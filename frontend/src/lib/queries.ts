import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { getJSON, postAction } from './api'
import { readInitialState } from './initial-state'
import type {
  Distribution,
  ExtensionDetails,
  ExtensionSummary,
  ServerState,
  TaskInfo,
  ThreadInfo,
} from './types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 5_000,
    },
  },
})

export const queryKeys = {
  state: ['state'] as const,
  extensions: ['extensions'] as const,
  extension: (name: string) => ['extensions', name] as const,
  versionInfo: ['version-info'] as const,
  threads: ['threads'] as const,
  tasks: ['tasks'] as const,
}

const initialState = readInitialState()
const initialStateUpdatedAt = Date.now()

/** Returns the global state of the server. */
export function useServerState() {
  return useQuery({
    queryKey: queryKeys.state,
    queryFn: () => getJSON<ServerState>('api/state'),
    initialData: initialState,
    initialDataUpdatedAt: initialState ? initialStateUpdatedAt : undefined,
  })
}

/** Returns the list of extensions known to the server. */
export function useExtensions({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.extensions,
    queryFn: async () =>
      (await getJSON<{ extensions: ExtensionSummary[] }>('api/extensions'))
        .extensions,
    enabled,
  })
}

/** Saves the current configuration of the server into its config file. */
export function useSaveConfiguration() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const saved = await postAction<boolean>('config/save')
      if (!saved) {
        throw new Error('The server cannot save its configuration.')
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.state }),
  })
}

/** Returns the details and the configuration of a single extension. */
export function useExtension(
  name: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    enabled,
    queryKey: queryKeys.extension(name),
    queryFn: () =>
      getJSON<ExtensionDetails>(`api/extensions/${encodeURIComponent(name)}`),
    // The configuration is edited locally; refetching it while the user is
    // editing would be confusing
    refetchOnWindowFocus: false,
  })
}

export type ExtensionAction = 'load' | 'unload' | 'reload'

/**
 * Loads, unloads or reloads an extension. When a configuration is given, the
 * extension is reconfigured before it is loaded or reloaded.
 */
export function useExtensionAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      name,
      action,
      config,
    }: {
      name: string
      action: ExtensionAction
      config?: unknown
    }) =>
      postAction(
        `extensions/${encodeURIComponent(name)}/${action}`,
        config === undefined ? undefined : { config },
      ),
    // Loading or unloading an extension may affect other extensions (its
    // dependencies or dependents) and the global state of the server too
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.extensions }),
        client.invalidateQueries({ queryKey: queryKeys.state }),
      ]),
  })
}

/** Returns the Python packages installed on the server. */
export function useVersionInfo() {
  return useQuery({
    queryKey: queryKeys.versionInfo,
    queryFn: async () =>
      (await getJSON<{ distributions: Distribution[] }>('api/version-info'))
        .distributions,
    staleTime: Infinity,
  })
}

/** Returns the threads running in the server process. */
export function useThreads() {
  return useQuery({
    queryKey: queryKeys.threads,
    queryFn: async () =>
      (await getJSON<{ threads: ThreadInfo[] }>('api/threads')).threads,
  })
}

/** Returns the Trio tasks running in the server. */
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () =>
      (await getJSON<{ tasks: TaskInfo[] }>('api/tasks')).tasks,
  })
}
