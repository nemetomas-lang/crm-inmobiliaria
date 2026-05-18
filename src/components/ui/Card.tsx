import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, padding = true, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-border rounded-[16px]',
        'shadow-[var(--shadow-card)]',
        padding && 'p-5',
        hover && 'hover:shadow-[var(--shadow-card-hover)] transition-shadow cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('font-display font-semibold text-base text-ink', className)}>
      {children}
    </h3>
  )
}
