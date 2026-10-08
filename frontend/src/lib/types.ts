/** Global state of the server that is relevant for every page. */
export interface ServerState {
  canSaveConfig: boolean
  debug: boolean
  restartRequested: boolean
}

/** Summary of an extension, as shown in the list of extensions. */
export interface ExtensionSummary {
  name: string
  description: string
  loaded: boolean
  tags: string[]
  restartRequested: boolean
  version: string | null
}

/** Details of a single extension, including its configuration. */
export interface ExtensionDetails extends ExtensionSummary {
  dependencies: string[]
  dependents: string[]
  config: unknown
  schema: Record<string, unknown> | null
}

export interface Distribution {
  name: string
  version: string | null
  summary: string
}

export interface ThreadInfo {
  ident: number | null
  name: string
  daemon: boolean
}

export interface TaskInfo {
  level: number
  name: string
}
