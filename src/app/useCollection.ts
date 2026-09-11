import { useContext } from 'react'
import { CollectionContext } from './collectionContext'
import type { CollectionContextValue } from './collectionContext'

export const useCollection = (): CollectionContextValue => {
  const context = useContext(CollectionContext)
  if (!context) throw new Error('useCollection musi być użyty wewnątrz CollectionProvider.')
  return context
}
