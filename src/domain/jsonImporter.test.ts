import { describe, expect, it } from 'vitest'
import { createEmptyCollection, createEntry, createGame } from './model'
import { parseJsonCollection } from './jsonImporter'

describe('JSON collection import', () => {
  it('parses an exported collection', () => {
    const collection = createEmptyCollection()

    expect(parseJsonCollection(JSON.stringify(collection))).toEqual(collection)
  })

  it('rejects malformed JSON', () => {
    expect(() => parseJsonCollection('{')).toThrow()
  })

  it('migrates legacy collections and starts an empty future-play queue', () => {
    const collection = createEmptyCollection()
    const legacy = { ...collection, schemaVersion: 1 }
    delete (legacy as Partial<typeof legacy>).futurePlayGameIds

    expect(parseJsonCollection(JSON.stringify(legacy))).toMatchObject({
      schemaVersion: 2,
      futurePlayGameIds: [],
    })
  })

  it('normalizes future-play references to five currently owned games', () => {
    const collection = createEmptyCollection()
    const games = Array.from({ length: 6 }, (_, index) => createGame(`Game ${index}`))
    collection.games.push(...games)
    collection.entries.push(...games.map((game) => createEntry(game.id, { platform: 'PS5' })))
    collection.futurePlayGameIds = [...games.map((game) => game.id), 'missing-game']

    const parsed = parseJsonCollection(JSON.stringify(collection))

    expect(parsed.futurePlayGameIds).toEqual(games.slice(0, 5).map((game) => game.id))
  })

  it('rejects data that does not match the collection schema', () => {
    expect(() => parseJsonCollection(JSON.stringify({ schemaVersion: 3 }))).toThrow()
  })
})
