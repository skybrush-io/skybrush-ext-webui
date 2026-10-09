import { DownloadIcon, DroneIcon, LoaderIcon, SaveIcon } from 'lucide-react'
import { Link, useMatch } from 'react-router'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useServerState } from '@/lib/queries'

import { getVisibleNavigation, type NavigationItem } from './navigation'
import {
  CONFIG_EXPORT_URL,
  useConfigurationActions,
} from './use-configuration-actions'

export function AppSidebar() {
  const { data: state } = useServerState()
  const { isMobile, setOpenMobile } = useSidebar()
  const closeOnMobile = () => isMobile && setOpenMobile(false)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" onClick={closeOnMobile}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <DroneIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Skybrush Server
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Configuration
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {getVisibleNavigation(state?.debug ?? false).map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavigationMenuItem
                    key={item.path}
                    item={item}
                    onClick={closeOnMobile}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <ConfigurationMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function NavigationMenuItem({
  item,
  onClick,
}: {
  item: NavigationItem
  onClick: () => void
}) {
  const isActive = useMatch({ path: item.path, end: false }) !== null

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link
          to={item.path}
          aria-current={isActive ? 'page' : undefined}
          onClick={onClick}
        >
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function ConfigurationMenu() {
  const { canSave, saveConfiguration, isSaving } = useConfigurationActions()

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupLabel>Configuration</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Export configuration">
            <a href={CONFIG_EXPORT_URL} download="config.json">
              <DownloadIcon />
              <span>Export</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {canSave && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Save configuration"
              disabled={isSaving}
              onClick={saveConfiguration}
            >
              {isSaving ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}
              <span>{isSaving ? 'Saving…' : 'Save to config file'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
