import type { GamePlan } from './model'
import { compareDateOnly, todayDateOnly } from './dateOnly'
import type { Locale } from '../i18n'

export interface PlanListItem {
  plan: GamePlan
  gameTitle: string
}

const priorityRank = { high: 0, normal: 1, low: 2 } as const

export const isPlanOverdue = (plan: GamePlan, today = todayDateOnly()): boolean =>
  plan.status === 'planned' && plan.plannedDate !== null && compareDateOnly(plan.plannedDate, today) < 0

export const sortPlanItems = (items: PlanListItem[], locale: Locale): PlanListItem[] => [...items].sort((left, right) => {
  const leftDate = left.plan.plannedDate
  const rightDate = right.plan.plannedDate
  if (leftDate === null && rightDate !== null) return 1
  if (leftDate !== null && rightDate === null) return -1
  if (leftDate !== null && rightDate !== null) {
    const dateResult = compareDateOnly(leftDate, rightDate)
    if (dateResult !== 0) return dateResult
  }

  const priorityResult = priorityRank[left.plan.priority] - priorityRank[right.plan.priority]
  if (priorityResult !== 0) return priorityResult

  const titleResult = left.gameTitle.localeCompare(right.gameTitle, locale === 'pl' ? 'pl-PL' : 'en-US')
  return titleResult !== 0 ? titleResult : left.plan.id.localeCompare(right.plan.id)
})
