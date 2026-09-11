import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, ExternalLink, Filter, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { matchesTitle } from '../domain/normalize'
import type { Game, GameEntry, GamePlan } from '../domain/model'
import { doesItPlayListUrl } from '../integrations/doesItPlay'
import { useTranslation } from '../i18n'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { EntryForm, GameForm, PlanForm } from '../ui/forms'
import { conditionLabelKey, completionLabelKey, formatDate, formatMoney, planStatusLabelKey, priorityLabelKey } from '../ui/format'

type ModalState =
  | { kind: 'game'; game?: Game }
  | { kind: 'entry'; gameId: string; entry?: GameEntry }
  | { kind: 'plan'; gameId: string; plan?: GamePlan }
  | { kind: 'convert'; plan: GamePlan }
  | null

type CompletionFilter = 'all' | 'started' | 'finished' | 'not-started'

export function CollectionPage() {
  const { data, addGame, updateGame, deleteGame, addEntry, updateEntry, deleteEntry, addPlan, updatePlan, deletePlan, convertPlan } = useCollection()
  const { t, plural } = useTranslation()
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('all')
  const [view, setView] = useState<'grouped' | 'flat'>('grouped')
  const [filter, setFilter] = useState<'all' | 'owned' | 'planned' | 'sealed' | 'used'>('all')
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>(null)

  const platforms = useMemo(() => [...new Set(data.entries.map((entry) => entry.platform).concat(data.plans.map((plan) => plan.platform).filter(Boolean)))].sort(), [data])
  const visibleGames = useMemo(() => data.games.filter((game) => {
    const entries = data.entries.filter((entry) => entry.gameId === game.id)
    const plans = data.plans.filter((plan) => plan.gameId === game.id)
    const titleMatch = matchesTitle(query, game.title, game.aliases)
    const platformMatch = platform === 'all' || entries.some((entry) => entry.platform === platform) || plans.some((plan) => plan.platform === platform)
    const filterMatch = filter === 'all'
      || (filter === 'owned' && entries.length > 0)
      || (filter === 'planned' && plans.length > 0)
      || (filter === 'sealed' && entries.some((entry) => entry.condition === 'sealed'))
      || (filter === 'used' && entries.some((entry) => entry.condition === 'used'))
    const completionMatch = completionFilter === 'all'
      || (completionFilter === 'started' && entries.some((entry) => entry.completion === 'not-completed'))
      || (completionFilter === 'finished' && entries.some((entry) => entry.completion === 'completed'))
      || (completionFilter === 'not-started' && entries.some((entry) => entry.completion === 'not-started'))
    return titleMatch && platformMatch && filterMatch && completionMatch
  }).sort((a, b) => a.title.localeCompare(b.title)), [completionFilter, data, filter, platform, query])

  const openGame = (game: Game): void => setExpanded((current) => new Set(current).add(game.id))
  const confirmDeleteGame = (game: Game): void => {
    if (window.confirm(t('collection.deleteGameConfirm', { title: game.title }))) deleteGame(game.id)
  }

  return (
    <div className="page-stack">
      <section className="page-heading-row">
        <div><p className="eyebrow">{t('collection.eyebrow')}</p><h1>{t('collection.title')}</h1><p className="page-lead">{plural('collection.pageLead', data.entries.length, { plans: data.plans.length })}</p></div>
        <button className="button button-primary" type="button" onClick={() => setModal({ kind: 'game' })}><Plus size={17} /> {t('common.addGame')}</button>
      </section>

      <section className="toolbar panel">
        <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('collection.searchPlaceholder')} /></label>
        <label className="select-field"><span>{t('collection.platform')}</span><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="all">{t('collection.all')}</option>{platforms.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="select-field"><span>{t('collection.completion')}</span><select value={completionFilter} onChange={(event) => setCompletionFilter(event.target.value as CompletionFilter)}><option value="all">{t('collection.all')}</option><option value="started">{t('collection.started')}</option><option value="finished">{t('collection.finished')}</option><option value="not-started">{t('collection.notStarted')}</option></select></label>
        <label className="select-field"><span>{t('collection.view')}</span><select value={view} onChange={(event) => setView(event.target.value as 'grouped' | 'flat')}><option value="grouped">{t('collection.grouped')}</option><option value="flat">{t('collection.flat')}</option></select></label>
        <div className="filter-tabs" aria-label={t('collection.filter')}>{[['all', 'collection.all'], ['owned', 'collection.owned'], ['planned', 'collection.plans'], ['sealed', 'collection.sealed'], ['used', 'collection.used']].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} type="button" onClick={() => setFilter(value as typeof filter)}><Filter size={13} />{t(label as Parameters<typeof t>[0])}</button>)}</div>
      </section>

      {visibleGames.length === 0 ? <EmptyState title={t('collection.noMatches')} description={data.games.length === 0 ? t('collection.emptyDescription') : t('collection.filteredDescription')} action={<button className="button button-primary" type="button" onClick={() => setModal({ kind: 'game' })}><Plus size={16} /> {t('common.addGame')}</button>} /> : view === 'grouped' ? <div className="game-list">{visibleGames.map((game) => <GameGroup key={game.id} game={game} expanded={expanded.has(game.id)} onToggle={() => setExpanded((current) => { const next = new Set(current); if (next.has(game.id)) next.delete(game.id); else next.add(game.id); return next })} onEdit={() => setModal({ kind: 'game', game })} onDelete={() => confirmDeleteGame(game)} onAddEntry={() => { openGame(game); setModal({ kind: 'entry', gameId: game.id }) }} onEditEntry={(entry) => setModal({ kind: 'entry', gameId: game.id, entry })} onDeleteEntry={deleteEntry} onAddPlan={() => { openGame(game); setModal({ kind: 'plan', gameId: game.id }) }} onEditPlan={(plan) => setModal({ kind: 'plan', gameId: game.id, plan })} onDeletePlan={deletePlan} onConvertPlan={(plan) => setModal({ kind: 'convert', plan })} />)}</div> : <FlatEntries games={visibleGames} entries={data.entries} onEdit={(entry) => setModal({ kind: 'entry', gameId: entry.gameId, entry })} onDelete={deleteEntry} />}

      {modal?.kind === 'game' && <Modal title={modal.game ? t('collection.editGame') : t('collection.addGame')} onClose={() => setModal(null)}><GameForm initial={modal.game} submitLabel={modal.game ? t('common.saveChanges') : t('common.addGame')} onCancel={() => setModal(null)} onSubmit={(values) => { if (modal.game) updateGame(modal.game.id, values); else { const created = addGame(values.title); if (created) updateGame(created.id, { aliases: values.aliases, notes: values.notes }) } setModal(null) }} /></Modal>}
      {modal?.kind === 'entry' && <Modal title={modal.entry ? t('collection.editCopy') : t('collection.addCopy')} wide onClose={() => setModal(null)}><EntryForm initial={modal.entry} submitLabel={modal.entry ? t('common.saveChanges') : t('common.addEntry')} onCancel={() => setModal(null)} onSubmit={(values) => { if (modal.entry) updateEntry(modal.entry.id, values); else addEntry(modal.gameId, values); setModal(null) }} /></Modal>}
      {modal?.kind === 'plan' && <Modal title={modal.plan ? t('collection.editPlan') : t('collection.addPlan')} wide onClose={() => setModal(null)}><PlanForm initial={modal.plan} submitLabel={modal.plan ? t('common.saveChanges') : t('common.addPlan')} onCancel={() => setModal(null)} onSubmit={(values) => { if (modal.plan) updatePlan(modal.plan.id, values); else addPlan(modal.gameId, values); setModal(null) }} /></Modal>}
      {modal?.kind === 'convert' && <Modal title={t('collection.convertPlan')} wide onClose={() => setModal(null)}><EntryForm initial={{ platform: modal.plan.platform, version: modal.plan.version, notes: modal.plan.notes, condition: 'unknown', completion: 'not-started' }} submitLabel={t('collection.addToCollection')} onCancel={() => setModal(null)} onSubmit={(values) => { convertPlan(modal.plan.id, values); setModal(null) }} /></Modal>}
    </div>
  )
}

interface GameGroupProps {
  game: Game
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddEntry: () => void
  onEditEntry: (entry: GameEntry) => void
  onDeleteEntry: (entryId: string) => void
  onAddPlan: () => void
  onEditPlan: (plan: GamePlan) => void
  onDeletePlan: (planId: string) => void
  onConvertPlan: (plan: GamePlan) => void
}

function GameGroup({ game, expanded, onToggle, onEdit, onDelete, onAddEntry, onEditEntry, onDeleteEntry, onAddPlan, onEditPlan, onDeletePlan, onConvertPlan }: GameGroupProps) {
  const { data } = useCollection()
  const { t, plural } = useTranslation()
  const entries = data.entries.filter((entry) => entry.gameId === game.id)
  const plans = data.plans.filter((plan) => plan.gameId === game.id)
  const completed = entries.some((entry) => entry.completion === 'completed')
  return <article className={`game-group${expanded ? ' expanded' : ''}`}><div className="game-group-header"><button className="group-toggle" type="button" onClick={onToggle}>{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}<span className="game-avatar large">{game.title.slice(0, 1).toUpperCase()}</span><span className="group-title"><strong>{game.title}</strong><small>{plural('collection.copy', entries.length)}{plans.length ? ` · ${plural('collection.plan', plans.length)}` : ''}</small></span></button><div className="group-summary">{completed && <span className="mini-status completed">{t('collection.completedStatus')}</span>}{entries.length > 0 && <span className="mini-status owned">{t('collection.ownedStatus')}</span>}{plans.length > 0 && <span className="mini-status planned">{t('collection.planStatus')}</span>}<button className="icon-button" type="button" aria-label={t('collection.editGameAria', { title: game.title })} onClick={onEdit}><Pencil size={15} /></button><button className="icon-button danger" type="button" aria-label={t('collection.deleteGameAria', { title: game.title })} onClick={onDelete}><Trash2 size={15} /></button></div></div>{expanded && <div className="game-group-body"><div className="group-actions"><button className="button button-small button-secondary" type="button" onClick={onAddEntry}><Plus size={14} /> {t('common.addEntry')}</button><button className="button button-small button-quiet" type="button" onClick={onAddPlan}><Plus size={14} /> {t('common.addPlan')}</button></div>{entries.map((entry) => <EntryRow key={entry.id} gameTitle={game.title} entry={entry} onEdit={() => onEditEntry(entry)} onDelete={() => { if (window.confirm(t('collection.deleteCopyConfirm'))) onDeleteEntry(entry.id) }} />)}{plans.map((plan) => <PlanRow key={plan.id} plan={plan} onEdit={() => onEditPlan(plan)} onDelete={() => { if (window.confirm(t('collection.deletePlanConfirm'))) onDeletePlan(plan.id) }} onConvert={() => onConvertPlan(plan)} />)}</div>}</article>
}

function EntryRow({ gameTitle, entry, onEdit, onDelete }: { gameTitle: string; entry: GameEntry; onEdit: () => void; onDelete: () => void }) {
  const { t, locale } = useTranslation()
  return <div className="entry-row"><span className="entry-type entry-owned">{t('collection.copyLabel')}</span><div className="entry-main"><strong>{entry.platform}</strong><span>{entry.version || t('common.baseVersion')} · {t(conditionLabelKey[entry.condition])}</span>{entry.notes && <small className="entry-notes">{entry.notes}</small>}</div><span className={`pill pill-${entry.completion}`}>{t(completionLabelKey[entry.completion])}</span><span className="entry-price">{formatMoney(entry.price, entry.currency, locale)}</span><div className="entry-actions"><DoesItPlayLink gameTitle={gameTitle} entry={entry} /><button className="icon-button" type="button" aria-label={t('collection.editCopyAria')} onClick={onEdit}><Pencil size={15} /></button><button className="icon-button danger" type="button" aria-label={t('collection.deleteCopyAria')} onClick={onDelete}><Trash2 size={15} /></button></div></div>
}

function DoesItPlayLink({ gameTitle, entry }: { gameTitle: string; entry: GameEntry }) {
  const { t } = useTranslation()
  return <a className="icon-button external-link" href={doesItPlayListUrl(entry.platform)} target="_blank" rel="noreferrer" title={t('collection.checkDoesItPlayTitle')} aria-label={t('collection.checkDoesItPlay', { title: gameTitle })}><ExternalLink size={15} /></a>
}

function PlanRow({ plan, onEdit, onDelete, onConvert }: { plan: GamePlan; onEdit: () => void; onDelete: () => void; onConvert: () => void }) {
  const { t, locale } = useTranslation()
  return <div className="entry-row plan-row"><span className="entry-type entry-plan">{t('collection.planLabel')}</span><div className="entry-main"><strong>{plan.platform || t('common.anyPlatform')}</strong><span>{plan.version || t('common.anyVersion')} · {t(planStatusLabelKey[plan.status])} · {t('collection.priority')} {t(priorityLabelKey[plan.priority])}</span></div><span className="plan-date">{formatDate(plan.plannedDate, locale)}</span><span className="entry-price">{formatMoney(plan.targetPrice, plan.currency, locale)}</span><div className="entry-actions"><button className="icon-button" type="button" aria-label={t('collection.markPurchased')} onClick={onConvert}><Check size={15} /></button><button className="icon-button" type="button" aria-label={t('collection.editPlanAria')} onClick={onEdit}><Pencil size={15} /></button><button className="icon-button danger" type="button" aria-label={t('collection.deletePlanAria')} onClick={onDelete}><Trash2 size={15} /></button></div></div>
}

function FlatEntries({ games, entries, onEdit, onDelete }: { games: Game[]; entries: GameEntry[]; onEdit: (entry: GameEntry) => void; onDelete: (entryId: string) => void }) {
  const { t, locale } = useTranslation()
  const gameIds = new Set(games.map((game) => game.id))
  const filtered = entries.filter((entry) => gameIds.has(entry.gameId))
  return <div className="flat-table panel"><div className="flat-table-header"><span>{t('collection.tableGame')}</span><span>{t('collection.tablePlatform')}</span><span>{t('collection.tableVersion')}</span><span>{t('collection.tableCondition')}</span><span>{t('collection.tableStatus')}</span><span>{t('collection.tablePrice')}</span><span>{t('collection.tableNotes')}</span><span /></div>{filtered.map((entry) => <div className="flat-table-row" key={entry.id}><strong data-label={t('collection.tableGame')}>{games.find((game) => game.id === entry.gameId)?.title}</strong><span data-label={t('collection.tablePlatform')}>{entry.platform}</span><span data-label={t('collection.tableVersion')}>{entry.version || '—'}</span><span data-label={t('collection.tableCondition')}>{t(conditionLabelKey[entry.condition])}</span><span data-label={t('collection.tableStatus')}>{t(completionLabelKey[entry.completion])}</span><span data-label={t('collection.tablePrice')}>{formatMoney(entry.price, entry.currency, locale)}</span><span className="flat-notes" data-label={t('collection.tableNotes')}>{entry.notes || '—'}</span><span className="flat-actions"><DoesItPlayLink gameTitle={games.find((game) => game.id === entry.gameId)?.title ?? t('dashboard.unknownGame')} entry={entry} /><button className="icon-button" type="button" aria-label={t('common.edit')} onClick={() => onEdit(entry)}><Pencil size={15} /></button><button className="icon-button danger" type="button" aria-label={t('common.delete')} onClick={() => { if (window.confirm(t('collection.deleteCopyConfirm'))) onDelete(entry.id) }}><Trash2 size={15} /></button></span></div>)}</div>
}
