'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Loader2, Car, Gauge, Calendar, Edit2, Trash2, Save, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

export default function VehiculosPage() {
  const supabase = createClient()

  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  
  // Estados para la edición en el sitio
  const [idEditando, setIdEditando] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [formEdicion, setFormEdicion] = useState({
    matricula: '',
    marca: '',
    modelo: '',
    año: '',
    kilometros: '',
    notas: ''
  })

  useEffect(() => {
    cargarVehiculos()
  }, [])

  async function cargarVehiculos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehiculos(data || [])
    } catch (err: any) {
      console.error('Error cargando vehículos:', err)
      toast.error('No se pudieron cargar los vehículos')
    } finally {
      setLoading(false)
    }
  }

  // Activar el modo edición rellenando el formulario temporal
  const activarEdicion = (vehiculo: any) => {
    setIdEditando(vehiculo.id)
    setFormEdicion({
      matricula: vehiculo.matricula || '',
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      año: vehiculo.año ? String(vehiculo.año) : '',
      kilometros: vehiculo.kilometros ? String(vehiculo.kilometros) : '',
      notas: vehiculo.notas || ''
    })
  }

  const handleCambioEdicion = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormEdicion(prev => ({ ...prev, [name]: value }))
  }

  const guardarCambios = async (id: string) => {
    if (!formEdicion.matricula.trim()) {
      toast.error('La matrícula es obligatoria')
      return
    }

    setGuardando(true)
    try {
      const { error } = await supabase
        .from('vehiculos')
        .update({
          matricula: formEdicion.matricula.trim().toUpperCase(),
          marca: formEdicion.marca.trim() || null,
          modelo: formEdicion.modelo.trim() || null,
          año: formEdicion.año ? parseInt(formEdicion.año, 10) : null,
          kilometros: formEdicion.kilometros ? parseInt(formEdicion.kilometros, 10) : null,
          notas: formEdicion.notas.trim() || null
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Vehículo actualizado correctamente')
      setIdEditando(null)
      cargarVehiculos()
    } catch (err: any) {
      console.error(err)
      toast.error(`Error al actualizar: ${err.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarVehiculo = async (id: string) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar este vehículo? Se borrará permanentemente de la base de datos.')
    if (!confirmar) return

    setEliminandoId(id)
    try {
      const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Vehículo retirado de la flota')
      cargarVehiculos()
    } catch (err: any) {
      console.error(err)
      toast.error('No se puede eliminar. El coche tiene facturas u órdenes de reparación asociadas.')
    } finally {
      setEliminandoId(null)
    }
  }

  const vehiculosFiltrados = vehiculos.filter(vehiculo => {
    const searchLower = busqueda.toLowerCase()
    return (
      (vehiculo.matricula || '').toLowerCase().includes(searchLower) ||
      (vehiculo.marca || '').toLowerCase().includes(searchLower) ||
      (vehiculo.modelo || '').toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 hidden sm:block">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Control de Vehículos</h1>
            <p className="text-xs md:text-sm text-gray-500">Gestiona, edita y consulta la flota de coches del taller</p>
          </div>
        </div>
        
        <Link href="/vehiculos/nuevo">
          <Button className="w-full sm:w-auto gap-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm font-semibold transition-all">
            <Plus className="w-4 h-4" />
            Nuevo Vehículo
          </Button>
        </Link>
      </div>

      <Card className="p-4 rounded-2xl border border-gray-200/80 shadow-sm bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por matrícula, marca o modelo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 h-10 text-sm rounded-xl border-gray-200 bg-slate-50/30 focus-visible:ring-sky-500"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <p className="text-xs text-gray-400">Cargando flota automotriz...</p>
        </div>
      ) : vehiculosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
          <Car className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">No se encontraron vehículos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehiculosFiltrados.map(vehiculo => {
            const estaEditando = idEditando === vehiculo.id

            return (
              <Card
                key={vehiculo.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all overflow-hidden border-l-4 ${
                  estaEditando ? 'border-l-amber-500 border-amber-200 ring-2 ring-amber-500/10' : 'border-l-sky-500 border-gray-200/90'
                } flex flex-col justify-between`}
              >

                {!estaEditando ? (
                  <>
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg tracking-widest uppercase shadow-sm border border-slate-950">
                            {vehiculo.matricula}
                          </span>
                          <h3 className="font-bold text-gray-900 text-base mt-2 tracking-tight">
                            {vehiculo.marca || 'Sin Marca'} <span className="font-medium text-gray-600">{vehiculo.modelo || 'Sin Modelo'}</span>
                          </h3>
                        </div>


                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-slate-100"
                            onClick={() => activarEdicion(vehiculo)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            disabled={eliminandoId === vehiculo.id}
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => eliminarVehiculo(vehiculo.id)}
                          >
                            {eliminandoId === vehiculo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>

                      {vehiculo.notas && (
                        <div className="mt-2 bg-amber-50/40 border border-amber-100 p-2.5 rounded-xl">
                          <p className="text-[11px] text-gray-600 italic leading-normal line-clamp-2">
                            {vehiculo.notas}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-3 bg-slate-50/60 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-gray-400" />
                        <span>{vehiculo.kilometros ? `${vehiculo.kilometros.toLocaleString()} km` : '---'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Año: {vehiculo.año || '---'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Modificar Vehículo</span>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setIdEditando(null)}
                          className="h-7 px-2 text-xs rounded-lg text-gray-500"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                        </Button>
                        <Button 
                          size="sm" 
                          disabled={guardando}
                          onClick={() => guardarCambios(vehiculo.id)}
                          className="h-7 px-2.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                        >
                          {guardando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Guardar
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Matrícula</Label>
                        <Input 
                          name="matricula" 
                          value={formEdicion.matricula} 
                          onChange={handleCambioEdicion} 
                          className="h-8 text-xs rounded-lg font-mono uppercase bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[9px] font-bold text-gray-400 uppercase">Marca</Label>
                          <Input name="marca" value={formEdicion.marca} onChange={handleCambioEdicion} className="h-8 text-xs rounded-lg" />
                        </div>
                        <div>
                          <Label className="text-[9px] font-bold text-gray-400 uppercase">Modelo</Label>
                          <Input name="modelo" value={formEdicion.modelo} onChange={handleCambioEdicion} className="h-8 text-xs rounded-lg" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[9px] font-bold text-gray-400 uppercase">Año</Label>
                          <Input name="año" type="number" value={formEdicion.año} onChange={handleCambioEdicion} className="h-8 text-xs rounded-lg" />
                        </div>
                        <div>
                          <Label className="text-[9px] font-bold text-gray-400 uppercase">Kilómetros</Label>
                          <Input name="kilometros" type="number" value={formEdicion.kilometros} onChange={handleCambioEdicion} className="h-8 text-xs rounded-lg" />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Notas internas</Label>
                        <Textarea name="notes" value={formEdicion.notas} onChange={handleCambioEdicion} rows={2} className="text-xs rounded-lg resize-none p-2" />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}