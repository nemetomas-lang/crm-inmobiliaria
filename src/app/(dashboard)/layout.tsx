import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNavProvider } from '@/components/layout/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? null
  const userEmail = user.email ?? null
  const userAvatar = profile?.avatar_url ?? null

  return (
    <MobileNavProvider>
      <div className="flex min-h-screen bg-surface">
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </MobileNavProvider>
  )
}
