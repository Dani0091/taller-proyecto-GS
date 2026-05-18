'use client'

import { NumberInput } from '@/components/ui/number-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { VehiculoFormulario } from '@/types/formularios'

interface VehiculoFormProps {
  vehiculo: VehiculoFormulario | null
  onChange: (vehiculo: VehiculoFormulario) => void
  disabled?: boolean
  mode: 'edit' | 'create'
}

export function VehiculoForm({ vehiculo, onChange, disabled = false, mode }: VehiculoFormProps) {
  if (!vehiculo) return null

  const handleChange = (field: keyof VehiculoFormulario, value: any) => {
    onChange({
      ...vehiculo,
      [field]: value
    })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Matrícula</Label>
        <Input
          value={vehiculo.matricula || ''}
          onChange={(e) => handleChange('matricula', e.target.value)}
          placeholder="1234 ABC"
          disabled={disabled}
          className={mode === 'edit' ? 'bg-gray-50' : ''}
        />
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">VIN/Bastidor</Label>
        <Input
          value={vehiculo.vin || ''}
          onChange={(e) => handleChange('vin', e.target.value)}
          placeholder="WVWZZZ..."
          disabled={disabled}
        />
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Marca</Label>
        <Input
          value={vehiculo.marca || ''}
          onChange={(e) => handleChange('marca', e.target.value)}
          placeholder="Seat, Renault..."
          disabled={disabled}
        />
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Modelo</Label>
        <Input
          value={vehiculo.modelo || ''}
          onChange={(e) => handleChange('modelo', e.target.value)}
          placeholder="León, Clio..."
          disabled={disabled}
        />
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Año</Label>
        <NumberInput
          value={vehiculo.año}
          onChange={(value) => handleChange('año', value)}
          placeholder="2020"
          disabled={disabled}
          min={1900}
          max={new Date().getFullYear() + 1}
        />
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Color</Label>
        <Input
          value={vehiculo.color || ''}
          onChange={(e) => handleChange('color', e.target.value)}
          placeholder="Blanco, Negro..."
          disabled={disabled}
        />
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Kilómetros</Label>
        <NumberInput
          value={vehiculo.kilometros}
          onChange={(value) => handleChange('kilometros', value)}
          placeholder="125000"
          disabled={disabled}
          min={0}
        />
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Combustible</Label>
        <select
          value={vehiculo.tipo_combustible || ''}
          onChange={(e) => handleChange('tipo_combustible', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">Seleccionar...</option>
          <option value="Gasolina">Gasolina</option>
          <option value="Diésel">Diésel</option>
          <option value="Eléctrico">Eléctrico</option>
          <option value="Híbrido">Híbrido</option>
        </select>
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Potencia (CV)</Label>
        <NumberInput
          value={vehiculo.potencia_cv}
          onChange={(value) => handleChange('potencia_cv', value)}
          placeholder="120"
          disabled={disabled}
          min={0}
          step={0.1}
        />
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Cilindrada (cc)</Label>
        <NumberInput
          value={vehiculo.cilindrada}
          onChange={(value) => handleChange('cilindrada', value)}
          placeholder="1600"
          disabled={disabled}
          min={0}
          step={1}
        />
      </div>
    </div>
  )
}