import mockCollectionJson from '../data/mock-collection.json'
import { parseJsonCollection } from './jsonImporter'
import { cloneCollection, type CollectionData } from './model'
import { normalizeTitle } from './normalize'

export interface MockDataMergeResult {
  data: CollectionData
  addedGames: number
  addedEntries: number
  addedPlans: number
}

export const mockCollection = parseJsonCollection(JSON.stringify(mockCollectionJson))

const normalizePlatform = (value: string): string => value.trim().toLocaleLowerCase('pl-PL')
const normalizeVersion = (value: string): string => value.trim().toLocaleLowerCase('pl-PL')

const hasMatchingRecord = (
  gameId: string,
  platform: string,
  version: string,
  records: Array<{ gameId: string; platform: string; version: string }>,
): boolean => {
  const normalizedPlatform = normalizePlatform(platform)
  const normalizedVersion = normalizeVersion(version)
  return records.some((record) =>
    record.gameId === gameId &&
    normalizePlatform(record.platform) === normalizedPlatform &&
    normalizeVersion(record.version) === normalizedVersion,
  )
}

export const mergeMockCollection = (current: CollectionData, mock = mockCollection): MockDataMergeResult => {
  const data = cloneCollection(current)
  const gameIds = new Map<string, string>()
  const gamesByTitle = new Map(data.games.map((game) => [normalizeTitle(game.title), game]))
  let addedGames = 0
  let addedEntries = 0
  let addedPlans = 0

  for (const mockGame of mock.games) {
    const existing = gamesByTitle.get(normalizeTitle(mockGame.title))
    if (existing) {
      gameIds.set(mockGame.id, existing.id)
    } else {
      const game = structuredClone(mockGame)
      data.games.push(game)
      gamesByTitle.set(normalizeTitle(game.title), game)
      gameIds.set(mockGame.id, game.id)
      addedGames += 1
    }
  }

  for (const entry of mock.entries) {
    const gameId = gameIds.get(entry.gameId)
    if (!gameId || data.entries.some((candidate) => candidate.id === entry.id) ||
      hasMatchingRecord(gameId, entry.platform, entry.version, data.entries)) continue
    data.entries.push({ ...structuredClone(entry), gameId })
    addedEntries += 1
  }

  for (const plan of mock.plans) {
    const gameId = gameIds.get(plan.gameId)
    if (!gameId || data.plans.some((candidate) => candidate.id === plan.id) ||
      hasMatchingRecord(gameId, plan.platform, plan.version, data.plans)) continue
    data.plans.push({ ...structuredClone(plan), gameId })
    addedPlans += 1
  }

  return { data, addedGames, addedEntries, addedPlans }
}
