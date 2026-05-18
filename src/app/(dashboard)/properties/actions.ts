'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PropertyTipo, PropertyEstado } from '@/lib/types'

export interface CreatePropertyData {
  title: string
  tipo?: PropertyTipo
  estado?: PropertyEstado
  address?: string
  barrio?: string
  city?: string
  province?: string
  postal_code?: string
  floor_unit?: string
  price_ars?: number
  price_usd?: number
  expensas?: number
  sup_cubierta?: number
  sup_descubierta?: number
  ambientes?: number
  dormitorios?: number
  banos?: number
  cocheras?: number
  antiguedad?: number
  orientacion?: string
  descripcion?: string
  img_urls?: string[]
  amenities?: string[]
  pago_dia?: number
  owner_contact_id?: string
  tenant_contact_id?: string
}

export async function createProperty(data: CreatePropertyData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: property, error } = await supabase
    .from('properties')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/properties')
  return property
}

export async function updateProperty(id: string, data: Partial<CreatePropertyData>) {
  const supabase = await createClient()
  const { data: property, error } = await supabase
    .from('properties')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/properties')
  revalidatePath(`/properties/${id}`)
  return property
}
