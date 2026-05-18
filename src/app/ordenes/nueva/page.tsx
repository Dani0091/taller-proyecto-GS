'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, User, Search, Car, FileText, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

interface ClienteOption {
  id: string
  nombre: string
  nif?: string
}

export default function NuevaOrdenPage() {
  const supabase = createClient()
  const router = useRouter()

  const [listaClientes, setListaClientes] = useState<ClienteOption[]>([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteOption | null>(null)
  
  const [mostrarCrearCliente, setMostrarCrearCliente] = useState(false)
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [nuevoClienteNif, setNuevoClienteNif] = useState('')
  const [creandoCliente, setCreandoCliente] = useState(false)

  const [matricula, setMatricula] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')

  const [descripcionProblema, setDescripcionProblema] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [trabajosRealizados, setTrabajosRealizados] = useState('')
  const [importeFinal, setImporteFinal] = useState('')

  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargarClientesIniciales() {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nombre, nif')
          .order('nombre', { ascending: true })
        if (!error && data) setListaClientes(data)
      } catch (e) {
        console.error("Error al cargar clientes:", e)
      }
    }
    cargarClientesIniciales()
  }, [])

  const refrescarListaClientes = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, nif')
      .order('nombre', { ascending: true })
    if (data) setListaClientes(data)
  }

  const handleCrearClienteExpress = async () => {
    if (!nuevoClienteNombre.trim()) {
      toast.error('El nombre del cliente es obligatorio')
      return
    }
    setCreandoCliente(true)
    try {
      const { data: talleres } = await supabase.from('talleres').select('id').limit(1)
      const tId = talleres && talleres.length > 0 ? talleres[0].id : null

      const { data, error } = await supabase
        .from('clientes')
        .insert([{ 
          nombre: nuevoClienteNombre.trim(), 
          nif: nuevoClienteNif.trim().toUpperCase(),
          taller_id: tId
        }])
        .select()
        .single()

      if (error) throw error

      toast.success(`Cliente "${data.nombre}" creado`)
      setClienteSeleccionado(data)
      setMostrarCrearCliente(false)
      setNuevoClienteNombre('')
      setNuevoClienteNif('')
      await refrescarListaClientes()
    } catch (err: any) {
      console.error(err)
      toast.error(`Error al registrar cliente: ${err.message}`)
    } finally {
      setCreandoCliente(false)
    }
  }

  const ejecutarGuardado = async () => {
    if (!clienteSeleccionado) {
      toast.error('Por favor, vincula un cliente a la orden')
      return
    }
    if (!matricula.trim()) {
      toast.error('La matrícula es obligatoria')
      return
    }
    if (!descripcionProblema.trim()) {
      toast.error('Añade la descripción del problema')
      return
    }

    setGuardando(true)

    try {
      const matriculaLimpia = matricula.toUpperCase().replace(/\s/g, '')

      const { data: talleres, error: errorTaller } = await supabase
        .from('talleres')
        .select('id')
        .limit(1)

      if (errorTaller || !talleres || talleres.length === 0) {
        throw new Error('No se ha detectado ningún taller en la tabla public.talleres')
      }
      const tallerId = talleres[0].id

      let vehiculoId = null
      const { data: vehiculoExistente } = await supabase
        .from('vehiculos')
        .select('id')
        .eq('matricula', matriculaLimpia)
        .maybeSingle()

      if (vehiculoExistente) {
        vehiculoId = vehiculoExistente.id
      } else {
        const { data: nuevoVehiculo, error: errorVehiculo } = await supabase
          .from('vehiculos')
          .insert([{
            matricula: matriculaLimpia,
            marca: marca.trim() || 'Genérico',
            modelo: modelo.trim() || 'Sin modelo',
            cliente_id: clienteSeleccionado.id,
            taller_id: tallerId
          }])
          .select()
          .single()

        if (errorVehiculo) throw errorVehiculo
        vehiculoId = nuevoVehiculo.id
      }

      const anoActual = new Date().getFullYear()
      const rand = Math.floor(1000 + Math.random() * 9000)
      const numOrden = `ORD-${anoActual}-${rand}`

      const payload = {
        taller_id: tallerId,
        numero_orden: numOrden,
        cliente_id: clienteSeleccionado.id,
        vehiculo_id: vehiculoId,
        fecha_entrada: new Date().toISOString(),
        descripcion_problema: descripcionProblema.trim(),
        diagnostico: diagnostico.trim() || null,
        trabajos_realizados: trabajosRealizados.trim() || null,
        importe_final: importeFinal ? parseFloat(importeFinal) : 0
      }

      const { error: errorInsert } = await supabase
        .from('ordenes_reparacion')
        .insert([payload])

      if (errorInsert) throw errorInsert

      toast.success('¡Orden guardada con éxito!')
      router.push('/ordenes')
      router.refresh()
    } catch (err: any) {
      console.error("Error devuelto por Supabase:", err)
      toast.error(`Fallo de inserción: ${err.message || 'Error en tipos de datos'}`)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-16 p-4">
      <div className="flex items-center gap-3">
        <Link href="/ordenes">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nueva Orden de Trabajo</h1>
          <p className="text-sm text-gray-500">Formulario sincronizado con las tablas reales</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-5 space-y-3 rounded-2xl border-gray-200 shadow-sm bg-white">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <Label className="flex items-center gap-1.5 text-gray-900 text-xs font-bold uppercase tracking-wider">
              <User className="w-4 h-4 text-sky-500" /> 1. Cliente Titular *
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrarCrearCliente(!mostrarCrearCliente)}
              className="text-sky-600 font-bold text-xs h-7"
            >
              {mostrarCrearCliente ? 'Buscar existente' : '+ Cliente Rápido'}
            </Button>
          </div>

          {mostrarCrearCliente ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] font-medium text-gray-600">Nombre *</Label>
                  <Input 
                    value={nuevoClienteNombre}
                    onChange={e => setNuevoClienteNombre(e.target.value)}
                    placeholder="Juan Pérez" 
                    className="h-9 text-sm rounded-xl mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-medium text-gray-600">NIF / DNI</Label>
                  <Input 
                    value={nuevoClienteNif}
                    onChange={e => setNuevoClienteNif(e.target.value)}
                    placeholder="12345678X" 
                    className="h-9 text-sm rounded-xl mt-1 bg-white"
                  />
                </div>
              </div>
              <Button
                type="button"
                disabled={creandoCliente}
                onClick={handleCrearClienteExpress}
                className="w-full h-8 bg-gray-900 text-white rounded-xl text-xs font-bold"
              >
                {creandoCliente ? 'Guardando...' : 'Crear y Vincular'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  value={busquedaCliente}
                  onChange={e => setBusquedaCliente(e.target.value)}
                  placeholder="Filtrar por nombre de cliente..."
                  className="pl-9 rounded-xl h-9 text-sm"
                />
              </div>

              <div className="max-h-28 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-1 bg-gray-50/50">
                {listaClientes
                  .filter(c => !busquedaCliente || c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()))
                  .map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClienteSeleccionado(c)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs flex justify-between items-center transition-all ${
                        clienteSeleccionado?.id === c.id ? 'border-sky-500 bg-sky-50 text-sky-800 font-semibold shadow-sm' : 'border-transparent bg-white hover:bg-gray-100'
                      }`}
                    >
                      <span>{c.nombre}</span>
                      <Badge variant="outline" className="font-mono text-[9px] bg-gray-50">{c.nif || 'Sin NIF'}</Badge>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {clienteSeleccionado && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800 font-medium">
              <span>Vinculado a: <strong>{clienteSeleccionado.nombre}</strong></span>
              <button type="button" onClick={() => setClienteSeleccionado(null)} className="text-emerald-700 font-bold">Cambiar</button>
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-3 rounded-2xl border-gray-200 shadow-sm bg-white">
          <h2 className="font-bold text-xs text-gray-900 flex items-center gap-2 uppercase tracking-wider border-b border-gray-100 pb-1">
            <Car className="w-4 h-4 text-sky-500" /> 2. Datos del Vehículo
          </h2>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Matrícula *</Label>
              <Input 
                value={matricula} 
                onChange={e => setMatricula(e.target.value)} 
                placeholder="1234XYZ" 
                className="font-mono text-xs uppercase rounded-xl mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Marca</Label>
              <Input 
                value={marca} 
                onChange={e => setMarca(e.target.value)} 
                placeholder="Audi" 
                className="text-xs rounded-xl mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Modelo</Label>
              <Input 
                value={modelo} 
                onChange={e => setModelo(e.target.value)} 
                placeholder="A4" 
                className="text-xs rounded-xl mt-1 bg-gray-50"
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3 rounded-2xl border-gray-200 shadow-sm bg-white">
          <h2 className="font-bold text-xs text-gray-900 flex items-center gap-2 uppercase tracking-wider border-b border-gray-100 pb-1">
            <FileText className="w-4 h-4 text-sky-500" /> 3. Registro de Trabajo en Taller
          </h2>

          <div>
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Descripción Inicial del Problema *</Label>
            <Textarea 
              value={descripcionProblema} 
              onChange={e => setDescripcionProblema(e.target.value)} 
              placeholder="¿Qué le ocurre al vehículo según el cliente?" 
              className="rounded-xl mt-1 min-h-[60px] text-xs"
            />
          </div>

          <div>
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Diagnóstico Mecánico</Label>
            <Textarea 
              value={diagnostico} 
              onChange={e => setDiagnostico(e.target.value)} 
              placeholder="Resultado oficial del análisis..." 
              className="rounded-xl mt-1 min-h-[60px] text-xs bg-slate-50/40"
            />
          </div>

          <div>
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Trabajos Realizados</Label>
            <Textarea 
              value={trabajosRealizados} 
              onChange={e => setTrabajosRealizados(e.target.value)} 
              placeholder="Operaciones y sustitución de repuestos efectuadas..." 
              className="rounded-xl mt-1 min-h-[60px] text-xs bg-slate-50/40"
            />
          </div>

          <div className="pt-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" /> Importe Final Facturado (€)
            </Label>
            <Input 
              type="number" 
              step="0.01"
              value={importeFinal} 
              onChange={e => setImporteFinal(e.target.value)} 
              placeholder="0.00" 
              className="rounded-xl mt-1 h-9 text-xs font-medium"
            />
          </div>
        </Card>

        <Button
          type="button"
          onClick={ejecutarGuardado}
          disabled={guardando}
          className="w-full py-5 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md transition-all gap-2"
        >
          {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
          {guardando ? 'Guardando...' : 'Crear Orden de Reparación'}
        </Button>
      </div>
    </div>
  )
}