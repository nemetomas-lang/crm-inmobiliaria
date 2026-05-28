'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  fmtCurrency,
  formatDate,
  getFullName,
  cn,
} from '@/lib/utils'
import type { Task, Property, Contact, PropertyEstado } from '@/lib/types'
import {
  Bell,
  Home,
  FileText,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Send,
  RefreshCw,
} from 'lucide-react'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type TabId = 'alertas' | 'alquileres' | 'contratos' | 'avisos'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'alertas', label: 'Alertas', icon: <Bell size={15} /> },
  { id: 'alquileres', label: 'Control de Alquileres', icon: <Home size={15} /> },
  { id: 'contratos', label: 'Contratos por Vencer', icon: <FileText size={15} /> },
  { id: 'avisos', label: 'Aviso de Pago', icon: <MessageCircle size={15} /> },
]

interface AlertItem {
  id: string
  type: 'overdue_task' | 'expiring_contract' | 'pending_task'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  date?: string
}

interface RentalProperty extends Property {
  owner: Contact | null
  tenant: Contact | null
  daysUntilPayment: number | null
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('alertas')
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [rentals, setRentals] = useState<RentalProperty[]>([])
  const [expiringContracts, setExpiringContracts] = useState<RentalProperty[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const in90Days = format(addDays(today, 90), 'yyyy-MM-dd')

    const [overdueTasksRes, upcomingTasksRes, propertiesRes] = await Promise.all([
      // Overdue tasks
      supabase
        .from('tasks')
        .select('*')
        .lt('scheduled_at', `${todayStr}T00:00:00`)
        .is('completed_at', null)
        .order('scheduled_at'),
      // Tasks due in next 7 days
      supabase
        .from('tasks')
        .select('*')
        .gte('scheduled_at', `${todayStr}T00:00:00`)
        .lte('scheduled_at', `${format(addDays(today, 7), 'yyyy-MM-dd')}T23:59:59`)
        .is('completed_at', null)
        .order('scheduled_at')
        .limit(10),
      // Properties with rental info
      supabase
        .from('properties')
        .select(`
          *,
          owner:contacts!properties_owner_contact_id_fkey(id, first_name, last_name, phone, email),
          tenant:contacts!properties_tenant_contact_id_fkey(id, first_name, last_name, phone, email)
        `)
        .eq('estado', 'alquilado'),
    ])

    // Build alerts
    const alertItems: AlertItem[] = []
    for (const t of (overdueTasksRes.data ?? []) as Task[]) {
      alertItems.push({
        id: t.id,
        type: 'overdue_task',
        title: `Tarea vencida: ${t.title}`,
        description: `Programada para el ${t.scheduled_at ? formatDate(t.scheduled_at) : 'fecha desconocida'}`,
        severity: 'high',
        date: t.scheduled_at ?? undefined,
      })
    }
    for (const t of (upcomingTasksRes.data ?? []) as Task[]) {
      alertItems.push({
        id: `upcoming-${t.id}`,
        type: 'pending_task',
        title: `Tarea próxima: ${t.title}`,
        description: `Programada para el ${t.scheduled_at ? formatDate(t.scheduled_at) : 'fecha desconocida'}`,
        severity: 'low',
        date: t.scheduled_at ?? undefined,
      })
    }

    setAlerts(alertItems)

    // Process rentals
    const props = (propertiesRes.data ?? []) as RentalProperty[]
    const today2 = new Date()
    const enriched = props.map((p) => {
      let daysUntilPayment: number | null = null
      if (p.pago_dia != null) {
        const currentMonth = today2.getMonth()
        const currentYear = today2.getFullYear()
        let paymentDate = new Date(currentYear, currentMonth, p.pago_dia)
        if (paymentDate < today2) {
          paymentDate = new Date(currentYear, currentMonth + 1, p.pago_dia)
        }
        daysUntilPayment = differenceInDays(paymentDate, today2)
      }
      return { ...p, daysUntilPayment }
    })

    setRentals(enriched)

    // Expiring contracts: properties where pago_dia is within 90 days (as proxy for contract end)
    const expiring = enriched.filter(
      (p) => p.daysUntilPayment != null && p.daysUntilPayment <= 90
    )
    setExpiringContracts(expiring)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const highAlerts = alerts.filter((a) => a.severity === 'high')
  const lowAlerts = alerts.filter((a) => a.severity !== 'high')

  return (
    <>
      <Topbar
        title="Administración"
        subtitle="Panel de control y alertas"
        actions={
          <button
            onClick={fetchData}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-ink-3 hover:text-ink hover:bg-surface transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={15} />
          </button>
        }
      />

      <main className="flex-1 p-3 sm:p-6 space-y-4">
        {/* Tab navigation */}
        <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border w-fit flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white text-ink shadow-sm border border-border'
                  : 'text-ink-3 hover:text-ink'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'alertas' && highAlerts.length > 0 && (
                <span className="w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                  {highAlerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'alertas' && (
          <div className="space-y-4">
            {/* High severity */}
            {highAlerts.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-red-600" />
                  </div>
                  <h3 className="font-display font-bold text-base text-ink">
                    Alertas urgentes ({highAlerts.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {highAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-800">{alert.title}</p>
                        <p className="text-xs text-red-600 mt-0.5">{alert.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Low severity */}
            {lowAlerts.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Clock size={16} className="text-yellow-600" />
                  </div>
                  <h3 className="font-display font-bold text-base text-ink">
                    Tareas próximas ({lowAlerts.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {lowAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                      <Clock size={15} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-yellow-800">{alert.title}</p>
                        <p className="text-xs text-yellow-600 mt-0.5">{alert.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {alerts.length === 0 && !loading && (
              <EmptyState
                title="Sin alertas"
                description="Todo está al día. No hay alertas pendientes."
                icon={<CheckCircle size={22} />}
              />
            )}
          </div>
        )}

        {activeTab === 'alquileres' && (
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Home size={16} className="text-orange" />
              <h3 className="font-display font-bold text-base text-ink">
                Propiedades en Alquiler ({rentals.length})
              </h3>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="skeleton w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3.5 w-48 rounded" />
                      <div className="skeleton h-3 w-32 rounded" />
                    </div>
                    <div className="skeleton h-6 w-20 rounded-full" />
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : rentals.length === 0 ? (
              <EmptyState title="Sin alquileres activos" description="No hay propiedades en alquiler registradas" icon={<Home size={18} />} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-0 py-2 text-xs font-semibold text-ink-3 uppercase tracking-wide">Propiedad</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-ink-3 uppercase tracking-wide">Inquilino</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-ink-3 uppercase tracking-wide">Precio</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-ink-3 uppercase tracking-wide">Próx. vencimiento</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-ink-3 uppercase tracking-wide">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map((p) => {
                      const urgent = p.daysUntilPayment != null && p.daysUntilPayment <= 5
                      const soon = p.daysUntilPayment != null && p.daysUntilPayment <= 15 && !urgent
                      return (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                          <td className="pr-4 py-3">
                            <p className="text-sm font-semibold text-ink truncate max-w-[200px]">{p.title}</p>
                            <p className="text-xs text-ink-3">{[p.barrio, p.city].filter(Boolean).join(', ')}</p>
                          </td>
                          <td className="px-4 py-3">
                            {p.tenant ? (
                              <div>
                                <p className="text-sm font-medium text-ink">{getFullName(p.tenant.first_name, p.tenant.last_name)}</p>
                                <p className="text-xs text-ink-3">{p.tenant.phone ?? p.tenant.email ?? ''}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-ink-light">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-ink">
                              {p.price_ars ? fmtCurrency(p.price_ars, 'ARS') : p.price_usd ? fmtCurrency(p.price_usd, 'USD') : '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {p.pago_dia != null ? (
                              <div>
                                <p className="text-sm font-medium text-ink">Día {p.pago_dia}</p>
                                {p.daysUntilPayment != null && (
                                  <p className={cn(
                                    'text-xs font-medium',
                                    urgent ? 'text-red-600' : soon ? 'text-yellow-600' : 'text-ink-3'
                                  )}>
                                    {p.daysUntilPayment === 0 ? 'Hoy' :
                                     p.daysUntilPayment === 1 ? 'Mañana' :
                                     `en ${p.daysUntilPayment} días`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-ink-light">Sin configurar</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {urgent ? (
                              <Badge bgColor="#fef2f2" textColor="#b91c1c" dot color="#ef4444">Urgente</Badge>
                            ) : soon ? (
                              <Badge bgColor="#fefce8" textColor="#854d0e" dot color="#eab308">Próximo</Badge>
                            ) : (
                              <Badge bgColor="#f0fdf4" textColor="#15803d" dot color="#22c55e">Al día</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'contratos' && (
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <FileText size={16} className="text-orange" />
              <h3 className="font-display font-bold text-base text-ink">
                Contratos por Vencer (próximos 90 días)
              </h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : expiringContracts.length === 0 ? (
              <EmptyState
                title="Sin contratos por vencer"
                description="No hay contratos que vencen en los próximos 90 días"
                icon={<CheckCircle size={18} />}
              />
            ) : (
              <div className="space-y-3">
                {expiringContracts.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border',
                      (p.daysUntilPayment ?? 99) <= 5
                        ? 'border-red-200 bg-red-50'
                        : (p.daysUntilPayment ?? 99) <= 30
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-border bg-surface'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      (p.daysUntilPayment ?? 99) <= 5 ? 'bg-red-100' : 'bg-orange-50'
                    )}>
                      <Calendar size={18} className={(p.daysUntilPayment ?? 99) <= 5 ? 'text-red-600' : 'text-orange'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{p.title}</p>
                      <p className="text-xs text-ink-3">
                        {p.tenant ? getFullName(p.tenant.first_name, p.tenant.last_name) : 'Sin inquilino'}
                        {p.daysUntilPayment != null && ` · Vence en ${p.daysUntilPayment} días`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-ink">
                        {p.price_ars ? fmtCurrency(p.price_ars, 'ARS') : p.price_usd ? fmtCurrency(p.price_usd, 'USD') : '—'}
                      </p>
                      <p className="text-xs text-ink-3">Día {p.pago_dia}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'avisos' && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <MessageCircle size={16} className="text-green-500" />
                <h3 className="font-display font-bold text-base text-ink">Configuración de Avisos</h3>
              </div>
              <p className="text-sm text-ink-3 mb-4">
                Configurá el mensaje automático de WhatsApp que se enviará a los inquilinos días antes del vencimiento.
              </p>

              <div className="bg-surface rounded-xl p-4 border border-border space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">Días de anticipación</label>
                  <div className="flex gap-2">
                    {[3, 5, 7, 10].map((d) => (
                      <button
                        key={d}
                        className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm font-medium text-ink-2 hover:border-orange hover:text-orange transition-colors"
                      >
                        {d} días
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">Plantilla del mensaje</label>
                  <div className="bg-[#25d366]/10 border border-[#25d366]/20 rounded-xl p-4 font-mono text-sm text-ink-2 space-y-1">
                    <p>Hola <span className="text-orange font-semibold">{'{{nombre_inquilino}}'}</span> 👋</p>
                    <p className="mt-2">Te recordamos que el próximo <span className="text-orange font-semibold">{'{{fecha_vencimiento}}'}</span> vence el pago del alquiler del inmueble ubicado en <span className="text-orange font-semibold">{'{{direccion}}'}</span>.</p>
                    <p className="mt-2">El monto a abonar es de <span className="text-orange font-semibold">{'{{monto}}'}</span>.</p>
                    <p className="mt-2">Ante cualquier consulta, no dudes en contactarnos.</p>
                    <p className="mt-3 font-semibold">Neme Negocios Inmobiliarios 🏢</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-ink">Envío automático</p>
                    <p className="text-xs text-ink-3">Habilitá el envío automático para los próximos vencimientos</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-light">Deshabilitado</span>
                    <div className="w-11 h-6 rounded-full bg-border relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full shadow absolute top-1 left-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#25d366] hover:bg-[#1db954] text-white text-sm font-semibold rounded-xl transition-colors">
                  <Send size={14} /> Enviar aviso de prueba
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-orange hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors">
                  Guardar configuración
                </button>
              </div>
            </Card>

            {/* Rentals due soon */}
            <Card>
              <h3 className="font-display font-semibold text-base text-ink mb-4">
                Vencimientos próximos ({expiringContracts.filter((p) => (p.daysUntilPayment ?? 99) <= 7).length})
              </h3>
              {expiringContracts.filter((p) => (p.daysUntilPayment ?? 99) <= 7).length === 0 ? (
                <EmptyState
                  title="Sin vencimientos esta semana"
                  description="No hay pagos que vencen en los próximos 7 días"
                  icon={<CheckCircle size={16} />}
                />
              ) : (
                <div className="space-y-2">
                  {expiringContracts
                    .filter((p) => (p.daysUntilPayment ?? 99) <= 7)
                    .map((p) => (
                      <div key={p.id} className="flex items-center gap-4 p-3 border border-border rounded-xl hover:bg-surface transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <DollarSign size={14} className="text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{p.title}</p>
                          <p className="text-xs text-ink-3">
                            {p.tenant ? getFullName(p.tenant.first_name, p.tenant.last_name) : '—'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-ink">
                            {p.price_ars ? fmtCurrency(p.price_ars, 'ARS') : '—'}
                          </p>
                          <p className="text-xs text-orange font-medium">
                            {p.daysUntilPayment === 0 ? 'Hoy' : `${p.daysUntilPayment}d`}
                          </p>
                        </div>
                        {p.tenant?.phone && (
                          <a
                            href={`https://wa.me/${p.tenant.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(getFullName(p.tenant.first_name, p.tenant.last_name))}%2C%20te%20recordamos%20el%20vencimiento%20del%20alquiler.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#25d366] hover:bg-[#1db954] text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
                          >
                            <MessageCircle size={12} /> WA
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </>
  )
}
