'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div
            className="bg-white rounded-[16px] border border-border p-8 text-center"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className="font-display font-bold text-xl text-ink mb-2">¡Registro exitoso!</h2>
            <p className="text-ink-3 text-sm mb-6">
              Te enviamos un email de confirmación a <strong>{email}</strong>.
              Por favor revisá tu bandeja de entrada y hacé clic en el link para activar tu cuenta.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full h-11 bg-orange hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/neme-logo.png" alt="Neme" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">Neme Negocios</h1>
          <p className="text-ink-3 text-sm mt-1">Inmobiliarios · Córdoba</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-[16px] border border-border p-8"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <h2 className="font-display font-bold text-xl text-ink mb-1">Crear cuenta</h2>
          <p className="text-ink-3 text-sm mb-6">Completá tus datos para registrarte</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan García"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-ink text-sm
                  placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange
                  transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-ink text-sm
                  placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange
                  transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border bg-white text-ink text-sm
                    placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange
                    transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-3 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu contraseña"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-ink text-sm
                  placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange
                  transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-orange hover:bg-orange-600 text-white font-semibold rounded-xl
                transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2
                text-sm mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-3 mt-5">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-orange font-semibold hover:text-orange-600 transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-ink-light mt-6">
          © 2025 Neme Negocios Inmobiliarios
        </p>
      </div>
    </div>
  )
}
