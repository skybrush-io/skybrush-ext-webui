import {
  CircleAlertIcon,
  PackageXIcon,
  PlayIcon,
  PowerOffIcon,
  RotateCwIcon,
  TriangleAlertIcon,
  UndoIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useBlocker, useParams } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge, TagList } from '@/components/common/ExtensionBadges'
import { JsonEditor } from '@/components/common/JsonEditor'
import { QueryError } from '@/components/common/QueryError'
import { UnloadExtensionDialog } from '@/components/extensions/UnloadExtensionDialog'
import {
  useConfigEditor,
  type ConfigEditorState,
} from '@/components/extensions/use-config-editor'
import { useRunExtensionAction } from '@/components/extensions/use-run-extension-action'
import { SchemaForm } from '@/components/schema-form/SchemaForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/lib/api'
import { useExtension, type ExtensionAction } from '@/lib/queries'
import type { ExtensionDetails } from '@/lib/types'

export default function ExtensionDetailsPage() {
  const { name = '' } = useParams()
  const { data: extension, error, isPending, refetch } = useExtension(name)

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState icon={PackageXIcon} title="Extension not found">
          <p className="mb-4">
            The server does not know about an extension named{' '}
            <span className="font-mono text-foreground">{name}</span>.
          </p>
          <Button asChild variant="outline">
            <Link to="/extensions">Back to extensions</Link>
          </Button>
        </EmptyState>
      )
    }
    return <QueryError error={error} onRetry={() => void refetch()} />
  }

  if (isPending) {
    return <DetailsSkeleton />
  }

  // Reset the editor whenever the configuration changes on the server
  return (
    <ExtensionDetailsView
      key={`${name}:${JSON.stringify(extension.config)}`}
      extension={extension}
    />
  )
}

function ExtensionDetailsView({ extension }: { extension: ExtensionDetails }) {
  const editor = useConfigEditor(extension)
  const { run, pending } = useRunExtensionAction()
  const [unloadOpen, setUnloadOpen] = useState(false)
  const [pendingApply, setPendingApply] = useState<ExtensionAction | null>(null)
  const isBusy = pending?.name === extension.name

  const apply = async (action: ExtensionAction) => {
    await run(
      extension.name,
      action,
      action !== 'unload' && editor.isDirty ? editor.value : undefined,
    )
  }

  const requestApply = (action: 'load' | 'reload') => {
    if (editor.jsonError !== null) {
      toast.error('The configuration is not valid JSON', {
        description: editor.jsonError,
      })
    } else if (editor.isDirty && editor.validationErrors.length > 0) {
      setPendingApply(action)
    } else {
      void apply(action)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">
            {extension.name}
          </h1>
          {extension.version && (
            <Badge variant="outline" className="font-mono">
              v{extension.version}
            </Badge>
          )}
          <StatusBadge extension={extension} />
          <TagList tags={extension.tags} />
        </div>
        {extension.description && (
          <p className="max-w-3xl text-muted-foreground">
            {extension.description}
          </p>
        )}
      </header>

      <div className="grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <ConfigurationCard editor={editor} disabled={isBusy} />
        <RelationsCard extension={extension} />
      </div>

      <ActionBar
        extension={extension}
        editor={editor}
        busyAction={isBusy ? pending?.action : undefined}
        onLoad={() => requestApply('load')}
        onReload={() => requestApply('reload')}
        onUnload={() => setUnloadOpen(true)}
      />

      <UnloadExtensionDialog
        name={extension.name}
        open={unloadOpen}
        onOpenChange={setUnloadOpen}
        onConfirm={() => void apply('unload')}
      />
      <ValidationErrorsDialog
        editor={editor}
        action={pendingApply}
        onCancel={() => setPendingApply(null)}
        onConfirm={() => {
          if (pendingApply) {
            void apply(pendingApply)
          }
          setPendingApply(null)
        }}
      />
      <UnsavedChangesGuard isDirty={editor.isDirty} />
    </div>
  )
}

function ConfigurationCard({
  editor,
  disabled,
}: {
  editor: ConfigEditorState
  disabled: boolean
}) {
  const { form } = editor

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>
          Changes take effect when the extension is loaded or reloaded.
        </CardDescription>
        {form && !editor.formUnavailable && (
          <CardAction>
            <Tabs
              value={editor.mode}
              onValueChange={(mode) => {
                if (!editor.setMode(mode as 'form' | 'json')) {
                  toast.error('Fix the JSON syntax errors first')
                }
              }}
            >
              <TabsList>
                <TabsTrigger value="form">Form</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {editor.formUnavailable && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" />
            <p>
              The current configuration does not match the schema of the
              extension closely enough to be shown as a form. You can still edit
              it as JSON.
            </p>
          </div>
        )}
        {form &&
          editor.mode === 'form' &&
          editor.validationErrors.length > 0 && (
            <div className="mb-5 space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
              <p className="flex items-center gap-2 font-medium text-destructive">
                <CircleAlertIcon className="size-4" />
                The configuration does not match the schema of the extension
              </p>
              <ValidationErrorList editor={editor} />
              {!editor.isDirty && (
                <p className="text-xs text-muted-foreground">
                  Some values may not be shown correctly in the form. Switch to
                  the JSON view to see the configuration as it is stored.
                </p>
              )}
            </div>
          )}
        {form && editor.mode === 'form' ? (
          <SchemaForm
            schema={form.schema}
            uiSchema={form.uiSchema}
            value={editor.value}
            onChange={editor.setValue}
            onRenderError={editor.onFormRenderError}
            disabled={disabled}
          />
        ) : (
          <div className="space-y-2">
            <JsonEditor
              value={editor.jsonText}
              onChange={editor.setJsonText}
              minHeight="16rem"
              aria-label="Configuration as JSON"
            />
            {editor.jsonError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <CircleAlertIcon className="size-3.5" />
                {editor.jsonError}
              </p>
            )}
            {!editor.jsonError && editor.validationErrors.length > 0 && (
              <ValidationErrorList editor={editor} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ValidationErrorList({ editor }: { editor: ConfigEditorState }) {
  return (
    <ul className="space-y-0.5 text-xs text-destructive">
      {editor.validationErrors.map((error, index) => (
        <li key={index}>{error.stack}</li>
      ))}
    </ul>
  )
}

function ExtensionLinks({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <span className="text-muted-foreground">None</span>
  }
  return (
    <span className="flex flex-wrap gap-1">
      {names.map((name) => (
        <Badge key={name} variant="outline" asChild>
          <Link
            to={`/extensions/${encodeURIComponent(name)}`}
            className="font-mono"
          >
            {name}
          </Link>
        </Badge>
      ))}
    </span>
  )
}

function RelationsCard({ extension }: { extension: ExtensionDetails }) {
  return (
    <Card size="sm" className="lg:sticky lg:top-20">
      <CardContent>
        <dl className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Depends on
            </dt>
            <dd>
              <ExtensionLinks names={extension.dependencies} />
            </dd>
          </div>
          <div className="space-y-1.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Required by
            </dt>
            <dd>
              <ExtensionLinks names={extension.dependents} />
            </dd>
          </div>
          {extension.restartRequested && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <RotateCwIcon className="mt-0.5 size-3.5 shrink-0" />
              This extension asked for the server to be restarted.
            </p>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}

function ActionBar({
  extension,
  editor,
  busyAction,
  onLoad,
  onReload,
  onUnload,
}: {
  extension: ExtensionDetails
  editor: ConfigEditorState
  busyAction?: ExtensionAction
  onLoad: () => void
  onReload: () => void
  onUnload: () => void
}) {
  const { isDirty, validationErrors, jsonError } = editor
  const busy = busyAction !== undefined
  const icon = (action: ExtensionAction, Icon: typeof PlayIcon) =>
    busyAction === action ? <Spinner /> : <Icon />

  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 -mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t bg-background/85 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/70 md:-mx-6 md:-mb-6 md:px-6">
      <div className="min-w-0 flex-1 text-sm">
        {jsonError ? (
          <span className="flex items-center gap-1.5 text-destructive">
            <CircleAlertIcon className="size-4" />
            Invalid JSON
          </span>
        ) : isDirty ? (
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            Unsaved changes
            {validationErrors.length > 0 && (
              <span className="text-destructive">
                · {validationErrors.length}{' '}
                {validationErrors.length === 1 ? 'problem' : 'problems'}
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">No changes</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {isDirty && (
          <Button variant="ghost" onClick={editor.discard} disabled={busy}>
            <UndoIcon />
            Discard
          </Button>
        )}
        {extension.loaded ? (
          <>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onUnload}
              disabled={busy}
            >
              {icon('unload', PowerOffIcon)}
              Unload
            </Button>
            <Button
              variant={isDirty ? 'default' : 'outline'}
              onClick={onReload}
              disabled={busy}
            >
              {icon('reload', RotateCwIcon)}
              {isDirty ? 'Apply and reload' : 'Reload'}
            </Button>
          </>
        ) : (
          <Button onClick={onLoad} disabled={busy}>
            {icon('load', PlayIcon)}
            {isDirty ? 'Apply and load' : 'Load'}
          </Button>
        )}
      </div>
    </div>
  )
}

function ValidationErrorsDialog({
  editor,
  action,
  onCancel,
  onConfirm,
}: {
  editor: ConfigEditorState
  action: ExtensionAction | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog
      open={action !== null}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Apply a configuration with problems?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                The configuration does not match the schema of the extension.
                The extension may refuse to {action ?? 'load'} with it.
              </p>
              <ValidationErrorList editor={editor} />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Apply anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Asks for confirmation before leaving the page with unsaved changes. */
function UnsavedChangesGuard({ isDirty }: { isDirty: boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!isDirty) {
      return
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  return (
    <AlertDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => !open && blocker.reset?.()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            The configuration of this extension has changes that have not been
            applied yet. They will be lost if you leave this page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay on this page</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => blocker.proceed?.()}
          >
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  )
}
