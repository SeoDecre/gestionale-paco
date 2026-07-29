import { NavLink, Outlet } from 'react-router-dom'
import { esci } from '@/features/auth/api'
import { BottoneIcona } from '@/components/ui/Bottone'
import { classiChip } from '@/components/ui/chipStile'
import { Icona, type NomeIcona } from '@/components/ui/Icona'

/**
 * Guscio dell'app, responsive (§15 + porting CRM 3.0, che era solo desktop).
 *
 *  - telefono: barra in basso a schede, pollice-friendly. In basso e non in
 *    alto perche' l'app si usa in piedi con una mano sola.
 *  - da `lg` in su: barra laterale fissa come il 3.0, cosi' su iPad/desktop
 *    resta visibile tutto insieme senza rubare altezza al contenuto.
 *
 * La posizione della navigazione non cambia mai fra una pagina e l'altra:
 * spostarla e' il modo piu' rapido di far perdere l'orientamento.
 */

type Voce = { to: string; etichetta: string; icona: NomeIcona; end?: boolean }

/** Le cinque voci sempre raggiungibili col pollice (massimo consigliato: 5). */
const PRINCIPALI: Voce[] = [
  { to: '/', etichetta: 'Oggi', icona: 'cruscotto', end: true },
  { to: '/agenda', etichetta: 'Agenda', icona: 'agenda' },
  { to: '/lead', etichetta: 'Lead', icona: 'lead' },
  { to: '/report', etichetta: 'Report', icona: 'report' },
  { to: '/configurazione', etichetta: 'Config', icona: 'configurazione' },
]

/** Il resto: nella barra laterale su schermo largo, a chip su telefono. */
const SECONDARIE: Voce[] = [
  { to: '/aree', etichetta: 'Aree', icona: 'aree' },
  { to: '/importa', etichetta: 'Importa', icona: 'importa' },
]

const TUTTE = [...PRINCIPALI.slice(0, 3), ...SECONDARIE, ...PRINCIPALI.slice(3)]

export function AppShell() {
  return (
    <div className="min-h-svh lg:flex">
      {/* ------------------------------------------------ barra laterale (lg+) */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-bordo bg-superficie lg:flex">
        <div className="border-b border-bordo px-4 py-4">
          <p className="text-titolo font-semibold">AgentPro</p>
          <p className="text-etichetta text-testo-debole">NEXI · Hera Comm</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2" aria-label="Sezioni">
          {TUTTE.map((v) => (
            <NavLink
              key={v.to}
              to={v.to}
              end={v.end}
              className={({ isActive }) =>
                `transizione-colore relative mb-0.5 flex min-h-11 items-center gap-2.5 rounded-card px-3 text-campo ${
                  isActive
                    ? 'bg-info-soft font-medium text-info-soft-text'
                    : 'text-testo-debole hover:bg-superficie-alt hover:text-testo'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Barretta a sinistra: la posizione corrente si legge anche
                      senza distinguere il colore del riempimento. */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-pillola bg-info-soft-text"
                    />
                  )}
                  <Icona nome={v.icona} misura="sm" />
                  {v.etichetta}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-bordo p-2">
          <button
            onClick={() => void esci()}
            className="transizione-colore flex min-h-11 w-full items-center gap-2.5 rounded-card px-3 text-campo text-testo-debole hover:bg-superficie-alt hover:text-testo"
          >
            <Icona nome="esci" misura="sm" />
            Esci
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ------------------------------------------- intestazione (solo mobile) */}
        <header className="z-sticky sticky top-0 flex items-center justify-between border-b border-bordo bg-superficie px-4 py-2 lg:hidden">
          <span className="text-titolo font-semibold">AgentPro</span>
          <BottoneIcona
            nome="esci"
            etichetta="Esci dall'account"
            onClick={() => void esci()}
          />
        </header>

        {/* Su telefono le voci secondarie stanno qui: la barra in basso ne
            tiene cinque, di piu' diventerebbero bersagli troppo stretti. */}
        <nav
          className="scorrevole-x flex gap-1.5 border-b border-bordo bg-superficie px-4 py-2 lg:hidden"
          aria-label="Altre sezioni"
        >
          {SECONDARIE.map((v) => (
            <NavLink
              key={v.to}
              to={v.to}
              className={({ isActive }) => classiChip({ attivo: isActive })}
            >
              <Icona nome={v.icona} misura="sm" />
              {v.etichetta}
            </NavLink>
          ))}
        </nav>

        <main className="spazio-barra flex-1 p-4 lg:pb-4">
          <Outlet />
        </main>
      </div>

      {/* -------------------------------------------- barra inferiore (mobile) */}
      <nav
        className="z-navigazione pb-sicura fixed inset-x-0 bottom-0 flex border-t border-bordo bg-superficie lg:hidden"
        aria-label="Navigazione principale"
      >
        {PRINCIPALI.map((v) => (
          <NavLink
            key={v.to}
            to={v.to}
            end={v.end}
            className={({ isActive }) =>
              `premibile relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-micro ${
                isActive ? 'font-semibold text-info-soft-text' : 'text-testo-debole'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-0.5 w-8 rounded-pillola bg-info-soft-text"
                  />
                )}
                <Icona nome={v.icona} misura="md" />
                {v.etichetta}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
