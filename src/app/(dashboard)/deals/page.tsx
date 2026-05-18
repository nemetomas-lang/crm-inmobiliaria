'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { KanbanBoard } from './KanbanBoard'
import type { PipelineStage, DealWithRelations, Contact } from '@/lib/types'

export default function DealsPage() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<DealWithRelations[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    const [stagesRes, dealsRes, contactsRes] = await Promise.all([
      supabase.from('pipeline_stages').select('*').order('order_index'),
      supabase
        .from('deals')
        .select(`
          *,
          contact:contacts(id, first_name, last_name),
          company:companies(id, name),
          assigned_profile:profiles!deals_assigned_to_fkey(id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .order('first_name'),
    ])

    setStages((stagesRes.data ?? []) as PipelineStage[])
    setDeals((dealsRes.data ?? []) as DealWithRelations[])
    setContacts((contactsRes.data ?? []) as Contact[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const supabase = createClient()
    const channel = supabase
      .channel('deals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  const totalDeals = deals.length
  const activeDeals = deals.filter((d) => d.estado === 'activo').length

  return (
    <>
      <Topbar
        title="Pipeline"
        subtitle={`${totalDeals} deals · ${activeDeals} activos`}
      />
      <main className="flex-1 p-6 overflow-hidden">
        {loading ? (
          <div className="flex gap-4 overflow-x-auto">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-2xl bg-surface p-4 space-y-3"
                style={{ minWidth: '280px' }}
              >
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-24 rounded-xl" />
                <div className="skeleton h-24 rounded-xl" />
                <div className="skeleton h-24 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard
            stages={stages}
            initialDeals={deals}
            contacts={contacts}
            onRefresh={fetchData}
          />
        )}
      </main>
    </>
  )
}
