import { useCallback } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/lib/api'
import { useExtensionAction, type ExtensionAction } from '@/lib/queries'

const SUCCESS_MESSAGES: Record<ExtensionAction, string> = {
  load: 'loaded',
  unload: 'unloaded',
  reload: 'reloaded',
}

/**
 * Returns a function that loads, unloads or reloads an extension and reports
 * the outcome in a toast notification.
 */
export function useRunExtensionAction() {
  const { mutateAsync, isPending, variables } = useExtensionAction()

  const run = useCallback(
    async (
      name: string,
      action: ExtensionAction,
      config?: unknown,
    ): Promise<boolean> => {
      try {
        await mutateAsync({ name, action, config })
        toast.success(`Extension ${name} ${SUCCESS_MESSAGES[action]}`)
        return true
      } catch (error) {
        toast.error(`Failed to ${action} extension ${name}`, {
          description: getErrorMessage(error),
        })
        return false
      }
    },
    [mutateAsync],
  )

  return {
    run,
    pending: isPending ? variables : undefined,
  }
}
