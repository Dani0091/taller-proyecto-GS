'use client'

import { Car } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Vehiculo } from '@/types/workshop'

interface InfoVehiculoProps {
  vehiculo?: Vehiculo | null
  compact?: boolean
}

export function InfoVehiculo({ 
  vehiculo, 
  compact = false 
}: InfoVehiculoProps) {

  if (!vehiculo) {
    return (
      <Card className={`p-4 ${compact ? 'text-sm' : ''}`}>
        <div className="flex items-center justify-center text-gray-500 py-8">
          <Car className="h-8 w-8 mr-2" />
          <span>Selecciona un vehículo</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-4 ${compact ? 'text-sm' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <Car className="h-4 w-4 mr-2" />
          Información del Vehículo
        </h3>
      </div>

      <div className="space-y-3">
        <div className="text-center py-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-gray-900">
            {vehiculo.matricula}
          </div>
          <div className="text-xs text-gray-500">Matrícula</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Marca:</span>
            <div className="font-medium">{vehiculo.marca || '-'}</div>
          </div>
          <div>
            <span className="text-gray-500">Modelo:</span>
            <div className="font-medium">{vehiculo.modelo || '-'}</div>
          </div>
          <div>
            <span className="text-gray-500">Año:</span>
            <div className="font-medium">{vehiculo.año || '-'}</div>
          </div>
          <div>
            <span className="text-gray-500">Color:</span>
            <div className="font-medium">{vehiculo.color || '-'}</div>
          </div>
        </div>

        {!compact && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Especificaciones</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Kilometraje:</span>
                <div className="font-medium">
                  {vehiculo.kilometros ? Number(vehiculo.kilometros).toLocaleString() : '-'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Combustible:</span>
                <div className="font-medium">{vehiculo.tipo_combustible || '-'}</div>
              </div>
              <div>
                <span className="text-gray-500">Potencia:</span>
                <div className="font-medium">
                  {vehiculo.potencia_cv ? `${vehiculo.potencia_cv} CV` : '-'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Cilindrada:</span>
                <div className="font-medium">
                  {vehiculo.cilindrada ? `${vehiculo.cilindrada} cc` : '-'}
                </div>
              </div>
            </div>
          </div>
        )}

        {vehiculo.vin && (
          <div>
            <span className="text-gray-500 text-sm">VIN/Bastidor:</span>
            <div className="font-mono text-xs bg-gray-100 p-2 rounded">
              {vehiculo.vin}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {vehiculo.tipo_combustible && (
            <Badge variant="secondary" className="text-xs">
              {vehiculo.tipo_combustible}
            </Badge>
          )}
          {vehiculo.año && (
            <Badge variant="outline" className="text-xs">
              {vehiculo.año}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}