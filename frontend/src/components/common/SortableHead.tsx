import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import type { SortState } from '@/lib/sorting'
import { cn } from '@/lib/utils'

export function SortableHead<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = !active
    ? ArrowUpDownIcon
    : sort.direction === 'asc'
      ? ArrowUpIcon
      : ArrowDownIcon

  return (
    <TableHead
      className={className}
      aria-sort={
        active
          ? sort.direction === 'asc'
            ? 'ascending'
            : 'descending'
          : undefined
      }
    >
      <button
        type="button"
        className="-ml-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon
          className={cn('size-3.5', active ? 'opacity-100' : 'opacity-40')}
        />
      </button>
    </TableHead>
  )
}
