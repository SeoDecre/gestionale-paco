import { Pillola } from '@/components/ui/Pillola'

/**
 * Segnaposto milestone 1. La dashboard vera (§3) arriva alla milestone 3,
 * quando esistono appuntamenti e lavorazioni da mostrare.
 */
export function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-testo-debole">
        Accesso eseguito. La dashboard (§3) arriva alla milestone 3.
      </p>
      <div className="flex flex-wrap gap-2">
        <Pillola tinta="info">NEXI</Pillola>
        <Pillola tinta="successo">Hera Comm</Pillola>
        <Pillola tinta="avviso">Target A</Pillola>
        <Pillola tinta="pericolo">SumUp</Pillola>
        <Pillola tinta="neutro">Self gen</Pillola>
      </div>
    </div>
  )
}
