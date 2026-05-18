'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import type { DealWithRelations, PipelineStage, Contact, BudgetCurrency, DealTipo } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { stageColorMap, fmtCurrency, getFullName, dealTipoConfig } from '@/lib/utils'
import { updateDealStage, createDeal } from './actions'
import { Plus, GripVertical, DollarSign, User } from 'lucide-react'
import Link from 'next/link'

// ─── Deal Card ───────────────────────────────────────────────────────────────

interface DealCardProps {
  deal: DealWithRelations
  isDragging?: boolean
}

function DealCard({ deal, isDragging }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const tipoCfg = deal.tipo ? dealTipoConfig[deal.tipo] : null
  const contactName = deal.contact
    ? getFullName(deal.contact.first_name, deal.contact.last_name)
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-border rounded-xl p-3.5 select-none cursor-grab active:cursor-grabbing
        hover:shadow-[var(--shadow-card-hover)] transition-shadow group
        ${isDragging ? 'kanban-drag-overlay' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-ink-light opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
        >
          <GripVertical size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/deals/${deal.id}`}
            className="text-sm font-semibold text-ink hover:text-orange transition-colors line-clamp-2 block"
            onClick={(e) => e.stopPropagation()}
          >
            {deal.title}
          </Link>

          {contactName && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <User size={11} className="text-ink-light flex-shrink-0" />
              <span className="text-xs text-ink-3 truncate">{contactName}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2.5">
            {deal.value ? (
              <div className="flex items-center gap-1 text-xs font-bold text-ink">
                <DollarSign size={11} className="text-orange" />
                {fmtCurrency(deal.value, deal.currency)}
              </div>
            ) : (
              <span className="text-xs text-ink-light">Sin valor</span>
            )}

            {tipoCfg && (
              <Badge
                bgColor={tipoCfg.bgColor}
                textColor={tipoCfg.textColor}
                size="sm"
              >
                {tipoCfg.label}
              </Badge>
            )}
          </div>

          {deal.assigned_profile && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
              <Avatar name={deal.assigned_profile.full_name} size="xs" />
              <span className="text-xs text-ink-light truncate">{deal.assigned_profile.full_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Column ───────────────────────────────────────────────────────────

interface KanbanColumnProps {
  stage: PipelineStage
  deals: DealWithRelations[]
  contacts: Contact[]
  onDealCreated: () => void
}

function KanbanColumn({ stage, deals, contacts, onDealCreated }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ title: '', contact_id: '', value: '', currency: 'USD', tipo: '' })
  const [saving, setSaving] = useState(false)

  const c = stageColorMap[stage.color] ?? { bg: '#f3f4f6', text: '#374151', dot: '#6b7280' }
  const totalValue = deals.reduce((s, d) => s + (d.value ?? 0), 0)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await createDeal({
        title: form.title,
        stage_id: stage.id,
        contact_id: form.contact_id || undefined,
        value: form.value ? Number(form.value) : undefined,
        currency: (form.currency as BudgetCurrency) || 'USD',
        tipo: (form.tipo as DealTipo) || undefined,
        estado: 'activo',
      })
      setForm({ title: '', contact_id: '', value: '', currency: 'USD', tipo: '' })
      setShowAddForm(false)
      onDealCreated()
    } catch {
      alert('Error al crear el deal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl transition-colors
        ${isOver ? 'bg-orange/5 ring-2 ring-orange/30' : 'bg-surface'}`}
      style={{ minWidth: '280px', maxWidth: '280px' }}
    >
      {/* Column header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />
            <span className="font-display font-bold text-sm text-ink">{stage.name}</span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              {deals.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-ink-light hover:text-orange hover:bg-orange-50 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-ink-3 pl-4">
            {fmtCurrency(totalValue, 'ARS')}
          </p>
        )}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div className="mx-3 mb-2 bg-white border border-border rounded-xl p-3 shadow-sm">
          <form onSubmit={handleAdd} className="space-y-2">
            <Input
              placeholder="Título del deal *"
              value={form.title}
              onChange={set('title')}
              required
              className="text-xs py-1.5"
            />
            <select
              value={form.contact_id}
              onChange={set('contact_id')}
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-white text-xs text-ink
                focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange"
            >
              <option value="">Sin contacto</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {getFullName(c.first_name, c.last_name)}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <input
                type="number"
                placeholder="Valor"
                value={form.value}
                onChange={set('value')}
                className="flex-1 w-0 px-2 py-1.5 rounded-lg border border-border bg-white text-xs text-ink
                  focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange"
              />
              <select
                value={form.currency}
                onChange={set('currency')}
                className="w-16 px-1 py-1.5 rounded-lg border border-border bg-white text-xs text-ink
                  focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
            <select
              value={form.tipo}
              onChange={set('tipo')}
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-white text-xs text-ink
                focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange"
            >
              <option value="">Tipo...</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="alquiler_temporal">Alq. temporal</option>
              <option value="inversion">Inversión</option>
            </select>
            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 h-7 rounded-lg border border-border text-xs text-ink-3 hover:bg-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-7 rounded-lg bg-orange hover:bg-orange-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {saving ? '...' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 px-3 pb-4 space-y-2 overflow-y-auto"
        style={{ minHeight: '80px' }}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {deals.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-8 h-8 rounded-xl border-2 border-dashed border-border flex items-center justify-center mb-2">
              <Plus size={14} className="text-ink-light" />
            </div>
            <p className="text-xs text-ink-light">Arrastrá deals aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  stages: PipelineStage[]
  initialDeals: DealWithRelations[]
  contacts: Contact[]
  onRefresh: () => void
}

export function KanbanBoard({ stages, initialDeals, contacts, onRefresh }: KanbanBoardProps) {
  const [deals, setDeals] = useState<DealWithRelations[]>(initialDeals)
  const [activeDeal, setActiveDeal] = useState<DealWithRelations | null>(null)

  // Sync local state when parent refreshes
  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const getDealsByStage = useCallback(
    (stageId: string) => deals.filter((d) => d.stage_id === stageId),
    [deals]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id)
    if (deal) setActiveDeal(deal)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Check if dropping over a column (stage) directly
    const overStage = stages.find((s) => s.id === overId)
    if (overStage) {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === activeId ? { ...d, stage_id: overStage.id } : d
        )
      )
      return
    }

    // Dropping over another deal — move to that deal's stage
    const overDeal = deals.find((d) => d.id === overId)
    if (overDeal && overDeal.stage_id !== deals.find((d) => d.id === activeId)?.stage_id) {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === activeId ? { ...d, stage_id: overDeal.stage_id } : d
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDeal(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the target stage
    let targetStageId: string | null = null

    const overStage = stages.find((s) => s.id === overId)
    if (overStage) {
      targetStageId = overStage.id
    } else {
      const overDeal = deals.find((d) => d.id === overId)
      if (overDeal) targetStageId = overDeal.stage_id
    }

    if (!targetStageId) return

    const originalDeal = initialDeals.find((d) => d.id === activeId)
    if (!originalDeal || originalDeal.stage_id === targetStageId) return

    // Optimistic update already applied in handleDragOver
    try {
      await updateDealStage(activeId, targetStageId)
      onRefresh()
    } catch {
      // Revert on error
      setDeals(initialDeals)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={getDealsByStage(stage.id)}
            contacts={contacts}
            onDealCreated={onRefresh}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && (
          <DealCard deal={activeDeal} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  )
}
