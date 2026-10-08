import { HammerIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'

/**
 * Temporary page shown for routes whose content has not been ported to the
 * new web UI yet.
 */
export function PendingPage({
  title,
  description,
}: {
  title: ReactNode
  description?: ReactNode
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState icon={HammerIcon} title="Under construction">
        This page is being rebuilt as part of the new web UI.
      </EmptyState>
    </>
  )
}
