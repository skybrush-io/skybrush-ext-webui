import { useCallback } from 'react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/lib/api'
import { useSaveConfiguration, useServerState } from '@/lib/queries'

export type ConfigurationFormat = 'json' | 'toml'

export const CONFIGURATION_FORMATS: {
  value: ConfigurationFormat
  label: string
}[] = [
  { value: 'json', label: 'JSON' },
  { value: 'toml', label: 'TOML' },
]

/**
 * Downloads the compact configuration of the server in the given format. The
 * conversion happens on the server; the result is saved via a temporary link
 * so a failed request can be reported instead of navigating away.
 */
async function downloadConfiguration(format: ConfigurationFormat) {
  let response: Response
  try {
    response = await fetch(`config/compact.${format}`)
  } catch {
    throw new ApiError('Cannot reach the server')
  }

  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`.trim(),
      response.status,
    )
  }

  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = `config.${format}`
  link.click()

  // Revoking the URL right away may cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Returns the actions that operate on the configuration of the whole server,
 * shared between the sidebar and the command menu.
 */
export function useConfigurationActions() {
  const { data: state } = useServerState()
  const { mutateAsync, isPending: isSaving } = useSaveConfiguration()

  const exportConfiguration = useCallback(
    async (format: ConfigurationFormat) => {
      try {
        await downloadConfiguration(format)
      } catch (error) {
        toast.error('Failed to export configuration', {
          description: getErrorMessage(error),
        })
      }
    },
    [],
  )

  const saveConfiguration = useCallback(async () => {
    try {
      await mutateAsync()
      toast.success('Configuration saved')
    } catch (error) {
      toast.error('Failed to save configuration', {
        description: getErrorMessage(error),
      })
    }
  }, [mutateAsync])

  return {
    canSave: state?.canSaveConfig ?? false,
    exportConfiguration,
    saveConfiguration,
    isSaving,
  }
}
