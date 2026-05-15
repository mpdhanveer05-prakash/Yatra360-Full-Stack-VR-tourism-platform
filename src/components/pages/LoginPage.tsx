import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore(s => s.setSession)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/explore'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token, user } = await login(username.trim(), password)
      setSession(token, user)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-3xl text-gold tracking-widest">WELCOME BACK</h1>
          <p className="font-proza text-sm text-text-secondary mt-2">
            Sign in to continue your journey
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-surface/80 backdrop-blur-md border border-gold/30 rounded-sm p-6 space-y-4 shadow-2xl"
        >
          <div className="space-y-1.5">
            <label htmlFor="username" className="block font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-bg-elevated border border-gold/20 text-cream font-proza px-3 py-2 rounded-sm focus:outline-none focus:border-gold/60 transition-colors"
              placeholder="lahari"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-bg-elevated border border-gold/20 text-cream font-proza px-3 py-2 rounded-sm focus:outline-none focus:border-gold/60 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-2 rounded-sm">
              <span className="flex-none">⚠</span>
              <p className="font-proza text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-saffron text-cream font-cinzel text-sm tracking-widest uppercase px-4 py-2.5 rounded-sm hover:bg-saffron-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>

          <p className="font-proza text-xs text-text-secondary text-center pt-2 border-t border-gold/15">
            New here?{' '}
            <Link to="/signup" className="text-gold hover:text-gold-light underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
