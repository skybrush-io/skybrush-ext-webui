import { RotateCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RefreshButton({
  onClick,
  isRefreshing,
}: {
  onClick: () => void
  isRefreshing: boolean
}) {
  return (
    <Button variant="outline" onClick={onClick} disabled={isRefreshing}>
      <RotateCwIcon className={cn(isRefreshing && 'animate-spin')} />
      Refresh
    </Button>
  )
}
