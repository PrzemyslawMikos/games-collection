import type { CollectionData, GameEntry, GamePlan } from './model'

export interface CurrencyTotal {
  currency: string
  amount: number
}

export interface CollectionStats {
  totalGames: number
  totalEntries: number
  ownedGames: number
  completedGames: number
  completedEntries: number
  sealedEntries: number
  usedEntries: number
  plannedGames: number
  orderedPlans: number
  totalSpend: CurrencyTotal[]
  plannedBudget: CurrencyTotal[]
  platformTotals: Array<{ platform: string; entries: number; ownedSpend: number; currency: string }>
  completionProgress: number
}

const sumByCurrency = (values: Array<{ amount: number | null; currency: string }>): CurrencyTotal[] => {
  const totals = new Map<string, number>()
  for (const value of values) {
    if (value.amount === null) continue
    totals.set(value.currency, (totals.get(value.currency) ?? 0) + value.amount)
  }

  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => a.currency.localeCompare(b.currency))
}

const entriesForGame = (entries: GameEntry[], gameId: string): GameEntry[] =>
  entries.filter((entry) => entry.gameId === gameId)

export const calculateStats = (data: CollectionData): CollectionStats => {
  const ownedGameIds = new Set(data.entries.map((entry) => entry.gameId))
  const completedGameIds = new Set(
    data.entries.filter((entry) => entry.completion === 'completed').map((entry) => entry.gameId),
  )
  const plannedGameIds = new Set(data.plans.map((plan) => plan.gameId))
  const platformMap = new Map<string, { entries: number; ownedSpend: number; currency: string }>()

  for (const entry of data.entries) {
    const current = platformMap.get(entry.platform) ?? {
      entries: 0,
      ownedSpend: 0,
      currency: entry.currency,
    }
    current.entries += 1
    if (entry.price !== null) current.ownedSpend += entry.price
    platformMap.set(entry.platform, current)
  }

  const completedEntries = data.entries.filter((entry) => entry.completion === 'completed').length
  const ownedEntries = data.entries.length

  return {
    totalGames: data.games.length,
    totalEntries: ownedEntries,
    ownedGames: ownedGameIds.size,
    completedGames: completedGameIds.size,
    completedEntries,
    sealedEntries: data.entries.filter((entry) => entry.condition === 'sealed').length,
    usedEntries: data.entries.filter((entry) => entry.condition === 'used').length,
    plannedGames: plannedGameIds.size,
    orderedPlans: data.plans.filter((plan) => plan.status === 'ordered').length,
    totalSpend: sumByCurrency(data.entries.map((entry) => ({ amount: entry.price, currency: entry.currency }))),
    plannedBudget: sumByCurrency(data.plans.map((plan) => ({ amount: plan.targetPrice, currency: plan.currency }))),
    platformTotals: [...platformMap.entries()]
      .map(([platform, values]) => ({ platform, ...values }))
      .sort((a, b) => a.platform.localeCompare(b.platform)),
    completionProgress: ownedEntries === 0 ? 0 : Math.round((completedEntries / ownedEntries) * 100),
  }
}

export const getGameEntries = (data: CollectionData, gameId: string): GameEntry[] =>
  entriesForGame(data.entries, gameId)

export const getGamePlans = (data: CollectionData, gameId: string): GamePlan[] =>
  data.plans.filter((plan) => plan.gameId === gameId)
