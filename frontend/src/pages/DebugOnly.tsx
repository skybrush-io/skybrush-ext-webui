import { BugOffIcon } from 'lucide-react'
import { Link, Outlet } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { useServerState } from '@/lib/queries'

/**
 * Route wrapper that renders its child routes only when the `debug`
 * extension of the server is loaded.
 */
export default function DebugOnly() {
  const { data: state } = useServerState()

  if (state === undefined || state.debug) {
    return <Outlet />
  }

  return (
    <EmptyState icon={BugOffIcon} title="Debugging tools are not available">
      Load the{' '}
      <Link className="font-mono underline" to="/extensions/debug">
        debug
      </Link>{' '}
      extension to use this page.
    </EmptyState>
  )
}
