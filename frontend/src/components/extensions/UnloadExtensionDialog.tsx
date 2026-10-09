import { Link } from 'react-router'

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
import { useExtension, useExtensions } from '@/lib/queries'

interface UnloadExtensionDialogProps {
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Asks for confirmation before unloading an extension. Unloading an extension
 * also unloads the extensions that depend on it; these are listed here.
 */
export function UnloadExtensionDialog({
  name,
  open,
  onOpenChange,
  onConfirm,
}: UnloadExtensionDialogProps) {
  const { data: details } = useExtension(name, { enabled: open })
  const { data: extensions } = useExtensions({ enabled: open })

  const loaded = new Set(
    extensions?.filter((ext) => ext.loaded).map((ext) => ext.name),
  )
  const affected = (details?.dependents ?? []).filter((dep) => loaded.has(dep))

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Unload <span className="font-mono">{name}</span>?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                The extension stops running until it is loaded again. Its
                configuration is kept.
              </p>
              {affected.length > 0 && (
                <p>
                  These extensions depend on it and will also be unloaded:{' '}
                  {affected.map((dep, index) => (
                    <span key={dep}>
                      {index > 0 && ', '}
                      <Link
                        to={`/extensions/${encodeURIComponent(dep)}`}
                        className="font-mono text-foreground underline underline-offset-2"
                        onClick={() => onOpenChange(false)}
                      >
                        {dep}
                      </Link>
                    </span>
                  ))}
                  .
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Unload
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
