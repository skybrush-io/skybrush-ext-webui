import {
  ADDITIONAL_PROPERTY_FLAG,
  ariaDescribedByIds,
  buttonId,
  canExpand,
  descriptionId,
  examplesId,
  getInputProps,
  getSchemaType,
  getTemplate,
  getUiOptions,
  titleId,
  type ArrayFieldItemButtonsTemplateProps,
  type ArrayFieldItemTemplateProps,
  type ArrayFieldTemplateProps,
  type BaseInputTemplateProps,
  type DescriptionFieldProps,
  type FieldErrorProps,
  type FieldHelpProps,
  type FieldTemplateProps,
  type IconButtonProps,
  type ObjectFieldTemplateProps,
  type RJSFSchema,
  type TitleFieldProps,
  type WrapIfAdditionalTemplateProps,
} from '@rjsf/utils'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import type { ChangeEvent, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

import { getFormUiOptions } from './adapter'

function isContainer(schema: RJSFSchema): boolean {
  const type = getSchemaType(schema)
  return type === 'object' || type === 'array'
}

function isAdditionalProperty(schema: RJSFSchema): boolean {
  return ADDITIONAL_PROPERTY_FLAG in schema
}

/**
 * Returns the value that a property that can be switched on or off receives
 * when the user switches it on.
 */
function getValueWhenSwitchedOn(
  schema: RJSFSchema,
  registry: FieldTemplateProps['registry'],
): unknown {
  const value = registry.schemaUtils.getDefaultFormState(schema, undefined)
  if (value !== undefined) {
    return value
  }

  switch (getSchemaType(schema)) {
    case 'string':
      return ''
    case 'number':
    case 'integer':
      return typeof schema.minimum === 'number' ? schema.minimum : 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return null
  }
}

/* -------------------------------------------------------------------------- */
/* Fields                                                                     */
/* -------------------------------------------------------------------------- */

export function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    label,
    children,
    errors,
    help,
    rawDescription,
    hidden,
    displayLabel,
    schema,
    uiSchema,
    formData,
    onChange,
    fieldPathId,
    registry,
    disabled,
    readonly,
  } = props
  const uiOptions = getFormUiOptions(uiSchema)
  const WrapIfAdditionalTemplate = getTemplate(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions,
  )

  if (hidden) {
    return <div className="hidden">{children}</div>
  }

  // Properties that can be switched on or off (json-editor's "opt-in")
  if (uiOptions.optional) {
    const enabled = formData !== undefined
    const checkboxId = `${id}__enabled`
    const toggle = (checked: boolean) =>
      onChange(
        checked
          ? (getValueWhenSwitchedOn(schema, registry) as never)
          : undefined,
        fieldPathId.path,
      )

    return (
      // oxlint-disable-next-line react/static-components -- looked up from the registry, not created here
      <WrapIfAdditionalTemplate {...props}>
        <div className="grid gap-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id={checkboxId}
              className="mt-0.5"
              checked={enabled}
              disabled={disabled || readonly}
              onCheckedChange={(checked) => toggle(checked === true)}
              aria-describedby={rawDescription ? descriptionId(id) : undefined}
            />
            <div className="grid gap-1">
              <Label htmlFor={checkboxId}>{label}</Label>
              {rawDescription && (
                <p
                  id={descriptionId(id)}
                  className="text-xs text-muted-foreground"
                >
                  {rawDescription}
                </p>
              )}
            </div>
          </div>
          {enabled && (
            <div className="grid gap-1.5 pl-7">
              {children}
              {errors}
              {help}
            </div>
          )}
        </div>
      </WrapIfAdditionalTemplate>
    )
  }

  // Booleans render their own label; objects and arrays render a title
  const showLabel =
    displayLabel && uiOptions.widget !== 'checkbox' && !isContainer(schema)

  return (
    // oxlint-disable-next-line react/static-components -- looked up from the registry, not created here
    <WrapIfAdditionalTemplate {...props}>
      <div className="grid gap-1.5">
        {showLabel && label && <Label htmlFor={id}>{label}</Label>}
        {showLabel && rawDescription && (
          <p id={descriptionId(id)} className="text-xs text-muted-foreground">
            {rawDescription}
          </p>
        )}
        {children}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  )
}

export function TitleFieldTemplate({
  id,
  title,
  optionalDataControl,
}: TitleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 id={id} className="text-sm font-semibold">
        {title}
      </h3>
      {optionalDataControl}
    </div>
  )
}

export function DescriptionFieldTemplate({
  id,
  description,
}: DescriptionFieldProps) {
  if (!description) {
    return null
  }
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {description}
    </p>
  )
}

export function FieldErrorTemplate({ errors, fieldPathId }: FieldErrorProps) {
  if (!errors || errors.length === 0) {
    return null
  }
  return (
    <ul
      id={`${fieldPathId.$id}__error`}
      className="space-y-0.5 text-xs text-destructive"
    >
      {errors
        .filter((error) => !!error)
        .map((error, index) => (
          <li key={index}>{error}</li>
        ))}
    </ul>
  )
}

export function FieldHelpTemplate({ help, fieldPathId }: FieldHelpProps) {
  if (!help) {
    return null
  }
  return (
    <p
      id={`${fieldPathId.$id}__help`}
      className="text-xs text-muted-foreground"
    >
      {help}
    </p>
  )
}

/** Renders the key of entries in maps with arbitrary keys. */
export function WrapIfAdditionalTemplate({
  id,
  label,
  children,
  schema,
  disabled,
  readonly,
  onKeyRenameBlur,
  onRemoveProperty,
  uiSchema,
  registry,
}: WrapIfAdditionalTemplateProps) {
  if (!isAdditionalProperty(schema)) {
    return <>{children}</>
  }

  const { RemoveButton } = registry.templates.ButtonTemplates
  const keyInput = (
    <Input
      key={label}
      id={`${id}-key`}
      aria-label="Name"
      className="h-7 max-w-60 font-mono text-xs"
      defaultValue={label}
      disabled={disabled || readonly}
      onBlur={onKeyRenameBlur}
    />
  )
  const removeButton = (
    <RemoveButton
      id={buttonId(id, 'remove')}
      disabled={disabled || readonly}
      onClick={onRemoveProperty}
      uiSchema={uiSchema}
      registry={registry}
    />
  )

  if (!isContainer(schema)) {
    return (
      <div className="flex items-start gap-2">
        {keyInput}
        <div className="min-w-0 flex-1">{children}</div>
        {removeButton}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        {keyInput}
        <div className="flex-1" />
        {removeButton}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Objects and arrays                                                         */
/* -------------------------------------------------------------------------- */

export function ObjectFieldTemplate({
  description,
  disabled,
  formData,
  fieldPathId,
  onAddProperty,
  properties,
  readonly,
  registry,
  required,
  schema,
  title,
  uiSchema,
}: ObjectFieldTemplateProps) {
  const uiOptions = getFormUiOptions(uiSchema)
  const { AddButton } = registry.templates.ButtonTemplates
  const isRoot = fieldPathId.path.length === 0

  // The title of switchable properties and map entries is rendered elsewhere
  const showHeader =
    !isRoot && !uiOptions.optional && !isAdditionalProperty(schema)
  const isBoxed = showHeader

  return (
    <fieldset
      id={fieldPathId.$id}
      className={cn(
        'min-w-0 space-y-5',
        isBoxed && 'rounded-lg border p-3 sm:p-4',
      )}
    >
      {showHeader && (title || description) && (
        <div className="space-y-1">
          {title && (
            <TitleFieldTemplate
              id={titleId(fieldPathId)}
              title={title}
              required={required}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
          {description && (
            <DescriptionFieldTemplate
              id={descriptionId(fieldPathId)}
              description={description}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
        </div>
      )}
      {properties.map((property) => property.content)}
      {canExpand(schema, uiSchema, formData) && (
        <AddButton
          id={buttonId(fieldPathId, 'add')}
          className="rjsf-object-property-expand"
          onClick={onAddProperty}
          disabled={disabled || readonly}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </fieldset>
  )
}

export function ArrayFieldTemplate({
  canAdd,
  disabled,
  fieldPathId,
  items,
  onAddClick,
  readonly,
  registry,
  required,
  schema,
  title,
  uiSchema,
}: ArrayFieldTemplateProps) {
  const uiOptions = getFormUiOptions(uiSchema)
  const { AddButton } = registry.templates.ButtonTemplates
  const showHeader = !uiOptions.optional && !isAdditionalProperty(schema)
  const description = uiOptions.description ?? schema.description

  return (
    <fieldset id={fieldPathId.$id} className="min-w-0 space-y-2">
      {showHeader && (
        <div className="space-y-1">
          {(uiOptions.title || title) && (
            <TitleFieldTemplate
              id={titleId(fieldPathId)}
              title={uiOptions.title || title}
              required={required}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
          {description && (
            <DescriptionFieldTemplate
              id={descriptionId(fieldPathId)}
              description={description}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
        </div>
      )}
      {items.length > 0 ? (
        <div className="space-y-2">{items}</div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No items</p>
      )}
      {canAdd && (
        <AddButton
          id={buttonId(fieldPathId, 'add')}
          className="rjsf-array-item-add"
          onClick={onAddClick}
          disabled={disabled || readonly}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </fieldset>
  )
}

export function ArrayFieldItemTemplate({
  children,
  buttonsProps,
  hasToolbar,
  registry,
  schema,
  uiSchema,
}: ArrayFieldItemTemplateProps) {
  const uiOptions = getUiOptions(uiSchema)
  const ArrayFieldItemButtonsTemplate = getTemplate(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  )
  const boxed = isContainer(schema)

  return (
    <div
      className={cn(
        'flex gap-2',
        boxed
          ? 'items-start rounded-lg border bg-muted/20 p-3'
          : 'items-center',
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {hasToolbar && (
        <div className="flex shrink-0 items-center">
          {/* oxlint-disable-next-line react/static-components -- looked up from the registry, not created here */}
          <ArrayFieldItemButtonsTemplate {...buttonsProps} />
        </div>
      )}
    </div>
  )
}

export function ArrayFieldItemButtonsTemplate({
  disabled,
  hasCopy,
  hasMoveDown,
  hasMoveUp,
  hasRemove,
  fieldPathId,
  onCopyItem,
  onRemoveItem,
  onMoveDownItem,
  onMoveUpItem,
  readonly,
  registry,
  uiSchema,
}: ArrayFieldItemButtonsTemplateProps) {
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } =
    registry.templates.ButtonTemplates
  const inactive = disabled || readonly

  return (
    <>
      {(hasMoveUp || hasMoveDown) && (
        <MoveUpButton
          id={buttonId(fieldPathId, 'moveUp')}
          disabled={inactive || !hasMoveUp}
          onClick={onMoveUpItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {(hasMoveUp || hasMoveDown) && (
        <MoveDownButton
          id={buttonId(fieldPathId, 'moveDown')}
          disabled={inactive || !hasMoveDown}
          onClick={onMoveDownItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasCopy && (
        <CopyButton
          id={buttonId(fieldPathId, 'copy')}
          disabled={inactive}
          onClick={onCopyItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasRemove && (
        <RemoveButton
          id={buttonId(fieldPathId, 'remove')}
          disabled={inactive}
          onClick={onRemoveItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Inputs                                                                     */
/* -------------------------------------------------------------------------- */

export function BaseInputTemplate({
  id,
  htmlName,
  value,
  readonly,
  disabled,
  autofocus,
  onBlur,
  onFocus,
  onChange,
  onChangeOverride,
  options,
  schema,
  rawErrors,
  type,
  placeholder,
  required,
}: BaseInputTemplateProps) {
  const inputProps = getInputProps(schema, type, options)
  const isNumeric =
    inputProps.type === 'number' || inputProps.type === 'integer'
  const inputValue = isNumeric
    ? value || value === 0
      ? value
      : ''
    : (value ?? '')

  const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) =>
    onChange(target.value === '' ? options.emptyValue : target.value)

  return (
    <>
      <Input
        id={id}
        name={htmlName || id}
        {...inputProps}
        value={inputValue}
        placeholder={placeholder}
        required={required}
        readOnly={readonly}
        disabled={disabled}
        autoFocus={autofocus}
        aria-invalid={rawErrors && rawErrors.length > 0 ? true : undefined}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
        list={schema.examples ? examplesId(id) : undefined}
        className={cn(isNumeric ? 'w-44' : 'max-w-xl')}
        onChange={onChangeOverride || handleChange}
        onBlur={({ target }) => onBlur(id, target.value)}
        onFocus={({ target }) => onFocus(id, target.value)}
      />
      {Array.isArray(schema.examples) && (
        <datalist id={examplesId(id)}>
          {(schema.examples as string[]).map((example) => (
            <option key={example} value={example} />
          ))}
        </datalist>
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

function IconButton({
  icon,
  label,
  className,
  onClick,
  disabled,
  id,
}: IconButtonProps & { icon: ReactNode; label: string }) {
  return (
    <Button
      type="button"
      id={id}
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </Button>
  )
}

export function AddButton({
  className,
  onClick,
  disabled,
  id,
}: IconButtonProps) {
  const isMapEntry = className?.includes('rjsf-object-property-expand')
  return (
    <Button
      type="button"
      id={id}
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
    >
      <PlusIcon />
      {isMapEntry ? 'Add entry' : 'Add item'}
    </Button>
  )
}

export function RemoveButton(props: IconButtonProps) {
  return (
    <IconButton
      {...props}
      icon={<Trash2Icon />}
      label="Remove"
      className="text-muted-foreground hover:text-destructive"
    />
  )
}

export function MoveUpButton(props: IconButtonProps) {
  return <IconButton {...props} icon={<ArrowUpIcon />} label="Move up" />
}

export function MoveDownButton(props: IconButtonProps) {
  return <IconButton {...props} icon={<ArrowDownIcon />} label="Move down" />
}

export function CopyItemButton(props: IconButtonProps) {
  return <IconButton {...props} icon={<CopyIcon />} label="Duplicate" />
}

export function ClearButton(props: IconButtonProps) {
  return <IconButton {...props} icon={<XIcon />} label="Clear" />
}

export function SubmitButton() {
  return null
}

export function ErrorListTemplate() {
  // Errors are shown next to the fields and summarized in the action bar
  return null
}
