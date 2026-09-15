import { createContext } from 'react'
import type { CollectionData, Game, GameEntry, GamePlan } from '../domain/model'
import type { CollectionStats } from '../domain/stats'
import type { MockDataMergeResult } from '../domain/mockData'
import type { GitHubAuth } from '../storage/github'

export interface CollectionContextValue {
  data: CollectionData
  stats: CollectionStats
  loading: boolean
  saving: boolean
  dirty: boolean
  remoteChanged: boolean
  remoteSha: string | null
  mockDataLoaded: boolean
  error: string | null
  auth: GitHubAuth | null
  loginPrompt: { url: string; code: string } | null
  repositoryReference: string
  setError: (message: string | null) => void
  replaceData: (data: CollectionData) => void
  loadMockData: () => Omit<MockDataMergeResult, 'data'>
  addGame: (title: string) => Game | null
  updateGame: (gameId: string, values: Partial<Pick<Game, 'title' | 'aliases' | 'notes'>>) => void
  mergeGames: (targetId: string, sourceId: string) => void
  deleteGame: (gameId: string) => void
  addEntry: (gameId: string, values: Partial<Omit<GameEntry, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  updateEntry: (entryId: string, values: Partial<Omit<GameEntry, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  deleteEntry: (entryId: string) => void
  addFuturePlayGame: (gameId: string) => void
  removeFuturePlayGame: (gameId: string) => void
  finishFuturePlayGame: (gameId: string) => void
  moveFuturePlayGame: (gameId: string, direction: 'up' | 'down') => void
  reorderFuturePlayGame: (gameId: string, targetIndex: number) => void
  addPlan: (gameId: string, values: Partial<Omit<GamePlan, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  updatePlan: (planId: string, values: Partial<Omit<GamePlan, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  deletePlan: (planId: string) => void
  convertPlan: (planId: string, values: Partial<Omit<GameEntry, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  saveLocal: () => Promise<void>
  loadRemote: () => Promise<void>
  sync: () => Promise<void>
  login: () => Promise<void>
  completeLogin: () => Promise<void>
  logout: () => void
}

export const CollectionContext = createContext<CollectionContextValue | null>(null)
