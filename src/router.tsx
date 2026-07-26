import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LeadListPage } from '@/features/lead/LeadListPage'
import { LeadDetailPage } from '@/features/lead/LeadDetailPage'
import { AgendaPage } from '@/features/planning/AgendaPage'
import { ConfigurazionePage } from '@/features/configurazione/ConfigurazionePage'
import { ImportPage } from '@/features/import/ImportPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'lead', element: <LeadListPage /> },
      { path: 'lead/:id', element: <LeadDetailPage /> },
      { path: 'configurazione', element: <ConfigurazionePage /> },
      { path: 'importa', element: <ImportPage /> },
    ],
  },
])
