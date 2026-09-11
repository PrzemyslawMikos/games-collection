import { describe, expect, it } from 'vitest'
import { collectSuggestions, findSuggestion, rankSuggestions } from './suggestions'

describe('collection value suggestions', () => {
  it('deduplicates values by trimmed case-insensitive spelling', () => {
    expect(collectSuggestions([' PS5 ', 'ps5', '', 'Switch'])).toEqual(['PS5', 'Switch'])
  })

  it('ranks exact, prefix, and substring matches in that order', () => {
    expect(rankSuggestions('pro', ['Retro Pro', 'Pro', 'Pro Max', 'Approach'])).toEqual([
      'Pro',
      'Pro Max',
      'Approach',
      'Retro Pro',
    ])
  })

  it('returns the existing canonical spelling for a case-insensitive match', () => {
    expect(findSuggestion(' ps5 ', ['PS5', 'Switch'])).toBe('PS5')
  })
})
