import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Variabili Supabase mancanti. Copia .env.example in .env.local e inserisci ' +
      'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY dal progetto Supabase.',
  )
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // La sessione va ripresa dall'URL solo per il recupero password.
    detectSessionInUrl: true,
  },
})
