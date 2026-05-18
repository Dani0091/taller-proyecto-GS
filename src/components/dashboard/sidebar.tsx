'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
// ✅ CAMBIO 1: Añadido 'FileText' a los iconos importados
import { Home, Wrench, Users, Settings, X, Gauge, Car, FileText } from 'lucide-react'

// ✅ CAMBIO 2: Añadido el enlace de facturas apuntando a la nueva ruta
const links = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/ordenes', label: 'Órdenes', icon: Wrench },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/vehiculos', label: 'Vehículos', icon: Car },
  { href: '/facturas', label: 'Facturas', icon: FileText }, 
]

interface PlanInfo {
  plan_nombre: string
  plan_display: string
  dias_restantes: number
  color: string
}

interface SidebarProps {
  user?: any
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ user, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch('/api/taller/plan')
        if (res.ok) {
          const data = await res.json()
          setPlanInfo(data)
        } else {
          setPlanInfo({
            plan_nombre: 'clase',
            plan_display: 'Entorno de Clase',
            dias_restantes: 99,
            color: '#0ea5e9'
          })
        }
      } catch (error) {
        console.error('Error fetching plan:', error)
      }
    }
    fetchPlan()
  }, [])

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const emailUsuario = user?.email || 'usuario@taller.com'
    const inicialUsuario = emailUsuario.charAt(0).toUpperCase()

    return (
      <>
        {/* Logo */}
        <div className={`${isMobile ? 'flex items-center justify-between' : ''} mb-8`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TallerAgil</h1>
              <p
                className="text-[10px] font-medium tracking-wider uppercase"
                style={{ color: planInfo?.color || '#38bdf8' }}
              >
                {planInfo?.plan_display || 'Entorno de Clase'}
              </p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Accent stripe */}
        <div className="h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-500 rounded-full mb-6 opacity-80" />

        <nav className="flex-1 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={isMobile ? onClose : undefined}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className="font-medium">{link.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-cyan-300 rounded-full animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700/50 pt-4 mt-4">
          <div className="p-3 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {inicialUsuario}
                </span>
              </div>
              <p className="text-xs text-gray-300 truncate flex-1">{emailUsuario}</p>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500">TallerAgil v0.07</span>
              <span
                    className="px-2 py-0.5 rounded-full font-medium"
                    style={{
                    backgroundColor: `${planInfo?.color || '#38bdf8'}20`,
                    color: planInfo?.color || '#38bdf8'
                    }}
                  >PRO
</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Sidebar para desktop */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white p-5 flex-col border-r border-gray-800">
        <SidebarContent />
      </aside>

      {/* Sidebar móvil */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white p-5 flex flex-col
          transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent isMobile />
      </aside>
    </>
  )
}