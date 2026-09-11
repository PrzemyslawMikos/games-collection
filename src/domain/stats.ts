import type { CollectionData, CompletionStatus, Condition, GameEntry, GamePlan } from './model'

export interface CurrencyTotal {
  currency: string
  amount: number
}

export interface PlatformTotal {
  platform: string
  entries: number
  ownedSpend: CurrencyTotal[]
}

export interface PlatformDistribution {
  platform: string
  entries: number
  isOther?: boolean
}

export interface PlatformSpending {
  currency: string
  platforms: Array<{ platform: string; amount: number }>
}

export type OwnershipStatus = 'bought' | 'planned'

export interface OwnershipTotal {
  status: OwnershipStatus
  count: number
}

export interface CompletionTotal {
  status: CompletionStatus
  count: number
}

export interface ConditionTotal {
  status: Exclude<Condition, 'unknown'>
  count: number
}

export interface PurchaseTimelinePoint {
  period: string
  purchases: number
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
  platformTotals: PlatformTotal[]
  platformDistribution: PlatformDistribution[]
  platformSpending: PlatformSpending[]
  ownershipTotals: OwnershipTotal[]
  completionTotals: CompletionTotal[]
  conditionTotals: ConditionTotal[]
  purchaseTimeline: PurchaseTimelinePoint[]
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

const ownershipOrder: OwnershipStatus[] = ['bought', 'planned']
const completionOrder: CompletionStatus[] = ['completed', 'not-completed', 'not-started']
const conditionOrder: ConditionTotal['status'][] = ['used', 'sealed']

const createOwnershipTotals = (data: CollectionData, ownedGameIds: Set<string>): OwnershipTotal[] => {
  const counts = new Map<OwnershipStatus, number>(ownershipOrder.map((status) => [status, 0]))
  const plannedGames = new Set(data.plans.map((plan) => plan.gameId))

  counts.set('bought', data.entries.length)
  counts.set('planned', [...plannedGames].filter((gameId) => !ownedGameIds.has(gameId)).length)

  return ownershipOrder.map((status) => ({ status, count: counts.get(status) ?? 0 }))
}

const createCompletionTotals = (entries: GameEntry[]): CompletionTotal[] => {
  const counts = new Map<CompletionStatus, number>(completionOrder.map((status) => [status, 0]))

  for (const entry of entries) counts.set(entry.completion, (counts.get(entry.completion) ?? 0) + 1)

  return completionOrder.map((status) => ({ status, count: counts.get(status) ?? 0 }))
}

const createConditionTotals = (entries: GameEntry[]): ConditionTotal[] => {
  const counts = new Map<ConditionTotal['status'], number>(conditionOrder.map((status) => [status, 0]))

  for (const entry of entries) {
    if (entry.condition !== 'unknown') counts.set(entry.condition, (counts.get(entry.condition) ?? 0) + 1)
  }

  return conditionOrder.map((status) => ({ status, count: counts.get(status) ?? 0 }))
}

const parsePurchaseDate = (value: string): { year: number; month: number; day: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  return { year, month, day }
}

const createPurchaseTimeline = (entries: GameEntry[]): PurchaseTimelinePoint[] => {
  const dates = entries
    .map((entry) => entry.purchaseDate ? parsePurchaseDate(entry.purchaseDate) : null)
    .filter((date): date is { year: number; month: number; day: number } => date !== null)
  if (dates.length === 0) return []

  const first = dates.reduce((earliest, date) =>
    date.year < earliest.year || (date.year === earliest.year && date.month < earliest.month) ? date : earliest,
  )
  const last = dates.reduce((latest, date) =>
    date.year > latest.year || (date.year === latest.year && date.month > latest.month) ? date : latest,
  )
  const byYear = first.year !== last.year
  const counts = new Map<string, number>()

  for (const date of dates) {
    const period = byYear ? String(date.year) : `${date.year}-${String(date.month).padStart(2, '0')}`
    counts.set(period, (counts.get(period) ?? 0) + 1)
  }

  const periods: string[] = []
  if (byYear) {
    for (let year = first.year; year <= last.year; year += 1) periods.push(String(year))
  } else {
    let year = first.year
    let month = first.month
    while (year < last.year || (year === last.year && month <= last.month)) {
      periods.push(`${year}-${String(month).padStart(2, '0')}`)
      month += 1
      if (month === 13) {
        month = 1
        year += 1
      }
    }
  }

  return periods.map((period) => {
    return { period, purchases: counts.get(period) ?? 0 }
  })
}

export const calculateStats = (data: CollectionData): CollectionStats => {
  const ownedGameIds = new Set(data.entries.map((entry) => entry.gameId))
  const completedGameIds = new Set(
    data.entries.filter((entry) => entry.completion === 'completed').map((entry) => entry.gameId),
  )
  const plannedGameIds = new Set(data.plans.map((plan) => plan.gameId))
  const platformMap = new Map<string, { entries: number; ownedSpend: Map<string, number> }>()

  for (const entry of data.entries) {
    const current = platformMap.get(entry.platform) ?? {
      entries: 0,
      ownedSpend: new Map<string, number>(),
    }
    current.entries += 1
    if (entry.price !== null) current.ownedSpend.set(entry.currency, (current.ownedSpend.get(entry.currency) ?? 0) + entry.price)
    platformMap.set(entry.platform, current)
  }

  const platformTotals: PlatformTotal[] = [...platformMap.entries()]
    .filter(([platform]) => platform.trim().length > 0)
    .map(([platform, values]) => ({
      platform,
      entries: values.entries,
      ownedSpend: [...values.ownedSpend.entries()]
        .map(([currency, amount]) => ({ currency, amount }))
        .sort((a, b) => a.currency.localeCompare(b.currency)),
    }))
    .sort((a, b) => b.entries - a.entries || a.platform.localeCompare(b.platform))
  const chartPlatforms = platformTotals.slice(0, 8)
  const remainingEntries = platformTotals.slice(8).reduce((sum, platform) => sum + platform.entries, 0)
  const platformDistribution = remainingEntries > 0
    ? [...chartPlatforms.map(({ platform, entries }) => ({ platform, entries })), { platform: 'other', entries: remainingEntries, isOther: true }]
    : chartPlatforms.map(({ platform, entries }) => ({ platform, entries }))
  const spendingMap = new Map<string, Map<string, number>>()
  for (const entry of data.entries) {
    if (entry.price === null || entry.platform.trim().length === 0) continue
    const platformAmounts = spendingMap.get(entry.currency) ?? new Map<string, number>()
    platformAmounts.set(entry.platform, (platformAmounts.get(entry.platform) ?? 0) + entry.price)
    spendingMap.set(entry.currency, platformAmounts)
  }
  const platformSpending: PlatformSpending[] = [...spendingMap.entries()]
    .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
    .map(([currency, platforms]) => ({
      currency,
      platforms: [...platforms.entries()]
        .map(([platform, amount]) => ({ platform, amount }))
        .sort((a, b) => b.amount - a.amount || a.platform.localeCompare(b.platform)),
    }))

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
    platformTotals,
    platformDistribution,
    platformSpending,
    ownershipTotals: createOwnershipTotals(data, ownedGameIds),
    completionTotals: createCompletionTotals(data.entries),
    conditionTotals: createConditionTotals(data.entries),
    purchaseTimeline: createPurchaseTimeline(data.entries),
    completionProgress: ownedEntries === 0 ? 0 : Math.round((completedEntries / ownedEntries) * 100),
  }
}

export const getGameEntries = (data: CollectionData, gameId: string): GameEntry[] =>
  entriesForGame(data.entries, gameId)

export const getGamePlans = (data: CollectionData, gameId: string): GamePlan[] =>
  data.plans.filter((plan) => plan.gameId === gameId)
