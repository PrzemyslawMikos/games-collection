import { describe, expect, it } from 'vitest'
import { en, pl } from './catalogs'
import { languageStorageKey, pluralize, translate } from './index'

describe('localization', () => {
  it('keeps both catalogs complete', () => {
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort())
  })

  it('interpolates values and pluralizes both locales', () => {
    expect(translate('en', 'dashboard.plansWaiting', { count: 3 })).toBe('3 games waiting to be purchased.')
    expect(pluralize('en', 'collection.copy', 1)).toBe('1 copy')
    expect(pluralize('en', 'collection.copy', 2)).toBe('2 copies')
    expect(pluralize('pl', 'collection.copy', 1)).toBe('1 egzemplarz')
    expect(pluralize('pl', 'collection.copy', 3)).toBe('3 egzemplarzy')
  })

  it('returns the key for an unknown translation and keeps the preference key stable', () => {
    expect(translate('pl', 'missing.key')).toBe('missing.key')
    expect(languageStorageKey).toBe('games-collection-language')
  })
})
