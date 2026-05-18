import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: React.ReactNode
  iconBgColor?: string
  iconColor?: string
  loading?: boolean
  className?: string
}

export function KpiCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  iconBgColor = '#fff4e8',
  iconColor = '#f5912c',
  loading = false,
  className,
}: KpiCardProps) {
  const isPositive = trend != null && trend >= 0

  if (loading) {
    return (
      <div className={cn('bg-white border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)]', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-8 w-20 rounded mt-3" />
            <div className="skeleton h-3 w-16 rounded mt-2" />
          </div>
          <div className="skeleton w-12 h-12 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)]', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-ink-3 uppercase tracking-wide">{label}</p>
          <p className="font-display font-bold text-3xl text-ink mt-1 leading-none">
            {value}
          </p>
          {trend != null && (
            <div className={cn('flex items-center gap-1 mt-2', isPositive ? 'text-green-600' : 'text-red-500')}>
              {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span className="text-xs font-medium">
                {isPositive ? '+' : ''}{trend}%
                {trendLabel && <span className="text-ink-light font-normal ml-1">{trendLabel}</span>}
              </span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
