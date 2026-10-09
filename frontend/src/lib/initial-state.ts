import type { ServerState } from './types'

/**
 * Returns the server state embedded in the HTML page by the server, if any.
 * The page served by the Vite development server does not contain it; the
 * state is then fetched from the API instead.
 */
export function readInitialState(): ServerState | undefined {
  const element = document.getElementById('sb-initial-state')
  if (!element?.textContent) {
    return undefined
  }

  try {
    return JSON.parse(element.textContent) as ServerState
  } catch {
    return undefined
  }
}

/**
 * Returns the path where the web UI is mounted on the server, without a
 * trailing slash, derived from the `<base href>` of the page.
 */
export function getMountPoint(): string {
  return new URL(document.baseURI).pathname.replace(/\/+$/, '')
}
