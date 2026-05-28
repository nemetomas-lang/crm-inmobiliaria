'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import {
  fmtCurrency,
  propertyTipoConfig,
  propertyEstadoConfig,
  fmtSqm,
} from '@/lib/utils'
import type { Property, PropertyEstado, PropertyTipo, PropertyOperacion } from '@/lib/types'
import { createProperty } from './actions'
import {
  Home,
  BedDouble,
  Bath,
  Maximize2,
  Car,
  List,
  LayoutGrid,
  MapPin,
  Plus,
} from 'lucide-react'

type ViewMode = 'grid' | 'list'

export default function PropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    tipo: '',
    estado: 'disponible',
    operacion: '',
    address: '',
    barrio: '',
    city: 'Córdoba',
    price_usd: '',
    price_ars: '',
    sup_cubierta: '',
    dormitorios: '',
    banos: '',
    cocheras: '',
    ambientes: '',
  })

  const fetchProperties = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    setProperties((data ?? []) as Property[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createProperty({
        title: form.title,
        tipo: form.tipo as PropertyTipo || undefined,
        estado: form.estado as PropertyEstado || 'disponible',
        operacion: form.operacion as PropertyOperacion || undefined,
        address: form.address || undefined,
        barrio: form.barrio || undefined,
        city: form.city || undefined,
        price_usd: form.price_usd ? Number(form.price_usd) : undefined,
        price_ars: form.price_ars ? Number(form.price_ars) : undefined,
        sup_cubierta: form.sup_cubierta ? Number(form.sup_cubierta) : undefined,
        dormitorios: form.dormitorios ? Number(form.dormitorios) : undefined,
        banos: form.banos ? Number(form.banos) : undefined,
        cocheras: form.cocheras ? Number(form.cocheras) : undefined,
        ambientes: form.ambientes ? Number(form.ambientes) : undefined,
      })
      setShowModal(false)
      fetchProperties()
    } catch (err) {
      alert('Error al crear la propiedad:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase()
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.barrio?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <Topbar
        title="Propiedades"
        subtitle={`${properties.length} propiedades`}
        onAdd={() => setShowModal(true)}
        addLabel="Nueva propiedad"
        searchPlaceholder="Buscar propiedad..."
        onSearch={setSearch}
        searchValue={search}
        actions={
          <div className="flex border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-9 h-9 flex items-center justify-center transition-colors ${
                viewMode === 'grid' ? 'bg-surface text-ink' : 'text-ink-light hover:text-ink'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-9 h-9 flex items-center justify-center transition-colors ${
                viewMode === 'list' ? 'bg-surface text-ink' : 'text-ink-light hover:text-ink'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        }
      />

      <main className="flex-1 p-3 sm:p-6">
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4' : 'space-y-3'}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-[16px] overflow-hidden">
                <div className="skeleton h-44 w-full" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-5 w-20 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Sin propiedades"
            description={search ? 'No hay propiedades que coincidan' : 'Agregá tu primera propiedad'}
            icon={<Home size={22} />}
            action={<Button onClick={() => setShowModal(true)} icon={<Plus size={14} />}>Nueva propiedad</Button>}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((p) => <PropertyCard key={p.id} property={p} onClick={() => router.push(`/properties/${p.id}`)} />)}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-[16px] shadow-[var(--shadow-card)] overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Propiedad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Precio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Características</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const tipoCfg = p.tipo ? propertyTipoConfig[p.tipo as PropertyTipo] : null
                  const estadoCfg = p.estado ? propertyEstadoConfig[p.estado as PropertyEstado] : null
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-surface cursor-pointer transition-colors"
                      onClick={() => router.push(`/properties/${p.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-ink">{p.title}</p>
                        {(p.address || p.barrio) && (
                          <p className="text-xs text-ink-3 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />
                            {[p.barrio, p.address].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-2">{tipoCfg?.label ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        {estadoCfg ? (
                          <Badge bgColor={estadoCfg.bgColor} textColor={estadoCfg.textColor} dot color={estadoCfg.color}>
                            {estadoCfg.label}
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-ink">
                        {p.price_usd ? fmtCurrency(p.price_usd, 'USD') : p.price_ars ? fmtCurrency(p.price_ars, 'ARS') : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 text-xs text-ink-3">
                          {p.dormitorios != null && <span className="flex items-center gap-1"><BedDouble size={12} />{p.dormitorios}</span>}
                          {p.banos != null && <span className="flex items-center gap-1"><Bath size={12} />{p.banos}</span>}
                          {p.sup_cubierta != null && <span className="flex items-center gap-1"><Maximize2 size={12} />{fmtSqm(p.sup_cubierta)}</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Propiedad" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Título *" value={form.title} onChange={set('title')} required placeholder="Depto 3 amb en Nueva Córdoba" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" value={form.tipo} onChange={set('tipo')}>
              <option value="">Seleccionar...</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="local">Local Comercial</option>
              <option value="oficina">Oficina</option>
              <option value="terreno">Terreno</option>
              <option value="galpon">Galpón</option>
              <option value="campo">Campo</option>
              <option value="otro">Otro</option>
            </Select>
            <Select label="Estado" value={form.estado} onChange={set('estado')}>
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
              <option value="alquilado">Alquilado</option>
              <option value="no_disponible">No disponible</option>
            </Select>
          </div>
          <Select label="Operación *" value={form.operacion} onChange={set('operacion')}>
            <option value="">Seleccionar...</option>
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </Select>
          <Input label="Dirección" value={form.address} onChange={set('address')} placeholder="Av. Colón 1234, Piso 3 Dpto B" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Barrio" value={form.barrio} onChange={set('barrio')} placeholder="Nueva Córdoba" />
            <Input label="Ciudad" value={form.city} onChange={set('city')} placeholder="Córdoba" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio USD" type="number" value={form.price_usd} onChange={set('price_usd')} placeholder="0" />
            <Input label="Precio ARS" type="number" value={form.price_ars} onChange={set('price_ars')} placeholder="0" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Input label="Ambientes" type="number" value={form.ambientes} onChange={set('ambientes')} placeholder="3" />
            <Input label="Dormitorios" type="number" value={form.dormitorios} onChange={set('dormitorios')} placeholder="2" />
            <Input label="Baños" type="number" value={form.banos} onChange={set('banos')} placeholder="1" />
            <Input label="Cocheras" type="number" value={form.cocheras} onChange={set('cocheras')} placeholder="1" />
          </div>
          <Input label="Sup. cubierta (m²)" type="number" value={form.sup_cubierta} onChange={set('sup_cubierta')} placeholder="75" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar propiedad</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function PropertyCard({ property: p, onClick }: { property: Property; onClick: () => void }) {
  const tipoCfg = p.tipo ? propertyTipoConfig[p.tipo as PropertyTipo] : null
  const estadoCfg = p.estado ? propertyEstadoConfig[p.estado as PropertyEstado] : null
  const imgUrl = p.img_urls?.[0] ?? null

  return (
    <div
      className="bg-white border border-border rounded-[16px] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] cursor-pointer transition-shadow group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="h-44 bg-surface relative overflow-hidden">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home size={36} className="text-border" />
          </div>
        )}
        {estadoCfg && (
          <div className="absolute top-3 right-3">
            <Badge bgColor={estadoCfg.bgColor} textColor={estadoCfg.textColor} dot color={estadoCfg.color}>
              {estadoCfg.label}
            </Badge>
          </div>
        )}
        {p.code && (
          <div className="absolute top-3 left-3">
            <span className="bg-ink/70 text-white text-xs font-mono px-2 py-0.5 rounded-lg">#{p.code}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-display font-bold text-sm text-ink line-clamp-2 leading-snug">{p.title}</p>
        {(p.address || p.barrio) && (
          <p className="text-xs text-ink-3 flex items-center gap-1 mt-1">
            <MapPin size={10} />
            {[p.barrio, p.city].filter(Boolean).join(', ')}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div>
            {p.price_usd ? (
              <p className="text-base font-bold text-ink">{fmtCurrency(p.price_usd, 'USD')}</p>
            ) : p.price_ars ? (
              <p className="text-base font-bold text-ink">{fmtCurrency(p.price_ars, 'ARS')}</p>
            ) : null}
          </div>
          {tipoCfg && (
            <Badge bgColor="#f3f4f6" textColor="#374151" size="sm">{tipoCfg.label}</Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-ink-3">
          {p.dormitorios != null && (
            <span className="flex items-center gap-1"><BedDouble size={13} className="text-ink-light" />{p.dormitorios} dorm.</span>
          )}
          {p.banos != null && (
            <span className="flex items-center gap-1"><Bath size={13} className="text-ink-light" />{p.banos} baños</span>
          )}
          {p.sup_cubierta != null && (
            <span className="flex items-center gap-1"><Maximize2 size={13} className="text-ink-light" />{fmtSqm(p.sup_cubierta)}</span>
          )}
          {p.cocheras != null && p.cocheras > 0 && (
            <span className="flex items-center gap-1"><Car size={13} className="text-ink-light" />{p.cocheras}</span>
          )}
        </div>
      </div>
    </div>
  )
}
