'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getFullName } from '@/lib/utils'
import { createTask } from '@/app/(dashboard)/calendar/actions'
import type { TaskKind, Contact } from '@/lib/types'

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  defaultDate?: Date
  defaultContactId?: string
  defaultPropertyId?: string
  defaultDealId?: string
  // When mounted from a property/contact detail, pre-fill and lock the relation
  lockContact?: boolean
  lockProperty?: boolean
  lockDeal?: boolean
}

export default function TaskFormModal({
  open,
  onClose,
  onSaved,
  defaultDate,
  defaultContactId,
  defaultPropertyId,
  defaultDealId,
  lockContact,
  lockProperty,
  lockDeal,
}: TaskFormModalProps) {
  const [contacts, setContacts] = useState<Pick<Contact, 'id' | 'first_name' | 'last_name'>[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    kind: 'llamada' as TaskKind,
    scheduled_at: format(defaultDate ?? new Date(), "yyyy-MM-dd'T'HH:mm"),
    contact_id: defaultContactId ?? '',
  })

  useEffect(() => {
    if (!open) return
    // Reset form to current defaults each time the modal opens
    setForm({
      title: '',
      kind: 'llamada',
      scheduled_at: format(defaultDate ?? new Date(), "yyyy-MM-dd'T'HH:mm"),
      contact_id: defaultContactId ?? '',
    })
    // Only fetch contacts list when not locked (no need otherwise)
    if (!lockContact) {
      const supabase = createClient()
      supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .order('first_name')
        .then(({ data }) => setContacts((data ?? []) as Contact[]))
    }
  }, [open, defaultDate, defaultContactId, lockContact])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createTask({
        title: form.title,
        kind: form.kind,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined,
        contact_id: form.contact_id || undefined,
        property_id: defaultPropertyId,
        deal_id: defaultDealId,
      })
      onSaved?.()
      onClose()
    } catch (err) {
      alert('Error al crear la tarea:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva tarea" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título *"
          value={form.title}
          onChange={set('title')}
          required
          placeholder="Ej: Llamada con propietario"
        />
        <Select label="Tipo" value={form.kind} onChange={set('kind')}>
          <option value="llamada">Llamada</option>
          <option value="visita">Visita</option>
          <option value="reunion">Reunión</option>
          <option value="documentacion">Documentación</option>
          <option value="seguimiento">Seguimiento</option>
          <option value="otro">Otro</option>
        </Select>
        <Input
          label="Fecha y hora"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={set('scheduled_at')}
        />
        {!lockContact && !lockProperty && !lockDeal && (
          <Select label="Contacto" value={form.contact_id} onChange={set('contact_id')}>
            <option value="">Sin contacto</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {getFullName(c.first_name, c.last_name)}
              </option>
            ))}
          </Select>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={saving}>Guardar tarea</Button>
        </div>
      </form>
    </Modal>
  )
}
