import { describe, expect, it } from 'vitest'
import { createEmptyCollection, createEntry, createGame, createPlan } from './model'
import { calculateStats } from './stats'

describe('dashboard chart statistics', () => {
  it('keeps platform spending separated by currency and builds chart datasets', () => {
    const data = createEmptyCollection()
    const ownedGame = createGame('Gra posiadana')
    const secondGame = createGame('Druga gra')
    const plannedGame = createGame('Gra planowana')
    data.games.push(ownedGame, secondGame, plannedGame)
    data.entries.push(
      createEntry(ownedGame.id, {
        platform: 'PS5',
        price: 100,
        currency: 'PLN',
        condition: 'sealed',
        purchaseDate: '2024-01-10',
      }),
      createEntry(ownedGame.id, {
        platform: 'PS5',
        price: 50,
        currency: 'EUR',
        completion: 'completed',
        condition: 'sealed',
        purchaseDate: '2024-03-12',
      }),
      createEntry(secondGame.id, {
        platform: 'Switch',
        price: null,
        condition: 'used',
        purchaseDate: null,
      }),
    )
    data.plans.push(createPlan(plannedGame.id, { targetPrice: 80 }))

    const stats = calculateStats(data)

    expect(stats.platformTotals).toEqual([
      {
        platform: 'PS5',
        entries: 2,
        ownedSpend: [
          { currency: 'EUR', amount: 50 },
          { currency: 'PLN', amount: 100 },
        ],
      },
      { platform: 'Switch', entries: 1, ownedSpend: [] },
    ])
    expect(stats.platformDistribution).toEqual([
      { platform: 'PS5', entries: 2 },
      { platform: 'Switch', entries: 1 },
    ])
    expect(stats.platformSpending).toEqual([
      { currency: 'EUR', platforms: [{ platform: 'PS5', amount: 50 }] },
      { currency: 'PLN', platforms: [{ platform: 'PS5', amount: 100 }] },
    ])
    expect(stats.ownershipTotals).toEqual([
      { status: 'bought', count: 3 },
      { status: 'planned', count: 1 },
    ])
    expect(stats.completionTotals).toEqual([
      { status: 'completed', count: 1 },
      { status: 'not-completed', count: 0 },
      { status: 'not-started', count: 2 },
    ])
    expect(stats.conditionTotals).toEqual([
      { status: 'used', count: 1 },
      { status: 'sealed', count: 2 },
    ])
    expect(stats.purchaseTimeline).toEqual([
      { period: '2024-01', purchases: 1 },
      { period: '2024-02', purchases: 0 },
      { period: '2024-03', purchases: 1 },
    ])
  })

  it('groups long purchase ranges by year and ignores invalid dates', () => {
    const data = createEmptyCollection()
    const game = createGame('Gra')
    data.games.push(game)
    data.entries.push(
      createEntry(game.id, { purchaseDate: '2022-12-31' }),
      createEntry(game.id, { purchaseDate: '2024-01-01' }),
      createEntry(game.id, { purchaseDate: '2024-99-01' }),
    )

    expect(calculateStats(data).purchaseTimeline).toEqual([
      { period: '2022', purchases: 1 },
      { period: '2023', purchases: 0 },
      { period: '2024', purchases: 1 },
    ])
  })

  it('counts each chart dimension independently', () => {
    const data = createEmptyCollection()
    const ownedGame = createGame('Posiadana gra')
    const plannedGame = createGame('Planowana gra')
    data.games.push(ownedGame, plannedGame)
    data.entries.push(
      createEntry(ownedGame.id, { completion: 'completed', condition: 'sealed' }),
      createEntry(ownedGame.id, { completion: 'not-completed', condition: 'used' }),
      createEntry(plannedGame.id, { completion: 'not-started', condition: 'unknown' }),
    )
    data.plans.push(
      createPlan(plannedGame.id),
      createPlan(plannedGame.id, { status: 'ordered' }),
      createPlan(ownedGame.id),
    )

    const stats = calculateStats(data)

    expect(stats.ownershipTotals).toEqual([
      { status: 'bought', count: 3 },
      { status: 'planned', count: 0 },
    ])
    expect(stats.completionTotals).toEqual([
      { status: 'completed', count: 1 },
      { status: 'not-completed', count: 1 },
      { status: 'not-started', count: 1 },
    ])
    expect(stats.conditionTotals).toEqual([
      { status: 'used', count: 1 },
      { status: 'sealed', count: 1 },
    ])
  })

  it('returns empty timeline and zeroed chart categories for empty data', () => {
    const stats = calculateStats(createEmptyCollection())

    expect(stats.purchaseTimeline).toEqual([])
    expect(stats.platformDistribution).toEqual([])
    expect(stats.platformSpending).toEqual([])
    expect(stats.ownershipTotals).toEqual([
      { status: 'bought', count: 0 },
      { status: 'planned', count: 0 },
    ])
    expect(stats.completionTotals).toEqual([
      { status: 'completed', count: 0 },
      { status: 'not-completed', count: 0 },
      { status: 'not-started', count: 0 },
    ])
    expect(stats.conditionTotals).toEqual([
      { status: 'used', count: 0 },
      { status: 'sealed', count: 0 },
    ])
  })

  it('limits the platform donut to eight platforms plus a remainder', () => {
    const data = createEmptyCollection()
    const game = createGame('Gra')
    data.games.push(game)
    for (let index = 1; index <= 9; index += 1) {
      data.entries.push(createEntry(game.id, { platform: `Platforma ${index}` }))
    }

    expect(calculateStats(data).platformDistribution).toEqual([
      { platform: 'Platforma 1', entries: 1 },
      { platform: 'Platforma 2', entries: 1 },
      { platform: 'Platforma 3', entries: 1 },
      { platform: 'Platforma 4', entries: 1 },
      { platform: 'Platforma 5', entries: 1 },
      { platform: 'Platforma 6', entries: 1 },
      { platform: 'Platforma 7', entries: 1 },
      { platform: 'Platforma 8', entries: 1 },
      { platform: 'other', entries: 1, isOther: true },
    ])
  })
})
