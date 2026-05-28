'use client'

import { useState } from 'react'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Property, PropertyTipo, PropertyEstado, PropertyOperacion } from '@/lib/types'
import type { CreatePropertyData } from './actions'

interface PropertyEditFormProps {
  initial: Property
  onSubmit: (data: Partial<CreatePropertyData>) => Promise<void>
  onCancel: () => void
  saving: boolean
}

export default function PropertyEditForm({ initial, onSubmit, onCancel, saving }: PropertyEditFormProps) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    tipo: initial.tipo ?? '',
    operacion: initial.operacion ?? '',
    estado: initial.estado ?? 'disponible',
    code: initial.code ?? '',
    address: initial.address ?? '',
    barrio: initial.barrio ?? '',
    city: initial.city ?? '',
    province: initial.province ?? '',
    floor_unit: initial.floor_unit ?? '',
    price_usd: initial.price_usd?.toString() ?? '',
    price_ars: initial.price_ars?.toString() ?? '',
    expensas: initial.expensas?.toString() ?? '',
    sup_cubierta: initial.sup_cubierta?.toString() ?? '',
    sup_descubierta: initial.sup_descubierta?.toString() ?? '',
    ambientes: initial.ambientes?.toString() ?? '',
    dormitorios: initial.dormitorios?.toString() ?? '',
    banos: initial.banos?.toString() ?? '',
    cocheras: initial.cocheras?.toString() ?? '',
    antiguedad: initial.antiguedad?.toString() ?? '',
    orientacion: initial.orientacion ?? '',
    pago_dia: initial.pago_dia?.toString() ?? '',
    descripcion: initial.descripcion ?? '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }))
  }

  const num = (s: string): number | undefined => (s ? Number(s) : undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data: Partial<CreatePropertyData> = {
      title: form.title,
      tipo: (form.tipo || undefined) as PropertyTipo | undefined,
      operacion: (form.operacion || undefined) as PropertyOperacion | undefined,
      estado: (form.estado || undefined) as PropertyEstado | undefined,
      address: form.address || undefined,
      barrio: form.barrio || undefined,
      city: form.city || undefined,
      province: form.province || undefined,
      floor_unit: form.floor_unit || undefined,
      price_usd: num(form.price_usd),
      price_ars: num(form.price_ars),
      expensas: num(form.expensas),
      sup_cubierta: num(form.sup_cubierta),
      sup_descubierta: num(form.sup_descubierta),
      ambientes: num(form.ambientes),
      dormitorios: num(form.dormitorios),
      banos: num(form.banos),
      cocheras: num(form.cocheras),
      antiguedad: num(form.antiguedad),
      orientacion: form.orientacion || undefined,
      pago_dia: num(form.pago_dia),
      descripcion: form.descripcion || undefined,
    }
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Identidad</h4>
      <Input label="Título *" value={form.title} onChange={set('title')} required />
      <div className="grid grid-cols-3 gap-4">
        <Select label="Tipo" value={form.tipo} onChange={set('tipo')}>
          <option value="">—</option>
          <option value="casa">Casa</option>
          <option value="departamento">Departamento</option>
          <option value="local">Local comercial</option>
          <option value="oficina">Oficina</option>
          <option value="terreno">Terreno</option>
          <option value="galpon">Galpón</option>
          <option value="campo">Campo</option>
          <option value="otro">Otro</option>
        </Select>
        <Select label="Operación" value={form.operacion} onChange={set('operacion')}>
          <option value="">—</option>
          <option value="venta">Venta</option>
          <option value="alquiler">Alquiler</option>
        </Select>
        <Select label="Estado" value={form.estado} onChange={set('estado')}>
          <option value="disponible">Disponible</option>
          <option value="reservado">Reservado</option>
          <option value="vendido">Vendido</option>
          <option value="alquilado">Alquilado</option>
          <option value="no_disponible">No disponible</option>
        </Select>
      </div>

      <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wide pt-2 border-t border-border">Ubicación</h4>
      <Input label="Dirección" value={form.address} onChange={set('address')} />
      <div className="grid grid-cols-3 gap-4">
        <Input label="Barrio" value={form.barrio} onChange={set('barrio')} />
        <Input label="Ciudad" value={form.city} onChange={set('city')} />
        <Input label="Provincia" value={form.province} onChange={set('province')} />
      </div>
      <Input label="Piso / Unidad" value={form.floor_unit} onChange={set('floor_unit')} placeholder="3° B" />

      <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wide pt-2 border-t border-border">Valor</h4>
      <div className="grid grid-cols-3 gap-4">
        <Input label="Precio USD" type="number" value={form.price_usd} onChange={set('price_usd')} />
        <Input label="Precio ARS" type="number" value={form.price_ars} onChange={set('price_ars')} />
        <Input label="Expensas" type="number" value={form.expensas} onChange={set('expensas')} />
      </div>
      <Input label="Día de pago (1-31)" type="number" value={form.pago_dia} onChange={set('pago_dia')} placeholder="5" />

      <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wide pt-2 border-t border-border">Características</h4>
      <div className="grid grid-cols-4 gap-4">
        <Input label="Ambientes" type="number" value={form.ambientes} onChange={set('ambientes')} />
        <Input label="Dormitorios" type="number" value={form.dormitorios} onChange={set('dormitorios')} />
        <Input label="Baños" type="number" value={form.banos} onChange={set('banos')} />
        <Input label="Cocheras" type="number" value={form.cocheras} onChange={set('cocheras')} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Input label="Sup. cubierta (m²)" type="number" value={form.sup_cubierta} onChange={set('sup_cubierta')} />
        <Input label="Sup. descubierta (m²)" type="number" value={form.sup_descubierta} onChange={set('sup_descubierta')} />
        <Input label="Antigüedad (años)" type="number" value={form.antiguedad} onChange={set('antiguedad')} />
        <Input label="Orientación" value={form.orientacion} onChange={set('orientacion')} placeholder="Norte" />
      </div>

      <Textarea label="Descripción" value={form.descripcion} onChange={set('descripcion')} rows={3} />

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>Guardar cambios</Button>
      </div>
    </form>
  )
}
