import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    plan_nombre: 'clase',
    plan_display: 'Entorno de Clase',
    dias_restantes: 99,
    suscripcion_activa: true,
    color: '#0ea5e9'
  });
}
