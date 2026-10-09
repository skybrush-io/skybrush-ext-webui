import { SearchXIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryError } from '@/components/common/QueryError'
import { SearchInput } from '@/components/common/SearchInput'
import { SortableHead } from '@/components/common/SortableHead'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useVersionInfo } from '@/lib/queries'
import { sortBy, useSort } from '@/lib/sorting'

type SortKey = 'name' | 'version'

export default function VersionInfoPage() {
  const { data, error, isPending, refetch } = useVersionInfo()
  const [query, setQuery] = useState('')
  const { sort, toggle } = useSort<SortKey>('name')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = (data ?? []).filter(
      (dist) =>
        !needle ||
        dist.name.toLowerCase().includes(needle) ||
        dist.summary.toLowerCase().includes(needle),
    )
    return sortBy(filtered, sort, (dist, key) => dist[key])
  }, [data, query, sort])

  return (
    <>
      <PageHeader
        title="Version info"
        description={
          data
            ? `${data.length} Python packages are installed alongside the server.`
            : 'Python packages installed alongside the server.'
        }
      />

      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search packages…"
        />
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchXIcon} title="No packages found">
          No installed package matches “{query}”.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <SortableHead
                  label="Package"
                  sortKey="name"
                  sort={sort}
                  onSort={toggle}
                  className="pl-4"
                />
                <SortableHead
                  label="Version"
                  sortKey="version"
                  sort={sort}
                  onSort={toggle}
                />
                <TableHead className="hidden md:table-cell">
                  Description
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((dist) => (
                <TableRow key={dist.name}>
                  <TableCell className="pl-4 align-top font-mono text-[0.8125rem] font-medium">
                    {dist.name}
                  </TableCell>
                  <TableCell className="align-top font-mono text-xs tabular-nums">
                    {dist.version}
                  </TableCell>
                  <TableCell className="hidden whitespace-normal text-muted-foreground md:table-cell">
                    {dist.summary}
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
