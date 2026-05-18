'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TaskKind } from '@/lib/types'

export interface CreateTaskData {
  title: string
  kind?: TaskKind
  scheduled_at?: string
  contact_id?: string
  deal_id?: string
  property_id?: string
  assigned_to?: string
}

export async function createTask(data: CreateTaskData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/calendar')
  return task
}

export async function completeTask(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/calendar')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/calendar')
}
