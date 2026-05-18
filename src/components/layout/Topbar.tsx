'use client'

import { useState } from 'react'
import { Search, Bell, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value)
    onSearch?.(e.target.value)
  }

  const searchVal = searchValue !== undefined ? searchValue : localSearch

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="flex items-center gap-4 px-6 h-16">
        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl text-ink leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-ink-3">{subtitle}</p>}
        </div>

        {/* Search */}
        {onSearch !== undefined && (
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none"
            />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="h-9 pl-9 pr-4 rounded-xl border border-border bg-surface text-sm text-ink
                placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange
                transition-colors w-56"
            />
          </div>
        )}

        {/* Extra actions */}
        {actions}

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-ink-3 hover:text-ink hover:bg-surface transition-colors border border-border">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full" />
        </button>

        {/* Add button */}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 h-9 px-4 bg-orange hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={15} />
            {addLabel}
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
  return (
    <header className={cn('sticky top-0 z-30 bg-white border-b border-border', className)}>
      <div className="flex items-center justify-between px-6 h-16">
        <div />
        <div className="flex items-center gap-3">
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
