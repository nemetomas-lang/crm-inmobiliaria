import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'dark' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-orange hover:bg-orange-600 text-white border-transparent shadow-sm',
  ghost:
    'bg-transparent hover:bg-surface text-ink-2 border-transparent',
  dark:
    'bg-ink hover:bg-ink-2 text-white border-transparent',
  danger:
    'bg-red-500 hover:bg-red-600 text-white border-transparent',
  outline:
    'bg-white hover:bg-surface text-ink border-border',
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold border transition-colors',
        'disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/40',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
