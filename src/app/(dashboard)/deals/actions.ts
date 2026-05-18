'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DealTipo, DealEstado, BudgetCurrency } from '@/lib/types'

export interface CreateDealData {
  title: string
  contact_id?: string
  company_id?: string
  stage_id: string
  value?: number
  currency?: BudgetCurrency
  tipo?: DealTipo
  estado?: DealEstado
  close_date?: string
  description?: string
  assigned_to?: string
}

export async function createDeal(data: CreateDealData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: deal, error } = await supabase
    .from('deals')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/deals')
  return deal
}

export async function updateDealStage(id: string, stage_id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('deals')
    .update({ stage_id, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/deals')
}

export async function updateDeal(id: string, data: Partial<CreateDealData>) {
  const supabase = await createClient()
  const { data: deal, error } = await supabase
    .from('deals')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/deals')
  revalidatePath(`/deals/${id}`)
  return deal
}

export async function deleteDeal(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('deals').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/deals')
}
