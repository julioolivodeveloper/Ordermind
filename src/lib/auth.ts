import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole, Profile } from '@/types'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const { data: restaurant } = profile.restaurant_id
    ? await supabase.from('restaurants').select('*').eq('id', profile.restaurant_id).single()
    : { data: null }

  return { ...profile, email: user.email, restaurant: restaurant ?? undefined }
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!allowedRoles.includes(profile.role)) redirect('/dashboard')
  return profile
}

export async function requireSuperAdmin() {
  return requireRole(['super_admin'])
}

export async function requireRestaurantAccess() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!['super_admin', 'restaurant_owner', 'staff'].includes(profile.role)) redirect('/login')
  return profile
}

export { formatCurrency, timeAgo } from '@/lib/utils'

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}
