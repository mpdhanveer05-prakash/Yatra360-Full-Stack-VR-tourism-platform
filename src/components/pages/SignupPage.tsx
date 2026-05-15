import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export default function SignupPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore(s => s.setSession)

  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token, user } = await signup(username.trim(), email.trim(), password)
      setSession(token, user)
      navigate('/explore', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-3xl text-gold tracking-widest">JOIN YATRA360</h1>
          <p className="font-proza text-sm text-text-secondary mt-2">
            Create an account to track your virtual journeys
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-surface/80 backdrop-blur-md border border-gold/30 rounded-sm p-6 space-y-4 shadow-2xl"
        >
          <div className="space-y-1.5">
            <label htmlFor="username" className="block font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-bg-elevated border border-gold/20 text-cream font-proza px-3 py-2 rounded-sm focus:outline-none focus:border-gold/60 transition-colors"
              placeholder="lahari"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg-elevated border border-gold/20 text-cream font-proza px-3 py-2 rounded-sm focus:outline-none focus:border-gold/60 transition-colors"
              placeholder="lahari@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Password <span className="text-text-muted/60 normal-case">(min 6 chars)</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
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
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>

          <p className="font-proza text-xs text-text-secondary text-center pt-2 border-t border-gold/15">
            Already have an account?{' '}
            <Link to="/login" className="text-gold hover:text-gold-light underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
