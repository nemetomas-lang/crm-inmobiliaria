'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  GitFork,
  Home,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn, getInitials, getAvatarColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} /> },
  { label: 'Contactos', href: '/contacts', icon: <Users size={18} /> },
  { label: 'Empresas', href: '/companies', icon: <Building2 size={18} /> },
  { label: 'Pipeline', href: '/deals', icon: <GitFork size={18} /> },
  { label: 'Propiedades', href: '/properties', icon: <Home size={18} /> },
  { label: 'Calendario', href: '/calendar', icon: <Calendar size={18} /> },
  { label: 'Administración', href: '/admin', icon: <Settings size={18} /> },
]

interface SidebarProps {
  userName?: string | null
  userEmail?: string | null
  userAvatar?: string | null
}

export function Sidebar({ userName, userEmail, userAvatar }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = getInitials(userName)
  const avatarBg = getAvatarColor(userName)

  return (
    <aside className="w-[232px] min-h-screen bg-ink flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-display font-bold text-base">N</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-display font-bold text-sm leading-tight truncate">Neme Negocios</p>
            <p className="text-white/50 text-xs leading-tight">Inmobiliarios</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group',
                active
                  ? 'bg-orange text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              )}
            >
              <span className={cn(
                'flex-shrink-0 transition-colors',
                active ? 'text-white' : 'text-white/50 group-hover:text-white/80'
              )}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight size={14} className="text-white/60 flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatar} alt={userName ?? ''} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName ?? 'Usuario'}</p>
            <p className="text-white/40 text-[11px] truncate">{userEmail ?? ''}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="text-white/40 hover:text-white/70 transition-colors p-1 rounded"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
