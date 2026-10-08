import {
  EllipsisIcon,
  PackageSearchIcon,
  PlayIcon,
  PowerOffIcon,
  RotateCwIcon,
  SettingsIcon,
  TagIcon,
} from 'lucide-react'
import { useMemo, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge, TagList } from '@/components/common/ExtensionBadges'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryError } from '@/components/common/QueryError'
import { SearchInput } from '@/components/common/SearchInput'
import { UnloadExtensionDialog } from '@/components/extensions/UnloadExtensionDialog'
import { useRunExtensionAction } from '@/components/extensions/use-run-extension-action'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getExtensionStatus, type ExtensionStatus } from '@/lib/extensions'
import { useExtensions } from '@/lib/queries'
import type { ExtensionSummary } from '@/lib/types'

type StatusFilter = 'all' | ExtensionStatus

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'loaded', label: 'Loaded' },
  { value: 'unloaded', label: 'Not loaded' },
  { value: 'restart', label: 'Restart pending' },
]

function isStatusFilter(value: string | null): value is StatusFilter {
  return STATUS_FILTERS.some((filter) => filter.value === value)
}

function matchesQuery(extension: ExtensionSummary, query: string): boolean {
  const needle = query.trim().toLowerCase()
  return (
    !needle ||
    extension.name.toLowerCase().includes(needle) ||
    extension.description.toLowerCase().includes(needle) ||
    extension.tags.some((tag) => tag.toLowerCase().includes(needle))
  )
}

/** Filter state of the page, stored in the query string of the URL. */
function useFilters() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status')

  const update = (key: string, value: string | string[] | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(key)
        for (const item of Array.isArray(value) ? value : [value]) {
          if (item) {
            next.append(key, item)
          }
        }
        return next
      },
      { replace: true },
    )

  return {
    query: params.get('q') ?? '',
    status: isStatusFilter(status) ? status : 'all',
    tags: params.getAll('tag'),
    setQuery: (value: string) => update('q', value),
    setStatus: (value: StatusFilter) =>
      update('status', value === 'all' ? null : value),
    setTags: (value: string[]) => update('tag', value),
    clear: () => setParams(new URLSearchParams(), { replace: true }),
  }
}

export default function ExtensionListPage() {
  const { data: extensions, error, isPending, refetch } = useExtensions()
  const filters = useFilters()

  const allTags = useMemo(
    () => [...new Set(extensions?.flatMap((ext) => ext.tags))].sort(),
    [extensions],
  )

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: 0,
      loaded: 0,
      unloaded: 0,
      restart: 0,
    }
    for (const extension of extensions ?? []) {
      result.all++
      result[getExtensionStatus(extension)]++
    }
    return result
  }, [extensions])

  const visible = useMemo(
    () =>
      (extensions ?? [])
        .filter((ext) => matchesQuery(ext, filters.query))
        .filter(
          (ext) =>
            filters.status === 'all' ||
            getExtensionStatus(ext) === filters.status,
        )
        .filter((ext) => filters.tags.every((tag) => ext.tags.includes(tag)))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [extensions, filters.query, filters.status, filters.tags],
  )

  const isFiltered =
    filters.query !== '' || filters.status !== 'all' || filters.tags.length > 0

  return (
    <>
      <PageHeader
        title="Extensions"
        description={
          extensions
            ? `${counts.all} extensions, ${extensions.filter((ext) => ext.loaded).length} loaded`
            : 'Load, unload and configure the extensions of the server.'
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.query}
          onChange={filters.setQuery}
          placeholder="Search extensions…"
        />
        <ToggleGroup
          type="single"
          variant="outline"
          value={filters.status}
          onValueChange={(value) =>
            filters.setStatus(isStatusFilter(value) ? value : 'all')
          }
          aria-label="Filter by status"
          className="flex-wrap"
        >
          {STATUS_FILTERS.map((filter) => (
            <ToggleGroupItem
              key={filter.value}
              value={filter.value}
              className="gap-1.5 px-2.5"
            >
              {filter.label}
              {extensions && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {counts[filter.value]}
                </span>
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {allTags.length > 0 && (
          <TagFilter
            tags={allTags}
            selected={filters.tags}
            onChange={filters.setTags}
          />
        )}
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <TableSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState icon={PackageSearchIcon} title="No extensions found">
          {isFiltered && (
            <>
              <p className="mb-4">No extensions match the current filters.</p>
              <Button variant="outline" onClick={filters.clear}>
                Clear filters
              </Button>
            </>
          )}
        </EmptyState>
      ) : (
        <ExtensionTable extensions={visible} />
      )}
    </>
  )
}

function TagFilter({
  tags,
  selected,
  onChange,
}: {
  tags: string[]
  selected: string[]
  onChange: (tags: string[]) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <TagIcon />
          Tags
          {selected.length > 0 && (
            <Badge className="ml-0.5 h-4 min-w-4 px-1 tabular-nums">
              {selected.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Show extensions tagged with</DropdownMenuLabel>
        {tags.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag}
            checked={selected.includes(tag)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...selected, tag]
                  : selected.filter((item) => item !== tag),
              )
            }
          >
            {tag}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])}>
              Clear tag filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ExtensionTable({ extensions }: { extensions: ExtensionSummary[] }) {
  const navigate = useNavigate()
  const showVersion = extensions.some((extension) => extension.version)
  const { run, pending } = useRunExtensionAction()
  const [unloadTarget, setUnloadTarget] = useState<string | null>(null)

  const openOnClick = (name: string) => (event: MouseEvent) => {
    // Let links, buttons and menus inside the row handle their own clicks
    if ((event.target as HTMLElement).closest('a, button, [role=menu]')) {
      return
    }
    navigate(`/extensions/${encodeURIComponent(name)}`)
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-4">Name</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            {showVersion && (
              <TableHead className="hidden sm:table-cell">Version</TableHead>
            )}
            <TableHead>Status</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {extensions.map((extension) => {
            const isBusy = pending?.name === extension.name
            return (
              <TableRow
                key={extension.name}
                className="cursor-pointer"
                onClick={openOnClick(extension.name)}
              >
                <TableCell className="py-2.5 pl-4 align-top">
                  <Link
                    to={`/extensions/${encodeURIComponent(extension.name)}`}
                    className="font-mono text-[0.8125rem] font-medium hover:underline"
                  >
                    {extension.name}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-xs whitespace-normal text-muted-foreground md:hidden">
                    {extension.description}
                  </p>
                </TableCell>
                <TableCell className="hidden py-2.5 whitespace-normal md:table-cell">
                  <span className="text-muted-foreground">
                    {extension.description}
                  </span>
                  <TagList
                    tags={extension.tags}
                    className="ml-2 align-middle"
                  />
                </TableCell>
                {showVersion && (
                  <TableCell className="hidden py-2.5 align-top font-mono text-xs text-muted-foreground tabular-nums sm:table-cell">
                    {extension.version}
                  </TableCell>
                )}
                <TableCell className="py-2.5 align-top">
                  {isBusy ? (
                    <Badge variant="secondary">
                      <Spinner />
                      Working…
                    </Badge>
                  ) : (
                    <StatusBadge extension={extension} />
                  )}
                </TableCell>
                <TableCell className="py-1.5 pr-2 align-top">
                  <ExtensionActionsMenu
                    extension={extension}
                    disabled={isBusy}
                    onConfigure={() =>
                      navigate(
                        `/extensions/${encodeURIComponent(extension.name)}`,
                      )
                    }
                    onLoad={() => void run(extension.name, 'load')}
                    onReload={() => void run(extension.name, 'reload')}
                    onUnload={() => setUnloadTarget(extension.name)}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {unloadTarget && (
        <UnloadExtensionDialog
          name={unloadTarget}
          open
          onOpenChange={(open) => !open && setUnloadTarget(null)}
          onConfirm={() => void run(unloadTarget, 'unload')}
        />
      )}
    </div>
  )
}

function ExtensionActionsMenu({
  extension,
  disabled,
  onConfigure,
  onLoad,
  onReload,
  onUnload,
}: {
  extension: ExtensionSummary
  disabled: boolean
  onConfigure: () => void
  onLoad: () => void
  onReload: () => void
  onUnload: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Actions for ${extension.name}`}
        >
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onConfigure}>
          <SettingsIcon />
          Configure
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {extension.loaded ? (
          <>
            <DropdownMenuItem onSelect={onReload}>
              <RotateCwIcon />
              Reload
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onUnload}>
              <PowerOffIcon />
              Unload…
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={onLoad}>
            <PlayIcon />
            Load
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border p-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-4 flex-1 md:block" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}
