'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { 
  TrendingUp, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  Banknote, 
  Receipt, 
  FileText, 
  Calculator, 
  Gauge, 
  Plus, 
  Users, 
  Car,
  ArrowRight, 
  Loader2 
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// Definimos la interfaz localmente para que no busque DTOs externos
interface MetricasDashboard {
  nombreUsuario: string
  nombreTaller: string
  ordenesHoy: number
  pendientes: number
  enProgreso: number
  completadas: number
  facturadoMes: number
  baseImponibleMes: number
  ivaRecaudadoMes: number
  ivaTrimestre: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarMetricas()
  }, [])

  const cargarMetricas = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Consultar todas las órdenes de reparación de tu nueva BD
      const { data: ordenes, error: dbError } = await supabase
        .from('ordenes_reparacion')
        .select('importe_final, estado, fecha_entrada')

      if (dbError) throw dbError

      const hoy = new Date().toISOString().split('T')[0]
      
      // Variables para calcular todo en tiempo real
      let ordenesHoy = 0
      let pendientes = 0
      let enProgreso = 0
      let completadas = 0
      let facturadoMes = 0

      if (ordenes) {
        ordenes.forEach((orden) => {
          // Contadores de estado según tus valores permitidos en BD
          if (orden.estado === 'recibido') pendientes++
          if (orden.estado === 'en_progreso') enProgreso++
          if (orden.estado === 'completado' || orden.estado === 'entregado') completadas++

          // Comprobar ingresos (importe_final)
          facturadoMes += Number(orden.importe_final || 0)

          // Comprobar si entró hoy
          if (orden.fecha_entrada && orden.fecha_entrada.startsWith(hoy)) {
            ordenesHoy++
          }
        })
      }

      // 2. Cálculos financieros derivados (21% de IVA estándar de talleres)
      const baseImponibleMes = facturadoMes / 1.21
      const ivaRecaudadoMes = facturadoMes - baseImponibleMes
      const ivaTrimestre = ivaRecaudadoMes // Aproximación directa para mostrar el dato

      setMetricas({
        nombreUsuario: 'Usuario',
        nombreTaller: 'Taller de pruebas',
        ordenesHoy,
        pendientes,
        enProgreso,
        completadas,
        facturadoMes,
        baseImponibleMes,
        ivaRecaudadoMes,
        ivaTrimestre
      })

    } catch (err: any) {
      console.error('Error cargando métricas:', err)
      setError(err.message || 'Error al conectar con Supabase')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
            <Gauge className="w-8 h-8 text-white animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-medium">Cargando panel...</p>
        </div>
      </div>
    )
  }

  if (error || !metricas) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="text-center p-6 max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-900 font-bold mb-1">No se pudo cargar el panel</p>
          <p className="text-gray-400 text-xs mb-4">{error}</p>
          <button
            onClick={cargarMetricas}
            className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Reintentar conexión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6 md:space-y-8">
      
      {/* Cabecera de Bienvenida */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-sky-500/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-500" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {metricas.nombreUsuario ? `Bienvenido, ${metricas.nombreUsuario}` : 'Panel de Control'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {metricas.nombreTaller || 'Gestión integral del taller mecánico'}
          </p>
        </div>
      </div>

      {/* Sección: Estado de Reparaciones */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Estado de Reparaciones</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full justify-center">
          
          <Card className="p-4 md:p-5 bg-gradient-to-br from-sky-500 to-cyan-500 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Hoy</span>
            </div>
            <p className="text-white/80 text-xs font-medium mb-0.5">Órdenes Hoy</p>
            <p className="text-2xl md:text-3xl font-bold font-mono">{metricas.ordenesHoy}</p>
          </Card>

          <Card className="p-4 md:p-5 bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Espera</span>
            </div>
            <p className="text-white/80 text-xs font-medium mb-0.5">Pendientes</p>
            <p className="text-2xl md:text-3xl font-bold font-mono">{metricas.pendientes}</p>
          </Card>

          <Card className="p-4 md:p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>
            </div>
            <p className="text-white/80 text-xs font-medium mb-0.5">En Taller</p>
            <p className="text-2xl md:text-3xl font-bold font-mono">{metricas.enProgreso}</p>
          </Card>

          <Card className="p-4 md:p-5 bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Listas</span>
            </div>
            <p className="text-white/80 text-xs font-medium mb-0.5">Completadas</p>
            <p className="text-2xl md:text-3xl font-bold font-mono">{metricas.completadas}</p>
          </Card>

        </div>
      </div>

      {/* Sección: Resumen Balance */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Resumen de Contabilidad</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full justify-center">
          
          <Card className="p-4 md:p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-sm">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <Banknote className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Total Facturado</p>
            <p className="text-lg md:text-xl font-bold font-mono">
              €{metricas.facturadoMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-4 md:p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-sm">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <Receipt className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Base Imponible</p>
            <p className="text-lg md:text-xl font-bold font-mono">
              €{metricas.baseImponibleMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-4 md:p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-sm">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">IVA Recaudado</p>
            <p className="text-lg md:text-xl font-bold font-mono">
              €{metricas.ivaRecaudadoMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-4 md:p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-sm">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <Calculator className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">IVA Trimestral</p>
            <p className="text-lg md:text-xl font-bold font-mono">
              €{metricas.ivaTrimestre.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

        </div>
      </div>

      {/* Sección: Accesos Rápidos */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
          
          <Link href="/ordenes/nueva" className="group block w-full">
            <Card className="p-4 h-full border border-sky-100 bg-sky-50/60 hover:bg-sky-50 hover:border-sky-200 transition-all duration-200 cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Nueva Orden</p>
                  <p className="text-[11px] text-gray-500">Registrar trabajo</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-500 group-hover:translate-x-1 transition-transform" />
            </Card>
          </Link>

          <Link href="/ordenes" className="group block w-full">
            <Card className="p-4 h-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 transition-all duration-200 cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Ver Órdenes</p>
                  <p className="text-[11px] text-gray-500">Historial y estados</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Card>
          </Link>

          <Link href="/clientes" className="group block w-full">
            <Card className="p-4 h-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 transition-all duration-200 cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Ver Clientes</p>
                  <p className="text-[11px] text-gray-500">Fichas de contacto</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Card>
          </Link>

          <Link href="/vehiculos" className="group block w-full">
            <Card className="p-4 h-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 transition-all duration-200 cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Ver Vehículos</p>
                  <p className="text-[11px] text-gray-500">Flota y matrículas</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Card>
          </Link>

        </div>
      </div>

    </div>
  )
}