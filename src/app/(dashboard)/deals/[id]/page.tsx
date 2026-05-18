'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import {
  fmtCurrency,
  formatDate,
  formatRelativeTime,
  getFullName,
  dealTipoConfig,
  dealEstadoConfig,
  activityKindConfig,
  stageColorMap,
} from '@/lib/utils'
import type {
  DealWithRelations,
  Activity,
  ActivityKind,
  PipelineStage,
} from '@/lib/types'
import { addActivity } from '../../contacts/actions'
import { updateDeal } from '../actions'
import {
  ArrowLeft,
  StickyNote,
  Phone,
  Mail,
  MapPin,
  Users,
  Clock,
  MessageCircle,
  DollarSign,
  Calendar,
  User,
  Tag,
  ChevronDown,
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

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [deal, setDeal] = useState<DealWithRelations | null>(null)
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [updatingStage, setUpdatingStage] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [dealRes, stagesRes, activitiesRes] = await Promise.all([
      supabase
        .from('deals')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, phone),
          company:companies(id, name),
          stage:pipeline_stages(*),
          assigned_profile:profiles!deals_assigned_to_fkey(id, full_name, avatar_url)
        `)
        .eq('id', id)
        .single(),
      supabase.from('pipeline_stages').select('*').order('order_index'),
      supabase
        .from('activities')
        .select('*')
        .eq('deal_id', id)
        .order('created_at', { ascending: false }),
    ])
    if (dealRes.data) setDeal(dealRes.data as DealWithRelations)
    setStages((stagesRes.data ?? []) as PipelineStage[])
    setActivities((activitiesRes.data ?? []) as Activity[])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStageChange = async (stageId: string) => {
    if (!deal) return
    setUpdatingStage(true)
    try {
      await updateDeal(id, { stage_id: stageId })
      fetchData()
    } catch (err) {
      alert('Error al actualizar la etapa:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setUpdatingStage(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      await addActivity({ kind: 'nota', title: 'Nota', description: noteText.trim(), deal_id: id })
      setNoteText('')
      fetchData()
    } catch (err) {
      alert('Error al guardar la nota:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title="Cargando..." />
        <main className="flex-1 p-6">
          <div className="skeleton h-40 rounded-2xl mb-6" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 skeleton h-96 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
          </div>
        </main>
      </>
    )
  }

  if (!deal) {
    return (
      <>
        <Topbar title="Deal no encontrado" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <EmptyState title="Deal no encontrado" description="El deal que buscás no existe" />
        </main>
      </>
    )
  }

  const tipoCfg = deal.tipo ? dealTipoConfig[deal.tipo] : null
  const estadoCfg = deal.estado ? dealEstadoConfig[deal.estado] : null
  const currentStage = stages.find((s) => s.id === deal.stage_id)
  const stageColors = currentStage ? stageColorMap[currentStage.color] ?? { bg: '#f3f4f6', text: '#374151', dot: '#6b7280' } : null

  return (
    <>
      <Topbar title={deal.title} />
      <main className="flex-1 p-6 space-y-4">
        <button
          onClick={() => router.push('/deals')}
          className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} />
          Volver al pipeline
        </button>

        {/* Header */}
        <Card padding={false} className="overflow-hidden">
          <div className="bg-gradient-to-r from-ink to-ink-2 p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-display font-bold text-white">{deal.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {tipoCfg && (
                    <Badge bgColor="rgba(255,255,255,0.15)" textColor="white">
                      {tipoCfg.label}
                    </Badge>
                  )}
                  {estadoCfg && (
                    <Badge bgColor="rgba(255,255,255,0.15)" textColor="white" dot color={estadoCfg.color}>
                      {estadoCfg.label}
                    </Badge>
                  )}
                  {deal.value && (
                    <span className="flex items-center gap-1 text-orange font-bold text-sm">
                      <DollarSign size={14} />
                      {fmtCurrency(deal.value, deal.currency)}
                    </span>
                  )}
                </div>
                {deal.contact && (
                  <div className="flex items-center gap-2 mt-3 text-white/70 text-sm">
                    <User size={14} />
                    <span>{getFullName(deal.contact.first_name, deal.contact.last_name)}</span>
                    {deal.contact.email && <span>· {deal.contact.email}</span>}
                  </div>
                )}
              </div>

              {/* Stage selector */}
              <div className="relative flex-shrink-0">
                <label className="block text-white/60 text-xs mb-1">Etapa</label>
                <div className="relative">
                  <select
                    value={deal.stage_id}
                    onChange={(e) => handleStageChange(e.target.value)}
                    disabled={updatingStage}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-semibold border-0
                      focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer disabled:opacity-60"
                    style={stageColors ? { backgroundColor: stageColors.bg, color: stageColors.text } : {}}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={stageColors ? { color: stageColors.text } : {}} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left: Activity */}
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <h3 className="font-display font-semibold text-sm text-ink mb-3">Agregar nota</h3>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Escribí una nota sobre este deal..."
              />
              <div className="flex justify-end mt-3">
                <Button onClick={handleAddNote} loading={savingNote} disabled={!noteText.trim()} icon={<StickyNote size={14} />}>
                  Guardar nota
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="font-display font-semibold text-sm text-ink mb-4">
                Actividad ({activities.length})
              </h3>
              {activities.length === 0 ? (
                <EmptyState title="Sin actividad" description="No hay actividades registradas para este deal" icon={<Clock size={18} />} />
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-5">
                    {activities.map((act) => {
                      const cfg = activityKindConfig[act.kind]
                      return (
                        <div key={act.id} className="relative flex items-start gap-4">
                          <ActivityIcon kind={act.kind} />
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-ink">{act.title}</p>
                                <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: cfg.bgColor, color: cfg.color }}>
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

          {/* Right: Details */}
          <div className="space-y-4">
            <Card>
              <h3 className="font-display font-semibold text-sm text-ink mb-4">Detalles</h3>
              <div className="space-y-3">
                {deal.close_date && (
                  <div className="flex items-start gap-3">
                    <Calendar size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">Fecha de cierre</p>
                      <p className="text-sm text-ink font-medium">{formatDate(deal.close_date)}</p>
                    </div>
                  </div>
                )}
                {deal.assigned_profile && (
                  <div className="flex items-start gap-3">
                    <User size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">Asignado a</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar name={deal.assigned_profile.full_name} size="xs" />
                        <p className="text-sm text-ink font-medium">{deal.assigned_profile.full_name}</p>
                      </div>
                    </div>
                  </div>
                )}
                {deal.company && (
                  <div className="flex items-start gap-3">
                    <Tag size={15} className="text-ink-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ink-light">Empresa</p>
                      <p className="text-sm text-ink font-medium">{deal.company.name}</p>
                    </div>
                  </div>
                )}
                {deal.description && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-ink-light mb-1">Descripción</p>
                    <p className="text-sm text-ink-3 whitespace-pre-wrap">{deal.description}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
