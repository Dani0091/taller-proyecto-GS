'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Loader2, AlertCircle, Wrench, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'

interface OrdenEstructura {
  id: string
  numero_orden: string
  estado: string
  importe_final: number
  descripcion_problema: string
  fecha_entrada: string
  created_at: string
  clientes: { nombre: string } | null
  vehiculos: { matricula: string; marca: string; modelo: string } | null
}

export default function OrdenesPage() {
  const supabase = createClient()
  const [ordenes, setOrdenes] = useState<OrdenEstructura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: dbError } = await supabase
        .from('ordenes_reparacion')
        .select(`
          id,
          numero_orden,
          estado,
          importe_final,
          descripcion_problema,
          fecha_entrada,
          created_at,
          clientes ( nombre ),
          vehiculos ( matricula, marca, modelo )
        `)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError

      setOrdenes((data as any) || [])
    } catch (err: any) {
      console.error('Error cargando órdenes de reparación:', err)
      setError(err.message || 'Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  const eliminarOrden = async (id: string) => {
    const confirmar = window.confirm('¿Seguro que quieres eliminar esta orden de trabajo permanentemente?')
    if (!confirmar) return

    try {
      const { error: deleteError } = await supabase
        .from('ordenes_reparacion')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setOrdenes(prev => prev.filter(orden => orden.id !== id))
    } catch (err: any) {
      console.error('Error al eliminar la orden:', err)
      alert('No se pudo eliminar la orden: ' + err.message)
    }
  }

  const ordenesFiltradas = ordenes.filter(orden => {
    const searchLower = busqueda.toLowerCase()
    const nombreCliente = orden.clientes?.nombre || ''
    const matriculaVehiculo = orden.vehiculos?.matricula || ''
    const numOrden = orden.numero_orden || ''

    return (
      numOrden.toLowerCase().includes(searchLower) ||
      nombreCliente.toLowerCase().includes(searchLower) ||
      matriculaVehiculo.toLowerCase().includes(searchLower) ||
      searchLower === ''
    )
  })

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 hidden sm:block">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Órdenes de Trabajo</h1>
            <p className="text-xs md:text-sm text-gray-500">Gestión integrada de reparaciones y flota del taller</p>
          </div>
        </div>
        
        <Link href="/ordenes/nueva">
          <Button className="w-full sm:w-auto gap-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm font-semibold transition-all">
            <Plus className="w-4 h-4" />
            Nueva Orden
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por orden, cliente o matrícula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 bg-white border-gray-200 focus:bg-white rounded-xl text-sm"
            />
          </div>
          <span className="text-xs text-gray-400 font-medium self-end sm:self-center">
            Mostrando {ordenesFiltradas.length} de {ordenes.length} órdenes
          </span>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-gray-900 font-bold mb-1">Error al cargar datos</p>
            <p className="text-gray-400 text-xs mb-4">{error}</p>
            <Button onClick={cargarOrdenes} className="bg-gray-900 text-white rounded-xl text-sm px-4">
              Reintentar
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-3" />
            <p className="text-xs text-gray-400 font-medium">Sincronizando órdenes...</p>
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-900 font-medium text-sm">No se encontraron órdenes registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3 px-4 w-[22%]">Orden / Código</th>
                  <th className="py-3 px-4 w-[22%]">Cliente</th>
                  <th className="py-3 px-4 w-[20%]">Vehículo</th>
                  <th className="py-3 px-4 w-[20%]">Detalle / Problema</th>
                  <th className="py-3 px-4 w-[16%] text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {ordenesFiltradas.map((orden) => (
                  <tr key={orden.id} className="hover:bg-gray-50/40 transition-colors group">
                    <td className="py-4 px-4 font-semibold text-gray-900 vertical-align-top">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{orden.numero_orden || `ORD-${orden.id.slice(0, 5).toUpperCase()}`}</span>
                      </div>
                      <span className="block text-[10px] font-normal text-gray-400 mt-0.5">
                        {orden.fecha_entrada ? new Date(orden.fecha_entrada).toLocaleDateString('es-ES') : new Date(orden.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </td>
                    
                    <td className="py-4 px-4 font-semibold text-gray-900 truncate">
                      {orden.clientes?.nombre || 'No asignado'}
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="font-mono bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 text-xs rounded-md font-semibold inline-block">
                        {orden.vehiculos?.matricula || 'S/M'}
                      </span>
                      {orden.vehiculos?.marca && (
                        <span className="text-gray-500 text-[11px] block mt-1 truncate font-normal">
                          {orden.vehiculos.marca} {orden.vehiculos.modelo || ''}
                        </span>
                      )}
                    </td>
                    
                    <td className="py-4 px-4 text-xs text-gray-500 truncate italic">
                      "{orden.descripcion_problema || 'Sin detalles.'}"
                    </td>
                    
                    <td className="py-4 px-4 text-right">
                      <div className="font-bold text-emerald-600 font-mono text-base">
                        €{(orden.importe_final || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => eliminarOrden(orden.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all border border-red-100 shadow-sm cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}