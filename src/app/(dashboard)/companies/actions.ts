'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateCompanyData {
  name: string
  tax_id?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  website?: string
  notes?: string
}

export async function createCompany(data: CreateCompanyData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: company, error } = await supabase
    .from('companies')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/companies')
  return company
}

export async function updateCompany(id: string, data: Partial<CreateCompanyData>) {
  const supabase = await createClient()
  const { data: company, error } = await supabase
    .from('companies')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/companies')
  return company
}
