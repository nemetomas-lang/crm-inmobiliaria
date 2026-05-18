'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import {
  getFullName,
  contactEstadoConfig,
  contactInteresConfig,
  fmtCurrency,
  formatRelativeTime,
} from '@/lib/utils'
import type { Contact, ContactEstado, ContactInteres, PipelineStage } from '@/lib/types'
import { createContact } from './actions'
import {
  Phone,
  Mail,
  ChevronRight,
  Users,
  Loader2,
} from 'lucide-react'
import ContactForm from './ContactForm'

const STAGE_FILTERS: { label: string; value: ContactEstado | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Nuevo', value: 'nuevo' },
  { label: 'Contactado', value: 'contactado' },
  { label: 'Visitó', value: 'visito' },
  { label: 'Negociación', value: 'negociacion' },
  { label: 'Cerrado', value: 'cerrado' },
  { label: 'Perdido', value: 'perdido' },
]

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ContactEstado | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})

  const fetchContacts = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    const all = (data ?? []) as Contact[]
    setContacts(all)

    // Count per estado
    const c: Record<string, number> = { all: all.length }
    for (const s of ['nuevo', 'contactado', 'visito', 'negociacion', 'cerrado', 'perdido']) {
      c[s] = all.filter((x) => x.estado === s).length
    }
    setCounts(c)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchContacts()
    const supabase = createClient()
    const channel = supabase
      .channel('contacts-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, fetchContacts)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchContacts])

  const filtered = contacts.filter((c) => {
    const matchFilter = filter === 'all' || c.estado === filter
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      getFullName(c.first_name, c.last_name).toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    return matchFilter && matchSearch
  })

  const handleCreate = async (formData: Record<string, string>) => {
    setSaving(true)
    try {
      await createContact({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        estado: (formData.estado as ContactEstado) || 'nuevo',
        interes: (formData.interes as ContactInteres) || undefined,
        budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
        budget_currency: (formData.budget_currency as 'ARS' | 'USD') || 'USD',
        origen: formData.origen as never || undefined,
        notas: formData.notas || undefined,
      })
      setShowModal(false)
      fetchContacts()
    } catch {
      alert('Error al crear el contacto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Topbar
        title="Contactos"
        subtitle={`${counts.all ?? 0} contactos`}
        onAdd={() => setShowModal(true)}
        addLabel="Nuevo contacto"
        searchPlaceholder="Buscar contacto..."
        onSearch={setSearch}
        searchValue={search}
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Stage filter chips */}
        <div className="flex flex-wrap gap-2">
          {STAGE_FILTERS.map((sf) => {
            const isActive = filter === sf.value
            const cfg = sf.value !== 'all' ? contactEstadoConfig[sf.value] : null
            return (
              <button
                key={sf.value}
                onClick={() => setFilter(sf.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  isActive
                    ? 'bg-orange text-white border-orange'
                    : 'bg-white border-border text-ink-3 hover:text-ink hover:border-ink-light'
                }`}
              >
                {cfg && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                )}
                {sf.label}
                {counts[sf.value] != null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-surface text-ink-3'}`}>
                    {counts[sf.value]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="bg-white border border-border rounded-[16px] overflow-hidden shadow-[var(--shadow-card)]">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 w-40 rounded" />
                    <div className="skeleton h-3 w-32 rounded" />
                  </div>
                  <div className="skeleton h-6 w-20 rounded-full" />
                  <div className="skeleton h-6 w-16 rounded-full" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Sin contactos"
              description={search ? 'No hay contactos que coincidan con tu búsqueda' : 'Agregá tu primer contacto'}
              icon={<Users size={22} />}
              action={
                <Button onClick={() => setShowModal(true)} icon={<Users size={14} />}>
                  Nuevo contacto
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Contacto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Interés</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Presupuesto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Origen</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Agregado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const fullName = getFullName(c.first_name, c.last_name)
                    const estadoCfg = c.estado ? contactEstadoConfig[c.estado as ContactEstado] : null
                    const interesCfg = c.interes ? contactInteresConfig[c.interes as ContactInteres] : null
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border last:border-0 hover:bg-surface transition-colors cursor-pointer"
                        onClick={() => router.push(`/contacts/${c.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={fullName} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink truncate">{fullName}</p>
                              <div className="flex items-center gap-2 text-xs text-ink-3">
                                {c.email && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail size={11} />{c.email}
                                  </span>
                                )}
                                {c.phone && !c.email && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={11} />{c.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {estadoCfg ? (
                            <Badge bgColor={estadoCfg.bgColor} textColor={estadoCfg.textColor} dot color={estadoCfg.color}>
                              {estadoCfg.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-ink-light">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {interesCfg ? (
                            <Badge bgColor={interesCfg.bgColor} textColor={interesCfg.textColor}>
                              {interesCfg.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-ink-light">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-ink-2">
                          {c.budget_max
                            ? fmtCurrency(c.budget_max, c.budget_currency)
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-ink-3 capitalize">
                          {c.origen?.replace('_', ' ') ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-ink-light whitespace-nowrap">
                          {formatRelativeTime(c.created_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <ChevronRight size={16} className="text-ink-light" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* New Contact Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Contacto" size="lg">
        <ContactForm
          onSubmit={handleCreate}
          onCancel={() => setShowModal(false)}
          saving={saving}
        />
      </Modal>
    </>
  )
}
