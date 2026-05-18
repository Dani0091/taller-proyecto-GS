import { createClient } from '@/utils/supabase/server';
import { ListadoClientes } from '@/components/clientes/listado-clientes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

export const revalidate = 0;

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando clientes:', error);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 hidden sm:block">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Directorio de Clientes</h1>
            <p className="text-xs md:text-sm text-gray-500">Gestiona la base de datos de tu taller</p>
          </div>
        </div>
        
        <Link href="/clientes/nuevo">
          <Button className="w-full sm:w-auto gap-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm font-semibold transition-all">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <ListadoClientes clientesIniciales={clientes || []} />
      </div>
    </div>
  );
}