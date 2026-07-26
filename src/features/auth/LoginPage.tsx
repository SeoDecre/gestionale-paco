import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { accedi } from './api'
import { useSession } from './useSession'
import { messaggioErrore } from '@/lib/errors'

export function LoginPage() {
  const { session, caricamento } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  if (caricamento) return null
  if (session) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErrore(null)
    setInCorso(true)
    try {
      await accedi(email, password)
    } catch (err) {
      setErrore(messaggioErrore(err))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-card border border-bordo bg-superficie p-6"
      >
        <h1 className="mb-6 text-center text-titolo font-semibold">AgentPro</h1>

        <label className="mb-1 block text-etichetta text-testo-debole" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-card border border-bordo px-3 py-2.5 text-campo"
        />

        <label className="mb-1 block text-etichetta text-testo-debole" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-card border border-bordo px-3 py-2.5 text-campo"
        />

        {errore && (
          <p
            role="alert"
            className="mb-4 rounded-card border border-danger-soft-border bg-danger-soft px-3 py-2 text-etichetta text-danger-soft-text"
          >
            {errore}
          </p>
        )}

        <button
          type="submit"
          disabled={inCorso}
          className="w-full rounded-card bg-info-soft-text px-4 py-3 text-campo font-medium text-white disabled:opacity-50"
        >
          {inCorso ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>
    </div>
  )
}
