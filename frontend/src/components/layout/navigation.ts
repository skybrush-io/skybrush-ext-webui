import {
  CpuIcon,
  InfoIcon,
  ListTreeIcon,
  MessageSquareIcon,
  PackageIcon,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  path: string
  title: string
  description: string
  icon: LucideIcon
}

export interface NavigationGroup {
  title: string
  debugOnly?: boolean
  items: NavigationItem[]
}

export const navigation: NavigationGroup[] = [
  {
    title: 'Server',
    items: [
      {
        path: '/extensions',
        title: 'Extensions',
        description: 'Load, unload and configure server extensions',
        icon: PackageIcon,
      },
      {
        path: '/version-info',
        title: 'Version info',
        description: 'Installed Python packages and their versions',
        icon: InfoIcon,
      },
    ],
  },
  {
    title: 'Debug',
    debugOnly: true,
    items: [
      {
        path: '/messages',
        title: 'Messages',
        description: 'Send test messages to the server',
        icon: MessageSquareIcon,
      },
      {
        path: '/threads',
        title: 'Threads',
        description: 'Running threads of the server process',
        icon: CpuIcon,
      },
      {
        path: '/tasks',
        title: 'Tasks',
        description: 'Active Trio tasks of the server',
        icon: ListTreeIcon,
      },
    ],
  },
]

/** Returns the navigation groups that are visible in the current state. */
export function getVisibleNavigation(debug: boolean): NavigationGroup[] {
  return navigation.filter((group) => debug || !group.debugOnly)
}
