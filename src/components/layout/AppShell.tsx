import { NavLink, Outlet } from 'react-router-dom'
import { esci } from '@/features/auth/api'

const voci = [
  { to: '/', etichetta: 'Oggi', end: true },
  { to: '/agenda', etichetta: 'Agenda', end: false },
  { to: '/lead', etichetta: 'Lead', end: false },
  { to: '/importa', etichetta: 'Importa', end: false },
  { to: '/report', etichetta: 'Report', end: false },
  { to: '/configurazione', etichetta: 'Config', end: false },
]

export function AppShell() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b border-bordo bg-superficie px-4 py-3">
        <nav className="flex items-center gap-4">
          <span className="text-titolo font-semibold">AgentPro</span>
          {voci.map((v) => (
            <NavLink
              key={v.to}
              to={v.to}
              end={v.end}
              className={({ isActive }) =>
                isActive
                  ? 'text-campo font-medium text-info-soft-text'
                  : 'text-campo text-testo-debole'
              }
            >
              {v.etichetta}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => void esci()}
          className="text-etichetta text-testo-debole underline"
        >
          Esci
        </button>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
