import Form from '@rjsf/core'
import type { RJSFSchema, UiSchema } from '@rjsf/utils'
import { Component, type ReactNode } from 'react'

import { defaultFormStateBehavior, validator } from './form-state'
import { templates, widgets } from './theme'

interface SchemaFormProps {
  schema: RJSFSchema
  uiSchema: UiSchema
  value: unknown
  onChange: (value: unknown) => void
  /** Called when the form cannot render the value, e.g. due to type errors */
  onRenderError: (error: Error) => void
  disabled?: boolean
}

/** Form generated from the configuration schema of an extension. */
export function SchemaForm({
  schema,
  uiSchema,
  value,
  onChange,
  onRenderError,
  disabled,
}: SchemaFormProps) {
  return (
    <FormErrorBoundary onError={onRenderError}>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={value}
        validator={validator}
        templates={templates}
        widgets={widgets}
        disabled={disabled}
        experimental_defaultFormStateBehavior={defaultFormStateBehavior}
        liveValidate="onChange"
        showErrorList={false}
        noHtml5Validate
        onChange={(event) => onChange(event.formData)}
        onSubmit={() => {}}
      />
    </FormErrorBoundary>
  )
}

class FormErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
