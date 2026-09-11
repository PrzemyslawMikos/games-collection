import { describe, expect, it } from 'vitest'
import { createEmptyCollection, createEntry, createGame, createPlan } from './model'
import { calculateStats } from './stats'

describe('collection statistics', () => {
  it('counts canonical games separately from physical entries and plans', () => {
    const data = createEmptyCollection()
    const game = createGame('The Witcher 3')
    const secondGame = createGame('Hades')
    data.games.push(game, secondGame)
    data.entries.push(
      createEntry(game.id, { platform: 'PS5', price: 120, completion: 'completed', condition: 'sealed' }),
      createEntry(game.id, { platform: 'PS4', price: 80, completion: 'not-completed', condition: 'used' }),
    )
    data.plans.push(createPlan(secondGame.id, { targetPrice: 60, status: 'ordered' }))

    expect(calculateStats(data)).toMatchObject({
      totalGames: 2,
      totalEntries: 2,
      ownedGames: 1,
      completedGames: 1,
      completedEntries: 1,
      plannedGames: 1,
      orderedPlans: 1,
      sealedEntries: 1,
      usedEntries: 1,
      completionProgress: 50,
    })
    expect(calculateStats(data).totalSpend).toEqual([{ currency: 'PLN', amount: 200 }])
  })
})
