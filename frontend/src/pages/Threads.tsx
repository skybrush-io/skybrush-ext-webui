import { SearchXIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryError } from '@/components/common/QueryError'
import { RefreshButton } from '@/components/common/RefreshButton'
import { SearchInput } from '@/components/common/SearchInput'
import { SortableHead } from '@/components/common/SortableHead'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useThreads } from '@/lib/queries'
import { sortBy, useSort } from '@/lib/sorting'

type SortKey = 'ident' | 'name' | 'daemon'

export default function ThreadsPage() {
  const { data, error, isPending, isFetching, refetch } = useThreads()
  const [query, setQuery] = useState('')
  const { sort, toggle } = useSort<SortKey>('name')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = (data ?? []).filter(
      (thread) => !needle || thread.name.toLowerCase().includes(needle),
    )
    return sortBy(filtered, sort, (thread, key) =>
      key === 'daemon' ? String(thread.daemon) : thread[key],
    )
  }, [data, query, sort])

  return (
    <>
      <PageHeader
        title="Threads"
        description={
          data
            ? `${data.length} threads are running in the server process.`
            : 'Threads running in the server process.'
        }
        actions={
          <RefreshButton
            onClick={() => void refetch()}
            isRefreshing={isFetching}
          />
        }
      />

      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search threads…"
        />
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchXIcon} title="No threads found" />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <SortableHead
                  label="Name"
                  sortKey="name"
                  sort={sort}
                  onSort={toggle}
                  className="pl-4"
                />
                <SortableHead
                  label="Identifier"
                  sortKey="ident"
                  sort={sort}
                  onSort={toggle}
                />
                <SortableHead
                  label="Type"
                  sortKey="daemon"
                  sort={sort}
                  onSort={toggle}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((thread) => (
                <TableRow key={`${thread.ident}-${thread.name}`}>
                  <TableCell className="pl-4 font-mono text-[0.8125rem]">
                    {thread.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                    {thread.ident}
                  </TableCell>
                  <TableCell>
                    <Badge variant={thread.daemon ? 'secondary' : 'outline'}>
                      {thread.daemon ? 'Daemon' : 'Regular'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
