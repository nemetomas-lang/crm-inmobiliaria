import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  bgColor?: string
  textColor?: string
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

export function Badge({
  children,
  color,
  bgColor,
  textColor,
  size = 'sm',
  className,
  dot = false,
}: BadgeProps) {
  const style: React.CSSProperties = {}
  if (bgColor) style.backgroundColor = bgColor
  if (textColor) style.color = textColor

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        !bgColor && 'bg-gray-100 text-gray-700',
        className
      )}
      style={style}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color ?? textColor ?? '#6b7280' }}
        />
      )}
      {children}
    </span>
  )
}

// Convenience component for pipeline stage
interface StageBadgeProps {
  name: string
  color: string
  size?: 'sm' | 'md'
}

const stageColorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: '#eff6ff', text: '#1d4ed8' },
  yellow: { bg: '#fefce8', text: '#854d0e' },
  purple: { bg: '#f5f3ff', text: '#6d28d9' },
  orange: { bg: '#fff4e8', text: '#b45309' },
  green: { bg: '#f0fdf4', text: '#15803d' },
  red: { bg: '#fef2f2', text: '#b91c1c' },
}

export function StageBadge({ name, color, size = 'sm' }: StageBadgeProps) {
  const c = stageColorMap[color] ?? { bg: '#f3f4f6', text: '#374151' }
  const dotColor = {
    blue: '#3b82f6',
    yellow: '#eab308',
    purple: '#8b5cf6',
    orange: '#f5912c',
    green: '#22c55e',
    red: '#ef4444',
  }[color] ?? '#6b7280'

  return (
    <Badge
      bgColor={c.bg}
      textColor={c.text}
      color={dotColor}
      size={size}
      dot
    >
      {name}
    </Badge>
  )
}
