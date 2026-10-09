import {
  ChevronRightIcon,
  ListRestartIcon,
  PlugIcon,
  SendIcon,
  UnplugIcon,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { CopyButton } from '@/components/common/CopyButton'
import { JsonEditor } from '@/components/common/JsonEditor'
import { PageHeader } from '@/components/common/PageHeader'
import {
  MESSAGE_PRESETS,
  NOISY_NOTIFICATION_TYPES,
} from '@/components/messages/presets'
import {
  useMessageSocket,
  type ConnectionStatus,
  type MessageEntry,
} from '@/components/messages/use-message-socket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

const PRESET_NAMES = Object.keys(MESSAGE_PRESETS).sort()
const DEFAULT_PRESET = 'SYS-VER'
const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

function formatPreset(name: string): string {
  return JSON.stringify(MESSAGE_PRESETS[name], null, 2)
}

export default function MessagesPage() {
  const socket = useMessageSocket()
  const [message, setMessage] = useState(() => formatPreset(DEFAULT_PRESET))
  const [preset, setPreset] = useState(DEFAULT_PRESET)
  const [shownTypes, setShownTypes] = useState<string[]>([])

  const send = useCallback(() => {
    let body: unknown
    try {
      body = JSON.parse(message)
    } catch {
      toast.error('The message is not valid JSON')
      return
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      toast.error('The message must be a JSON object')
      return
    }
    if (!('type' in body)) {
      toast.error("The message must have a 'type' property")
      return
    }
    socket.send(body as Record<string, unknown>)
  }, [message, socket])

  const hiddenTypes = NOISY_NOTIFICATION_TYPES.filter(
    (type) => !shownTypes.includes(type),
  )
  const notifications = socket.notifications.filter(
    (entry) => !entry.type || !hiddenTypes.includes(entry.type),
  )

  return (
    <>
      <PageHeader
        title="Messages"
        description="Send test messages to the server and watch its responses and notifications."
        actions={<ConnectionBadge status={socket.status} />}
      />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>
              The message body is wrapped in a Flockwave envelope before
              sending.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="message-preset" className="text-muted-foreground">
                Preset
              </Label>
              <NativeSelect
                id="message-preset"
                value={preset}
                onChange={({ target }) => {
                  setPreset(target.value)
                  setMessage(formatPreset(target.value))
                }}
                className="w-44 font-mono text-xs"
              >
                {PRESET_NAMES.map((name) => (
                  <NativeSelectOption key={name} value={name}>
                    {name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <JsonEditor
              value={message}
              onChange={setMessage}
              onSubmit={send}
              minHeight="14rem"
              maxHeight="60vh"
              aria-label="Message to send"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={send} disabled={socket.status !== 'connected'}>
                <SendIcon />
                Send
                <KbdGroup className="ml-1 opacity-70">
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  <Kbd>↵</Kbd>
                </KbdGroup>
              </Button>
              {socket.status === 'disconnected' ? (
                <Button variant="outline" onClick={socket.connect}>
                  <PlugIcon />
                  Connect
                </Button>
              ) : (
                <Button variant="outline" onClick={socket.disconnect}>
                  <UnplugIcon />
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <Tabs defaultValue="responses" className="gap-0">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="responses">
                  Responses
                  <CountBadge count={socket.responses.length} />
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  Notifications
                  <CountBadge count={notifications.length} />
                </TabsTrigger>
              </TabsList>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={socket.clear}>
                  <ListRestartIcon />
                  Clear
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="pt-4">
              <TabsContent value="responses">
                <MessageList
                  entries={socket.responses}
                  label="Response"
                  emptyText="Responses from the server will appear here."
                />
              </TabsContent>
              <TabsContent value="notifications" className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Also show
                  </span>
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    size="sm"
                    value={shownTypes}
                    onValueChange={setShownTypes}
                    aria-label="Frequent notification types to show"
                    className="flex-wrap"
                  >
                    {NOISY_NOTIFICATION_TYPES.map((type) => (
                      <ToggleGroupItem
                        key={type}
                        value={type}
                        className="font-mono text-xs"
                      >
                        {type}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <MessageList
                  entries={notifications}
                  label="Notification"
                  emptyText="Notifications from the server will appear here."
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </>
  )
}

const STATUS_STYLES: Record<
  ConnectionStatus,
  { label: string; className: string; dot: string }
> = {
  connected: {
    label: 'Connected',
    className: 'bg-success/15 text-success dark:bg-success/20',
    dot: 'bg-success',
  },
  connecting: {
    label: 'Connecting…',
    className: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground animate-pulse',
  },
  disconnected: {
    label: 'Disconnected',
    className: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
    dot: 'bg-destructive',
  },
}

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <Badge variant="secondary" className={cn('h-6 px-2.5', style.className)}>
      <span className={cn('size-1.5 rounded-full', style.dot)} />
      {style.label}
    </Badge>
  )
}

function CountBadge({ count }: { count: number }) {
  if (count === 0) {
    return null
  }
  return (
    <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
      {count}
    </span>
  )
}

function MessageList({
  entries,
  label,
  emptyText,
}: {
  entries: MessageEntry[]
  label: string
  emptyText: string
}) {
  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry, position) => (
        <MessageItem
          key={entry.index}
          entry={entry}
          label={label}
          defaultOpen={position === 0}
        />
      ))}
    </ul>
  )
}

function MessageItem({
  entry,
  label,
  defaultOpen,
}: {
  entry: MessageEntry
  label: string
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const text = JSON.stringify(entry.data, null, 2)

  return (
    <li className="rounded-lg border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 pr-1.5">
          <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50">
            <ChevronRightIcon
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform',
                open && 'rotate-90',
              )}
            />
            <span className="text-muted-foreground">
              {label} #{entry.index}
            </span>
            {entry.type && (
              <Badge variant="outline" className="font-mono">
                {entry.type}
              </Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {entry.receivedAt.toLocaleTimeString()}
            </span>
          </CollapsibleTrigger>
          <CopyButton text={text} label="Copy message" />
        </div>
        <CollapsibleContent>
          <pre className="max-h-96 overflow-auto border-t bg-muted/30 px-3 py-2 font-mono text-xs leading-relaxed">
            {text}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}
