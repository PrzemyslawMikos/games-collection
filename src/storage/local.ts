import Dexie, { type Table } from 'dexie'
import type { CollectionData } from '../domain/model'

interface CollectionRecord {
  id: 'current'
  data: CollectionData
  remoteSha: string | null
  savedAt: string
}

interface SettingRecord {
  key: string
  value: string
}

const MOCK_DATA_SETTING_KEY = 'mock-data-loaded'

class CollectionDatabase extends Dexie {
  collections!: Table<CollectionRecord, string>
  settings!: Table<SettingRecord, string>

  constructor() {
    super('games-collection')
    this.version(1).stores({
      collections: 'id',
      settings: 'key',
    })
  }
}

export const database = new CollectionDatabase()

export const loadLocalCollection = async (): Promise<CollectionRecord | undefined> =>
  database.collections.get('current')

export const saveLocalCollection = async (
  data: CollectionData,
  remoteSha: string | null,
): Promise<void> => {
  await database.collections.put({
    id: 'current',
    data,
    remoteSha,
    savedAt: new Date().toISOString(),
  })
}

export const getSetting = async (key: string): Promise<string | undefined> =>
  (await database.settings.get(key))?.value

export const setSetting = async (key: string, value: string): Promise<void> => {
  await database.settings.put({ key, value })
}

export const loadMockDataState = async (): Promise<boolean> =>
  (await getSetting(MOCK_DATA_SETTING_KEY)) === 'true'

export const saveMockDataState = async (loaded: boolean): Promise<void> => {
  await setSetting(MOCK_DATA_SETTING_KEY, String(loaded))
}

export const clearLocalData = async (): Promise<void> => {
  await database.collections.clear()
  await database.settings.delete(MOCK_DATA_SETTING_KEY)
}
