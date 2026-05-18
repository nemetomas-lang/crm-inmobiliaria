'use client'

import { useState } from 'react'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import type { CreateContactData } from './actions'
import type { ContactType } from '@/lib/types'
import { User, Home, Key, ShieldCheck } from 'lucide-react'

interface ContactFormProps {
  initialValues?: Partial<CreateContactData>
  onSubmit: (data: CreateContactData) => Promise<void>
  onCancel: () => void
  saving: boolean
}

const TYPE_TABS: { value: ContactType; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: 'lead', label: 'Lead', icon: <User size={14} />, hint: 'Cliente potencial — compra/venta/alquiler' },
  { value: 'propietario', label: 'Propietario', icon: <Home size={14} />, hint: 'Dueño de propiedad — datos bancarios para liquidación' },
  { value: 'inquilino', label: 'Inquilino', icon: <Key size={14} />, hint: 'Alquila una propiedad — datos para cobranzas' },
  { value: 'garante', label: 'Garante', icon: <ShieldCheck size={14} />, hint: 'Respalda un alquiler — CUIL + recibos de sueldo' },
]

export default function ContactForm({
  initialValues = {},
  onSubmit,
  onCancel,
  saving,
}: ContactFormProps) {
  const [type, setType] = useState<ContactType>((initialValues.contact_type as ContactType) ?? 'lead')
  const [form, setForm] = useState({
    first_name: initialValues.first_name ?? '',
    last_name: initialValues.last_name ?? '',
    email: initialValues.email ?? '',
    phone: initialValues.phone ?? '',
    dni: initialValues.dni ?? '',
    cuil: initialValues.cuil ?? '',
    birth_date: initialValues.birth_date ?? '',
    occupation: initialValues.occupation ?? '',
    // Lead-only
    estado: initialValues.estado ?? 'nuevo',
    interes: initialValues.interes ?? '',
    budget_min: initialValues.budget_min?.toString() ?? '',
    budget_max: initialValues.budget_max?.toString() ?? '',
    budget_currency: initialValues.budget_currency ?? 'USD',
    origen: initialValues.origen ?? '',
    // Bank (propietario/inquilino)
    banco: initialValues.banco ?? '',
    cbu: initialValues.cbu ?? '',
    alias_cbu: initialValues.alias_cbu ?? '',
    tipo_cuenta: initialValues.tipo_cuenta ?? '',
    notas: initialValues.notas ?? '',
  })
  const [recibosUrls, setRecibosUrls] = useState<string[]>(initialValues.recibos_sueldo_urls ?? [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data: CreateContactData = {
      first_name: form.first_name,
      last_name: form.last_name,
      contact_type: type,
      email: form.email || undefined,
      phone: form.phone || undefined,
      dni: form.dni || undefined,
      birth_date: form.birth_date || undefined,
      occupation: form.occupation || undefined,
      notas: form.notas || undefined,
    }

    if (type === 'lead') {
      Object.assign(data, {
        estado: form.estado || 'nuevo',
        interes: form.interes || undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        budget_currency: form.budget_currency || 'USD',
        origen: form.origen || undefined,
      })
    }
    if (type === 'propietario' || type === 'inquilino') {
      Object.assign(data, {
        banco: form.banco || undefined,
        cbu: form.cbu || undefined,
        alias_cbu: form.alias_cbu || undefined,
        tipo_cuenta: form.tipo_cuenta || undefined,
      })
    }
    if (type === 'garante') {
      Object.assign(data, {
        cuil: form.cuil || undefined,
        recibos_sueldo_urls: recibosUrls.length > 0 ? recibosUrls : undefined,
      })
    }

    await onSubmit(data)
  }

  const currentTab = TYPE_TABS.find((t) => t.value === type)!

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector tabs */}
      <div>
        <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">
          Tipo de contacto
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TYPE_TABS.map((t) => {
            const active = type === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-medium transition-colors ${
                  active
                    ? 'bg-orange text-white border-orange'
                    : 'bg-white border-border text-ink-3 hover:border-ink-light hover:text-ink'
                }`}
              >
                <span className={active ? 'text-white' : 'text-ink-light'}>{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-ink-light mt-1.5">{currentTab.hint}</p>
      </div>

      {/* ───── Common: identity ───── */}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre *" value={form.first_name} onChange={set('first_name')} required placeholder="Juan" />
        <Input label="Apellido *" value={form.last_name} onChange={set('last_name')} required placeholder="García" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="juan@email.com" />
        <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} placeholder="+54 351 000-0000" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="DNI" value={form.dni} onChange={set('dni')} placeholder="29.881.220" />
        {(type === 'propietario' || type === 'inquilino') && (
          <Input label="Fecha de nacimiento" type="date" value={form.birth_date} onChange={set('birth_date')} />
        )}
        {type === 'garante' && (
          <Input label="CUIL" value={form.cuil} onChange={set('cuil')} placeholder="20-29881220-3" />
        )}
        {type === 'lead' && (
          <Input label="Ocupación" value={form.occupation} onChange={set('occupation')} placeholder="Diseñador UX" />
        )}
      </div>

      {/* ───── Lead-only fields ───── */}
      {type === 'lead' && (
        <>
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
            <Input label="Presupuesto mín." type="number" value={form.budget_min} onChange={set('budget_min')} placeholder="0" />
            <Input label="Presupuesto máx." type="number" value={form.budget_max} onChange={set('budget_max')} placeholder="0" />
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
        </>
      )}

      {/* ───── Propietario / Inquilino: bank fields ───── */}
      {(type === 'propietario' || type === 'inquilino') && (
        <div className="pt-2 border-t border-border space-y-4">
          <h4 className="text-sm font-semibold text-ink">Datos bancarios</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Banco" value={form.banco} onChange={set('banco')} placeholder="Banco Galicia" />
            <Select label="Tipo de cuenta" value={form.tipo_cuenta} onChange={set('tipo_cuenta')}>
              <option value="">Sin especificar</option>
              <option value="caja_ahorro_ars">Caja de Ahorro $</option>
              <option value="caja_ahorro_usd">Caja de Ahorro U$D</option>
              <option value="cuenta_corriente">Cuenta Corriente</option>
              <option value="cuenta_unica">Cuenta Única</option>
            </Select>
          </div>
          <Input label="CBU" value={form.cbu} onChange={set('cbu')} placeholder="0070123130004001233456" />
          <Input label="Alias" value={form.alias_cbu} onChange={set('alias_cbu')} placeholder="JUAN.GARCIA.NEME" />
        </div>
      )}

      {/* ───── Garante: payslips ───── */}
      {type === 'garante' && (
        <div className="pt-2 border-t border-border space-y-3">
          <h4 className="text-sm font-semibold text-ink">Recibos de sueldo</h4>
          <p className="text-xs text-ink-3">PDFs o fotos de los últimos 3 recibos. Quedan guardados de forma privada.</p>
          <FileUpload
            bucket="garante-recibos"
            values={recibosUrls}
            onChangeMulti={setRecibosUrls}
            accept="application/pdf,image/*"
            multiple
            folder={form.dni || 'sin-dni'}
          />
        </div>
      )}

      <Textarea label="Notas" value={form.notas} onChange={set('notas')} rows={2} placeholder="Notas adicionales..." />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>Guardar contacto</Button>
      </div>
    </form>
  )
}
