import { describe, expect, it } from 'vitest'

import { adaptSchema, hasConfigurableProperties } from './adapter'

describe('adaptSchema', () => {
  it('treats properties as required unless marked with required: false', () => {
    const { schema, uiSchema } = adaptSchema({
      type: 'object',
      properties: {
        host: { type: 'string', default: '127.0.0.1' },
        port: { type: 'integer', default: 5000, required: false },
      },
    })

    expect(schema.required).toEqual(['host'])
    expect(schema.properties?.port).toEqual({ type: 'integer', default: 5000 })
    expect(uiSchema.port).toEqual({ 'ui:options': { optional: true } })
    expect(uiSchema.host).toEqual({ 'ui:emptyValue': '' })
  })

  it('respects required arrays of standard JSON schemas', () => {
    const { schema, uiSchema } = adaptSchema({
      type: 'object',
      required: ['a'],
      properties: { a: { type: 'string', required: false } },
    })

    expect(schema.required).toEqual(['a'])
    expect(uiSchema.a).toEqual({ 'ui:emptyValue': '' })
  })

  it('fills required properties without a default like json-editor', () => {
    const { schema } = adaptSchema({
      type: 'object',
      properties: {
        name: { type: 'string' },
        enabled: { type: 'boolean' },
        items: { type: 'array', items: { type: 'string' } },
        count: { type: 'integer', minimum: 1 },
        ratio: { type: 'number' },
        mode: { type: 'string', enum: ['a', 'b'] },
        nested: { type: 'object', properties: {} },
        optional: { type: 'string', required: false },
      },
    })

    const defaults = Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, value]) => [
        key,
        (value as { default?: unknown }).default,
      ]),
    )
    expect(defaults).toEqual({
      name: '',
      enabled: false,
      items: [],
      count: 1,
      ratio: 0,
      mode: 'a',
      nested: undefined,
      optional: undefined,
    })
  })

  it('orders properties by propertyOrder, then by declaration order', () => {
    const { uiSchema } = adaptSchema({
      type: 'object',
      properties: {
        c: { type: 'string' },
        a: { type: 'string', propertyOrder: 20 },
        b: { type: 'string', propertyOrder: 10 },
        d: { type: 'string' },
      },
    })

    expect(uiSchema['ui:order']).toEqual(['b', 'a', 'c', 'd', '*'])
  })

  it('moves json-editor specific keywords into the UI schema', () => {
    const { schema, uiSchema } = adaptSchema({
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['x', 'y'],
          options: { enum_titles: ['Mode X', 'Mode Y'] },
          propertyOrder: 5,
        },
        flag: { type: 'boolean', format: 'checkbox' },
        urls: { type: 'array', format: 'table', items: { type: 'string' } },
        notes: { type: 'string', format: 'textarea' },
        email: { type: 'string', format: 'email' },
        accuracy: { type: 'number', minValue: 0 },
      },
    })

    expect(schema.properties).toEqual({
      mode: { type: 'string', enum: ['x', 'y'], default: 'x' },
      flag: { type: 'boolean', default: false },
      urls: {
        type: 'array',
        items: { type: 'string', default: '' },
        default: [],
      },
      notes: { type: 'string', default: '' },
      email: { type: 'string', format: 'email', default: '' },
      accuracy: { type: 'number', minimum: 0, default: 0 },
    })
    expect(uiSchema.mode).toEqual({ 'ui:enumNames': ['Mode X', 'Mode Y'] })
    expect(uiSchema.flag).toBeUndefined()
    expect(uiSchema.urls).toEqual({
      'ui:options': { table: true },
      items: { 'ui:emptyValue': '', 'ui:label': false },
    })
    expect(uiSchema.notes).toEqual({
      'ui:widget': 'textarea',
      'ui:emptyValue': '',
    })
  })

  it('renders arrays of enums with format: checkbox as checkboxes', () => {
    const { schema, uiSchema } = adaptSchema({
      type: 'object',
      properties: {
        types: {
          type: 'array',
          format: 'checkbox',
          uniqueItems: true,
          required: false,
          items: {
            type: 'string',
            enum: ['gps', 'glonass'],
            options: { enum_titles: ['GPS', 'GLONASS'] },
          },
        },
      },
    })

    expect(schema.properties?.types).toEqual({
      type: 'array',
      uniqueItems: true,
      items: { type: 'string', enum: ['gps', 'glonass'], default: 'gps' },
    })
    expect(uiSchema.types).toEqual({
      'ui:widget': 'checkboxes',
      'ui:enumNames': ['GPS', 'GLONASS'],
      'ui:options': { optional: true },
      items: { 'ui:enumNames': ['GPS', 'GLONASS'], 'ui:label': false },
    })
  })

  it('adapts the schemas of map values and array items recursively', () => {
    const { schema, uiSchema } = adaptSchema({
      type: 'object',
      properties: {
        networks: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              id: { type: 'string', required: false },
              connections: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    })

    const networks = schema.properties?.networks as Record<string, unknown>
    expect(networks.additionalProperties).toMatchObject({
      required: ['connections'],
    })
    expect(uiSchema.networks).toMatchObject({
      additionalProperties: {
        id: { 'ui:options': { optional: true } },
        'ui:order': ['id', 'connections', '*'],
      },
    })
  })

  it('fixes defaults that match an allowed value only case-insensitively', () => {
    const { schema } = adaptSchema({
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['info', 'notice'], default: 'NOTICE' },
        other: { type: 'string', enum: ['a', 'b'], default: 'c' },
      },
    })

    expect(schema.properties?.level).toMatchObject({ default: 'notice' })
    expect(schema.properties?.other).toMatchObject({ default: 'c' })
  })

  it('hides the submit button', () => {
    expect(adaptSchema({ type: 'object' }).uiSchema).toEqual({
      'ui:submitButtonOptions': { norender: true },
    })
  })
})

describe('hasConfigurableProperties', () => {
  it('requires at least one property', () => {
    expect(hasConfigurableProperties(null)).toBe(false)
    expect(hasConfigurableProperties({ type: 'object' })).toBe(false)
    expect(hasConfigurableProperties({ properties: {} })).toBe(false)
    expect(hasConfigurableProperties({ properties: { a: {} } })).toBe(true)
  })
})
