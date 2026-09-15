import { describe, expect, it } from 'vitest'
import { differenceInDays, isValidDateOnly, subtractCalendarMonths, subtractDays } from './dateOnly'

describe('date-only helpers', () => {
  it('validates calendar dates without timezone conversion', () => {
    expect(isValidDateOnly('2024-02-29')).toBe(true)
    expect(isValidDateOnly('2023-02-29')).toBe(false)
    expect(isValidDateOnly('2024-2-09')).toBe(false)
  })

  it('clamps month subtraction to the last valid day', () => {
    expect(subtractCalendarMonths('2025-05-31', 1)).toBe('2025-04-30')
    expect(subtractCalendarMonths('2025-03-31', 2)).toBe('2025-01-31')
    expect(subtractCalendarMonths('2024-03-31', 1)).toBe('2024-02-29')
  })

  it('subtracts days across month and year boundaries', () => {
    expect(subtractDays('2025-01-01', 1)).toBe('2024-12-31')
    expect(subtractDays('2024-03-01', 1)).toBe('2024-02-29')
  })

  it('calculates signed day differences', () => {
    expect(differenceInDays('2025-05-10', '2025-05-15')).toBe(5)
    expect(differenceInDays('2025-05-15', '2025-05-10')).toBe(-5)
    expect(differenceInDays('2024-02-28', '2024-03-01')).toBe(2)
  })
})
