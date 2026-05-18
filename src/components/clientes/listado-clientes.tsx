'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Phone, Mail, User } from 'lucide-react'

interface Cliente {
  id: string
  nombre: string
  nif?: string | null
  email?: string | null
  telefono?: string | null
  direccion?: string | null
  notas?: string | null
}

interface ListadoClientesProps {
  clientesIniciales: Cliente[]
}

export function ListadoClientes({ clientesIniciales }: ListadoClientesProps) {
  const [busqueda, setBusqueda] = useState('')

  // Filtrado en tiempo real por Nombre o NIF
  const clientesFiltrados = clientesIniciales.filter(cliente => {
    const termino = busqueda.toLowerCase()
    return (
      cliente.nombre.toLowerCase().includes(termino) ||
      (cliente.nif && cliente.nif.toLowerCase().includes(termino))
    )
  })

  return (
    <div className="space-y-4 p-1">
      <div className="p-4 bg-slate-50/60 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o NIF..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-white border-gray-200 focus-visible:ring-sky-500"
          />
        </div>
        <div className="text-[11px] text-gray-400 font-medium">
          Mostrando {clientesFiltrados.length} de {clientesIniciales.length} clientes
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/30 rounded-xl border border-dashed border-gray-200">
            <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">No se encontraron clientes</p>
            <p className="text-xs text-gray-400">Prueba a cambiar los términos de la búsqueda.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                <th className="pb-3 pl-2">Cliente / Razón Social</th>
                <th className="pb-3 hidden md:table-cell">Identificación</th>
                <th className="pb-3 hidden sm:table-cell">Contacto</th>
                <th className="pb-3 text-right pr-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="group hover:bg-slate-50/50 transition-colors">
                  {/* Nombre */}
                  <td className="py-3.5 pl-2">
                    <div className="font-semibold text-gray-900">{cliente.nombre}</div>
                    <div className="md:hidden text-[11px] text-gray-500 font-mono mt-0.5">{cliente.nif || 'Sin NIF'}</div>
                  </td>

                  <td className="py-3.5 hidden md:table-cell font-mono text-xs text-gray-600">
                    {cliente.nif ? (
                      <Badge variant="outline" className="bg-slate-50 text-gray-600 font-medium rounded-lg text-[10px] uppercase border-gray-200">
                        {cliente.nif}
                      </Badge>
                    ) : (
                      <span className="text-gray-300">---</span>
                    )}
                  </td>

                  <td className="py-3.5 hidden sm:table-cell text-xs space-y-0.5 text-gray-600">
                    {cliente.telefono && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{cliente.telefono}</span>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center gap-1.5 text-gray-400 truncate max-w-[180px]">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500 truncate">{cliente.email}</span>
                      </div>
                    )}
                    {!cliente.telefono && !cliente.email && (
                      <span className="text-gray-300 italic">Sin datos</span>
                    )}
                  </td>

                  <td className="py-3.5 text-right pr-2">
                    <Link href={`/clientes/detalle?id=${cliente.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl gap-1.5 transition-all opacity-90 group-hover:opacity-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver ficha
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
