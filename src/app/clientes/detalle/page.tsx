'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, User, Phone, Mail, FileText, MapPin, 
  Notebook, Edit2, Trash2, Save, X, Loader2 
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

function DetalleClienteContenido() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const id = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    nif: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: '',
  })

  useEffect(() => {
    if (!id) return

    async function cargarCliente() {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          setFormData({
            nombre: data.nombre || '',
            nif: data.nif || '',
            email: data.email || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            notas: data.notas || '',
          })
        }
      } catch (err: any) {
        console.error(err)
        toast.error('No se pudo cargar la información del cliente')
      } finally {
        setLoading(false)
      }
    }

    cargarCliente()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre o razón social es obligatorio')
      return
    }

    setGuardando(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nombre: formData.nombre.trim(),
          nif: formData.nif.trim().toUpperCase() || null,
          email: formData.email.trim() || null,
          telefono: formData.telefono.trim() || null,
          direccion: formData.direccion.trim() || null,
          notas: formData.notas.trim() || null,
        })
        .eq('id', id)

      if (error) throw error

      toast.success('¡Cliente actualizado correctamente!')
      setModoEdicion(false)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(`Error al actualizar: ${err.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    const confirmar = window.confirm('¿Estás seguro de eliminar este cliente? Se borrará permanentemente de la base de datos.')
    if (!confirmar) return

    setEliminando(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Cliente eliminado del sistema')
      router.push('/clientes')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error('No se pudo eliminar el cliente. Comprueba que no tenga órdenes o facturas vinculadas.')
    } finally {
      setEliminando(false)
    }
  }

  if (!id) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto space-y-4">
        <p className="text-amber-600 text-sm font-medium bg-amber-50 p-4 border border-amber-200 rounded-2xl">ID de cliente inválido.</p>
        <Link href="/clientes"><Button variant="outline" className="rounded-xl w-full">Volver al panel</Button></Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <p className="text-xs text-gray-400">Cargando expediente del cliente...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4 p-4 pb-16">
      <div className="flex items-center justify-between">
        <Link href="/clientes">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 text-xs gap-1 px-2 rounded-lg">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al listado
          </Button>
        </Link>

        <div className="flex items-center gap-1.5">
          {!modoEdicion ? (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setModoEdicion(true)}
                className="h-8 text-xs font-semibold rounded-xl gap-1 border-gray-200 hover:bg-slate-50 text-gray-700"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-500" /> Editar
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                disabled={eliminando}
                onClick={handleEliminar}
                className="h-8 text-xs font-semibold rounded-xl gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {eliminando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Eliminar
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setModoEdicion(false)}
                className="h-8 text-xs font-semibold rounded-xl gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </Button>
              <Button 
                size="sm" 
                disabled={guardando}
                onClick={handleGuardar}
                className="h-8 text-xs font-semibold rounded-xl gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <div className="bg-slate-50 border-b border-gray-100 p-5 flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="w-full overflow-hidden">
            {modoEdicion ? (
              <div className="space-y-1">
                <Label className="text-[9px] font-bold uppercase text-sky-600">Nombre o Razón Social</Label>
                <Input 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  className="h-8 text-sm rounded-lg bg-white border-gray-200 focus-visible:ring-sky-500" 
                />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight truncate">{formData.nombre}</h2>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight mt-0.5">UUID: {id.substring(0, 8)}...</p>
              </>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-slate-50/40 p-3 rounded-xl border border-gray-100/60">
            <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
            <div className="space-y-1 w-full">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Identificación (NIF/CIF)</span>
              {modoEdicion ? (
                <Input name="nif" value={formData.nif} onChange={handleChange} className="h-8 text-xs font-mono uppercase bg-white" placeholder="12345678X" />
              ) : (
                <span className="text-sm font-medium text-gray-800 font-mono">{formData.nif || 'No registrado'}</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50/40 p-3 rounded-xl border border-gray-100/60">
            <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
            <div className="space-y-1 w-full">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Teléfono de Contacto</span>
              {modoEdicion ? (
                <Input name="telefono" value={formData.telefono} onChange={handleChange} className="h-8 text-xs bg-white" placeholder="600123456" />
              ) : (
                <span className="text-sm font-medium text-gray-800">{formData.telefono || 'Sin Teléfono'}</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50/40 p-3 rounded-xl border border-gray-100/60">
            <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
            <div className="space-y-1 w-full">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Correo Electrónico</span>
              {modoEdicion ? (
                <Input name="email" type="email" value={formData.email} onChange={handleChange} className="h-8 text-xs bg-white" placeholder="cliente@correo.com" />
              ) : (
                <span className="text-sm font-medium text-gray-800 break-all">{formData.email || 'Sin Email'}</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50/40 p-3 rounded-xl border border-gray-100/60">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
            <div className="space-y-1 w-full">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dirección de Envío / Factura</span>
              {modoEdicion ? (
                <Input name="direccion" value={formData.direccion} onChange={handleChange} className="h-8 text-xs bg-white" placeholder="Av. Constitución 14" />
              ) : (
                <span className="text-sm font-medium text-gray-800 text-balance">{formData.direccion || 'Sin Dirección física'}</span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3.5 mt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Notebook className="w-3.5 h-3.5 text-amber-500" /> Notas u Observaciones del Taller
            </span>
            {modoEdicion ? (
              <Textarea name="notas" value={formData.notas} onChange={handleChange} rows={3} className="text-xs bg-white min-h-[60px]" placeholder="Añadir observaciones..." />
            ) : (
              formData.notas ? (
                <p className="text-xs text-gray-600 bg-amber-50/30 border border-amber-100 p-3 rounded-xl italic leading-relaxed">
                  {formData.notas}
                </p>
              ) : (
                <span className="text-xs text-gray-300 italic block">Sin anotaciones internas</span>
              )
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function DetalleClientePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <DetalleClienteContenido />
    </Suspense>
  )
}
