'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Zap, Plus, X, Check, Loader2, Car, User,
  AlertTriangle, Printer, Search, FileText, UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

interface LineaItem {
  concepto: string
  cantidad: number
  precio_unitario: number
}

interface Plantilla {
  id: string
  nombre: string
  descripcion_operacion?: string
  precio_total_estimado: number
  lineas_items: LineaItem[]
}

interface ClienteOption {
  id: string
  nombre: string
  nif?: string
  direccion?: string
}

interface VehiculoOption {
  id: string
  matricula: string
  marca?: string
  modelo?: string
  cliente_id?: string
}

interface FacturaSimplificada {
  id: string
  numero_factura: string
  matricula: string
  total: number
  created_at: string
  metodo_pago: string
  clientes?: { nombre: string } | null
}

type MetodoPago = 'E' | 'T' | 'B'

const LIMITE_SIN_CLIENTE = 400
const IVA_DEFAULT = 21

export default function FacturasPage() {
  const supabase = createClient()

  const [plantillas] = useState<Plantilla[]>([
    {
      id: '1',
      nombre: 'Pinchazo',
      precio_total_estimado: 25,
      descripcion_operacion: 'Reparación de pinchazo o cambio...',
      lineas_items: [{ concepto: 'Reparación de pinchazo', cantidad: 1, precio_unitario: 20.66 }]
    },
    {
      id: '2',
      nombre: 'Carga Batería',
      precio_total_estimado: 40,
      descripcion_operacion: 'Carga y comprobación de batería',
      lineas_items: [{ concepto: 'Mano de obra: Carga de batería', cantidad: 1, precio_unitario: 33.05 }]
    },
    {
      id: '3',
      nombre: 'Revisión Aceite',
      precio_total_estimado: 65,
      descripcion_operacion: 'Cambio de aceite y filtro',
      lineas_items: [{ concepto: 'Filtro + Aceite motor estándar', cantidad: 1, precio_unitario: 53.72 }]
    }
  ])

  const [tallerId, setTallerId] = useState<string | null>(null)
  const [listaClientes, setListaClientes] = useState<ClienteOption[]>([])
  const [listaVehiculos, setListaVehiculos] = useState<VehiculoOption[]>([])
  const [facturasList, setFacturasList] = useState<FacturaSimplificada[]>([])
  const [loadingFacturas, setLoadingFacturas] = useState(true)
  const [busquedaFactura, setBusquedaFactura] = useState('')
  
  const [lineas, setLineas] = useState<LineaItem[]>([])
  const [mostrarLineaManual, setMostrarLineaManual] = useState(false)
  const [lineaManual, setLineaManual] = useState<LineaItem>({
    concepto: '', cantidad: 1, precio_unitario: 0
  })

  const [matriculaInput, setMatriculaInput] = useState('')
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<VehiculoOption | null>(null)
  const [busquedaVehiculo, setBusquedaVehiculo] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteOption | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('E')
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [emitiendo, setEmitiendo] = useState(false)
  const [resultado, setResultado] = useState<{
    numero_factura: string
    total: number
    fecha: string
    base_imponible: number
    iva: number
  } | null>(null)

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function inicializarModulo() {
      try {
        setLoadingInicial(true)
        const { data: { session } } = await supabase.auth.getSession()
        let idTallerDetectado = null

        if (session?.user) {
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('taller_id')
            .eq('email', session.user.email)
            .maybeSingle()
          
          if (usuario?.taller_id) idTallerDetectado = usuario.taller_id
        }

        if (!idTallerDetectado) {
          const { data: primerTaller } = await supabase.from('talleres').select('id').limit(1).maybeSingle()
          if (primerTaller) idTallerDetectado = primerTaller.id
        }

        setTallerId(idTallerDetectado)

        const { data: clientes } = await supabase
          .from('clientes')
          .select('id, nombre, nif, direccion')
          .order('nombre', { ascending: true })
        if (clientes) setListaClientes(clientes)

        const { data: vehiculos } = await supabase
          .from('vehiculos')
          .select('id, matricula, marca, modelo, cliente_id')
          .order('matricula', { ascending: true })
        if (vehiculos) setListaVehiculos(vehiculos)

        await cargarHistorialFacturas()

      } catch (err) {
        console.error('Error inicializando datos de facturación:', err)
      } finally {
        setLoadingInicial(false)
      }
    }
    inicializarModulo()
  }, [])

  const cargarHistorialFacturas = async () => {
    try {
      setLoadingFacturas(true)
      const { data, error } = await supabase
        .from('facturas_simplificadas')
        .select(`
          id,
          numero_factura,
          matricula,
          total,
          created_at,
          metodo_pago,
          clientes ( nombre )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFacturasList((data as any) || [])
    } catch (err) {
      console.error('Error cargando historial de facturas:', err)
    } finally {
      setLoadingFacturas(false)
    }
  }

  const baseImponible = lineas.reduce((s, l) => s + (l.cantidad * l.precio_unitario), 0)
  const iva = baseImponible * (IVA_DEFAULT / 100)
  const total = baseImponible + iva
  const requiereCliente = total > LIMITE_SIN_CLIENTE

  const seleccionarVehiculo = (vehiculo: VehiculoOption) => {
    setVehiculoSeleccionado(vehiculo)
    setMatriculaInput(vehiculo.matricula)
    toast.success(`Vehículo ${vehiculo.matricula} seleccionado`)

    if (vehiculo.cliente_id) {
      const dueno = listaClientes.find(c => c.id === vehiculo.cliente_id)
      if (dueno) {
        setClienteSeleccionado(dueno)
        toast.info(`Cliente asignado automáticamente: ${dueno.nombre}`)
      }
    }
  }

  const aplicarPlantilla = (p: Plantilla) => {
    setLineas(prev => [...prev, ...p.lineas_items])
    toast.success(`"${p.nombre}" añadida`)
  }

  const actualizarPrecioLinea = (idx: number, precio: number) => {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, precio_unitario: precio } : l))
  }

  const eliminarLinea = (idx: number) => {
    setLineas(prev => prev.filter((_, i) => i !== idx))
  }

  const addLineaManual = () => {
    if (!lineaManual.concepto.trim()) {
      toast.error('El concepto es obligatorio')
      return
    }
    setLineas(prev => [...prev, { ...lineaManual }])
    setLineaManual({ concepto: '', cantidad: 1, precio_unitario: 0 })
    setMostrarLineaManual(false)
  }

  const emitir = async () => {
    const matriculaFinal = matriculaInput.trim().toUpperCase()
    if (!matriculaFinal) {
      toast.error('La matrícula es obligatoria')
      return
    }
    if (lineas.length === 0) {
      toast.error('Añade al menos una operación')
      return
    }
    if (requiereCliente && !clienteSeleccionado) {
      toast.error('Para importes > 400€ debes seleccionar el cliente')
      return
    }
    if (!tallerId) {
      toast.error('No se ha podido determinar el ID de taller')
      return
    }

    setEmitiendo(true)

    try {
      const prefijoAno = new Date().getFullYear()
      const serialUnico = Math.floor(1000 + Math.random() * 9000)
      const numFacturaGenerado = `SIM-${prefijoAno}-${serialUnico}`

      const payloadFactura = {
        taller_id: tallerId,
        numero_factura: numFacturaGenerado,
        matricula: matriculaFinal,
        vehiculo_id: vehiculoSeleccionado?.id || null,
        cliente_id: clienteSeleccionado?.id || null,
        lineas_items: lineas,
        base_imponible: parseFloat(baseImponible.toFixed(2)),
        iva_porcentaje: IVA_DEFAULT,
        iva: parseFloat(iva.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        metodo_pago: metodoPago
      }

      const { error } = await supabase
        .from('facturas_simplificadas')
        .insert([payloadFactura])

      if (error) throw error

      const hoy = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      })

      setResultado({
        numero_factura: numFacturaGenerated = numFacturaGenerado,
        total: total,
        fecha: hoy,
        base_imponible: baseImponible,
        iva: iva,
      })
      
      toast.success('Factura registrada con éxito en Supabase')
      await cargarHistorialFacturas()
    } catch (err: any) {
      console.error(err)
      toast.error(`Fallo en base de datos: ${err.message || 'Error desconocido'}`)
    } finally {
      setEmitiendo(false)
    }
  }

  // Lógica de filtrado en tiempo real para el historial inferior
  const facturasFiltradas = facturasList.filter(fac => {
    const query = busquedaFactura.toLowerCase()
    const numero = fac.numero_factura?.toLowerCase() || ''
    const matricula = fac.matricula?.toLowerCase() || ''
    const cliente = fac.clientes?.nombre?.toLowerCase() || ''
    return numero.includes(query) || matricula.includes(query) || cliente.includes(query)
  })

  if (loadingInicial) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <p className="text-xs text-gray-400">Sincronizando catálogo con Supabase...</p>
      </div>
    )
  }

  if (resultado) {
    return (
      <div className="max-w-sm mx-auto space-y-4 py-6 px-4">
        <div
          ref={printRef}
          className="bg-white border-2 border-gray-200 rounded-2xl p-6 space-y-4 print:border-0 print:p-0 shadow-sm"
        >
          <div className="text-center border-b pb-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Factura Emitida</h2>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {resultado.numero_factura}
            </p>
            <p className="text-gray-500 text-xs mt-1">{resultado.fecha}</p>
          </div>

          <div className="flex flex-col gap-1.5 bg-gray-50 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900">
              <Car className="w-3.5 h-3.5 text-gray-400" />
              <span>{matriculaInput}</span>
              {vehiculoSeleccionado && <span className="font-sans text-gray-500 font-normal">({vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo})</span>}
            </div>
            {clienteSeleccionado && (
              <div className="flex items-center gap-1.5 border-t border-gray-200/60 pt-1.5 text-gray-600">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>{clienteSeleccionado.nombre}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            {lineas.map((l, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-600">{l.concepto} × {l.cantidad}</span>
                <span className="font-medium">{(l.cantidad * l.precio_unitario).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Base imponible</span>
              <span>{resultado.base_imponible.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>IVA ({IVA_DEFAULT}%)</span>
              <span>{resultado.iva.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-1">
              <span>TOTAL</span>
              <span className="text-emerald-600">{resultado.total.toFixed(2)} €</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 uppercase tracking-wider">
            Pago: {metodoPago === 'E' ? 'Efectivo' : metodoPago === 'T' ? 'Tarjeta' : 'Bizum'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 print:hidden">
          <Button onClick={() => window.print()} variant="outline" className="gap-2 rounded-xl text-xs h-11">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button
            onClick={() => {
              setResultado(null)
              setLineas([])
              setMatriculaInput('')
              setVehiculoSeleccionado(null)
              setClienteSeleccionado(null)
              setBusquedaCliente('')
              setBusquedaVehiculo('')
            }}
            className="bg-sky-600 hover:bg-sky-700 gap-2 rounded-xl text-white text-xs h-11 font-semibold"
          >
            <Zap className="w-4 h-4" />
            Nueva Factura
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 p-4 md:p-6">
      {/* Sección Superior: Formulario de Creación */}
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 hidden sm:block">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Facturación Rápida</h1>
              <p className="text-xs text-gray-500 mt-0.5">Serie FS · Terminal de Cobro Express</p>
            </div>
          </div>
          
          <Link href="/">
            <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </Button>
          </Link>
        </div>

        <Card className="p-4 rounded-2xl border-gray-200 shadow-sm bg-white">
          <h2 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Operaciones frecuentes
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {plantillas.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => aplicarPlantilla(p)}
                className="text-left p-3 rounded-xl border border-gray-200 hover:border-sky-300 hover:bg-sky-50/30 active:scale-[0.98] transition-all"
              >
                <p className="font-bold text-gray-900 text-xs">{p.nombre}</p>
                <p className="text-sky-600 font-extrabold text-sm mt-0.5">
                  {p.precio_total_estimado} €
                </p>
                {p.descripcion_operacion && (
                  <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-1">{p.descripcion_operacion}</p>
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setMostrarLineaManual(true)}
              className="p-3 rounded-xl border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-0.5 text-gray-400"
            >
              <Plus className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold uppercase tracking-wide text-[10px]">Personalizado</span>
            </button>
          </div>

          {mostrarLineaManual && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200/60">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">Concepto / Trabajo</Label>
                  <Input
                    placeholder="Ej: Diagnóstico de componentes eléctricos"
                    value={lineaManual.concepto}
                    onChange={e => setLineaManual(p => ({ ...p, concepto: e.target.value }))}
                    className="h-9 text-xs rounded-lg mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">Cant.</Label>
                  <Input
                    type="number"
                    min={1}
                    value={lineaManual.cantidad}
                    onChange={e => setLineaManual(p => ({ ...p, cantidad: parseInt(e.target.value) || 1 }))}
                    className="h-9 text-xs rounded-lg mt-1 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">Precio Unitario (€ sin IVA)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={lineaManual.precio_unitario === 0 ? '' : lineaManual.precio_unitario}
                    onChange={e => setLineaManual(p => ({ ...p, precio_unitario: parseFloat(e.target.value) || 0 }))}
                    className="h-9 text-xs rounded-lg mt-1 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={addLineaManual} className="flex-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold">Añadir Concepto</Button>
                <Button size="sm" variant="outline" onClick={() => setMostrarLineaManual(false)} className="rounded-lg text-xs">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </Card>

        {lineas.length === 0 ? (
          <Card className="p-4 rounded-2xl border-dashed border-amber-200 bg-amber-50/40 text-amber-900 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p>No hay conceptos añadidos. Presiona sobre alguna operación frecuente arriba.</p>
          </Card>
        ) : (
          <Card className="p-4 rounded-2xl border-gray-200 shadow-sm bg-white">
            <h2 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Detalle del documento</h2>
            <div className="space-y-2">
              {lineas.map((l, idx) => (
                <div key={idx} className="flex items-center gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">{l.concepto}</p>
                    <p className="text-[10px] text-gray-400">Cantidad: {l.cantidad}</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={l.precio_unitario}
                    onChange={e => actualizarPrecioLinea(idx, parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-xs text-right rounded-lg focus-visible:ring-sky-500"
                  />
                  <span className="text-[11px] text-gray-400 w-3">€</span>
                  <button
                    type="button"
                    onClick={() => eliminarLinea(idx)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t mt-3 pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Base imponible</span>
                <span>{baseImponible.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>IVA ({IVA_DEFAULT}%)</span>
                <span>{iva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-gray-100 pt-2 mt-2">
                <span>TOTAL (CON IVA)</span>
                <span className={requiereCliente ? 'text-amber-600 font-extrabold' : 'text-gray-900 font-extrabold'}>
                  {total.toFixed(2)} €
                </span>
              </div>
              {requiereCliente && (
                <p className="text-amber-600 text-[11px] flex items-center gap-1.5 mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-100 leading-snug">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  Supera los 400€ obligatorios para facturación simplificada anónima. Se requiere asociar un cliente.
                </p>
              )}
            </div>
          </Card>
        )}

        <Card className="p-4 space-y-5 rounded-2xl border-gray-200 shadow-sm bg-white">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> Matrícula o Flota Existente *
              </Label>
              <Link href="/vehiculos/nuevo" target="_blank">
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg gap-1 px-2 font-semibold">
                  <Plus className="w-3 h-3" /> Crear Vehículo
                </Button>
              </Link>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
              <Input
                value={matriculaInput}
                onChange={e => {
                  setMatriculaInput(e.target.value.toUpperCase().replace(/\s/g, ''))
                  setBusquedaVehiculo(e.target.value)
                  if (vehiculoSeleccionado && e.target.value !== vehiculoSeleccionado.matricula) {
                    setVehiculoSeleccionado(null)
                  }
                }}
                placeholder="Escribe matrícula manual o busca..."
                className="pl-9 rounded-xl h-10 font-mono tracking-widest uppercase text-sm"
                autoComplete="off"
              />
            </div>

            <div className="pt-1">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1.5">Selección rápida de coches:</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-0.5">
                {listaVehiculos
                  .filter(v => !busquedaVehiculo || v.matricula.toLowerCase().includes(busquedaVehiculo.toLowerCase()))
                  .map(v => {
                    const seleccionado = vehiculoSeleccionado?.id === v.id
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => seleccionarVehiculo(v)}
                        className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                          seleccionado 
                            ? 'bg-sky-600 text-white border-sky-700 shadow-sm' 
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {v.matricula}
                      </button>
                    )
                  })}
              </div>
            </div>

            {vehiculoSeleccionado && (
              <div className="bg-sky-50/70 border border-sky-100 rounded-xl px-3 py-1.5 text-xs flex items-center justify-between">
                <span className="text-sky-800">
                  Vinculado: <strong className="font-mono">{vehiculoSeleccionado.matricula}</strong> ({vehiculoSeleccionado.marca || 'S/M'} {vehiculoSeleccionado.modelo || ''})
                </span>
                <button type="button" onClick={() => { setVehiculoSeleccionado(null); setMatriculaInput(''); }} className="text-sky-500 hover:text-sky-800 p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {requiereCliente ? 'Cliente Titular Obligatorio *' : 'Vincular Cliente Titular'}
              </Label>
              <Link href="/clientes/nuevo" target="_blank">
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg gap-1 px-2 font-semibold">
                  <UserPlus className="w-3 h-3" /> Crear Cliente
                </Button>
              </Link>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
              <Input
                value={busquedaCliente}
                onChange={e => setBusquedaCliente(e.target.value)}
                placeholder="Filtrar lista de clientes..."
                className="pl-9 rounded-xl h-10 text-xs"
              />
            </div>

            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1.5">Selección rápida de clientes:</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-0.5">
                {listaClientes
                  .filter(c => !busquedaCliente || c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()))
                  .map(c => {
                    const seleccionado = clienteSeleccionado?.id === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setClienteSeleccionado(c)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          seleccionado 
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {c.nombre}
                      </button>
                    )
                  })}
              </div>
            </div>

            {clienteSeleccionado && (
              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs">
                <div className="text-emerald-800">
                  <span className="font-bold">{clienteSeleccionado.nombre}</span>
                  <span className="text-[10px] opacity-75 ml-2">({clienteSeleccionado.nif || 'Sin NIF'})</span>
                </div>
                <button type="button" onClick={() => setClienteSeleccionado(null)} className="text-emerald-600 hover:text-emerald-800 p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Método de caja</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {([['E', 'Efectivo'], ['T', 'Tarjeta'], ['B', 'Bizum']] as [MetodoPago, string][]).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setMetodoPago(code)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    metodoPago === code
                      ? 'border-sky-500 bg-sky-50/50 text-sky-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Button
          onClick={emitir}
          disabled={
            emitiendo ||
            lineas.length === 0 ||
            !matriculaInput.trim() ||
            (requiereCliente && !clienteSeleccionado)
          }
          className="w-full text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl min-h-[46px] shadow-sm transition-all gap-2"
        >
          {emitiendo ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {emitiendo
            ? 'Procesando inserción relacional...'
            : lineas.length === 0
              ? 'Añade operaciones al ticket'
              : `Cerrar Ticket y Registrar — ${total.toFixed(2)} €`
          }
        </Button>
      </div>


      <div className="border-t border-gray-100 pt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Historial </h2>
          <p className="text-xs text-gray-500">Últimos tickets de caja registrados</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-6 space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nº factura, matrícula o cliente..."
                value={busquedaFactura}
                onChange={(e) => setBusquedaFactura(e.target.value)}
                className="pl-9 bg-white border-gray-200 focus:bg-white rounded-xl text-sm"
              />
            </div>
            <span className="text-xs text-gray-400 font-medium self-end sm:self-center">
              Mostrando {facturasFiltradas.length} de {facturasList.length} registros
            </span>
          </div>

          {loadingFacturas ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
              <p className="text-xs text-gray-400">Cargando histórico...</p>
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400 font-medium">
              No se han encontrado facturas que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-3 px-4 w-[25%]">Nº Factura / Fecha</th>
                    <th className="py-3 px-4 w-[30%]">Cliente</th>
                    <th className="py-3 px-4 w-[20%]">Vehículo</th>
                    <th className="py-3 px-4 w-[12%]">Pago</th>
                    <th className="py-3 px-4 w-[13%] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {facturasFiltradas.map((fac) => (
                    <tr key={fac.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        <div className="text-xs text-gray-900 font-bold">{fac.numero_factura}</div>
                        <span className="block text-[10px] font-normal text-gray-400 mt-0.5">
                          {new Date(fac.created_at).toLocaleDateString('es-ES')} {new Date(fac.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      
                      <td className="py-3.5 px-4 font-semibold text-gray-900 truncate text-xs">
                        {fac.clientes?.nombre || <span className="text-gray-400 font-normal italic">Cliente Anónimo</span>}
                      </td>
                      
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 text-[11px] rounded-md font-semibold">
                          {fac.matricula}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-gray-500">
                        {fac.metodo_pago === 'E' ? 'Efectivo' : fac.metodo_pago === 'T' ? 'Tarjeta' : 'Bizum'}
                      </td>
                      
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono text-xs">
                        €{fac.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}