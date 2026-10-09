import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import { AppLayout } from '@/components/layout/AppLayout'
import type { RouteHandle } from '@/components/layout/breadcrumbs'
import { getMountPoint } from '@/lib/initial-state'
import DebugOnly from '@/pages/DebugOnly'
import RouteErrorPage from '@/pages/RouteError'

type PageModule = { default: React.ComponentType }

function page(load: () => Promise<PageModule>): Pick<RouteObject, 'lazy'> {
  return { lazy: async () => ({ Component: (await load()).default }) }
}

function handle(value: RouteHandle): RouteHandle {
  return value
}

// Keep the paths in sync with the page routes of the server-side extension
const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/extensions" replace /> },
      {
        path: 'extensions',
        handle: handle({ crumb: 'Extensions' }),
        children: [
          { index: true, ...page(() => import('@/pages/ExtensionList')) },
          {
            path: ':name',
            handle: handle({ crumb: (params) => params.name ?? '' }),
            ...page(() => import('@/pages/ExtensionDetails')),
          },
        ],
      },
      {
        path: 'version-info',
        handle: handle({ crumb: 'Version info' }),
        ...page(() => import('@/pages/VersionInfo')),
      },
      {
        element: <DebugOnly />,
        children: [
          {
            path: 'messages',
            handle: handle({ crumb: 'Messages' }),
            ...page(() => import('@/pages/Messages')),
          },
          {
            path: 'threads',
            handle: handle({ crumb: 'Threads' }),
            ...page(() => import('@/pages/Threads')),
          },
          {
            path: 'tasks',
            handle: handle({ crumb: 'Tasks' }),
            ...page(() => import('@/pages/Tasks')),
          },
        ],
      },
      {
        path: '*',
        handle: handle({ crumb: 'Not found' }),
        ...page(() => import('@/pages/NotFound')),
      },
    ],
  },
]

export const router = createBrowserRouter(routes, {
  basename: getMountPoint() || '/',
})
