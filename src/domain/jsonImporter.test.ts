import { describe, expect, it } from 'vitest'
import { createEmptyCollection } from './model'
import { parseJsonCollection } from './jsonImporter'

describe('JSON collection import', () => {
  it('parses an exported collection', () => {
    const collection = createEmptyCollection()

    expect(parseJsonCollection(JSON.stringify(collection))).toEqual(collection)
  })

  it('rejects malformed JSON', () => {
    expect(() => parseJsonCollection('{')).toThrow()
  })

  it('rejects data that does not match the collection schema', () => {
    expect(() => parseJsonCollection(JSON.stringify({ schemaVersion: 2 }))).toThrow()
  })
})
