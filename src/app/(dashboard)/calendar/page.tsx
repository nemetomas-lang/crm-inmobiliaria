'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { taskKindConfig, getFullName, cn } from '@/lib/utils'
import type { Task, Contact, TaskKind } from '@/lib/types'
import { createTask, completeTask } from './actions'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Calendar,
  Clock,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface TaskWithContact extends Task {
  contact: Contact | null
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState<TaskWithContact[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    kind: 'llamada',
    scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    contact_id: '',
  })

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

    const [tasksRes, contactsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, contact:contacts(id, first_name, last_name)')
        .gte('scheduled_at', `${monthStart}T00:00:00`)
        .lte('scheduled_at', `${monthEnd}T23:59:59`)
        .order('scheduled_at'),
      supabase.from('contacts').select('id, first_name, last_name').order('first_name'),
    ])

    setTasks((tasksRes.data ?? []) as TaskWithContact[])
    setContacts((contactsRes.data ?? []) as Contact[])
    setLoading(false)
  }, [currentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.scheduled_at && isSameDay(parseISO(t.scheduled_at), day))

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createTask({
        title: form.title,
        kind: form.kind as TaskKind,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined,
        contact_id: form.contact_id || undefined,
      })
      setShowModal(false)
      setForm({ title: '', kind: 'llamada', scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), contact_id: '' })
      fetchData()
    } catch (err) {
      alert('Error al crear la tarea:\n\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId)
      fetchData()
    } catch (err) {
      alert('Error al completar la tarea:\n\n' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : []
  const upcomingTasks = tasks
    .filter((t) => t.scheduled_at && new Date(t.scheduled_at) >= new Date() && !t.completed_at)
    .slice(0, 10)

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <>
      <Topbar
        title="Calendario"
        onAdd={() => setShowModal(true)}
        addLabel="Nuevo evento"
      />

      <main className="flex-1 p-3 sm:p-6 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Calendar */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-ink capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-surface transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 h-8 text-sm font-medium text-ink-3 hover:text-ink hover:bg-surface rounded-lg transition-colors"
                >
                  Hoy
                </button>
                <button
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-surface transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-ink-3 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
              {days.map((day) => {
                const dayTasks = getTasksForDay(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const todayDay = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'bg-white p-1.5 min-h-[80px] cursor-pointer transition-colors hover:bg-orange-50/40',
                      !isCurrentMonth && 'bg-surface',
                      isSelected && 'bg-orange-50 ring-1 ring-inset ring-orange/30'
                    )}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                  >
                    <div className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1',
                      todayDay && 'bg-orange text-white',
                      !todayDay && isCurrentMonth && 'text-ink',
                      !isCurrentMonth && 'text-ink-light'
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map((t) => {
                        const cfg = taskKindConfig[t.kind ?? 'otro']
                        return (
                          <div
                            key={t.id}
                            className="text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium"
                            style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                          >
                            {t.title}
                          </div>
                        )
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-[10px] text-ink-light px-1">+{dayTasks.length - 2} más</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Selected day tasks */}
          {selectedDay && (
            <Card className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-sm text-ink">
                  {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <button
                  onClick={() => {
                    setForm((f) => ({ ...f, scheduled_at: format(selectedDay, "yyyy-MM-dd'T'09:00") }))
                    setShowModal(true)
                  }}
                  className="text-xs text-orange font-semibold flex items-center gap-1 hover:text-orange-600 transition-colors"
                >
                  <Plus size={12} /> Agregar
                </button>
              </div>
              {selectedDayTasks.length === 0 ? (
                <p className="text-sm text-ink-light text-center py-4">Sin eventos</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map((t) => {
                    const cfg = taskKindConfig[t.kind ?? 'otro']
                    return (
                      <div key={t.id} className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl',
                        t.completed_at ? 'opacity-50' : ''
                      )}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium text-ink', t.completed_at && 'line-through')}>{t.title}</p>
                          <p className="text-xs text-ink-3">
                            {t.scheduled_at && format(parseISO(t.scheduled_at), 'HH:mm')}
                            {t.contact && ` · ${getFullName(t.contact.first_name, t.contact.last_name)}`}
                          </p>
                        </div>
                        {!t.completed_at && (
                          <button
                            onClick={() => handleComplete(t.id)}
                            className="text-ink-light hover:text-green-600 transition-colors"
                            title="Marcar como completada"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar: Upcoming tasks */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-orange" />
              <h3 className="font-display font-semibold text-sm text-ink">Próximas tareas</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                ))}
              </div>
            ) : upcomingTasks.length === 0 ? (
              <EmptyState
                title="Sin próximas tareas"
                description="No hay tareas programadas"
                icon={<Calendar size={16} />}
              />
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((t) => {
                  const cfg = taskKindConfig[t.kind ?? 'otro']
                  return (
                    <div key={t.id} className="flex items-start gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{t.title}</p>
                        <p className="text-xs text-ink-3">
                          {t.scheduled_at && format(parseISO(t.scheduled_at), "d MMM · HH:mm", { locale: es })}
                        </p>
                        {t.contact && (
                          <p className="text-xs text-ink-light truncate">
                            {getFullName(t.contact.first_name, t.contact.last_name)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleComplete(t.id)}
                        className="text-ink-light hover:text-green-600 transition-colors flex-shrink-0 mt-0.5"
                      >
                        <CheckCircle size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Button
            className="w-full"
            icon={<Plus size={14} />}
            onClick={() => setShowModal(true)}
          >
            Nuevo evento
          </Button>
        </div>
      </main>

      {/* Create Task Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Evento" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Título *"
            value={form.title}
            onChange={set('title')}
            required
            placeholder="Ej: Llamada con cliente"
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
          <Select label="Contacto" value={form.contact_id} onChange={set('contact_id')}>
            <option value="">Sin contacto</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {getFullName(c.first_name, c.last_name)}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar evento</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
