'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  fmtUSD,
  fmtARS,
  formatRelativeTime,
  formatDateTime,
  getFullName,
  contactEstadoConfig,
  activityKindConfig,
  stageColorMap,
} from '@/lib/utils'
import type {
  Contact,
  Activity,
  Task,
  Deal,
  PipelineStage,
  ContactEstado,
  ActivityKind,
} from '@/lib/types'
import {
  Users,
  DollarSign,
  CheckSquare,
  FileWarning,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  MessageCircle,
  Clock,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { format, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// Activity kind icon map
function ActivityIcon({ kind }: { kind: ActivityKind }) {
  const config = activityKindConfig[kind]
  const icons: Record<ActivityKind, React.ReactNode> = {
    nota: <StickyNote size={14} />,
    llamada: <Phone size={14} />,
    email: <Mail size={14} />,
    visita: <MapPin size={14} />,
    reunion: <Users size={14} />,
    whatsapp: <MessageCircle size={14} />,
    otro: <Clock size={14} />,
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {icons[kind]}
    </div>
  )
}

interface KPIData {
  totalContacts: number
  activeDealsValue: number
  tasksDueToday: number
  contractsExpiring90: number
}

interface StageData {
  stage: PipelineStage
  count: number
  value: number
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [recentActivities, setRecentActivities] = useState<(Activity & { contact: Contact | null })[]>([])
  const [todayTasks, setTodayTasks] = useState<(Task & { contact: Contact | null })[]>([])
  const [recentContacts, setRecentContacts] = useState<Contact[]>([])
  const [stageData, setStageData] = useState<StageData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const today = format(new Date(), 'yyyy-MM-dd')
    const in90Days = format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

    const [
      contactsResult,
      dealsResult,
      tasksResult,
      contractsResult,
      activitiesResult,
      todayTasksResult,
      recentContactsResult,
      stagesResult,
    ] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
      supabase.from('deals').select('value, currency, stage_id').eq('estado', 'activo'),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .is('completed_at', null),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .not('pago_dia', 'is', null)
        .lte('pago_dia', in90Days),
      supabase
        .from('activities')
        .select('*, contact:contacts(id,first_name,last_name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('tasks')
        .select('*, contact:contacts(id,first_name,last_name)')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .is('completed_at', null)
        .order('scheduled_at', { ascending: true })
        .limit(10),
      supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('pipeline_stages').select('*').order('order_index'),
    ])

    // Compute active deals value
    const deals = (dealsResult.data ?? []) as Pick<Deal, 'value' | 'currency' | 'stage_id'>[]
    const activeDealsValue = deals.reduce((sum, d) => {
      if (!d.value) return sum
      // Rough ARS equivalent: USD*1000 for display purposes, or just sum USD separately
      return sum + (d.value ?? 0)
    }, 0)

    setKpis({
      totalContacts: contactsResult.count ?? 0,
      activeDealsValue,
      tasksDueToday: tasksResult.count ?? 0,
      contractsExpiring90: contractsResult.count ?? 0,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRecentActivities((activitiesResult.data ?? []) as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTodayTasks((todayTasksResult.data ?? []) as any)
    setRecentContacts((recentContactsResult.data ?? []) as Contact[])

    // Stage breakdown
    const stages = (stagesResult.data ?? []) as PipelineStage[]
    const sd: StageData[] = stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage_id === stage.id)
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + (d.value ?? 0), 0),
      }
    })
    setStageData(sd)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetchData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const maxCount = Math.max(...stageData.map((s) => s.count), 1)

  return (
    <>
      <Topbar title="Dashboard" subtitle={format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })} />
      <main className="flex-1 p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Total Contactos"
            value={kpis?.totalContacts ?? 0}
            icon={<Users size={22} />}
            iconBgColor="#eff6ff"
            iconColor="#3b82f6"
            loading={loading}
          />
          <KpiCard
            label="Valor Deals Activos"
            value={kpis ? fmtARS(kpis.activeDealsValue) : '—'}
            icon={<DollarSign size={22} />}
            iconBgColor="#fff4e8"
            iconColor="#f5912c"
            loading={loading}
          />
          <KpiCard
            label="Tareas para Hoy"
            value={kpis?.tasksDueToday ?? 0}
            icon={<CheckSquare size={22} />}
            iconBgColor="#f0fdf4"
            iconColor="#22c55e"
            loading={loading}
          />
          <KpiCard
            label="Contratos por Vencer"
            value={kpis?.contractsExpiring90 ?? 0}
            icon={<FileWarning size={22} />}
            iconBgColor="#fef2f2"
            iconColor="#ef4444"
            loading={loading}
          />
        </div>

        {/* Middle row: Chart + Tasks Today */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Pipeline Chart */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Pipeline por Etapa</CardTitle>
            </CardHeader>
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-3 w-20 rounded" />
                    <div className="skeleton h-6 rounded flex-1" style={{ width: `${60 + i * 5}%` }} />
                    <div className="skeleton h-3 w-8 rounded" />
                  </div>
                ))}
              </div>
            ) : stageData.length === 0 ? (
              <EmptyState title="Sin datos" description="No hay deals en el pipeline" />
            ) : (
              <div className="space-y-3">
                {stageData.map((s) => {
                  const c = stageColorMap[s.stage.color] ?? { bg: '#f3f4f6', text: '#374151', dot: '#6b7280' }
                  const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0
                  return (
                    <div key={s.stage.id} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-ink-3 w-20 text-right truncate">{s.stage.name}</span>
                      <div className="flex-1 bg-surface rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                          style={{
                            width: `${Math.max(pct, s.count > 0 ? 5 : 0)}%`,
                            backgroundColor: c.dot,
                            minWidth: s.count > 0 ? '2rem' : '0',
                          }}
                        >
                          {s.count > 0 && (
                            <span className="text-white text-[11px] font-bold">{s.count}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-ink-3 w-6 text-right">{s.count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Today Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Tareas de Hoy</CardTitle>
              {todayTasks.length > 0 && (
                <span className="text-xs font-semibold text-orange bg-orange-50 px-2 py-0.5 rounded-full">
                  {todayTasks.length}
                </span>
              )}
            </CardHeader>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="skeleton w-5 h-5 rounded-full mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-full rounded" />
                      <div className="skeleton h-3 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todayTasks.length === 0 ? (
              <EmptyState
                title="Sin tareas"
                description="No tenés tareas programadas para hoy"
                icon={<CheckCircle size={20} />}
              />
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2.5 py-2 border-b border-border last:border-0">
                    <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{task.title}</p>
                      {task.contact && (
                        <p className="text-xs text-ink-3 truncate">
                          {getFullName(task.contact.first_name, task.contact.last_name)}
                        </p>
                      )}
                      {task.scheduled_at && (
                        <p className="text-xs text-ink-light">
                          {format(parseISO(task.scheduled_at), 'HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Bottom row: Recent Activities + Recent Contacts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <Link href="/contacts" className="text-xs text-orange hover:text-orange-600 font-semibold transition-colors">
                Ver todo
              </Link>
            </CardHeader>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="skeleton w-7 h-7 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-full rounded" />
                      <div className="skeleton h-3 w-32 rounded" />
                    </div>
                    <div className="skeleton h-3 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <EmptyState title="Sin actividad" description="No hay actividades registradas" />
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <ActivityIcon kind={act.kind} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{act.title}</p>
                      {act.contact && (
                        <p className="text-xs text-ink-3 truncate">
                          {getFullName(act.contact.first_name, act.contact.last_name)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-ink-light whitespace-nowrap flex-shrink-0">
                      {formatRelativeTime(act.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Contacts */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Contactos</CardTitle>
              <Link href="/contacts" className="text-xs text-orange hover:text-orange-600 font-semibold transition-colors">
                Ver todo
              </Link>
            </CardHeader>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-28 rounded" />
                      <div className="skeleton h-3 w-36 rounded" />
                    </div>
                    <div className="skeleton h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentContacts.length === 0 ? (
              <EmptyState title="Sin contactos" description="Aún no hay contactos registrados" />
            ) : (
              <div className="space-y-2">
                {recentContacts.map((c) => {
                  const fullName = getFullName(c.first_name, c.last_name)
                  const estadoCfg = c.estado ? contactEstadoConfig[c.estado as ContactEstado] : null
                  return (
                    <Link
                      key={c.id}
                      href={`/contacts/${c.id}`}
                      className="flex items-center gap-3 py-2 hover:bg-surface rounded-xl px-2 -mx-2 transition-colors"
                    >
                      <Avatar name={fullName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{fullName}</p>
                        <p className="text-xs text-ink-3 truncate">{c.email ?? c.phone ?? 'Sin contacto'}</p>
                      </div>
                      {estadoCfg && (
                        <Badge
                          bgColor={estadoCfg.bgColor}
                          textColor={estadoCfg.textColor}
                          size="sm"
                        >
                          {estadoCfg.label}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

      </main>
    </>
  )
}
