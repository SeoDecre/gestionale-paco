import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type StatoSessione = {
  session: Session | null
  caricamento: boolean
}

const SessioneContext = createContext<StatoSessione>({
  session: null,
  caricamento: true,
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [stato, setStato] = useState<StatoSessione>({
    session: null,
    caricamento: true,
  })

  useEffect(() => {
    let attivo = true

    supabase.auth.getSession().then(({ data }) => {
      if (attivo) setStato({ session: data.session, caricamento: false })
    })

    // Copre refresh del token, logout da un'altra scheda e scadenza sessione.
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (attivo) setStato({ session, caricamento: false })
    })

    return () => {
      attivo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <SessioneContext value={stato}>{children}</SessioneContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  return useContext(SessioneContext)
}
