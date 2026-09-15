import { describe, expect, it } from 'vitest'
import { createPlan } from './model'
import { createPlanCalendarIcs } from './ics'

describe('purchase plan calendar export', () => {
  it('creates four localized reminder events with exact reminder dates', () => {
    const ics = createPlanCalendarIcs({
      plan: createPlan('game_1', { plannedDate: '2025-05-31' }),
      timestamp: new Date('2025-01-02T03:04:05Z'),
      labels: {
        summaries: { twoMonths: 'Two months', oneMonth: 'One month', sevenDays: 'Seven days', oneDay: 'One day' },
        description: 'Plan details',
        alarmDescription: 'Reminder',
      },
    })

    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4)
    expect(ics).toContain('DTSTAMP:20250102T030405Z')
    expect(ics).toContain('DTSTART:20250331T090000')
    expect(ics).toContain('DTSTART:20250430T090000')
    expect(ics).toContain('DTSTART:20250524T090000')
    expect(ics).toContain('DTSTART:20250530T090000')
    expect(ics).toContain('TRIGGER:PT0S')
    expect(ics.endsWith('\r\n')).toBe(true)
  })

  it('escapes ICS text and rejects plans without a date', () => {
    const plan = createPlan('game_1', { plannedDate: '2025-05-31' })
    const ics = createPlanCalendarIcs({
      plan,
      labels: {
        summaries: { twoMonths: 'A; B, C\\D', oneMonth: 'One', sevenDays: 'Seven', oneDay: 'Day' },
        description: 'Line one\nLine two',
        alarmDescription: 'Reminder',
      },
    })
    expect(ics).toContain('SUMMARY:A\\; B\\, C\\\\D')
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two')
    expect(() => createPlanCalendarIcs({ plan: createPlan('game_1'), labels: { summaries: { twoMonths: 'A', oneMonth: 'B', sevenDays: 'C', oneDay: 'D' }, description: '', alarmDescription: '' } })).toThrow()
  })
})
