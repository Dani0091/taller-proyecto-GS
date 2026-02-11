import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TallerAgil - Dashboard',
  description: 'Sistema de gestión para talleres mecánicos - Proyecto Intermodular DAM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
