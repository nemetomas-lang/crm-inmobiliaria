'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  getFullName,
  contactEstadoConfig,
  contactInteresConfig,
  activityKindConfig,
  fmtCurrency,
  formatDate,
  formatRelativeTime,
} from '@/lib/utils'
import type { Contact, Activity, ActivityKind, ContactEstado, ContactInteres } from '@/lib/types'
import { addActivity, deleteContact, updateContact, type CreateContactData } from '../actions'
import { Modal } from '@/components/ui/Modal'
import ContactForm from '../ContactForm'
import {
  Phone,
  Mail,
  MessageCircle,
  ArrowLeft,
  StickyNote,
  MapPin,
  Users,
  Clock,
  Loader2,
  CheckCircle,
  Briefcase,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Pencil,
} from 'lucide-react'

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  const icons: Record<ActivityKind, React.ReactNode> = {
    nota: <StickyNote size={14} />,
    llamada: <Phone size={14} />,
    email: <Mail size={14} />,
    visita: <MapPin size={14} />,
    reunion: <Users size={14} />,
    whatsapp: <MessageCircle size={14} />,
    otro: <Clock size={14} />,
  }
  const cfg = activityKindConfig[kind]
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white"
      style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
    >
      {icons[kind]}
    </div>
  )
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [contactRes, activitiesRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', id).single(),
      supabase
        .from('activities')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false }),
    ])
    if (contactRes.data) setContact(contactRes.data as Contact)
    setActivities((activitiesRes.data ?? []) as Activity[])
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      await addActivity({
        kind: 'nota',
        title: 'Nota',
        description: noteText.trim(),
        contact_id: id,
      })
      setNoteText('')
      fetchData()
    } catch (err) {
      alert('Error al guardar la nota:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSavingNote(false)
    }
  }

  const handleWhatsApp = () => {
    if (!contact?.phone) return
    const phone = contact.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  const handleCall = () => {
    if (!contact?.phone) return
    window.open(`tel:${contact.phone}`, '_blank')
  }

  const handleEditSave = async (data: CreateContactData) => {
    setSavingEdit(true)
    try {
      await updateContact(id, data)
      setShowEditModal(false)
      fetchData()
    } catch (err) {
      alert('Error al guardar:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!contact) return
    const name = getFullName(contact.first_name, contact.last_name)
    const ok = window.confirm(
      `¿Borrar el contacto "${name}"?\n\nSe eliminarán también su historial de actividades y tareas asociadas. Esta acción no se puede deshacer.`
    )
    if (!ok) return
    try {
      await deleteContact(id)
      router.push('/contacts')
    } catch (err) {
      alert('No se pudo borrar el contacto:\n\n' + (err instanceof Error ? err.message : String(err)))
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title="Cargando..." />
        <main className="flex-1 p-3 sm:p-6">
          <div className="skeleton h-40 rounded-2xl mb-6" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 skeleton h-96 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
          </div>
        </main>
      </>
    )
  }

  if (!contact) {
    return (
      <>
        <Topbar title="Contacto no encontrado" />
        <main className="flex-1 p-3 sm:p-6 flex items-center justify-center">
          <EmptyState title="Contacto no encontrado" description="El contacto que buscás no existe" />
        </main>
      </>
    )
  }

  const fullName = getFullName(contact.first_name, contact.last_name)
  const estadoCfg = contact.estado ? contactEstadoConfig[contact.estado as ContactEstado] : null
  const interesCfg = contact.interes ? contactInteresConfig[contact.interes as ContactInteres] : null

  return (
    <>
      <Topbar title={fullName} />
      <main className="flex-1 p-3 sm:p-6 space-y-4">
        {/* Top bar: back + delete */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/contacts')}
            className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
          >
            <ArrowLeft size={15} />
            Volver a contactos
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
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
            >
              <Trash2 size={13} />
              Borrar contacto
            </button>
          </div>
        </div>

        {/* Header Card */}
        <Card padding={false} className="overflow-hidden">
          <div className="bg-gradient-to-r from-ink to-ink-2 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                <Avatar name={fullName} size="xl" className="ring-4 ring-white/20 flex-shrink-0" />
                <div className="flex-1 min-w-0 sm:hidden">
                  <h2 className="text-xl font-display font-bold text-white break-words">{fullName}</h2>
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <h2 className="hidden sm:block text-2xl font-display font-bold text-white">{fullName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {estadoCfg && (
                    <Badge bgColor="rgba(255,255,255,0.15)" textColor="white" dot color={estadoCfg.color}>
                      {estadoCfg.label}
                    </Badge>
                  )}
                  {interesCfg && (
                    <Badge bgColor="rgba(255,255,255,0.15)" textColor="white">
                      {interesCfg.label}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-white/70 text-xs sm:text-sm">
                  {contact.email && (
                    <span className="flex items-center gap-1.5 break-all">
                      <Mail size={14} className="flex-shrink-0" />
                      <span className="break-all">{contact.email}</span>
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} className="flex-shrink-0" />{contact.phone}
                    </span>
                  )}
                </div>
              </div>
              {contact.phone && (
                <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                  <button
                    onClick={handleWhatsApp}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25d366] hover:bg-[#1db954] text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                  <button
                    onClick={handleCall}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <Phone size={15} /> Llamar
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left: Timeline */}
          <div className="xl:col-span-2 space-y-4">
            {/* Add note */}
            <Card>
              <h3 className="font-display font-semibold text-sm text-ink mb-3">Agregar nota</h3>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Escribí una nota sobre este contacto..."
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleAddNote}
                  loading={savingNote}
                  disabled={!noteText.trim()}
                  icon={<StickyNote size={14} />}
                >
                  Guardar nota
                </Button>
              </div>
            </Card>

            {/* Activity timeline */}
            <Card>
              <h3 className="font-display font-semibold text-sm text-ink mb-4">
                Actividad ({activities.length})
              </h3>
              {activities.length === 0 ? (
                <EmptyState
                  title="Sin actividad"
                  description="No hay actividades registradas para este contacto"
                  icon={<Clock size={18} />}
                />
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-5">
                    {activities.map((act) => {
                      const cfg = activityKindConfig[act.kind]
                      return (
                        <div key={act.id} className="relative flex items-start gap-4 pl-0">
                          <ActivityIcon kind={act.kind} />
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-ink">{act.title}</p>
                                <span
                                  className="text-xs font-medium px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              <span className="text-xs text-ink-light whitespace-nowrap flex-shrink-0">
                                {formatRelativeTime(act.created_at)}
                              </span>
                            </div>
                            {act.description && (
                              <p className="text-sm text-ink-3 mt-1.5 whitespace-pre-wrap">{act.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Info */}
          <div className="space-y-4">
            {/* Quick data */}
            <Card>
              <h3 className="font-display font-semibold text-sm text-ink mb-4">Datos rápidos</h3>
              <div className="space-y-3">
                {contact.dni && (
                  <div className="flex items-start gap-3">
                    <CreditCard size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">DNI</p>
                      <p className="text-sm text-ink font-medium">{contact.dni}</p>
                    </div>
                  </div>
                )}
                {contact.birth_date && (
                  <div className="flex items-start gap-3">
                    <Calendar size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">Fecha de nacimiento</p>
                      <p className="text-sm text-ink font-medium">{formatDate(contact.birth_date)}</p>
                    </div>
                  </div>
                )}
                {contact.occupation && (
                  <div className="flex items-start gap-3">
                    <Briefcase size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">Ocupación</p>
                      <p className="text-sm text-ink font-medium">{contact.occupation}</p>
                    </div>
                  </div>
                )}
                {contact.estimated_income != null && (
                  <div className="flex items-start gap-3">
                    <DollarSign size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">Ingresos estimados</p>
                      <p className="text-sm text-ink font-medium">{fmtCurrency(contact.estimated_income, 'ARS')}</p>
                    </div>
                  </div>
                )}
                {(contact.budget_min || contact.budget_max) && (
                  <div className="flex items-start gap-3">
                    <DollarSign size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">Presupuesto</p>
                      <p className="text-sm text-ink font-medium">
                        {contact.budget_min ? fmtCurrency(contact.budget_min, contact.budget_currency) : '—'}
                        {' → '}
                        {contact.budget_max ? fmtCurrency(contact.budget_max, contact.budget_currency) : '—'}
                      </p>
                    </div>
                  </div>
                )}
                {contact.origen && (
                  <div className="flex items-start gap-3">
                    <MapPin size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">Origen</p>
                      <p className="text-sm text-ink font-medium capitalize">{contact.origen.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Notes */}
            {contact.notas && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={15} className="text-ink-3" />
                  <h3 className="font-display font-semibold text-sm text-ink">Notas</h3>
                </div>
                <p className="text-sm text-ink-3 whitespace-pre-wrap">{contact.notas}</p>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar contacto" size="lg">
        <ContactForm
          initialValues={{
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email ?? undefined,
            phone: contact.phone ?? undefined,
            dni: contact.dni ?? undefined,
            cuil: contact.cuil ?? undefined,
            birth_date: contact.birth_date ?? undefined,
            occupation: contact.occupation ?? undefined,
            estado: contact.estado ?? undefined,
            interes: contact.interes ?? undefined,
            contact_type: contact.contact_type ?? undefined,
            budget_min: contact.budget_min ?? undefined,
            budget_max: contact.budget_max ?? undefined,
            budget_currency: contact.budget_currency ?? undefined,
            origen: contact.origen ?? undefined,
            notas: contact.notas ?? undefined,
            banco: contact.banco ?? undefined,
            cbu: contact.cbu ?? undefined,
            alias_cbu: contact.alias_cbu ?? undefined,
            tipo_cuenta: contact.tipo_cuenta ?? undefined,
            recibos_sueldo_urls: contact.recibos_sueldo_urls ?? undefined,
          }}
          onSubmit={handleEditSave}
          onCancel={() => setShowEditModal(false)}
          saving={savingEdit}
        />
      </Modal>
    </>
  )
}
