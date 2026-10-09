import { CircleCheckIcon, CircleDashedIcon, RotateCwIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { getExtensionStatus } from '@/lib/extensions'
import type { ExtensionSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

const TAG_STYLES: Record<string, string> = {
  system: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  experimental:
    'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning',
  'restart requested':
    'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning',
  pro: 'bg-primary/10 text-primary dark:bg-primary/20',
  indoor: 'bg-success/15 text-success dark:bg-success/20',
}

export function TagBadge({ tag }: { tag: string }) {
  return (
    <Badge variant="secondary" className={cn('font-normal', TAG_STYLES[tag])}>
      {tag}
    </Badge>
  )
}

export function TagList({
  tags,
  className,
}: {
  tags: string[]
  className?: string
}) {
  if (tags.length === 0) {
    return null
  }

  return (
    <span className={cn('inline-flex flex-wrap gap-1', className)}>
      {tags.map((tag) => (
        <TagBadge key={tag} tag={tag} />
      ))}
    </span>
  )
}

const STATUS = {
  loaded: {
    label: 'Loaded',
    icon: CircleCheckIcon,
    className: 'bg-success/15 text-success dark:bg-success/20',
  },
  unloaded: {
    label: 'Not loaded',
    icon: CircleDashedIcon,
    className: 'bg-muted text-muted-foreground',
  },
  restart: {
    label: 'Restart pending',
    icon: RotateCwIcon,
    className:
      'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning',
  },
} as const

export function StatusBadge({
  extension,
}: {
  extension: Pick<ExtensionSummary, 'loaded' | 'restartRequested'>
}) {
  const status = STATUS[getExtensionStatus(extension)]
  return (
    <Badge variant="secondary" className={status.className}>
      <status.icon />
      {status.label}
    </Badge>
  )
}
