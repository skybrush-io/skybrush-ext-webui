/**
 * Conversion of the configuration schemas of Skybrush server extensions into
 * standard JSON Schema plus a UI schema for react-jsonschema-form.
 *
 * Extension schemas were written for the `json-editor` library that the
 * previous version of the web UI used, with the following settings:
 *
 * - `required_by_default: true`: every property is required unless it is
 *   marked with `required: false` (a boolean, which is not valid JSON Schema);
 * - `show_opt_in: true`: properties that are not required can be switched on
 *   or off with a checkbox; switched-off properties are left out of the
 *   configuration entirely.
 *
 * The schemas also use some json-editor specific keywords (`propertyOrder`,
 * `options.enum_titles`, layout-related `format` values) that are moved into
 * the UI schema here so that the JSON Schema validator does not see them.
 */

import {
  getUiOptions,
  type RJSFSchema,
  type UIOptionsType,
  type UiSchema,
} from '@rjsf/utils'

type JsonObject = Record<string, unknown>

/** UI options understood by the templates of the schema form. */
export type SchemaFormUiOptions = UIOptionsType & {
  /** The property can be switched on or off by the user */
  optional?: boolean
  /** Render the array in a compact layout (json-editor's `table` format) */
  table?: boolean
}

/** Returns the UI options of a field, including the custom ones. */
export function getFormUiOptions(uiSchema?: UiSchema): SchemaFormUiOptions {
  return getUiOptions(uiSchema) as SchemaFormUiOptions
}

export interface AdaptedSchema {
  schema: RJSFSchema
  uiSchema: UiSchema
}

/** Default value of `propertyOrder` in json-editor. */
const DEFAULT_PROPERTY_ORDER = 1000

/** Values of `format` that select a specific widget. */
const WIDGET_FORMATS: Record<string, string> = {
  textarea: 'textarea',
  password: 'password',
  radio: 'radio',
}

/** Values of `format` that only affect the layout in json-editor. */
const LAYOUT_FORMATS = new Set([
  'categories',
  'checkbox',
  'choices',
  'grid',
  'grid-strict',
  'select',
  'select2',
  'selectize',
  'table',
  'tabs',
  'tabs-top',
])

/** Keywords that are specific to json-editor and are removed from schemas. */
const JSON_EDITOR_KEYWORDS = new Set([
  'headerTemplate',
  'links',
  'minValue',
  'options',
  'propertyOrder',
  'required',
  'watch',
])

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getType(schema: JsonObject): string | undefined {
  const { type } = schema
  if (typeof type === 'string') {
    return type
  }
  if (Array.isArray(type)) {
    return type.find((item) => item !== 'null') as string | undefined
  }
  if (isObject(schema.properties)) {
    return 'object'
  }
  return undefined
}

/**
 * Returns the value that json-editor uses for a required property that has no
 * default value in the schema.
 */
function getEmptyValue(schema: JsonObject): unknown {
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0]
  }

  switch (getType(schema)) {
    case 'string':
      return ''
    case 'boolean':
      return false
    case 'array':
      return []
    case 'number':
    case 'integer':
      return typeof schema.minimum === 'number' && schema.minimum > 0
        ? schema.minimum
        : 0
    default:
      // Objects are filled recursively by the form from their properties
      return undefined
  }
}

function setUiOption(uiSchema: UiSchema, key: string, value: unknown) {
  uiSchema['ui:options'] = {
    ...uiSchema['ui:options'],
    [key]: value as UIOptionsType[string],
  }
}

function adaptNode(node: unknown): AdaptedSchema {
  if (!isObject(node)) {
    return { schema: node as RJSFSchema, uiSchema: {} }
  }

  const schema: JsonObject = {}
  const uiSchema: UiSchema = {}
  const type = getType(node)

  for (const [key, value] of Object.entries(node)) {
    if (!JSON_EDITOR_KEYWORDS.has(key) || key === 'required') {
      schema[key] = value
    }
  }

  // `required: true` / `required: false` on a property is handled by the
  // parent object; only array-valued `required` is valid JSON Schema
  if (!Array.isArray(node.required)) {
    delete schema.required
  }

  // `minValue` is presumably a misspelling of `minimum` in some schemas
  if (typeof node.minValue === 'number' && node.minimum === undefined) {
    schema.minimum = node.minValue
  }

  // Some schemas have defaults that differ from one of the allowed values only
  // in case; use the allowed value so the form is not invalid from the start
  if (Array.isArray(node.enum) && typeof node.default === 'string') {
    const fallback = node.default.toLowerCase()
    if (!node.enum.includes(node.default)) {
      const match = node.enum.find(
        (value) =>
          typeof value === 'string' && value.toLowerCase() === fallback,
      )
      if (match !== undefined) {
        schema.default = match
      }
    }
  }

  // json-editor-specific options
  const options = isObject(node.options) ? node.options : {}
  if (Array.isArray(options.enum_titles)) {
    uiSchema['ui:enumNames'] = options.enum_titles
  }
  if (options.hidden === true) {
    uiSchema['ui:widget'] = 'hidden'
  }

  // `format` is either a widget selector or a layout hint in json-editor
  const format = typeof node.format === 'string' ? node.format : undefined
  if (format !== undefined) {
    if (format in WIDGET_FORMATS) {
      uiSchema['ui:widget'] = WIDGET_FORMATS[format]
      delete schema.format
    } else if (LAYOUT_FORMATS.has(format)) {
      delete schema.format
      if (format === 'table') {
        setUiOption(uiSchema, 'table', true)
      } else if (format === 'checkbox' && type === 'array') {
        uiSchema['ui:widget'] = 'checkboxes'
      }
    }
  }

  // Empty strings are valid values (e.g. an empty host name to listen on all
  // interfaces) so they must not be turned into `undefined` by the form
  if (type === 'string' && !Array.isArray(node.enum)) {
    uiSchema['ui:emptyValue'] = ''
  }

  // Objects: handle required-by-default semantics and property ordering
  if (isObject(node.properties)) {
    const explicitlyRequired = new Set(
      Array.isArray(node.required) ? (node.required as string[]) : [],
    )
    const properties: JsonObject = {}
    const required: string[] = []
    const order: { name: string; order: number; index: number }[] = []

    Object.entries(node.properties).forEach(([name, child], index) => {
      const adapted = adaptNode(child)
      const childSchema = adapted.schema as JsonObject
      const isRequired =
        explicitlyRequired.has(name) ||
        !isObject(child) ||
        child.required !== false

      if (isRequired) {
        required.push(name)
        if (childSchema.default === undefined) {
          const emptyValue = getEmptyValue(childSchema)
          if (emptyValue !== undefined) {
            childSchema.default = emptyValue
          }
        }
      } else {
        setUiOption(adapted.uiSchema, 'optional', true)
      }

      properties[name] = childSchema
      if (Object.keys(adapted.uiSchema).length > 0) {
        uiSchema[name] = adapted.uiSchema
      }

      const propertyOrder =
        isObject(child) && typeof child.propertyOrder === 'number'
          ? child.propertyOrder
          : DEFAULT_PROPERTY_ORDER
      order.push({ name, order: propertyOrder, index })
    })

    schema.properties = properties
    if (required.length > 0) {
      schema.required = required
    } else {
      delete schema.required
    }

    order.sort((a, b) => a.order - b.order || a.index - b.index)
    uiSchema['ui:order'] = [...order.map((item) => item.name), '*']
  }

  // Maps with arbitrary keys
  if (isObject(node.additionalProperties)) {
    const adapted = adaptNode(node.additionalProperties)
    schema.additionalProperties = adapted.schema
    if (Object.keys(adapted.uiSchema).length > 0) {
      uiSchema.additionalProperties = adapted.uiSchema
    }
  }

  // Arrays
  if (isObject(node.items)) {
    const adapted = adaptNode(node.items)
    const itemSchema = adapted.schema as JsonObject
    // New items get the same initial values as in json-editor
    if (itemSchema.default === undefined) {
      const emptyValue = getEmptyValue(itemSchema)
      if (emptyValue !== undefined) {
        itemSchema.default = emptyValue
      }
    }
    schema.items = itemSchema
    // Items are shown as a list under the title of the array; labels like
    // "Connection URLs-1" would only add noise
    uiSchema.items = { ...adapted.uiSchema, 'ui:label': false }
    // The checkboxes widget reads the option labels from the array itself
    if (
      uiSchema['ui:widget'] === 'checkboxes' &&
      adapted.uiSchema['ui:enumNames']
    ) {
      uiSchema['ui:enumNames'] = adapted.uiSchema['ui:enumNames']
    }
  }

  return { schema: schema as RJSFSchema, uiSchema }
}

/**
 * Converts the configuration schema of an extension into a standard JSON
 * Schema and a UI schema for react-jsonschema-form.
 */
export function adaptSchema(schema: Record<string, unknown>): AdaptedSchema {
  const { schema: adapted, uiSchema } = adaptNode(schema)
  return {
    schema: adapted,
    uiSchema: {
      ...uiSchema,
      'ui:submitButtonOptions': { norender: true },
    },
  }
}

/** Returns whether the given schema describes any configurable properties. */
export function hasConfigurableProperties(
  schema: Record<string, unknown> | null | undefined,
): schema is Record<string, unknown> {
  return (
    isObject(schema) &&
    isObject(schema.properties) &&
    Object.keys(schema.properties).length > 0
  )
}
