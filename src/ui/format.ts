import type { Condition, CompletionStatus, PlanStatus, Priority } from '../domain/model'
import { translate, type Locale, type TranslationKey } from '../i18n'

const intlLocale = (locale: Locale): string => locale === 'en' ? 'en-US' : 'pl-PL'

export const formatMoney = (amount: number | null, currency = 'PLN', locale: Locale = 'pl'): string => {
  if (amount === null) return translate(locale, 'common.noPrice')
  return new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency }).format(amount)
}

export const formatDate = (value: string | null, locale: Locale = 'pl'): string => {
  if (!value) return translate(locale, 'common.noDate')
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`))
}

export const formatTimelinePeriod = (period: string, locale: Locale): string => {
  if (!period.includes('-')) return period
  const [year, month] = period.split('-').map(Number)
  return new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export const conditionLabelKey: Record<Condition, TranslationKey> = {
  sealed: 'labels.condition.sealed',
  used: 'labels.condition.used',
  unknown: 'labels.condition.unknown',
}

export const completionLabelKey: Record<CompletionStatus, TranslationKey> = {
  'not-started': 'labels.completion.notStarted',
  'not-completed': 'labels.completion.notCompleted',
  completed: 'labels.completion.completed',
}

export const planStatusLabelKey: Record<PlanStatus, TranslationKey> = {
  planned: 'labels.plan.planned',
  ordered: 'labels.plan.ordered',
}

export const priorityLabelKey: Record<Priority, TranslationKey> = {
  low: 'labels.priority.low',
  normal: 'labels.priority.normal',
  high: 'labels.priority.high',
}
