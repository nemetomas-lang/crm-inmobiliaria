'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import PropertyEditForm from '../PropertyEditForm'
import {
  fmtCurrency,
  fmtSqm,
  propertyTipoConfig,
  propertyEstadoConfig,
} from '@/lib/utils'
import type { Property, PropertyEstado, PropertyTipo, Contact } from '@/lib/types'
import { updateProperty, addGarante, removeGarante, deleteProperty } from '../actions'
import {
  ArrowLeft, Home, BedDouble, Bath, Car, Maximize2, MapPin, Edit2, Save, X,
  User, FileText, DollarSign, Calendar, Compass, Image as ImageIcon, Video,
  Receipt, ShieldCheck, Trash2, Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabId = 'general' | 'propietario' | 'inquilino' | 'contrato' | 'impuestos' | 'fotos'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'general',     label: 'Datos Generales',   icon: <Home size={14} /> },
  { id: 'propietario', label: 'Propietario',       icon: <User size={14} /> },
  { id: 'inquilino',   label: 'Inquilino/Garantes',icon: <ShieldCheck size={14} /> },
  { id: 'contrato',    label: 'Contrato',          icon: <FileText size={14} /> },
  { id: 'impuestos',   label: 'Impuestos/Servicios', icon: <Receipt size={14} /> },
  { id: 'fotos',       label: 'Fotos / Videos',    icon: <ImageIcon size={14} /> },
]

interface FieldRowProps {
  label: string
  value: string | number | null | undefined
  onSave?: (value: string) => Promise<void>
  type?: string
  icon?: React.ReactNode
  options?: { value: string; label: string }[]
}

function FieldRow({ label, value, onSave, type = 'text', icon, options }: FieldRowProps) {
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
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0 group">
      {icon && <span className="text-ink-light mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-light mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            {options ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                className="flex-1 px-2 py-1 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange"
              >
                <option value="">—</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                className="flex-1 px-2 py-1 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange"
              />
            )}
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
  const [garantes, setGarantes] = useState<Contact[]>([])
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [showEditModal, setShowEditModal] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: prop }, { data: contacts }, { data: garanteRows }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase.from('contacts').select('*').order('first_name'),
      supabase.from('property_garantes').select('contact_id').eq('property_id', id),
    ])

    if (prop) setProperty(prop as Property)
    const allC = (contacts ?? []) as Contact[]
    setAllContacts(allC)
    if (prop?.owner_contact_id) setOwner(allC.find((c) => c.id === prop.owner_contact_id) ?? null)
    else setOwner(null)
    if (prop?.tenant_contact_id) setTenant(allC.find((c) => c.id === prop.tenant_contact_id) ?? null)
    else setTenant(null)
    const garanteIds = (garanteRows ?? []).map((r: { contact_id: string }) => r.contact_id)
    setGarantes(allC.filter((c) => garanteIds.includes(c.id)))
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdate = useCallback(async (field: keyof Property, value: string | null) => {
    let parsed: string | number | null = value
    const numericFields: (keyof Property)[] = [
      'price_ars', 'price_usd', 'expensas', 'sup_cubierta', 'sup_descubierta',
      'ambientes', 'dormitorios', 'banos', 'cocheras', 'antiguedad', 'pago_dia',
    ]
    if (numericFields.includes(field)) parsed = value ? Number(value) : null
    await updateProperty(id, { [field]: parsed } as never)
    fetchData()
  }, [id, fetchData])

  // File upload helpers — wrap updateProperty so FileUpload's onChange/onChangeMulti
  // signature matches what handleUpdate-via-storage callbacks expect.
  const uploadField = (field: keyof Property) => async (url: string | null) => {
    await updateProperty(id, { [field]: url } as never)
    fetchData()
  }
  const uploadFieldMulti = (field: 'img_urls' | 'video_urls') => async (urls: string[]) => {
    await updateProperty(id, { [field]: urls } as never)
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

  const propietariosDisponibles = allContacts.filter((c) => c.contact_type === 'propietario' || c.contact_type == null)
  const inquilinosDisponibles    = allContacts.filter((c) => c.contact_type === 'inquilino' || c.contact_type == null)
  const garantesDisponibles      = allContacts.filter((c) =>
    c.contact_type === 'garante' &&
    !garantes.some((g) => g.id === c.id)
  )

  return (
    <>
      <Topbar title={property.title} />
      <main className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/properties')} className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors">
            <ArrowLeft size={15} />
            Volver a propiedades
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface border border-border rounded-lg transition-colors"
            >
              <Pencil size={13} />
              Editar
            </button>
            <button
              onClick={async () => {
                const ok = window.confirm(
                  `¿Borrar la propiedad "${property.title}"?\n\nSe eliminarán también sus tareas y vínculos con garantes. Los contactos (propietario/inquilino) NO se borran. Esta acción no se puede deshacer.`
                )
                if (!ok) return
                try {
                  await deleteProperty(id)
                  router.push('/properties')
                } catch (err) {
                  alert('No se pudo borrar la propiedad:\n\n' + (err instanceof Error ? err.message : String(err)))
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
            >
              <Trash2 size={13} />
              Borrar propiedad
            </button>
          </div>
        </div>

        {/* Header */}
        <Card padding={false} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
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
                  {estadoCfg && <Badge bgColor={estadoCfg.bgColor} textColor={estadoCfg.textColor} dot color={estadoCfg.color}>{estadoCfg.label}</Badge>}
                  {tipoCfg && <Badge bgColor="#f3f4f6" textColor="#374151">{tipoCfg.label}</Badge>}
                  {property.operacion && (
                    <Badge bgColor="#fff4e8" textColor="#e07a13">{property.operacion === 'venta' ? 'En venta' : 'En alquiler'}</Badge>
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
          <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border w-fit overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id ? 'bg-white text-ink shadow-sm border border-border' : 'text-ink-3 hover:text-ink'
                )}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {/* ───── DATOS GENERALES ───── */}
            {activeTab === 'general' && (
              <Card>
                <h3 className="font-display font-semibold text-base text-ink mb-4">Datos Generales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <FieldRow label="Código" value={property.code} onSave={(v) => handleUpdate('code', v)} icon={<FileText size={14} />} />
                    <FieldRow label="Título" value={property.title} onSave={(v) => handleUpdate('title', v)} />
                    <FieldRow label="Tipo" value={tipoCfg?.label ?? property.tipo} onSave={(v) => handleUpdate('tipo', v)} icon={<Home size={14} />}
                      options={[
                        { value: 'casa', label: 'Casa' },
                        { value: 'departamento', label: 'Departamento' },
                        { value: 'local', label: 'Local Comercial' },
                        { value: 'oficina', label: 'Oficina' },
                        { value: 'terreno', label: 'Terreno' },
                        { value: 'galpon', label: 'Galpón' },
                        { value: 'campo', label: 'Campo' },
                        { value: 'otro', label: 'Otro' },
                      ]}
                    />
                    <FieldRow label="Operación" value={property.operacion === 'venta' ? 'Venta' : property.operacion === 'alquiler' ? 'Alquiler' : null}
                      onSave={(v) => handleUpdate('operacion', v)}
                      options={[{ value: 'venta', label: 'Venta' }, { value: 'alquiler', label: 'Alquiler' }]} />
                    <FieldRow label="Estado" value={estadoCfg?.label ?? property.estado} onSave={(v) => handleUpdate('estado', v)}
                      options={[
                        { value: 'disponible', label: 'Disponible' },
                        { value: 'reservado', label: 'Reservado' },
                        { value: 'vendido', label: 'Vendido' },
                        { value: 'alquilado', label: 'Alquilado' },
                        { value: 'no_disponible', label: 'No disponible' },
                      ]}
                    />
                    <FieldRow label="Dirección" value={property.address} onSave={(v) => handleUpdate('address', v)} icon={<MapPin size={14} />} />
                    <FieldRow label="Barrio" value={property.barrio} onSave={(v) => handleUpdate('barrio', v)} />
                    <FieldRow label="Ciudad" value={property.city} onSave={(v) => handleUpdate('city', v)} />
                    <FieldRow label="Piso/Unidad" value={property.floor_unit} onSave={(v) => handleUpdate('floor_unit', v)} />
                  </div>
                  <div>
                    <FieldRow label="Valor USD" value={property.price_usd} onSave={(v) => handleUpdate('price_usd', v)} type="number" icon={<DollarSign size={14} />} />
                    <FieldRow label="Valor ARS" value={property.price_ars} onSave={(v) => handleUpdate('price_ars', v)} type="number" />
                    <FieldRow label="Expensas" value={property.expensas} onSave={(v) => handleUpdate('expensas', v)} type="number" />
                    <FieldRow label="Sup. Cubierta (m²)" value={property.sup_cubierta} onSave={(v) => handleUpdate('sup_cubierta', v)} type="number" icon={<Maximize2 size={14} />} />
                    <FieldRow label="Sup. Descubierta (m²)" value={property.sup_descubierta} onSave={(v) => handleUpdate('sup_descubierta', v)} type="number" />
                    <FieldRow label="Ambientes" value={property.ambientes} onSave={(v) => handleUpdate('ambientes', v)} type="number" />
                    <FieldRow label="Dormitorios" value={property.dormitorios} onSave={(v) => handleUpdate('dormitorios', v)} type="number" icon={<BedDouble size={14} />} />
                    <FieldRow label="Baños" value={property.banos} onSave={(v) => handleUpdate('banos', v)} type="number" icon={<Bath size={14} />} />
                    <FieldRow label="Cocheras" value={property.cocheras} onSave={(v) => handleUpdate('cocheras', v)} type="number" icon={<Car size={14} />} />
                    <FieldRow label="Antigüedad (años)" value={property.antiguedad} onSave={(v) => handleUpdate('antiguedad', v)} type="number" />
                    <FieldRow label="Orientación" value={property.orientacion} onSave={(v) => handleUpdate('orientacion', v)} icon={<Compass size={14} />} />
                  </div>
                </div>
              </Card>
            )}

            {/* ───── PROPIETARIO ───── */}
            {activeTab === 'propietario' && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-base text-ink">Propietario</h3>
                  <ContactSelector
                    label="Asignar"
                    contacts={propietariosDisponibles}
                    currentId={property.owner_contact_id}
                    onChange={async (cid) => { await updateProperty(id, { owner_contact_id: cid ?? null }); fetchData() }}
                    onCreateLink="/contacts"
                  />
                </div>
                {owner ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                      <FieldRow label="Nombre" value={`${owner.first_name} ${owner.last_name}`} icon={<User size={14} />} />
                      <FieldRow label="DNI" value={owner.dni} />
                      <FieldRow label="Teléfono" value={owner.phone} />
                      <FieldRow label="Email" value={owner.email} />
                      <FieldRow label="Fecha de nacimiento" value={owner.birth_date} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">Datos bancarios</p>
                      <FieldRow label="Banco" value={owner.banco} />
                      <FieldRow label="Tipo de cuenta" value={owner.tipo_cuenta} />
                      <FieldRow label="CBU" value={owner.cbu} />
                      <FieldRow label="Alias" value={owner.alias_cbu} />
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="Sin propietario asignado"
                    description="Elegí un contacto tipo Propietario de la lista de arriba, o creá uno nuevo en Contactos."
                    icon={<User size={18} />}
                  />
                )}
              </Card>
            )}

            {/* ───── INQUILINO + GARANTES ───── */}
            {activeTab === 'inquilino' && (
              <div className="space-y-4">
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-base text-ink">Inquilino</h3>
                    <ContactSelector
                      label="Asignar"
                      contacts={inquilinosDisponibles}
                      currentId={property.tenant_contact_id}
                      onChange={async (cid) => { await updateProperty(id, { tenant_contact_id: cid ?? null }); fetchData() }}
                      onCreateLink="/contacts"
                    />
                  </div>
                  {tenant ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <div>
                        <FieldRow label="Nombre" value={`${tenant.first_name} ${tenant.last_name}`} icon={<User size={14} />} />
                        <FieldRow label="DNI" value={tenant.dni} />
                        <FieldRow label="Teléfono" value={tenant.phone} />
                        <FieldRow label="Email" value={tenant.email} />
                        <FieldRow label="Fecha de nacimiento" value={tenant.birth_date} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">Datos bancarios</p>
                        <FieldRow label="Banco" value={tenant.banco} />
                        <FieldRow label="Tipo de cuenta" value={tenant.tipo_cuenta} />
                        <FieldRow label="CBU" value={tenant.cbu} />
                        <FieldRow label="Alias" value={tenant.alias_cbu} />
                      </div>
                    </div>
                  ) : (
                    <EmptyState title="Sin inquilino asignado" description="Sumá un contacto tipo Inquilino" icon={<User size={18} />} />
                  )}
                </Card>

                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-base text-ink">Garantes</h3>
                    <ContactSelector
                      label="Agregar garante"
                      contacts={garantesDisponibles}
                      currentId={null}
                      onChange={async (cid) => { if (cid) { await addGarante(id, cid); fetchData() } }}
                      onCreateLink="/contacts"
                    />
                  </div>
                  {garantes.length === 0 ? (
                    <EmptyState title="Sin garantes" description="Agregá uno o más contactos tipo Garante" icon={<ShieldCheck size={18} />} />
                  ) : (
                    <div className="space-y-3">
                      {garantes.map((g) => (
                        <div key={g.id} className="border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-ink">{g.first_name} {g.last_name}</p>
                              <p className="text-xs text-ink-3">DNI {g.dni ?? '—'} · CUIL {g.cuil ?? '—'}</p>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm('¿Quitar a este garante de la propiedad?')) return
                                try { await removeGarante(id, g.id); fetchData() }
                                catch (err) { alert(err instanceof Error ? err.message : String(err)) }
                              }}
                              className="text-ink-light hover:text-red-600 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 text-sm">
                            <div>
                              <p className="text-xs text-ink-light">Teléfono</p>
                              <p>{g.phone ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-ink-light">Email</p>
                              <p>{g.email ?? '—'}</p>
                            </div>
                          </div>
                          {g.recibos_sueldo_urls && g.recibos_sueldo_urls.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-ink-light mb-2">Recibos de sueldo ({g.recibos_sueldo_urls.length})</p>
                              <div className="space-y-1">
                                {g.recibos_sueldo_urls.map((path, i) => (
                                  <a
                                    key={i}
                                    href="#"
                                    onClick={async (e) => {
                                      e.preventDefault()
                                      const supabase = createClient()
                                      const { data } = await supabase.storage.from('garante-recibos').createSignedUrl(path, 3600)
                                      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                                    }}
                                    className="flex items-center gap-2 text-sm text-orange hover:underline"
                                  >
                                    <FileText size={13} /> {path.split('/').pop()}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ───── CONTRATO ───── */}
            {activeTab === 'contrato' && (
              <Card>
                <h3 className="font-display font-semibold text-base text-ink mb-4">Contrato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-6">
                  <FieldRow label="Día de pago" value={property.pago_dia ? `Día ${property.pago_dia} de cada mes` : null}
                    onSave={(v) => handleUpdate('pago_dia', v)} type="number" icon={<Calendar size={14} />} />
                  <FieldRow label="Operación" value={property.operacion} onSave={(v) => handleUpdate('operacion', v)}
                    options={[{ value: 'venta', label: 'Venta' }, { value: 'alquiler', label: 'Alquiler' }]} />
                  <FieldRow label="Valor (ARS)" value={property.price_ars} onSave={(v) => handleUpdate('price_ars', v)} type="number" icon={<DollarSign size={14} />} />
                  <FieldRow label="Valor (USD)" value={property.price_usd} onSave={(v) => handleUpdate('price_usd', v)} type="number" />
                  <FieldRow label="Expensas" value={property.expensas} onSave={(v) => handleUpdate('expensas', v)} type="number" />
                </div>
                <div className="pt-4 border-t border-border">
                  <FileUpload
                    bucket="property-contracts"
                    value={property.contract_pdf_url}
                    onChange={uploadField('contract_pdf_url')}
                    accept="application/pdf"
                    label="Contrato firmado (PDF)"
                    folder={id}
                  />
                </div>
              </Card>
            )}

            {/* ───── IMPUESTOS / SERVICIOS ───── */}
            {activeTab === 'impuestos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <h3 className="font-display font-semibold text-base text-ink mb-4">Impuestos</h3>
                  <FieldRow label="DGR — N° de cuenta" value={property.dgr_cuenta} onSave={(v) => handleUpdate('dgr_cuenta', v)} icon={<Receipt size={14} />} />
                  <FieldRow label="Municipalidad — N° cuenta" value={property.municipalidad_cuenta} onSave={(v) => handleUpdate('municipalidad_cuenta', v)} />
                  <FieldRow label="Nomenclatura catastral" value={property.nomenclatura_catastral} onSave={(v) => handleUpdate('nomenclatura_catastral', v)} />
                </Card>
                <Card>
                  <h3 className="font-display font-semibold text-base text-ink mb-4">Servicios</h3>
                  <FieldRow label="Agua — Unidad de facturación" value={property.agua_unidad_facturacion} onSave={(v) => handleUpdate('agua_unidad_facturacion', v)} />
                  <FieldRow label="Luz — N° de cliente" value={property.luz_n_cliente} onSave={(v) => handleUpdate('luz_n_cliente', v)} />
                  <FieldRow label="Luz — N° de contrato" value={property.luz_n_contrato} onSave={(v) => handleUpdate('luz_n_contrato', v)} />
                  <FieldRow label="Gas — N° de cuenta" value={property.gas_n_cuenta} onSave={(v) => handleUpdate('gas_n_cuenta', v)} />
                </Card>
                <Card className="md:col-span-2">
                  <h3 className="font-display font-semibold text-base text-ink mb-4">Escritura e informes de dominio</h3>
                  <FieldRow label="N° de matrícula" value={property.escritura_matricula} onSave={(v) => handleUpdate('escritura_matricula', v)} icon={<FileText size={14} />} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FileUpload
                      bucket="property-documents"
                      value={property.escritura_url}
                      onChange={uploadField('escritura_url')}
                      accept="application/pdf,image/*"
                      label="Escritura (PDF)"
                      folder={`${id}/escritura`}
                    />
                    <FileUpload
                      bucket="property-documents"
                      value={property.informe_dominio_url}
                      onChange={uploadField('informe_dominio_url')}
                      accept="application/pdf,image/*"
                      label="Informe de dominio (PDF)"
                      folder={`${id}/dominio`}
                    />
                  </div>
                </Card>
              </div>
            )}

            {/* ───── FOTOS / VIDEOS ───── */}
            {activeTab === 'fotos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <h3 className="font-display font-semibold text-base text-ink mb-4 flex items-center gap-2">
                    <ImageIcon size={16} /> Fotos
                  </h3>
                  <FileUpload
                    bucket="property-photos"
                    values={property.img_urls ?? []}
                    onChangeMulti={uploadFieldMulti('img_urls')}
                    accept="image/*"
                    multiple
                    folder={id}
                  />
                </Card>
                <Card>
                  <h3 className="font-display font-semibold text-base text-ink mb-4 flex items-center gap-2">
                    <Video size={16} /> Videos
                  </h3>
                  <FileUpload
                    bucket="property-videos"
                    values={property.video_urls ?? []}
                    onChangeMulti={uploadFieldMulti('video_urls')}
                    accept="video/*"
                    multiple
                    folder={id}
                  />
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar propiedad" size="lg">
        <PropertyEditForm
          initial={property}
          saving={savingEdit}
          onCancel={() => setShowEditModal(false)}
          onSubmit={async (data) => {
            setSavingEdit(true)
            try {
              await updateProperty(id, data)
              setShowEditModal(false)
              fetchData()
            } catch (err) {
              alert('Error al guardar:\n\n' + (err instanceof Error ? err.message : String(err)))
            } finally {
              setSavingEdit(false)
            }
          }}
        />
      </Modal>
    </>
  )
}

// ── Inline contact picker ─────────────────────────────────────────────────
function ContactSelector({
  label,
  contacts,
  currentId,
  onChange,
  onCreateLink,
}: {
  label: string
  contacts: Contact[]
  currentId: string | null
  onChange: (id: string | null) => Promise<void>
  onCreateLink: string
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  return (
    <div className="relative">
      <Button variant="ghost" onClick={() => setOpen((v) => !v)}>
        {label}
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 w-72 bg-white border border-border rounded-xl shadow-lg p-3 space-y-2">
          <Select
            label=""
            value={currentId ?? ''}
            onChange={async (e) => {
              setSaving(true)
              try {
                await onChange(e.target.value || null)
                setOpen(false)
              } catch (err) {
                alert(err instanceof Error ? err.message : String(err))
              } finally {
                setSaving(false)
              }
            }}
          >
            <option value="">— Ninguno —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}{c.dni ? ` · DNI ${c.dni}` : ''}
              </option>
            ))}
          </Select>
          <p className="text-xs text-ink-3">
            ¿No está en la lista?{' '}
            <a href={onCreateLink} className="text-orange hover:underline">Crear contacto</a>
          </p>
          {saving && <p className="text-xs text-ink-light">Guardando...</p>}
        </div>
      )}
    </div>
  )
}

// Unused import guard — Input is only referenced through Select via Input.tsx
// but TS would warn about it being unused
export const _input_ref = Input
