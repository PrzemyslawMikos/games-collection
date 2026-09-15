import type { GamePlan } from './model'
import { isValidDateOnly, subtractCalendarMonths, subtractDays } from './dateOnly'

export type ReminderKind = 'twoMonths' | 'oneMonth' | 'sevenDays' | 'oneDay'

const reminderKinds: Array<{ kind: ReminderKind; months?: number; days?: number }> = [
  { kind: 'twoMonths', months: 2 },
  { kind: 'oneMonth', months: 1 },
  { kind: 'sevenDays', days: 7 },
  { kind: 'oneDay', days: 1 },
]

interface CalendarLabels {
  summaries: Record<ReminderKind, string>
  description: string
  alarmDescription: string
}

interface PlanCalendarInput {
  plan: GamePlan
  labels: CalendarLabels
  timestamp?: Date
}

const escapeText = (value: string): string => value
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n')

const dateParts = (value: string): string => value.replaceAll('-', '')

const utcTimestamp = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

const reminderDate = (plannedDate: string, kind: ReminderKind): string => {
  const config = reminderKinds.find((item) => item.kind === kind)
  if (!config) throw new Error(`Unknown reminder kind: ${kind}`)
  return config.months ? subtractCalendarMonths(plannedDate, config.months) : subtractDays(plannedDate, config.days ?? 0)
}

export const createPlanCalendarIcs = ({ plan, labels, timestamp = new Date() }: PlanCalendarInput): string => {
  if (!plan.plannedDate || !isValidDateOnly(plan.plannedDate)) throw new Error('A valid planned date is required for calendar export.')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Games Collection//Purchase Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const { kind } of reminderKinds) {
    const date = reminderDate(plan.plannedDate, kind)
    const start = `${dateParts(date)}T090000`
    const end = `${dateParts(date)}T093000`
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeText(`${plan.id}-${kind}@games-collection`)}`,
      `DTSTAMP:${utcTimestamp(timestamp)}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeText(labels.summaries[kind])}`,
      `DESCRIPTION:${escapeText(labels.description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0S',
      `DESCRIPTION:${escapeText(labels.alarmDescription)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}
