'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Calendar, Gauge, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client' // <--- IMPORTACIÓN CORREGIDA

export default function NuevoVehiculoPage() {
  const supabase = createClient()
  
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [tallerId, setTallerId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    matricula: '',
    marca: '',
    modelo: '',
    año: '',
    kilometros: '',
    notas: ''
  })

  useEffect(() => {
    async function obtenerTaller() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const { data: usuario, error: dbError } = await supabase
            .from('usuarios')
            .select('taller_id')
            .eq('email', session.user.email)
            .single()

          if (!dbError && usuario?.taller_id) {
            setTallerId(usuario.taller_id)
            return
          }
        }

        const { data: primerTaller } = await supabase
          .from('talleres')
          .select('id')
          .limit(1)
          .maybeSingle()

        if (primerTaller) {
          setTallerId(primerTaller.id)
        } else {
          toast.error('No se detecta ningún taller en la base de datos. Crea primero un taller.')
        }

      } catch (err) {
        console.error('Error al verificar taller asignado:', err)
      } finally {
        setLoadingAuth(false)
      }
    }

    obtenerTaller()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tallerId) {
      toast.error('No se ha podido asignar un taller_id para guardar el vehículo')
      return
    }

    if (!formData.matricula.trim()) {
      toast.error('La matrícula es obligatoria')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('vehiculos')
        .insert([{
          taller_id: tallerId,
          matricula: formData.matricula.trim().toUpperCase(),
          marca: formData.marca.trim() || null,
          modelo: formData.modelo.trim() || null,
          año: formData.año ? parseInt(formData.año, 10) : null,
          kilometros: formData.kilometros ? parseInt(formData.kilometros, 10) : null,
          notas: formData.notas.trim() || null
        }])

      if (error) throw error

      toast.success('¡Vehículo registrado con éxito!')
      router.push('/vehiculos')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      if (error.code === '23505') {
        toast.error('Esta matrícula ya se encuentra registrada en el sistema')
      } else {
        toast.error(`Error al guardar: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <p className="text-xs text-gray-400">Estableciendo conexión segura con el taller...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-16 p-4">
      <div className="flex items-center gap-3">
        <Link href="/vehiculos">
          <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Alta de Vehículo</h1>
          <p className="text-xs text-gray-500">Añade una unidad de transporte al catálogo del taller</p>
        </div>
      </div>

      <Card className="p-6 rounded-2xl border border-gray-200 shadow-sm bg-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="matricula" className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
              Matrícula *
            </Label>
            <Input
              id="matricula"
              name="matricula"
              placeholder="Ej: 1234BBB"
              value={formData.matricula}
              onChange={handleChange}
              required
              className="rounded-xl mt-1 text-sm h-10 uppercase bg-slate-50/40 font-mono tracking-widest font-bold focus-visible:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marca" className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Marca
              </Label>
              <Input
                id="marca"
                name="marca"
                placeholder="Ej: Volkswagen"
                value={formData.marca}
                onChange={handleChange}
                className="rounded-xl mt-1 text-sm h-10 bg-slate-50/40 focus-visible:ring-sky-500"
              />
            </div>
            <div>
              <Label htmlFor="modelo" className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Modelo
              </Label>
              <Input
                id="modelo"
                name="modelo"
                placeholder="Ej: Golf GTI"
                value={formData.modelo}
                onChange={handleChange}
                className="rounded-xl mt-1 text-sm h-10 bg-slate-50/40 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="año" className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Año
              </Label>
              <Input
                id="año"
                name="año"
                type="number"
                placeholder="Ej: 2018"
                value={formData.año}
                onChange={handleChange}
                min={1900}
                max={new Date().getFullYear() + 1}
                className="rounded-xl mt-1 text-sm h-10 bg-slate-50/40 focus-visible:ring-sky-500"
              />
            </div>
            <div>
              <Label htmlFor="kilometros" className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-gray-400" /> Kilómetros
              </Label>
              <Input
                id="kilometros"
                name="kilometros"
                type="number"
                placeholder="Ej: 85000"
                value={formData.kilometros}
                onChange={handleChange}
                min={0}
                className="rounded-xl mt-1 text-sm h-10 bg-slate-50/40 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notas" className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" /> Notas u Observaciones
            </Label>
            <Textarea
              id="notas"
              name="notas"
              placeholder="Historial de distribución, detalles particulares..."
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              className="rounded-xl mt-1 text-xs bg-slate-50/40 focus-visible:ring-sky-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition-all gap-2 h-11"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Añadiendo unidad...' : 'Guardar Vehículo'}
            </Button>
            <Link href="/vehiculos">
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