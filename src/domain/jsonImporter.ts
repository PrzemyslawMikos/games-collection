import { collectionSchema, type CollectionData } from './model'

export const parseJsonCollection = (text: string): CollectionData =>
  collectionSchema.parse(JSON.parse(text))
