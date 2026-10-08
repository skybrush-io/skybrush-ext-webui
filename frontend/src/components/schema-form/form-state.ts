import {
  createSchemaUtils,
  type Experimental_DefaultFormStateBehavior,
  type RJSFSchema,
  type RJSFValidationError,
} from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'

/**
 * Only required properties are filled with their defaults; optional ones are
 * left out until the user switches them on, like json-editor did.
 */
export const defaultFormStateBehavior: Experimental_DefaultFormStateBehavior = {
  emptyObjectFields: 'populateRequiredDefaults',
}

export { validator }

/**
 * Returns the given configuration with defaults filled in for missing
 * required properties. This is the value that the form shows initially, and
 * it is also applied after every change so that new map entries receive
 * their defaults too.
 */
export function fillDefaults(schema: RJSFSchema, config: unknown): unknown {
  return createSchemaUtils(
    validator,
    schema,
    defaultFormStateBehavior,
  ).getDefaultFormState(schema, config as never)
}

/** Validates a value against the given schema. */
export function validateValue(
  schema: RJSFSchema,
  value: unknown,
): RJSFValidationError[] {
  return validator.validateFormData(value, schema).errors
}
