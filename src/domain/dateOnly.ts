const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const pad = (value: number): string => String(value).padStart(2, '0')

export const isValidDateOnly = (value: string): boolean => {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export const compareDateOnly = (left: string, right: string): number => left.localeCompare(right)

export const differenceInDays = (from: string, to: string): number => {
  if (!isValidDateOnly(from) || !isValidDateOnly(to)) throw new Error('Invalid date-only value')
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  const fromTime = Date.UTC(fromYear, fromMonth - 1, fromDay)
  const toTime = Date.UTC(toYear, toMonth - 1, toDay)
  return Math.round((toTime - fromTime) / 86_400_000)
}

export const todayDateOnly = (date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const subtractDays = (value: string, days: number): string => {
  if (!isValidDateOnly(value)) throw new Error(`Invalid date-only value: ${value}`)
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - days)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export const subtractCalendarMonths = (value: string, months: number): string => {
  if (!isValidDateOnly(value)) throw new Error(`Invalid date-only value: ${value}`)
  const [year, month, day] = value.split('-').map(Number)
  const targetMonthIndex = month - 1 - months
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonthIndex + 1, 0)).getUTCDate()
  const targetDay = Math.min(day, lastDay)
  return `${targetYear}-${pad(normalizedMonthIndex + 1)}-${pad(targetDay)}`
}
