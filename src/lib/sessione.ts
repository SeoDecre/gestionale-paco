import { supabase } from './supabase'

/**
 * ID dell'utente corrente, dalla sessione locale (nessuna chiamata di rete).
 * Serve solo a compilare owner_id nelle insert: la vera garanzia è comunque il
 * trigger tg_set_owner + la RLS, che ignorano qualunque owner_id inviato.
 */
export async function ownerId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Sessione non valida: effettua di nuovo l’accesso.')
  return id
}
