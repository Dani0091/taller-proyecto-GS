'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, UserPlus, FileText, Phone, Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

export default function NuevoClientePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [tallerId, setTallerId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    nif: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: '',
  })

  useEffect(() => {
    const obtenerTallerId = async () => {
      try {
        const { data: talleres, error } = await supabase
          .from('talleres')
          .select('id')
          .limit(1)

        if (error || !talleres || talleres.length === 0) {
          toast.error('No se pudo encontrar un taller en el sistema')
          return
        }
        setTallerId(talleres[0].id)
      } catch (error) {
        console.error('Error obteniendo taller_id:', error)
      }
    }
    obtenerTallerId()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tallerId) {
      toast.error('Falta el ID del taller obligatorio')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('clientes')
        .insert([{
          taller_id: tallerId,
          nombre: formData.nombre.trim(),
          nif: formData.nif.trim().toUpperCase() || null,
          email: formData.email.trim() || null,
          telefono: formData.telefono.trim() || null,
          direccion: formData.direccion.trim() || null,
          notas: formData.notas.trim() || null
        }])

      if (error) throw error

      toast.success('¡Cliente guardado con éxito!')
      router.push('/clientes')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(`Error al guardar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-16 p-4">
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nuevo Cliente</h1>
          <p className="text-sm text-gray-500">Añade un nuevo titular al ecosistema del taller</p>
        </div>
      </div>


      <Card className="p-5 rounded-2xl border-gray-200 shadow-sm bg-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <Label htmlFor="nombre" className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 text-sky-500" /> Nombre o Razón Social *
            </Label>
            <Input
              id="nombre"
              name="nombre"
              placeholder="Ej: Juan García López o Transportes S.A."
              value={formData.nombre}
              onChange={handleChange}
              required
              className="rounded-xl mt-1 text-sm h-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nif" className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-400" /> NIF / DNI / CIF
              </Label>
              <Input
                id="nif"
                name="nif"
                placeholder="12345678X"
                value={formData.nif}
                onChange={handleChange}
                className="rounded-xl mt-1 text-sm h-10 uppercase bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div>
              <Label htmlFor="telefono" className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> Teléfono
              </Label>
              <Input
                id="telefono"
                name="telefono"
                placeholder="600123456"
                value={formData.telefono}
                onChange={handleChange}
                className="rounded-xl mt-1 text-sm h-10 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> Correo Electrónico
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="cliente@correo.com"
              value={formData.email}
              onChange={handleChange}
              className="rounded-xl mt-1 text-sm h-10 bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div>
            <Label htmlFor="direccion" className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> Dirección Postal
            </Label>
            <Input
              id="direccion"
              name="direccion"
              placeholder="Av. Constitución 14, 2ºB"
              value={formData.direccion}
              onChange={handleChange}
              className="rounded-xl mt-1 text-sm h-10 bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div>
            <Label htmlFor="notas" className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
              Notas Internas u Observaciones
            </Label>
            <Textarea
              id="notas"
              name="notas"
              placeholder="Detalles sobre facturación, flotas, horarios preferidos..."
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              className="rounded-xl mt-1 text-sm bg-slate-50/50 focus:bg-white min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 py-5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition-all gap-2 h-11"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Guardando Registro...' : 'Guardar y Registrar Cliente'}
            </Button>
            <Link href="/clientes">
              <Button type="button" variant="outline" className="rounded-xl h-11 text-xs font-medium px-4">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}