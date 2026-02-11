import { supabase } from '@/lib/supabase/client'

export default async function DashboardPage() {
  const hoy = new Date().toISOString().split('T')[0]
  
  const { count: ordenesHoy } = await supabase
    .from('ordenes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', hoy)
  
  const { count: enProgreso } = await supabase
    .from('ordenes')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'en_progreso')
  
  const { count: pendientes } = await supabase
    .from('ordenes')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')
  
  const { data: ordenesConTotal } = await supabase
    .from('ordenes')
    .select('total')
  
  const ingresos = ordenesConTotal?.reduce((sum, o) => sum + o.total, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Dashboard - TallerAgil
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
            <p className="text-sm opacity-90 mb-2">Órdenes Hoy</p>
            <p className="text-4xl font-bold">{ordenesHoy || 0}</p>
          </div>
          
          <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
            <p className="text-sm opacity-90 mb-2">Ingresos</p>
            <p className="text-4xl font-bold">€{ingresos.toFixed(2)}</p>
          </div>
          
          <div className="bg-orange-500 text-white p-6 rounded-lg shadow-lg">
            <p className="text-sm opacity-90 mb-2">En Progreso</p>
            <p className="text-4xl font-bold">{enProgreso || 0}</p>
          </div>
          
          <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg">
            <p className="text-sm opacity-90 mb-2">Pendientes</p>
            <p className="text-4xl font-bold">{pendientes || 0}</p>
          </div>
          
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Estado del proyecto (2ª Evaluación):</strong> Dashboard completado. 
            Próximo paso: página de órdenes.
          </p>
        </div>
      </div>
    </div>
  )
}
