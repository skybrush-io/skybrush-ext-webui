import { deepEquals, type RJSFValidationError } from '@rjsf/utils'
import { useCallback, useMemo, useState } from 'react'

import {
  adaptSchema,
  hasConfigurableProperties,
  type AdaptedSchema,
} from '@/components/schema-form/adapter'
import {
  fillDefaults,
  validateValue,
} from '@/components/schema-form/form-state'
import type { ExtensionDetails } from '@/lib/types'

export type ConfigEditorMode = 'form' | 'json'

function stringify(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2)
}

export interface ConfigEditorState {
  /** Schema and UI schema for the form; `null` if there is no schema */
  form: AdaptedSchema | null
  /** Whether the form could not render the configuration */
  formUnavailable: boolean
  mode: ConfigEditorMode
  setMode: (mode: ConfigEditorMode) => boolean
  value: unknown
  setValue: (value: unknown) => void
  jsonText: string
  setJsonText: (text: string) => void
  /** Syntax error in the JSON editor, if any */
  jsonError: string | null
  /** Schema validation errors of the current value */
  validationErrors: RJSFValidationError[]
  isDirty: boolean
  discard: () => void
  onFormRenderError: () => void
}

/** State of the configuration editor on the details page of an extension. */
export function useConfigEditor(
  extension: ExtensionDetails,
): ConfigEditorState {
  const form = useMemo(
    () =>
      hasConfigurableProperties(extension.schema)
        ? adaptSchema(extension.schema)
        : null,
    [extension.schema],
  )

  // The value shown initially: the current configuration, with defaults
  // filled in for required properties. Changes are tracked relative to this.
  const baseline = useMemo(
    () =>
      form
        ? fillDefaults(form.schema, extension.config ?? {})
        : (extension.config ?? {}),
    [form, extension.config],
  )

  const [value, setValue] = useState<unknown>(baseline)
  const [mode, setModeState] = useState<ConfigEditorMode>(
    form ? 'form' : 'json',
  )
  const [formUnavailable, setFormUnavailable] = useState(false)
  const [jsonText, setJsonTextState] = useState(() => stringify(baseline))
  const [jsonError, setJsonError] = useState<string | null>(null)

  const setJsonText = useCallback((text: string) => {
    setJsonTextState(text)
    try {
      setValue(JSON.parse(text))
      setJsonError(null)
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : String(error))
    }
  }, [])

  const setMode = useCallback(
    (next: ConfigEditorMode): boolean => {
      if (next === mode) {
        return true
      }
      if (next === 'json') {
        setJsonTextState(stringify(value))
        setJsonError(null)
      } else if (jsonError !== null || formUnavailable) {
        return false
      }
      setModeState(next)
      return true
    },
    [mode, value, jsonError, formUnavailable],
  )

  const setFormValue = useCallback(
    (next: unknown) => setValue(form ? fillDefaults(form.schema, next) : next),
    [form],
  )

  const discard = useCallback(() => {
    setValue(baseline)
    setJsonTextState(stringify(baseline))
    setJsonError(null)
  }, [baseline])

  const onFormRenderError = useCallback(() => {
    setFormUnavailable(true)
    setJsonTextState(stringify(value))
    setModeState('json')
  }, [value])

  const validationErrors = useMemo(
    () => (form && jsonError === null ? validateValue(form.schema, value) : []),
    [form, value, jsonError],
  )

  return {
    form,
    formUnavailable,
    mode,
    setMode,
    value,
    setValue: setFormValue,
    jsonText,
    setJsonText,
    jsonError,
    validationErrors,
    isDirty: jsonError !== null || !deepEquals(value, baseline),
    discard,
    onFormRenderError,
  }
}
