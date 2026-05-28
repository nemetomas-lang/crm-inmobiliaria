'use client'

import { useState } from 'react'
import { Search, Bell, Plus, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobileNav } from './MobileNav'

interface TopbarProps {
  title: string
  subtitle?: string
  onAdd?: () => void
  addLabel?: string
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  searchValue?: string
  actions?: React.ReactNode
}

export function Topbar({
  title,
  subtitle,
  onAdd,
  addLabel = 'Nuevo',
  searchPlaceholder = 'Buscar...',
  onSearch,
  searchValue,
  actions,
}: TopbarProps) {
  const [localSearch, setLocalSearch] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const { setOpen: setMobileNavOpen } = useMobileNav()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value)
    onSearch?.(e.target.value)
  }

  const searchVal = searchValue !== undefined ? searchValue : localSearch

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 h-16">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-ink-2 hover:bg-surface flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        {/* Title (hidden when mobile-search is expanded so the input has room) */}
        <div className={cn(
          'flex-1 min-w-0',
          searchExpanded && onSearch !== undefined && 'hidden sm:block'
        )}>
          <h1 className="font-display font-bold text-base sm:text-xl text-ink leading-tight truncate">{title}</h1>
          {subtitle && <p className="hidden sm:block text-xs text-ink-3 truncate">{subtitle}</p>}
        </div>

        {/* Search — collapsed icon on mobile, expanded on tap */}
        {onSearch !== undefined && (
          <>
            {/* Mobile collapsed: icon button */}
            {!searchExpanded && (
              <button
                onClick={() => setSearchExpanded(true)}
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-ink-3 hover:bg-surface border border-border flex-shrink-0"
                aria-label="Buscar"
              >
                <Search size={16} />
              </button>
            )}
            {/* Mobile expanded: full input filling row */}
            {searchExpanded && (
              <div className="flex items-center gap-2 flex-1 sm:hidden">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    value={searchVal}
                    onChange={handleSearch}
                    placeholder={searchPlaceholder}
                    className="h-9 w-full pl-9 pr-3 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-colors"
                  />
                </div>
                <button
                  onClick={() => { setSearchExpanded(false); onSearch?.('') }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-3 hover:bg-surface flex-shrink-0"
                  aria-label="Cerrar búsqueda"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {/* Desktop: always-visible input */}
            <div className="hidden sm:block relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
              <input
                type="text"
                value={searchVal}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="h-9 pl-9 pr-4 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-colors w-44 md:w-56"
              />
            </div>
          </>
        )}

        {/* Extra page-specific actions (hidden on mobile to save space) */}
        <div className="hidden sm:flex items-center gap-2">{actions}</div>

        {/* Notifications (desktop only — saves real estate on mobile) */}
        <button className="hidden sm:flex relative w-9 h-9 items-center justify-center rounded-xl text-ink-3 hover:text-ink hover:bg-surface transition-colors border border-border flex-shrink-0">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full" />
        </button>

        {/* Add button — icon-only on mobile, full label on sm+ */}
        {onAdd && !searchExpanded && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 h-9 px-2 sm:px-4 bg-orange hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
            aria-label={addLabel}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{addLabel}</span>
          </button>
        )}
      </div>
    </header>
  )
}

// Simpler version used in dashboard layout
interface SimpleTopbarProps {
  userName?: string | null
  className?: string
}

export function SimpleTopbar({ userName, className }: SimpleTopbarProps) {
  const { setOpen: setMobileNavOpen } = useMobileNav()
  return (
    <header className={cn('sticky top-0 z-30 bg-white border-b border-border', className)}>
      <div className="flex items-center justify-between px-3 sm:px-6 h-16">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-ink-2 hover:bg-surface"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-ink-2 font-medium hidden md:block">{userName}</span>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-ink-3 hover:text-ink hover:bg-surface transition-colors border border-border">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full" />
          </button>
        </div>
      </div>
    </header>
  )
}
