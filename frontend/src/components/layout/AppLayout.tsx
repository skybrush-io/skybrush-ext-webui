import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { useBreadcrumbs } from './breadcrumbs'
import { CommandMenu } from './CommandMenu'
import { RestartBanner } from './RestartBanner'

// The sidebar component stores its state in this cookie
function isSidebarOpenByDefault(): boolean {
  return !document.cookie.split('; ').includes('sidebar_state=false')
}

export function AppLayout() {
  const crumbs = useBreadcrumbs()
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const openCommandMenu = useCallback(() => setCommandMenuOpen(true), [])

  const title = crumbs.at(-1)?.label
  useEffect(() => {
    document.title = title ? `${title} — Skybrush Server` : 'Skybrush Server'
  }, [title])

  return (
    <SidebarProvider defaultOpen={isSidebarOpenByDefault()}>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppHeader crumbs={crumbs} onOpenCommandMenu={openCommandMenu} />
        <RestartBanner />
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
      <CommandMenu open={commandMenuOpen} onOpenChange={setCommandMenuOpen} />
    </SidebarProvider>
  )
}
