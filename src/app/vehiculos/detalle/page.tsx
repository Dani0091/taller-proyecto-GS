import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DetalleVehiculoPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams.id;

  if (!id || typeof id !== 'string') return <div className="p-6">ID no válido.</div>;

  // Inicialización correcta para componentes del lado del servidor (Server Components)
  const supabase = await createClient();
  
  const { data: vehiculo, error } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !vehiculo) return <div className="p-6 text-amber-600">Vehículo no encontrado.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Link href="/vehiculos" className="text-sm text-slate-500">← Volver</Link>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <span className="bg-slate-900 text-white font-mono text-xs px-2 py-0.5 rounded font-bold">{vehiculo.matricula}</span>
        <h2 className="text-2xl font-bold text-slate-900 mt-2">{vehiculo.marca} {vehiculo.modelo || ''}</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p><strong>Año:</strong> {vehiculo.año || '---'}</p>
          <p><strong>Combustible:</strong> {vehiculo.tipo_combustible || '---'}</p>
          <p><strong>Kilómetros:</strong> {vehiculo.kilometros?.toLocaleString() || 0} km</p>
        </div>
      </div>
    </div>
  );
}