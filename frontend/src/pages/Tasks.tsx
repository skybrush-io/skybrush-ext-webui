import {
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  SearchXIcon,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryError } from '@/components/common/QueryError'
import { RefreshButton } from '@/components/common/RefreshButton'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTasks } from '@/lib/queries'
import type { TaskInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskNode {
  id: string
  name: string
  children: TaskNode[]
}

/** Builds a tree from the depth-first list of tasks with nesting levels. */
function buildTree(tasks: TaskInfo[]): TaskNode[] {
  const roots: TaskNode[] = []
  const stack: TaskNode[] = []

  tasks.forEach((task, index) => {
    const node: TaskNode = { id: String(index), name: task.name, children: [] }
    stack.length = Math.min(stack.length, task.level)
    const parent = stack.at(-1)
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
    stack.push(node)
  })

  return roots
}

/**
 * Keeps only the nodes that match the query and their ancestors. Returns the
 * IDs of the ancestors so they can be expanded.
 */
function filterTree(
  nodes: TaskNode[],
  needle: string,
  ancestors: Set<string>,
): TaskNode[] {
  const result: TaskNode[] = []
  for (const node of nodes) {
    const children = filterTree(node.children, needle, ancestors)
    if (children.length > 0) {
      ancestors.add(node.id)
    }
    if (children.length > 0 || node.name.toLowerCase().includes(needle)) {
      result.push({ ...node, children })
    }
  }
  return result
}

function collectIds(nodes: TaskNode[], into: Set<string> = new Set()) {
  for (const node of nodes) {
    if (node.children.length > 0) {
      into.add(node.id)
      collectIds(node.children, into)
    }
  }
  return into
}

function highlight(text: string, needle: string): ReactNode {
  const index = needle ? text.toLowerCase().indexOf(needle) : -1
  if (index < 0) {
    return text
  }
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-warning/40 text-inherit">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  )
}

export default function TasksPage() {
  const { data, error, isPending, isFetching, refetch } = useTasks()
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const tree = useMemo(() => buildTree(data ?? []), [data])
  const needle = query.trim().toLowerCase()
  const { visible, forcedOpen } = useMemo(() => {
    if (!needle) {
      return { visible: tree, forcedOpen: new Set<string>() }
    }
    const ancestors = new Set<string>()
    return {
      visible: filterTree(tree, needle, ancestors),
      forcedOpen: ancestors,
    }
  }, [tree, needle])

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const isOpen = (id: string) => forcedOpen.has(id) || !collapsed.has(id)

  const renderNodes = (nodes: TaskNode[], depth: number): ReactNode =>
    nodes.map((node) => {
      const hasChildren = node.children.length > 0
      const open = isOpen(node.id)
      return (
        <li
          key={node.id}
          role="treeitem"
          aria-expanded={hasChildren ? open : undefined}
        >
          <div
            className="flex items-center gap-1 rounded-md py-0.5 pr-2 hover:bg-muted/60"
            style={{ paddingLeft: `${depth * 1.25 + 0.25}rem` }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label={open ? 'Collapse' : 'Expand'}
                onClick={() => toggle(node.id)}
              >
                <ChevronRightIcon
                  className={cn(
                    'size-4 transition-transform',
                    open && 'rotate-90',
                  )}
                />
              </button>
            ) : (
              <span className="size-5 shrink-0" />
            )}
            <span className="truncate font-mono text-[0.8125rem]">
              {highlight(node.name, needle)}
            </span>
            {hasChildren && (
              <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                {node.children.length}
              </span>
            )}
          </div>
          {hasChildren && open && (
            <ul role="group">{renderNodes(node.children, depth + 1)}</ul>
          )}
        </li>
      )
    })

  return (
    <>
      <PageHeader
        title="Tasks"
        description={
          data
            ? `${data.length} Trio tasks are active in the server.`
            : 'Trio tasks currently active in the server.'
        }
        actions={
          <RefreshButton
            onClick={() => void refetch()}
            isRefreshing={isFetching}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search tasks…"
        />
        <Button variant="outline" onClick={() => setCollapsed(new Set())}>
          <ChevronsUpDownIcon />
          Expand all
        </Button>
        <Button
          variant="outline"
          onClick={() => setCollapsed(collectIds(tree))}
        >
          <ChevronsDownUpIcon />
          Collapse all
        </Button>
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchXIcon} title="No tasks found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border p-2">
          <ul role="tree" aria-label="Tasks">
            {renderNodes(visible, 0)}
          </ul>
        </div>
      )}
    </>
  )
}
