'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  fmtCurrency,
  fmtSqm,
  propertyTipoConfig,
  propertyEstadoConfig,
} from '@/lib/utils'
import type { Property, PropertyEstado, PropertyTipo, Contact } from '@/lib/types'
import { updateProperty } from '../actions'
import {
  ArrowLeft,
  Home,
  BedDouble,
  Bath,
  Car,
  Maximize2,
  MapPin,
  Edit2,
  Save,
  X,
  User,
  FileText,
  DollarSign,
  Calendar,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabId = 'general' | 'propietario' | 'inquilino' | 'contrato' | 'impuestos'

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'Datos Generales' },
  { id: 'propietario', label: 'Propietario' },
  { id: 'inquilino', label: 'Inquilino/Garantes' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'impuestos', label: 'Impuestos/Servicios' },
]

interface FieldRowProps {
  label: string
  value: string | number | null | undefined
  onSave?: (value: string) => Promise<void>
  type?: string
  icon?: React.ReactNode
}

function FieldRow({ label, value, onSave, type = 'text', icon }: FieldRowProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value ?? ''))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(editValue)
      setEditing(false)
    } catch (err) {
      alert('Error al guardar:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0 group">
      {icon && <span className="text-ink-light mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-light mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange"
            />
            <button onClick={handleSave} disabled={saving} className="text-green-600 hover:text-green-700 p-1">
              {saving ? <span className="text-xs">...</span> : <Save size={14} />}
            </button>
            <button onClick={() => setEditing(false)} className="text-ink-light hover:text-ink p-1">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">{value != null && value !== '' ? String(value) : '—'}</p>
            {onSave && (
              <button
                onClick={() => { setEditValue(String(value ?? '')); setEditing(true) }}
                className="opacity-0 group-hover:opacity-100 p-1 text-ink-light hover:text-orange transition-all"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [owner, setOwner] = useState<Contact | null>(null)
  const [tenant, setTenant] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('general')

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('properties').select('*').eq('id', id).single()
    if (data) {
      setProperty(data as Property)
      if (data.owner_contact_id) {
        const { data: ownerData } = await supabase
          .from('contacts').select('*').eq('id', data.owner_contact_id).single()
        setOwner(ownerData as Contact)
      }
      if (data.tenant_contact_id) {
        const { data: tenantData } = await supabase
          .from('contacts').select('*').eq('id', data.tenant_contact_id).single()
        setTenant(tenantData as Contact)
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdate = async (field: keyof Property, value: string) => {
    let parsed: string | number | null = value
    const numericFields: (keyof Property)[] = [
      'price_ars', 'price_usd', 'expensas', 'sup_cubierta', 'sup_descubierta',
      'ambientes', 'dormitorios', 'banos', 'cocheras', 'antiguedad', 'pago_dia'
    ]
    if (numericFields.includes(field)) {
      parsed = value ? Number(value) : null
    }
    await updateProperty(id, { [field]: parsed } as never)
    fetchData()
  }

  if (loading) {
    return (
      <>
        <Topbar title="Cargando..." />
        <main className="flex-1 p-6">
          <div className="skeleton h-48 rounded-2xl mb-4" />
          <div className="skeleton h-96 rounded-2xl" />
        </main>
      </>
    )
  }

  if (!property) {
    return (
      <>
        <Topbar title="Propiedad no encontrada" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <EmptyState title="Propiedad no encontrada" description="La propiedad que buscás no existe" />
        </main>
      </>
    )
  }

  const tipoCfg = property.tipo ? propertyTipoConfig[property.tipo as PropertyTipo] : null
  const estadoCfg = property.estado ? propertyEstadoConfig[property.estado as PropertyEstado] : null
  const imgUrl = property.img_urls?.[0] ?? null

  return (
    <>
      <Topbar title={property.title} />
      <main className="flex-1 p-6 space-y-4">
        <button onClick={() => router.push('/properties')} className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={15} />
          Volver a propiedades
        </button>

        {/* Header */}
        <Card padding={false} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="md:w-72 h-52 md:h-auto bg-surface flex-shrink-0 relative">
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt={property.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home size={48} className="text-border" />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-2xl text-ink">{property.title}</h2>
                  {property.address && (
                    <p className="text-sm text-ink-3 flex items-center gap-1 mt-1">
                      <MapPin size={13} />
                      {[property.address, property.barrio, property.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {estadoCfg && (
                    <Badge bgColor={estadoCfg.bgColor} textColor={estadoCfg.textColor} dot color={estadoCfg.color}>
                      {estadoCfg.label}
                    </Badge>
                  )}
                  {tipoCfg && (
                    <Badge bgColor="#f3f4f6" textColor="#374151">{tipoCfg.label}</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4">
                {property.price_usd && (
                  <div>
                    <p className="text-xs text-ink-light">Precio USD</p>
                    <p className="text-xl font-bold text-ink">{fmtCurrency(property.price_usd, 'USD')}</p>
                  </div>
                )}
                {property.price_ars && (
                  <div>
                    <p className="text-xs text-ink-light">Precio ARS</p>
                    <p className="text-xl font-bold text-ink">{fmtCurrency(property.price_ars, 'ARS')}</p>
                  </div>
                )}
                {property.expensas && (
                  <div>
                    <p className="text-xs text-ink-light">Expensas</p>
                    <p className="text-sm font-semibold text-ink-2">{fmtCurrency(property.expensas, 'ARS')}/mes</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm text-ink-3">
                {property.ambientes != null && <span className="flex items-center gap-1.5"><Home size={14} />{property.ambientes} amb.</span>}
                {property.dormitorios != null && <span className="flex items-center gap-1.5"><BedDouble size={14} />{property.dormitorios} dorm.</span>}
                {property.banos != null && <span className="flex items-center gap-1.5"><Bath size={14} />{property.banos} baños</span>}
                {property.sup_cubierta != null && <span className="flex items-center gap-1.5"><Maximize2 size={14} />{fmtSqm(property.sup_cubierta)}</span>}
                {property.cocheras != null && property.cocheras > 0 && <span className="flex items-center gap-1.5"><Car size={14} />{property.cocheras} coch.</span>}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-white text-ink shadow-sm border border-border'
                    : 'text-ink-3 hover:text-ink'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeTab === 'general' && (
              <Card>
                <h3 className="font-display font-semibold text-base text-ink mb-4">Datos Generales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <FieldRow label="Código" value={property.code} onSave={(v) => handleUpdate('code', v)} icon={<FileText size={14} />} />
                    <FieldRow label="Título" value={property.title} onSave={(v) => handleUpdate('title', v)} />
                    <FieldRow label="Tipo" value={tipoCfg?.label} onSave={(v) => handleUpdate('tipo', v)} icon={<Home size={14} />} />
                    <FieldRow label="Estado" value={estadoCfg?.label} onSave={(v) => handleUpdate('estado', v)} />
                    <FieldRow label="Dirección" value={property.address} onSave={(v) => handleUpdate('address', v)} icon={<MapPin size={14} />} />
                    <FieldRow label="Barrio" value={property.barrio} onSave={(v) => handleUpdate('barrio', v)} />
                    <FieldRow label="Ciudad" value={property.city} onSave={(v) => handleUpdate('city', v)} />
                    <FieldRow label="Provincia" value={property.province} onSave={(v) => handleUpdate('province', v)} />
                    <FieldRow label="Piso/Unidad" value={property.floor_unit} onSave={(v) => handleUpdate('floor_unit', v)} />
                  </div>
                  <div>
                    <FieldRow label="Precio USD" value={property.price_usd} onSave={(v) => handleUpdate('price_usd', v)} type="number" icon={<DollarSign size={14} />} />
                    <FieldRow label="Precio ARS" value={property.price_ars} onSave={(v) => handleUpdate('price_ars', v)} type="number" />
                    <FieldRow label="Expensas" value={property.expensas} onSave={(v) => handleUpdate('expensas', v)} type="number" />
                    <FieldRow label="Sup. Cubierta" value={property.sup_cubierta ? `${property.sup_cubierta} m²` : null} onSave={(v) => handleUpdate('sup_cubierta', v)} icon={<Maximize2 size={14} />} />
                    <FieldRow label="Sup. Descubierta" value={property.sup_descubierta ? `${property.sup_descubierta} m²` : null} onSave={(v) => handleUpdate('sup_descubierta', v)} />
                    <FieldRow label="Ambientes" value={property.ambientes} onSave={(v) => handleUpdate('ambientes', v)} type="number" />
                    <FieldRow label="Dormitorios" value={property.dormitorios} onSave={(v) => handleUpdate('dormitorios', v)} type="number" icon={<BedDouble size={14} />} />
                    <FieldRow label="Baños" value={property.banos} onSave={(v) => handleUpdate('banos', v)} type="number" icon={<Bath size={14} />} />
                    <FieldRow label="Cocheras" value={property.cocheras} onSave={(v) => handleUpdate('cocheras', v)} type="number" icon={<Car size={14} />} />
                    <FieldRow label="Antigüedad" value={property.antiguedad ? `${property.antiguedad} años` : null} onSave={(v) => handleUpdate('antiguedad', v)} />
                    <FieldRow label="Orientación" value={property.orientacion} onSave={(v) => handleUpdate('orientacion', v)} icon={<Compass size={14} />} />
                  </div>
                </div>
                {property.descripcion && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-ink-light mb-2">Descripción</p>
                    <p className="text-sm text-ink-3 whitespace-pre-wrap">{property.descripcion}</p>
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'propietario' && (
              <Card>
                <h3 className="font-display font-semibold text-base text-ink mb-4">Propietario</h3>
                {owner ? (
                  <div className="space-y-0">
                    <FieldRow label="Nombre" value={`${owner.first_name} ${owner.last_name}`} icon={<User size={14} />} />
                    <FieldRow label="Email" value={owner.email} />
                    <FieldRow label="Teléfono" value={owner.phone} />
                    <FieldRow label="DNI" value={owner.dni} />
                  </div>
                ) : (
                  <EmptyState
                    title="Sin propietario asignado"
                    description="Asociá un contacto como propietario de esta propiedad"
                    icon={<User size={18} />}
                  />
                )}
              </Card>
            )}

            {activeTab === 'inquilino' && (
              <Card>
                <h3 className="font-display font-semibold text-base text-ink mb-4">Inquilino / Garantes</h3>
                {tenant ? (
                  <div className="space-y-0">
                    <FieldRow label="Nombre" value={`${tenant.first_name} ${tenant.last_name}`} icon={<User size={14} />} />
                    <FieldRow label="Email" value={tenant.email} />
                    <FieldRow label="Teléfono" value={tenant.phone} />
                    <FieldRow label="DNI" value={tenant.dni} />
                    <FieldRow label="Ocupación" value={tenant.occupation} />
                  </div>
                ) : (
                  <EmptyState
                    title="Sin inquilino asignado"
                    description="Esta propiedad no tiene inquilino activo"
                    icon={<User size={18} />}
                  />
                )}
              </Card>
            )}

            {activeTab === 'contrato' && (
              <Card>
                <h3 className="font-display font-semibold text-base text-ink mb-4">Contrato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <FieldRow
                    label="Día de pago"
                    value={property.pago_dia ? `Día ${property.pago_dia} de cada mes` : null}
                    onSave={(v) => handleUpdate('pago_dia', v)}
                    type="number"
                    icon={<Calendar size={14} />}
                  />
                  <FieldRow
                    label="Precio alquiler (ARS)"
                    value={property.price_ars}
                    onSave={(v) => handleUpdate('price_ars', v)}
                    type="number"
                    icon={<DollarSign size={14} />}
                  />
                  <FieldRow
                    label="Expensas"
                    value={property.expensas}
                    onSave={(v) => handleUpdate('expensas', v)}
                    type="number"
                  />
                </div>
              </Card>
            )}

            {activeTab === 'impuestos' && (
              <Card>
                <h3 className="font-display font-semibold text-base text-ink mb-4">Impuestos y Servicios</h3>
                <EmptyState
                  title="Sin datos registrados"
                  description="Los datos de impuestos y servicios se completarán aquí"
                  icon={<FileText size={18} />}
                />
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
