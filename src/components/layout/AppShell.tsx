import { Outlet } from 'react-router-dom'
import { esci } from '@/features/auth/api'

export function AppShell() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b border-bordo bg-superficie px-4 py-3">
        <span className="text-titolo font-semibold">AgentPro</span>
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
