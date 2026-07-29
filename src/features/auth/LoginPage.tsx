import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { accedi } from './api'
import { useSession } from './useSession'
import { messaggioErrore } from '@/lib/errors'
import { Bottone, BottoneIcona } from '@/components/ui/Bottone'
import { Campo, Input } from '@/components/ui/Campo'
import { Avviso } from '@/components/ui/Avviso'

export function LoginPage() {
  const { session, caricamento } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)
  const [mostraPassword, setMostraPassword] = useState(false)

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
        className="superficie-card animate-salita flex w-full max-w-sm flex-col gap-4 p-6"
      >
        <div className="text-center">
          <h1 className="text-titolo font-semibold">AgentPro</h1>
          <p className="text-etichetta text-testo-debole">NEXI · Hera Comm</p>
        </div>

        <Campo etichetta="Email" obbligatorio>
          <Input
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>

        <Campo etichetta="Password" obbligatorio>
          {/* Mostra/nascondi: su tastiera del telefono si sbaglia a digitare
              piu' spesso, e senza questo l'unico rimedio e' riscrivere tutto. */}
          <div className="relative">
            <Input
              type={mostraPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <BottoneIcona
              nome="mostra"
              etichetta={
                mostraPassword ? 'Nascondi la password' : 'Mostra la password'
              }
              className="absolute inset-y-0 right-0"
              aria-pressed={mostraPassword}
              onClick={() => setMostraPassword((v) => !v)}
            />
          </div>
        </Campo>

        {errore && (
          <Avviso tinta="pericolo" assertivo>
            {errore}
          </Avviso>
        )}

        <Bottone type="submit" piena caricamento={inCorso}>
          {inCorso ? 'Accesso in corso…' : 'Accedi'}
        </Bottone>
      </form>
    </div>
  )
}
