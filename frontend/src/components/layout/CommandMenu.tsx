import { DownloadIcon, PackageIcon, SaveIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useExtensions, useServerState } from '@/lib/queries'
import { useTheme } from '@/lib/use-theme'

import { getVisibleNavigation } from './navigation'
import { themeOptions } from './theme-options'
import { useConfigurationActions } from './use-configuration-actions'

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Command palette that is opened with Cmd+K or Ctrl+K. */
export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const navigate = useNavigate()
  const { data: state } = useServerState()
  const { data: extensions } = useExtensions({ enabled: open })
  const { setTheme } = useTheme()
  const { canSave, exportConfiguration, saveConfiguration } =
    useConfigurationActions()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  const run = (action: () => unknown) => () => {
    onOpenChange(false)
    void action()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Jump to a page or extension, or run a command"
    >
      <Command>
        <CommandInput placeholder="Search pages, extensions and commands…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {getVisibleNavigation(state?.debug ?? false).map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.path}
                  value={`page ${item.title}`}
                  keywords={[item.description]}
                  onSelect={run(() => navigate(item.path))}
                >
                  <item.icon />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          {extensions && extensions.length > 0 && (
            <CommandGroup heading="Extensions">
              {extensions.map((extension) => (
                <CommandItem
                  key={extension.name}
                  value={`extension ${extension.name}`}
                  keywords={[extension.description, ...extension.tags]}
                  onSelect={run(() =>
                    navigate(
                      `/extensions/${encodeURIComponent(extension.name)}`,
                    ),
                  )}
                >
                  <PackageIcon />
                  <span className="font-mono text-[0.8rem]">
                    {extension.name}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {extension.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Commands">
            <CommandItem onSelect={run(exportConfiguration)}>
              <DownloadIcon />
              Export configuration
            </CommandItem>
            {canSave && (
              <CommandItem onSelect={run(saveConfiguration)}>
                <SaveIcon />
                Save configuration to config file
              </CommandItem>
            )}
            {themeOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={`theme ${option.label}`}
                onSelect={run(() => setTheme(option.value))}
              >
                <option.icon />
                Use {option.label.toLowerCase()} theme
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
