import { describe, expect, it } from 'vitest'
import { createEmptyCollection, createEntry, createGame } from './model'
import { mergeMockCollection } from './mockData'

describe('mock collection data', () => {
  it('merges the complete deterministic sample into an empty collection', () => {
    const result = mergeMockCollection(createEmptyCollection())

    expect(result).toMatchObject({ addedGames: 27, addedEntries: 21, addedPlans: 9 })
    expect(result.data.games).toHaveLength(27)
    expect(result.data.entries).toHaveLength(21)
    expect(result.data.plans).toHaveLength(9)
  })

  it('does not add the same sample records twice', () => {
    const first = mergeMockCollection(createEmptyCollection())
    const second = mergeMockCollection(first.data)

    expect(second).toMatchObject({ addedGames: 0, addedEntries: 0, addedPlans: 0 })
    expect(second.data).toEqual(first.data)
  })

  it('keeps matching user records and still adds records for other platforms', () => {
    const current = createEmptyCollection()
    const game = createGame('cyberpunk 2077')
    current.games.push(game)
    current.entries.push(createEntry(game.id, { platform: ' ps4 ', version: 'DAY ONE EDITION' }))

    const result = mergeMockCollection(current)

    expect(result.addedGames).toBe(26)
    expect(result.addedEntries).toBe(20)
    expect(result.addedPlans).toBe(9)
    expect(result.data.entries.find((entry) => entry.gameId === game.id && entry.platform === ' ps4 ')).toBeDefined()
    expect(result.data.entries.filter((entry) => entry.gameId === game.id)).toHaveLength(1)
  })
})
