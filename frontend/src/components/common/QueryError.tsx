import { OctagonXIcon, RotateCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api'

import { EmptyState } from './EmptyState'

interface QueryErrorProps {
  error: unknown
  title?: string
  onRetry?: () => void
}

/** Error state shown when the data of a page could not be loaded. */
export function QueryError({
  error,
  title = 'Could not load data from the server',
  onRetry,
}: QueryErrorProps) {
  return (
    <EmptyState icon={OctagonXIcon} title={title}>
      <p className="font-mono text-xs break-all">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RotateCwIcon />
          Try again
        </Button>
      )}
    </EmptyState>
  )
}
