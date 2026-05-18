import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

export function Input({
  label,
  error,
  hint,
  wrapperClassName,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border bg-white text-ink text-sm',
          'placeholder:text-ink-light transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange',
          error
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
            : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-light">{hint}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
  children: React.ReactNode
}

export function Select({
  label,
  error,
  hint,
  wrapperClassName,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink-2">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border bg-white text-ink text-sm',
          'focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange',
          'transition-colors appearance-none cursor-pointer',
          error
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
            : 'border-border',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-light">{hint}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

export function Textarea({
  label,
  error,
  hint,
  wrapperClassName,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-ink-2">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border bg-white text-ink text-sm',
          'placeholder:text-ink-light transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange',
          error
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
            : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-light">{hint}</p>}
    </div>
  )
}
