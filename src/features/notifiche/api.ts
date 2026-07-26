import { supabase } from '@/lib/supabase'
import { ownerId } from '@/lib/sessione'

/** Persistenza delle iscrizioni push (§7) e trigger della notifica di prova. */

export async function salvaSubscription(sub: PushSubscription): Promise<void> {
  const j = sub.toJSON()
  if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) throw new Error('Iscrizione non valida.')
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: j.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
      user_agent: navigator.userAgent,
      owner_id: await ownerId(),
    },
    { onConflict: 'owner_id,endpoint' },
  )
  if (error) throw error
}

export async function eliminaSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) throw error
}

/**
 * Invia una notifica di prova a sé stessi: chiama la Edge Function 'notifiche'
 * in modalità test col JWT dell'utente (la function invia alle sue iscrizioni).
 */
export async function inviaNotificaProva(): Promise<{ inviate: number }> {
  const { data, error } = await supabase.functions.invoke('notifiche', {
    body: { tipo: 'test' },
  })
  if (error) throw error
  return data as { inviate: number }
}
