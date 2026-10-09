import {
  ariaDescribedByIds,
  descriptionId,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getOptionValueFormat,
  optionId,
  type WidgetProps,
} from '@rjsf/utils'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { getFormUiOptions } from './adapter'

/** Boolean fields, rendered as a switch with the label next to it. */
export function CheckboxWidget({
  id,
  value,
  disabled,
  readonly,
  label,
  hideLabel,
  schema,
  uiSchema,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) {
  const checked = value === true
  const uiOptions = getFormUiOptions(uiSchema)
  const description = schema.description

  // Switchable booleans already show their label next to the outer switch
  if (uiOptions.optional) {
    return (
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          checked={checked}
          disabled={disabled || readonly}
          onCheckedChange={onChange}
        />
        <Label htmlFor={id} className="font-normal text-muted-foreground">
          {checked ? 'On' : 'Off'}
        </Label>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <Switch
        id={id}
        className="mt-0.5"
        checked={checked}
        disabled={disabled || readonly}
        onCheckedChange={onChange}
        onBlur={() => onBlur(id, checked)}
        onFocus={() => onFocus(id, checked)}
        aria-describedby={ariaDescribedByIds(id)}
      />
      {!hideLabel && (
        <div className="grid gap-1">
          <Label htmlFor={id}>{label}</Label>
          {description && (
            <p id={descriptionId(id)} className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Fields with a fixed set of allowed values. */
export function SelectWidget({
  id,
  htmlName,
  options,
  value,
  required,
  disabled,
  readonly,
  autofocus,
  multiple,
  placeholder,
  rawErrors,
  schema,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) {
  const { enumOptions = [], enumDisabled, emptyValue } = options
  const format = getOptionValueFormat(options)
  const selected = enumOptionSelectedValue(
    value,
    enumOptions,
    !!multiple,
    format,
    multiple ? [] : '',
  )
  const decode = (raw: string | string[]) =>
    enumOptionValueDecoder(raw, enumOptions, format, emptyValue)
  const getValue = (target: HTMLSelectElement) =>
    multiple
      ? Array.from(target.selectedOptions, (option) => option.value)
      : target.value

  return (
    <NativeSelect
      id={id}
      name={htmlName || id}
      multiple={multiple}
      value={selected as string | string[]}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      aria-invalid={rawErrors && rawErrors.length > 0 ? true : undefined}
      aria-describedby={ariaDescribedByIds(id)}
      className="max-w-xl"
      onChange={({ target }) => onChange(decode(getValue(target)))}
      onBlur={({ target }) => onBlur(id, decode(getValue(target)))}
      onFocus={({ target }) => onFocus(id, decode(getValue(target)))}
    >
      {!multiple && schema.default === undefined && (
        <NativeSelectOption value="">
          {placeholder || 'Select…'}
        </NativeSelectOption>
      )}
      {enumOptions.map((option, index) => (
        <NativeSelectOption
          key={String(option.value)}
          value={enumOptionValueEncoder(option.value, index, format)}
          disabled={enumDisabled?.includes(option.value)}
        >
          {option.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

/** Arrays of values from a fixed set, rendered as a set of checkboxes. */
export function CheckboxesWidget({
  id,
  disabled,
  readonly,
  options,
  value,
  onChange,
}: WidgetProps) {
  const { enumOptions = [], enumDisabled } = options
  const values: unknown[] = Array.isArray(value) ? value : []

  return (
    <div
      id={id}
      className="grid max-w-xl gap-x-6 gap-y-2 sm:grid-cols-2"
      role="group"
    >
      {enumOptions.map((option, index) => {
        const checked = enumOptionsIsSelected(option.value, values)
        const itemId = optionId(id, index)
        return (
          <div key={String(option.value)} className="flex items-center gap-2">
            <Checkbox
              id={itemId}
              checked={checked}
              disabled={
                disabled || readonly || enumDisabled?.includes(option.value)
              }
              onCheckedChange={(state) =>
                onChange(
                  state === true
                    ? enumOptionsSelectValue(index, values, enumOptions)
                    : enumOptionsDeselectValue(index, values, enumOptions),
                )
              }
            />
            <Label htmlFor={itemId} className="font-normal">
              {option.label}
            </Label>
          </div>
        )
      })}
    </div>
  )
}

/** Multi-line text fields. */
export function TextareaWidget({
  id,
  htmlName,
  value,
  required,
  disabled,
  readonly,
  autofocus,
  placeholder,
  options,
  rawErrors,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) {
  return (
    <Textarea
      id={id}
      name={htmlName || id}
      value={value ?? ''}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      placeholder={placeholder}
      rows={typeof options.rows === 'number' ? options.rows : 4}
      aria-invalid={rawErrors && rawErrors.length > 0 ? true : undefined}
      aria-describedby={ariaDescribedByIds(id)}
      className="max-w-xl"
      onChange={({ target }) =>
        onChange(target.value === '' ? options.emptyValue : target.value)
      }
      onBlur={({ target }) => onBlur(id, target.value)}
      onFocus={({ target }) => onFocus(id, target.value)}
    />
  )
}
