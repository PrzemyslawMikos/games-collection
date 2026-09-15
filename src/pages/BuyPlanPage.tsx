import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarPlus, Check, Pencil, Trash2 } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { differenceInDays, todayDateOnly } from '../domain/dateOnly'
import { createPlanCalendarIcs, type ReminderKind } from '../domain/ics'
import { isPlanOverdue, sortPlanItems, type PlanListItem } from '../domain/plans'
import { collectSuggestions } from '../domain/suggestions'
import type { GameEntry, GamePlan } from '../domain/model'
import { useTranslation } from '../i18n'
import { formatDate, formatMoney, planStatusLabelKey, priorityLabelKey } from '../ui/format'
import { downloadTextFile, safeFilename } from '../ui/download'
import { EmptyState } from '../ui/EmptyState'
import { PlanConversionModal, PlanModal } from '../ui/PlanModal'

type SortMode = 'date' | 'priority' | 'title'

export function BuyPlanPage() {
  const { data, updatePlan, deletePlan, convertPlan } = useCollection()
  const { t, locale, plural } = useTranslation()
  const [sortMode, setSortMode] = useState<SortMode>('date')
  const [editingPlan, setEditingPlan] = useState<GamePlan | null>(null)
  const [convertingPlan, setConvertingPlan] = useState<GamePlan | null>(null)
  const today = todayDateOnly()
  const platformSuggestions = useMemo(() => collectSuggestions(data.entries.map((entry) => entry.platform).concat(data.plans.map((plan) => plan.platform))), [data])
  const currencySuggestions = useMemo(() => collectSuggestions(data.entries.map((entry) => entry.currency).concat(data.plans.map((plan) => plan.currency)), (value) => value.trim().toUpperCase()), [data])
  const plans = useMemo<PlanListItem[]>(() => sortPlanItems(data.plans.map((plan) => ({ plan, gameTitle: data.games.find((game) => game.id === plan.gameId)?.title ?? t('dashboard.unknownGame') })), locale), [data, locale, t])
  const visiblePlans = useMemo(() => {
    if (sortMode === 'date') return plans
    return [...plans].sort((left, right) => {
      if (left.plan.plannedDate === null && right.plan.plannedDate !== null) return 1
      if (left.plan.plannedDate !== null && right.plan.plannedDate === null) return -1
      if (sortMode === 'title') return left.gameTitle.localeCompare(right.gameTitle, locale === 'pl' ? 'pl-PL' : 'en-US') || (left.plan.plannedDate ?? '').localeCompare(right.plan.plannedDate ?? '') || left.plan.id.localeCompare(right.plan.id)
      const priority = { high: 0, normal: 1, low: 2 } as const
      return priority[left.plan.priority] - priority[right.plan.priority] || (left.plan.plannedDate ?? '').localeCompare(right.plan.plannedDate ?? '') || left.gameTitle.localeCompare(right.gameTitle, locale === 'pl' ? 'pl-PL' : 'en-US') || left.plan.id.localeCompare(right.plan.id)
    })
  }, [locale, plans, sortMode])

  const exportCalendar = (item: PlanListItem): void => {
    if (!item.plan.plannedDate || isPlanOverdue(item.plan, today)) return
    const reminderLabels: Record<ReminderKind, string> = {
      twoMonths: t('buyPlan.reminderTwoMonths'),
      oneMonth: t('buyPlan.reminderOneMonth'),
      sevenDays: t('buyPlan.reminderSevenDays'),
      oneDay: t('buyPlan.reminderOneDay'),
    }
    const details = [
      `${t('buyPlan.calendarTargetDate')}: ${formatDate(item.plan.plannedDate, locale)}`,
      item.plan.platform ? `${t('buyPlan.calendarPlatform')}: ${item.plan.platform}` : '',
      item.plan.version ? `${t('buyPlan.calendarVersion')}: ${item.plan.version}` : '',
      item.plan.targetPrice !== null ? `${t('buyPlan.calendarPrice')}: ${formatMoney(item.plan.targetPrice, item.plan.currency, locale)}` : '',
      item.plan.notes ? `${t('buyPlan.calendarNotes')}: ${item.plan.notes}` : '',
    ].filter(Boolean).join('\n')
    const summaries = Object.fromEntries(Object.entries(reminderLabels).map(([kind, reminder]) => [kind, t('buyPlan.calendarSummary', { title: item.gameTitle, reminder })])) as Record<ReminderKind, string>
    const ics = createPlanCalendarIcs({ plan: item.plan, labels: { summaries, description: t('buyPlan.calendarDescription', { title: item.gameTitle, details }), alarmDescription: t('buyPlan.calendarAlarm') } })
    downloadTextFile(ics, `${safeFilename(item.gameTitle)}-purchase-reminders.ics`, 'text/calendar;charset=utf-8')
  }

  const confirmDelete = (item: PlanListItem): void => {
    if (window.confirm(t('collection.deletePlanConfirm'))) deletePlan(item.plan.id)
  }

  return <div className="page-stack">
    <section className="page-heading-row">
      <div><p className="eyebrow">{t('buyPlan.eyebrow')}</p><h1>{t('buyPlan.title')}</h1><p className="page-lead">{t('buyPlan.description')}</p></div>
      <span className="count-badge">{plural('buyPlan.planCount', visiblePlans.length)}</span>
    </section>

    {visiblePlans.length > 0 && <section className="toolbar panel buy-plan-toolbar">
      <label className="select-field"><span>{t('buyPlan.sort')}</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="date">{t('buyPlan.sortDate')}</option><option value="priority">{t('buyPlan.sortPriority')}</option><option value="title">{t('buyPlan.sortTitle')}</option></select></label>
    </section>}

    {visiblePlans.length === 0 ? <EmptyState title={t('buyPlan.emptyTitle')} description={t('buyPlan.emptyDescription')} /> : <div className="buy-plan-list">
      {visiblePlans.map((item) => <BuyPlanRow key={item.plan.id} item={item} today={today} onEdit={() => setEditingPlan(item.plan)} onConvert={() => setConvertingPlan(item.plan)} onDelete={() => confirmDelete(item)} onExport={() => exportCalendar(item)} />)}
    </div>}

    {editingPlan && <PlanModal plan={editingPlan} platformSuggestions={platformSuggestions} currencySuggestions={currencySuggestions} onClose={() => setEditingPlan(null)} onSubmit={(values) => { updatePlan(editingPlan.id, values); setEditingPlan(null) }} />}
    {convertingPlan && <PlanConversionModal plan={convertingPlan} platformSuggestions={platformSuggestions} currencySuggestions={currencySuggestions} onClose={() => setConvertingPlan(null)} onSubmit={(values: Partial<Omit<GameEntry, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => { convertPlan(convertingPlan.id, values); setConvertingPlan(null) }} />}
  </div>
}

function BuyPlanRow({ item, today, onEdit, onConvert, onDelete, onExport }: { item: PlanListItem; today: string; onEdit: () => void; onConvert: () => void; onDelete: () => void; onExport: () => void }) {
  const { t, locale, plural } = useTranslation()
  const overdue = isPlanOverdue(item.plan, today)
  const noCalendar = !item.plan.plannedDate || overdue
  const daysToPremiere = item.plan.plannedDate ? differenceInDays(today, item.plan.plannedDate) : null
  return <article className={`buy-plan-row${overdue ? ' buy-plan-row-overdue' : ''}`}>
    <div className="buy-plan-main">
      <div className="buy-plan-title"><span className="entry-type entry-plan">{t('collection.planLabel')}</span><div><h2>{item.gameTitle}</h2><p>{item.plan.platform || t('common.anyPlatform')} · {item.plan.version || t('common.anyVersion')}</p></div></div>
      <div className="buy-plan-meta">
        <span className="buy-plan-date"><strong>{formatDate(item.plan.plannedDate, locale)}</strong>{daysToPremiere !== null && <span className="days-to-premiere">{plural(overdue ? 'buyPlan.overdueDays' : 'buyPlan.daysToPremiere', Math.abs(daysToPremiere), { count: Math.abs(daysToPremiere) })}</span>}{overdue && <span className="overdue-label"><AlertTriangle size={13} />{t('buyPlan.overdue')}</span>}{!item.plan.plannedDate && <span className="not-scheduled-label">{t('buyPlan.notScheduled')}</span>}</span>
        <span className={`pill plan-status-${item.plan.status}`}>{t(planStatusLabelKey[item.plan.status])}</span>
        <span className="buy-plan-priority">{t('collection.priority')}: {t(priorityLabelKey[item.plan.priority])}</span>
        <span className="entry-price">{formatMoney(item.plan.targetPrice, item.plan.currency, locale)}</span>
      </div>
      {item.plan.notes && <p className="buy-plan-notes">{item.plan.notes}</p>}
      {noCalendar && <p className="buy-plan-hint">{overdue ? t('buyPlan.calendarOverdue') : t('buyPlan.calendarUnavailable')}</p>}
    </div>
    <div className="buy-plan-actions">
      <button className="icon-button" type="button" aria-label={t('buyPlan.markPurchasedAria', { title: item.gameTitle })} title={t('collection.markPurchased')} onClick={onConvert}><Check size={16} /></button>
      <button className="icon-button" type="button" aria-label={t('buyPlan.calendarAria', { title: item.gameTitle })} title={noCalendar ? (overdue ? t('buyPlan.calendarOverdue') : t('buyPlan.calendarUnavailable')) : t('buyPlan.addCalendar')} disabled={noCalendar} onClick={onExport}><CalendarPlus size={16} /></button>
      <button className="icon-button" type="button" aria-label={t('buyPlan.editAria', { title: item.gameTitle })} title={t('common.edit')} onClick={onEdit}><Pencil size={16} /></button>
      <button className="icon-button danger" type="button" aria-label={t('buyPlan.deleteAria', { title: item.gameTitle })} title={t('common.delete')} onClick={onDelete}><Trash2 size={16} /></button>
    </div>
  </article>
}
