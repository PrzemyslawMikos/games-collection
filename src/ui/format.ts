import type { Condition, CompletionStatus, PlanStatus, Priority } from '../domain/model'

export const formatMoney = (amount: number | null, currency = 'PLN'): string => {
  if (amount === null) return 'Brak ceny'
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(amount)
}

export const formatDate = (value: string | null): string => {
  if (!value) return 'Brak daty'
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`))
}

export const conditionLabel: Record<Condition, string> = {
  sealed: 'Zafoliowana',
  used: 'Używana',
  unknown: 'Nieokreślona',
}

export const completionLabel: Record<CompletionStatus, string> = {
  'not-started': 'Nie rozpoczęta',
  'not-completed': 'Nie ukończona',
  completed: 'Ukończona',
}

export const planStatusLabel: Record<PlanStatus, string> = {
  planned: 'Do kupienia',
  ordered: 'W drodze',
}

export const priorityLabel: Record<Priority, string> = {
  low: 'Niski',
  normal: 'Normalny',
  high: 'Wysoki',
}
