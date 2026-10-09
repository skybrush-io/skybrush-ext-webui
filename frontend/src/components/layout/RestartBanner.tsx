import { TriangleAlertIcon } from 'lucide-react'

import { useServerState } from '@/lib/queries'

export function RestartBanner() {
  const { data: state } = useServerState()
  if (!state?.restartRequested) {
    return null
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 border-b border-warning/40 bg-warning/15 px-4 py-2.5 text-sm md:px-6"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" />
      <p>
        <span className="font-medium">Restart required.</span>{' '}
        <span className="text-muted-foreground">
          Some of the changes you made take effect only after the server is
          restarted.
        </span>
      </p>
    </div>
  )
}
