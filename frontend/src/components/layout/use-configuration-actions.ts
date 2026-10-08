import { useCallback } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/lib/api'
import { useSaveConfiguration, useServerState } from '@/lib/queries'

/** URL from which the compact configuration of the server can be downloaded. */
export const CONFIG_EXPORT_URL = 'config/compact.json'

/**
 * Returns the actions that operate on the configuration of the whole server,
 * shared between the sidebar and the command menu.
 */
export function useConfigurationActions() {
  const { data: state } = useServerState()
  const { mutateAsync, isPending: isSaving } = useSaveConfiguration()

  const exportConfiguration = useCallback(() => {
    window.location.assign(new URL(CONFIG_EXPORT_URL, document.baseURI))
  }, [])

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
