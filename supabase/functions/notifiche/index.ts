// Edge Function "notifiche" (§7): invia web push.
//  - tipo=test        → chiamata dall'utente (JWT), invia una prova a sé stesso
//  - tipo=promemoria  → cron, appuntamenti che iniziano tra ~1 ora
//  - tipo=mattina     → cron 07:00, riepilogo di oggi
//  - tipo=sera        → cron 20:00, anteprima domani + memo da integrare
//
// Il web-push serve solo per la crittografia VAPID: la richiesta si invia con
// fetch (niente networking node in Deno). Le iscrizioni scadute (404/410) si
// eliminano.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:agentpro@example.com'

const db = createClient(SUPABASE_URL, SERVICE_ROLE)

type Sub = { id: string; owner_id: string; endpoint: string; p256dh: string; auth: string }
type Payload = { title: string; body: string; url?: string; tag?: string }

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

function claim(auth: string | null): { sub?: string; role?: string } {
  if (!auth) return {}
  try {
    const p = auth.replace('Bearer ', '').split('.')[1]
    return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

/** Invia a una singola iscrizione; elimina quelle scadute. Ritorna true se ok. */
async function invia(sub: Sub, payload: Payload): Promise<boolean> {
  const dettagli = webpush.generateRequestDetails(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload),
    { TTL: 3600, vapidDetails: { subject: VAPID_SUBJECT, publicKey: VAPID_PUBLIC, privateKey: VAPID_PRIVATE } },
  )
  const res = await fetch(dettagli.endpoint, {
    method: dettagli.method,
    headers: dettagli.headers,
    body: dettagli.body,
  })
  if (res.status === 404 || res.status === 410) {
    await db.from('push_subscriptions').delete().eq('id', sub.id)
    return false
  }
  return res.ok
}

async function subsDi(ownerId: string): Promise<Sub[]> {
  const { data } = await db.from('push_subscriptions').select('*').eq('owner_id', ownerId)
  return (data ?? []) as Sub[]
}

async function inviaATutte(subs: Sub[], payload: Payload): Promise<number> {
  const esiti = await Promise.all(subs.map((s) => invia(s, payload).catch(() => false)))
  return esiti.filter(Boolean).length
}

// Confini "oggi"/"domani" in ora di Roma, restituiti come istanti UTC.
function giornoRoma(offsetGiorni: number): { da: string; a: string } {
  const now = new Date()
  const parti = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const offName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    timeZoneName: 'shortOffset',
  })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')!.value // es. "GMT+2"
  const oreOff = Number(offName.replace('GMT', '') || '0')
  const base = new Date(`${parti}T00:00:00Z`) // mezzanotte Roma "come se UTC"
  base.setUTCDate(base.getUTCDate() + offsetGiorni)
  const da = new Date(base.getTime() - oreOff * 3600_000)
  const a = new Date(da.getTime() + 24 * 3600_000)
  return { da: da.toISOString(), a: a.toISOString() }
}

const oraRoma = (iso: string) =>
  new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

type App = { id: string; inizio: string; lead: { ragione_sociale: string } | null }

async function appuntamenti(ownerId: string, da: string, a: string): Promise<App[]> {
  const { data } = await db
    .from('appuntamenti')
    .select('id, inizio, lead(ragione_sociale)')
    .eq('owner_id', ownerId)
    .neq('stato', 'annullato')
    .gte('inizio', da)
    .lt('inizio', a)
    .order('inizio')
  return (data ?? []) as unknown as App[]
}

/** Utenti con almeno un'iscrizione push. */
async function ownersConSub(): Promise<string[]> {
  const { data } = await db.from('push_subscriptions').select('owner_id')
  return [...new Set((data ?? []).map((r: { owner_id: string }) => r.owner_id))]
}

async function digestMattina(): Promise<number> {
  const { da, a } = giornoRoma(0)
  let tot = 0
  for (const owner of await ownersConSub()) {
    const app = await appuntamenti(owner, da, a)
    const body = app.length
      ? `${app.length} appuntamenti. Primo: ${oraRoma(app[0].inizio)} ${app[0].lead?.ragione_sociale ?? ''}`
      : 'Nessun appuntamento oggi.'
    tot += await inviaATutte(await subsDi(owner), { title: 'Buongiorno', body, url: '/', tag: 'mattina' })
  }
  return tot
}

async function digestSera(): Promise<number> {
  const domani = giornoRoma(1)
  let tot = 0
  for (const owner of await ownersConSub()) {
    const app = await appuntamenti(owner, domani.da, domani.a)
    const { count } = await db
      .from('allegati')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', owner)
      .eq('tipo', 'audio')
      .eq('stato', 'da_integrare')
      .is('file_eliminato_at', null)
    const body = `Domani ${app.length} appuntamenti. Memo da integrare: ${count ?? 0}.`
    tot += await inviaATutte(await subsDi(owner), { title: 'Riepilogo serale', body, url: '/', tag: 'sera' })
  }
  return tot
}

async function promemoria(): Promise<number> {
  const ora = Date.now()
  const da = new Date(ora + 55 * 60_000).toISOString()
  const a = new Date(ora + 65 * 60_000).toISOString()
  const { data } = await db
    .from('appuntamenti')
    .select('id, owner_id, inizio, lead(ragione_sociale)')
    .eq('stato', 'pianificato')
    .is('promemoria_inviato_at', null)
    .gte('inizio', da)
    .lt('inizio', a)
  let tot = 0
  for (const app of (data ?? []) as unknown as (App & { owner_id: string })[]) {
    const inviate = await inviaATutte(await subsDi(app.owner_id), {
      title: 'Tra un’ora',
      body: `${oraRoma(app.inizio)} ${app.lead?.ragione_sociale ?? 'Appuntamento'}`,
      url: '/agenda',
      tag: `promemoria-${app.id}`,
    })
    await db.from('appuntamenti').update({ promemoria_inviato_at: new Date().toISOString() }).eq('id', app.id)
    tot += inviate
  }
  return tot
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const body = await req.json().catch(() => ({}))
  const tipo = body?.tipo
  const c = claim(req.headers.get('Authorization'))

  try {
    if (tipo === 'test') {
      if (!c.sub) return json({ error: 'non autorizzato' }, 401)
      const inviate = await inviaATutte(await subsDi(c.sub), {
        title: 'AgentPro',
        body: 'Notifica di prova ✔',
        url: '/',
        tag: 'test',
      })
      return json({ inviate })
    }
    // I tipi schedulati richiedono la service role (cron).
    if (c.role !== 'service_role') return json({ error: 'solo cron' }, 403)
    if (tipo === 'mattina') return json({ inviate: await digestMattina() })
    if (tipo === 'sera') return json({ inviate: await digestSera() })
    if (tipo === 'promemoria') return json({ inviate: await promemoria() })
    return json({ error: 'tipo sconosciuto' }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
