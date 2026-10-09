import { OctagonXIcon } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api'

export default function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : getErrorMessage(error)

  return (
    <div className="p-4 md:p-6">
      <EmptyState icon={OctagonXIcon} title="Something went wrong">
        <p className="mb-4 font-mono text-xs break-all">{message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </EmptyState>
    </div>
  )
}
