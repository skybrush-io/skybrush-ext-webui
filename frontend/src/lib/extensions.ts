import type { ExtensionSummary } from './types'

export type ExtensionStatus = 'loaded' | 'unloaded' | 'restart'

export function getExtensionStatus(
  extension: Pick<ExtensionSummary, 'loaded' | 'restartRequested'>,
): ExtensionStatus {
  if (extension.restartRequested) {
    return 'restart'
  }
  return extension.loaded ? 'loaded' : 'unloaded'
}
