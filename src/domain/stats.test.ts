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
    expect(stats.statusTotals).toEqual([
      { status: 'planned', count: 1 },
      { status: 'completed', count: 1 },
      { status: 'sealed', count: 1 },
      { status: 'in-progress', count: 1 },
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

  it('returns empty timeline and zeroed status categories for empty data', () => {
    const stats = calculateStats(createEmptyCollection())

    expect(stats.purchaseTimeline).toEqual([])
    expect(stats.platformDistribution).toEqual([])
    expect(stats.platformSpending).toEqual([])
    expect(stats.statusTotals).toEqual([
      { status: 'planned', count: 0 },
      { status: 'completed', count: 0 },
      { status: 'sealed', count: 0 },
      { status: 'in-progress', count: 0 },
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
