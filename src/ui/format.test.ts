import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, formatTimelinePeriod } from './format'

describe('locale-aware formatting', () => {
  it('formats dates and timeline periods in the active locale', () => {
    expect(formatDate('2024-01-15', 'en')).toContain('Jan')
    expect(formatDate('2024-01-15', 'pl')).toContain('sty')
    expect(formatTimelinePeriod('2024-01', 'en')).toContain('Jan')
    expect(formatTimelinePeriod('2024-01', 'pl')).toContain('sty')
  })

  it('formats money with the active locale and localized empty values', () => {
    expect(formatMoney(12.5, 'USD', 'en')).toContain('$12.50')
    expect(formatMoney(12.5, 'PLN', 'pl')).toContain('12,50')
    expect(formatMoney(null, 'PLN', 'en')).toBe('No price')
    expect(formatMoney(null, 'PLN', 'pl')).toBe('Brak ceny')
  })
})
