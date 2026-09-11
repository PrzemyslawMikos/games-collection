import { describe, expect, it } from 'vitest'
import { doesItPlayListUrl } from './doesItPlay'

describe('doesItPlayListUrl', () => {
  it('adds a platform filter for recognized platform names', () => {
    expect(doesItPlayListUrl(' PS4 ')).toBe('https://www.doesitplay.org/list?platform=PS4')
    expect(doesItPlayListUrl('Xbox Series X')).toBe('https://www.doesitplay.org/list?platform=Series+X')
  })

  it('falls back to the full list for hardware-specific values', () => {
    expect(doesItPlayListUrl('PS5 BC')).toBe('https://www.doesitplay.org/list')
    expect(doesItPlayListUrl('Switch OLED')).toBe('https://www.doesitplay.org/list')
  })

  it('encodes platform filter values safely', () => {
    expect(doesItPlayListUrl('Series X & One')).toBe('https://www.doesitplay.org/list?platform=Series+X+%26+One')
  })
})
