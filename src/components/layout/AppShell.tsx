import { NavLink, Outlet } from 'react-router-dom'
import { esci } from '@/features/auth/api'

/**
 * Guscio dell'app, responsive (§15 + porting CRM 3.0, che era solo desktop).
 *
 *  - telefono: barra in basso a schede, pollice-friendly. In basso e non in
 *    alto perche' l'app si usa in piedi con una mano sola.
 *  - da `lg` in su: barra laterale fissa come il 3.0, cosi' su iPad/desktop
 *    resta visibile tutto insieme senza rubare altezza al contenuto.
 *
 * `pb-[calc(...)]` sul main tiene il contenuto sopra la barra inferiore,
 * safe-area inclusa: senza, l'ultimo bottone finisce sotto la tab bar.
 */

type Voce = { to: string; etichetta: string; icona: string; end?: boolean }

/** Le cinque voci sempre raggiungibili col pollice. */
const PRINCIPALI: Voce[] = [
  { to: '/', etichetta: 'Oggi', icona: '📊', end: true },
  { to: '/agenda', etichetta: 'Agenda', icona: '📅' },
  { to: '/lead', etichetta: 'Lead', icona: '👥' },
  { to: '/report', etichetta: 'Report', icona: '📈' },
  { to: '/configurazione', etichetta: 'Config', icona: '⚙️' },
]

/** Il resto: nella barra laterale su schermo largo, nel menu "Altro" su telefono. */
const SECONDARIE: Voce[] = [
  { to: '/aree', etichetta: 'Aree', icona: '🗺️' },
  { to: '/importa', etichetta: 'Importa', icona: '⬆️' },
]

const TUTTE = [...PRINCIPALI.slice(0, 3), ...SECONDARIE, ...PRINCIPALI.slice(3)]

export function AppShell() {
  return (
    <div className="min-h-svh lg:flex">
      {/* ------------------------------------------------ barra laterale (lg+) */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-bordo bg-superficie lg:flex">
        <div className="border-b border-bordo px-4 py-4">
          <p className="text-titolo font-semibold">AgentPro</p>
          <p className="text-etichetta text-testo-debole">NEXI · Hera Comm</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {TUTTE.map((v) => (
            <NavLink
              key={v.to}
              to={v.to}
              end={v.end}
              className={({ isActive }) =>
                `mb-0.5 flex min-h-11 items-center gap-2.5 rounded-card px-3 text-campo ${
                  isActive
                    ? 'bg-info-soft font-medium text-info-soft-text'
                    : 'text-testo-debole hover:bg-sfondo'
                }`
              }
            >
              <span aria-hidden>{v.icona}</span>
              {v.etichetta}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-bordo p-2">
          <button
            onClick={() => void esci()}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-card px-3 text-campo text-testo-debole hover:bg-sfondo"
          >
            <span aria-hidden>🚪</span> Esci
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ------------------------------------------- intestazione (solo mobile) */}
        <header className="flex items-center justify-between border-b border-bordo bg-superficie px-4 py-3 lg:hidden">
          <span className="text-titolo font-semibold">AgentPro</span>
          <button onClick={() => void esci()} className="text-etichetta text-testo-debole underline">
            Esci
          </button>
        </header>

        {/* Su telefono le voci secondarie stanno qui: la barra in basso ne
            tiene cinque, di piu' diventerebbero bersagli troppo stretti. */}
        <nav className="flex gap-2 overflow-x-auto border-b border-bordo bg-superficie px-4 py-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECONDARIE.map((v) => (
            <NavLink
              key={v.to}
              to={v.to}
              className={({ isActive }) =>
                `flex-shrink-0 whitespace-nowrap rounded-pillola border px-3 py-1.5 text-etichetta ${
                  isActive
                    ? 'border-info-soft-border bg-info-soft font-medium text-info-soft-text'
                    : 'border-bordo text-testo-debole'
                }`
              }
            >
              <span aria-hidden className="mr-1">
                {v.icona}
              </span>
              {v.etichetta}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-4">
          <Outlet />
        </main>
      </div>

      {/* -------------------------------------------- barra inferiore (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-bordo bg-superficie pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navigazione principale"
      >
        {PRINCIPALI.map((v) => (
          <NavLink
            key={v.to}
            to={v.to}
            end={v.end}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight ${
                isActive ? 'font-semibold text-info-soft-text' : 'text-testo-debole'
              }`
            }
          >
            <span aria-hidden className="text-[18px]">
              {v.icona}
            </span>
            {v.etichetta}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
