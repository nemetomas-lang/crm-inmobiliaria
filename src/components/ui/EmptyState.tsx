import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = 'Sin resultados',
  description = 'No hay datos para mostrar.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4 text-ink-light">
        {icon ?? <Inbox size={24} />}
      </div>
      <h3 className="font-display font-semibold text-base text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-3 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
