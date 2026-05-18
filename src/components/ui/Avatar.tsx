import { cn, getInitials, getAvatarColor } from '@/lib/utils'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
      title={name ?? undefined}
    >
      {initials}
    </div>
  )
}
