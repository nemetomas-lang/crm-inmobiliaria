'use client'

import { useState } from 'react'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ContactFormProps {
  initialValues?: Record<string, string>
  onSubmit: (data: Record<string, string>) => Promise<void>
  onCancel: () => void
  saving: boolean
}

export default function ContactForm({
  initialValues = {},
  onSubmit,
  onCancel,
  saving,
}: ContactFormProps) {
  const [form, setForm] = useState<Record<string, string>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    estado: 'nuevo',
    interes: '',
    budget_min: '',
    budget_max: '',
    budget_currency: 'USD',
    origen: '',
    notas: '',
    ...initialValues,
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre *"
          value={form.first_name}
          onChange={set('first_name')}
          required
          placeholder="Juan"
        />
        <Input
          label="Apellido *"
          value={form.last_name}
          onChange={set('last_name')}
          required
          placeholder="García"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="juan@email.com"
        />
        <Input
          label="Teléfono"
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="+54 351 000-0000"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Estado" value={form.estado} onChange={set('estado')}>
          <option value="nuevo">Nuevo</option>
          <option value="contactado">Contactado</option>
          <option value="visito">Visitó</option>
          <option value="negociacion">Negociación</option>
          <option value="cerrado">Cerrado</option>
          <option value="perdido">Perdido</option>
        </Select>
        <Select label="Interés" value={form.interes} onChange={set('interes')}>
          <option value="">Sin especificar</option>
          <option value="compra">Compra</option>
          <option value="venta">Venta</option>
          <option value="alquiler">Alquiler</option>
          <option value="alquiler_temporal">Alquiler temporal</option>
          <option value="inversion">Inversión</option>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Presupuesto mín."
          type="number"
          value={form.budget_min}
          onChange={set('budget_min')}
          placeholder="0"
        />
        <Input
          label="Presupuesto máx."
          type="number"
          value={form.budget_max}
          onChange={set('budget_max')}
          placeholder="0"
        />
        <Select label="Moneda" value={form.budget_currency} onChange={set('budget_currency')}>
          <option value="USD">USD</option>
          <option value="ARS">ARS</option>
        </Select>
      </div>

      <Select label="Origen" value={form.origen} onChange={set('origen')}>
        <option value="">Sin especificar</option>
        <option value="web">Web</option>
        <option value="referido">Referido</option>
        <option value="redes_sociales">Redes sociales</option>
        <option value="portal_inmobiliario">Portal inmobiliario</option>
        <option value="llamada_directa">Llamada directa</option>
        <option value="otro">Otro</option>
      </Select>

      <Textarea
        label="Notas"
        value={form.notas}
        onChange={set('notas')}
        rows={3}
        placeholder="Notas adicionales sobre el contacto..."
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          Guardar contacto
        </Button>
      </div>
    </form>
  )
}
