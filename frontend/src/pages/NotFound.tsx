import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <EmptyState icon={CompassIcon} title="Page not found">
      <p className="mb-4">The page you are looking for does not exist.</p>
      <Button asChild variant="outline">
        <Link to="/extensions">Go to extensions</Link>
      </Button>
    </EmptyState>
  )
}
