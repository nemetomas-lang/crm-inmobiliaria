'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ContactEstado, ContactInteres, ContactType, BudgetCurrency, ContactOrigen } from '@/lib/types'

export interface CreateContactData {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  dni?: string
  cuil?: string
  birth_date?: string
  occupation?: string
  estimated_income?: number
  estado?: ContactEstado
  interes?: ContactInteres
  contact_type?: ContactType
  budget_min?: number
  budget_max?: number
  budget_currency?: BudgetCurrency
  origen?: ContactOrigen
  notas?: string
  // Bank info
  banco?: string
  cbu?: string
  alias_cbu?: string
  tipo_cuenta?: string
  // Garante
  recibos_sueldo_urls?: string[]
  assigned_to?: string
  company_id?: string
}

export async function createContact(data: CreateContactData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      ...data,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/contacts')
  return contact
}

export async function updateContact(id: string, data: Partial<CreateContactData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: contact, error } = await supabase
    .from('contacts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/contacts')
  revalidatePath(`/contacts/${id}`)
  return contact
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/contacts')
}

export async function addActivity(data: {
  kind: string
  title: string
  description?: string
  contact_id?: string
  deal_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: activity, error } = await supabase
    .from('activities')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/contacts')
  if (data.contact_id) revalidatePath(`/contacts/${data.contact_id}`)
  return activity
}
