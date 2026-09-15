import { describe, expect, it } from 'vitest'
import { remoteVersionChanged } from './syncState'

describe('remoteVersionChanged', () => {
  it('does not activate download when the remote file is missing', () => {
    expect(remoteVersionChanged(null, 'known-sha')).toBe(false)
  })

  it('activates download when a remote file has no stored baseline', () => {
    expect(remoteVersionChanged('remote-sha', null)).toBe(true)
  })

  it('activates download only when the remote SHA differs', () => {
    expect(remoteVersionChanged('same-sha', 'same-sha')).toBe(false)
    expect(remoteVersionChanged('new-sha', 'old-sha')).toBe(true)
  })
})
