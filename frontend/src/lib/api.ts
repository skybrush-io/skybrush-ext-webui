/**
 * Thin wrapper around `fetch()` for talking to the web UI extension of the
 * Skybrush server.
 *
 * All paths are relative; they are resolved against the `<base href>` of the
 * page, which points to the mount point of the extension on the server.
 */

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError('Cannot reach the server')
  }

  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`.trim(),
      response.status,
    )
  }

  return response.json()
}

/** Sends a GET request to the given path and returns the parsed JSON body. */
export async function getJSON<T>(path: string): Promise<T> {
  return (await request(path)) as T
}

/**
 * Sends a POST request to one of the action endpoints of the server. These
 * respond with `{ result }` on success and `{ error }` on failure; the latter
 * is turned into an exception.
 */
export async function postAction<T = unknown>(
  path: string,
  body?: unknown,
): Promise<T> {
  const response = (await request(path, {
    method: 'POST',
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }),
  })) as { result?: T; error?: string }

  if (response.error !== undefined) {
    throw new ApiError(response.error || 'Unknown error')
  }

  return response.result as T
}

/** Returns a human-readable message from an error thrown by the API layer. */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
