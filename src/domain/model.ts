import { z } from 'zod'

export const DATA_SCHEMA_VERSION = 1 as const

export const completionStatuses = ['not-started', 'not-completed', 'completed'] as const
export type CompletionStatus = (typeof completionStatuses)[number]

export const conditions = ['sealed', 'used', 'unknown'] as const
export type Condition = (typeof conditions)[number]

export const planStatuses = ['planned', 'ordered'] as const
export type PlanStatus = (typeof planStatuses)[number]

export const priorities = ['low', 'normal', 'high'] as const
export type Priority = (typeof priorities)[number]

export interface Game {
  id: string
  title: string
  aliases: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface GameEntry {
  id: string
  gameId: string
  platform: string
  version: string
  price: number | null
  currency: string
  purchaseDate: string | null
  condition: Condition
  completion: CompletionStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface GamePlan {
  id: string
  gameId: string
  platform: string
  version: string
  targetPrice: number | null
  currency: string
  priority: Priority
  plannedDate: string | null
  status: PlanStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface CollectionData {
  schemaVersion: typeof DATA_SCHEMA_VERSION
  updatedAt: string
  games: Game[]
  entries: GameEntry[]
  plans: GamePlan[]
}

const isoDate = z.string().datetime({ offset: true })

export const collectionSchema = z.object({
  schemaVersion: z.literal(DATA_SCHEMA_VERSION),
  updatedAt: isoDate,
  games: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      aliases: z.array(z.string()),
      notes: z.string(),
      createdAt: isoDate,
      updatedAt: isoDate,
    }),
  ),
  entries: z.array(
    z.object({
      id: z.string().min(1),
      gameId: z.string().min(1),
      platform: z.string().min(1),
      version: z.string(),
      price: z.number().nonnegative().nullable(),
      currency: z.string().length(3),
      purchaseDate: z.string().date().nullable(),
      condition: z.enum(conditions),
      completion: z.enum(completionStatuses),
      notes: z.string(),
      createdAt: isoDate,
      updatedAt: isoDate,
    }),
  ),
  plans: z.array(
    z.object({
      id: z.string().min(1),
      gameId: z.string().min(1),
      platform: z.string(),
      version: z.string(),
      targetPrice: z.number().nonnegative().nullable(),
      currency: z.string().length(3),
      priority: z.enum(priorities),
      plannedDate: z.string().date().nullable(),
      status: z.enum(planStatuses),
      notes: z.string(),
      createdAt: isoDate,
      updatedAt: isoDate,
    }),
  ),
})

export const makeId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export const now = (): string => new Date().toISOString()

export const createEmptyCollection = (): CollectionData => ({
  schemaVersion: DATA_SCHEMA_VERSION,
  updatedAt: now(),
  games: [],
  entries: [],
  plans: [],
})

export const createGame = (title: string, timestamp = now()): Game => ({
  id: makeId('game'),
  title: title.trim(),
  aliases: [],
  notes: '',
  createdAt: timestamp,
  updatedAt: timestamp,
})

export const createEntry = (
  gameId: string,
  values: Partial<Omit<GameEntry, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>> = {},
  timestamp = now(),
): GameEntry => ({
  id: makeId('entry'),
  gameId,
  platform: values.platform ?? '',
  version: values.version ?? '',
  price: values.price ?? null,
  currency: values.currency ?? 'PLN',
  purchaseDate: values.purchaseDate ?? null,
  condition: values.condition ?? 'unknown',
  completion: values.completion ?? 'not-started',
  notes: values.notes ?? '',
  createdAt: timestamp,
  updatedAt: timestamp,
})

export const createPlan = (
  gameId: string,
  values: Partial<Omit<GamePlan, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>> = {},
  timestamp = now(),
): GamePlan => ({
  id: makeId('plan'),
  gameId,
  platform: values.platform ?? '',
  version: values.version ?? '',
  targetPrice: values.targetPrice ?? null,
  currency: values.currency ?? 'PLN',
  priority: values.priority ?? 'normal',
  plannedDate: values.plannedDate ?? null,
  status: values.status ?? 'planned',
  notes: values.notes ?? '',
  createdAt: timestamp,
  updatedAt: timestamp,
})

export const cloneCollection = (data: CollectionData): CollectionData =>
  structuredClone(data)
