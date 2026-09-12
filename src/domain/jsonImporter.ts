import { migrateCollection, type CollectionData } from './model'

export const parseJsonCollection = (text: string): CollectionData =>
  migrateCollection(JSON.parse(text))
