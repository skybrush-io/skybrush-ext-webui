import { useMatches, type Params, type UIMatch } from 'react-router'

/** Extra information attached to routes via their `handle` property. */
export interface RouteHandle {
  crumb?: string | ((params: Params) => string)
}

export interface Crumb {
  label: string
  to: string
}

/** Returns the breadcrumbs of the current page, outermost first. */
export function useBreadcrumbs(): Crumb[] {
  const matches = useMatches() as UIMatch<unknown, RouteHandle | undefined>[]
  const crumbs: Crumb[] = []

  for (const match of matches) {
    const crumb = match.handle?.crumb
    if (crumb === undefined) {
      continue
    }

    const label = typeof crumb === 'function' ? crumb(match.params) : crumb
    if (crumbs.at(-1)?.to !== match.pathname) {
      crumbs.push({ label, to: match.pathname })
    }
  }

  return crumbs
}
