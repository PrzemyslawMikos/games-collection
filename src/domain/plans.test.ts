import { describe, expect, it } from 'vitest'
import { createGame, createPlan } from './model'
import { isPlanOverdue, sortPlanItems } from './plans'

describe('purchase plan behavior', () => {
  it('marks only planned dates before today as overdue', () => {
    const overdue = createPlan('game', { plannedDate: '2025-01-01', status: 'planned' })
    const ordered = createPlan('game', { plannedDate: '2025-01-01', status: 'ordered' })
    const today = createPlan('game', { plannedDate: '2025-05-10', status: 'planned' })
    expect(isPlanOverdue(overdue, '2025-05-10')).toBe(true)
    expect(isPlanOverdue(ordered, '2025-05-10')).toBe(false)
    expect(isPlanOverdue(today, '2025-05-10')).toBe(false)
  })

  it('sorts dates first, then priority, title, and puts undated plans last', () => {
    const first = createGame('First')
    const second = createGame('Second')
    const items = [
      { gameTitle: 'No date', plan: createPlan(first.id) },
      { gameTitle: second.title, plan: createPlan(second.id, { plannedDate: '2025-06-01', priority: 'low' }) },
      { gameTitle: first.title, plan: createPlan(first.id, { plannedDate: '2025-06-01', priority: 'high' }) },
      { gameTitle: 'Earlier', plan: createPlan(first.id, { plannedDate: '2025-05-01' }) },
    ]
    expect(sortPlanItems(items, 'en').map((item) => item.gameTitle)).toEqual(['Earlier', 'First', 'Second', 'No date'])
  })
})
