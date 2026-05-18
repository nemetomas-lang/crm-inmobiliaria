'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { formatRelativeTime } from '@/lib/utils'
import type { Company } from '@/lib/types'
import { createCompany } from './actions'
import { Building2, Globe, Mail, MapPin, Phone } from 'lucide-react'

interface CompanyWithCount extends Company {
  contacts_count: number
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    website: '',
    notes: '',
  })

  const fetchCompanies = useCallback(async () => {
    const supabase = createClient()
    const { data: companiesData } = await supabase
      .from('companies')
      .select('*')
      .order('name')

    const all = (companiesData ?? []) as Company[]

    // Get contact counts
    const { data: contactData } = await supabase
      .from('contacts')
      .select('company_id')
      .not('company_id', 'is', null)

    const countMap: Record<string, number> = {}
    for (const c of contactData ?? []) {
      if (c.company_id) {
        countMap[c.company_id] = (countMap[c.company_id] ?? 0) + 1
      }
    }

    setCompanies(all.map((c) => ({ ...c, contacts_count: countMap[c.id] ?? 0 })))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createCompany({
        name: form.name,
        tax_id: form.tax_id || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        province: form.province || undefined,
        website: form.website || undefined,
        notes: form.notes || undefined,
      })
      setShowModal(false)
      setForm({ name: '', tax_id: '', email: '', phone: '', address: '', city: '', province: '', website: '', notes: '' })
      fetchCompanies()
    } catch (err) {
      alert('Error al crear la empresa:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.tax_id?.includes(q)
    )
  })

  return (
    <>
      <Topbar
        title="Empresas"
        subtitle={`${companies.length} empresas`}
        onAdd={() => setShowModal(true)}
        addLabel="Nueva empresa"
        searchPlaceholder="Buscar empresa..."
        onSearch={setSearch}
        searchValue={search}
      />

      <main className="flex-1 p-6">
        <div className="bg-white border border-border rounded-[16px] overflow-hidden shadow-[var(--shadow-card)]">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 w-40 rounded" />
                    <div className="skeleton h-3 w-56 rounded" />
                  </div>
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-3 w-10 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Sin empresas"
              description={search ? 'No hay empresas que coincidan' : 'Agregá tu primera empresa'}
              icon={<Building2 size={22} />}
              action={
                <Button onClick={() => setShowModal(true)} icon={<Building2 size={14} />}>
                  Nueva empresa
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">CUIT</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Contacto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Ciudad</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Contactos</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Agregado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" className="rounded-xl" />
                          <div>
                            <p className="text-sm font-semibold text-ink">{c.name}</p>
                            {c.website && (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-orange flex items-center gap-1 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe size={10} />{c.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-2 font-mono">{c.tax_id ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm text-ink-3 space-y-0.5">
                          {c.email && <p className="flex items-center gap-1"><Mail size={11} className="flex-shrink-0" />{c.email}</p>}
                          {c.phone && <p className="flex items-center gap-1"><Phone size={11} className="flex-shrink-0" />{c.phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-3">
                        {(c.city || c.province) ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {[c.city, c.province].filter(Boolean).join(', ')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-ink">{c.contacts_count}</span>
                        <span className="text-xs text-ink-light ml-1">contactos</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-light">{formatRelativeTime(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Empresa" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={set('name')} required placeholder="Inmobiliaria SA" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CUIT/CUIL" value={form.tax_id} onChange={set('tax_id')} placeholder="20-12345678-9" />
            <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} placeholder="+54 351..." />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="empresa@email.com" />
          <Input label="Sitio web" type="url" value={form.website} onChange={set('website')} placeholder="https://empresa.com" />
          <Input label="Dirección" value={form.address} onChange={set('address')} placeholder="Av. Colón 1234" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ciudad" value={form.city} onChange={set('city')} placeholder="Córdoba" />
            <Input label="Provincia" value={form.province} onChange={set('province')} placeholder="Córdoba" />
          </div>
          <Textarea label="Notas" value={form.notes} onChange={set('notes')} rows={2} placeholder="Notas..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar empresa</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
