import { json, jsonParseLinter } from '@codemirror/lang-json'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { linter, lintGutter } from '@codemirror/lint'
import { Prec } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useMemo, useRef } from 'react'

import { cn } from '@/lib/utils'

// Colors are taken from the CSS variables of the application theme so the
// editor follows the light and dark modes automatically
const theme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    fontSize: '0.8125rem',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': { fontFamily: 'var(--font-mono)', padding: '0.5rem 0' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--muted-foreground)',
    border: 'none',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'color-mix(in oklab, var(--muted) 60%, transparent)',
  },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: 'calc(var(--radius) * 0.8)',
  },
})

const highlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: 'var(--code-property)' },
  { tag: tags.string, color: 'var(--code-string)' },
  { tag: tags.number, color: 'var(--code-number)' },
  { tag: [tags.bool, tags.null], color: 'var(--code-keyword)' },
  {
    tag: [tags.brace, tags.squareBracket, tags.separator],
    color: 'var(--muted-foreground)',
  },
])

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  /** Called when the user presses Cmd+Enter or Ctrl+Enter in the editor */
  onSubmit?: () => void
  minHeight?: string
  maxHeight?: string
  className?: string
  'aria-label'?: string
}

/** Code editor for JSON documents with syntax highlighting and linting. */
export function JsonEditor({
  value,
  onChange,
  onSubmit,
  minHeight = '12rem',
  maxHeight,
  className,
  'aria-label': ariaLabel,
}: JsonEditorProps) {
  // Keep the latest callback in a ref so the editor does not need to be
  // reconfigured whenever the callback changes
  const onSubmitRef = useRef(onSubmit)
  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])
  const hasSubmit = onSubmit !== undefined

  const extensions = useMemo(
    () => [
      json(),
      linter(jsonParseLinter(), { delay: 300 }),
      lintGutter(),
      theme,
      syntaxHighlighting(highlightStyle),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of(
        ariaLabel ? { 'aria-label': ariaLabel } : {},
      ),
      ...(hasSubmit
        ? [
            // Must take precedence over Mod-Enter in the default keymap
            Prec.highest(
              keymap.of([
                {
                  key: 'Mod-Enter',
                  preventDefault: true,
                  run: () => {
                    onSubmitRef.current?.()
                    return true
                  },
                },
              ]),
            ),
          ]
        : []),
    ],
    [hasSubmit, ariaLabel],
  )

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
        className,
      )}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme="none"
        minHeight={minHeight}
        maxHeight={maxHeight}
        basicSetup={{
          foldGutter: true,
          highlightActiveLine: true,
          tabSize: 2,
        }}
      />
    </div>
  )
}
