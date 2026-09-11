import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Filter, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { matchesTitle } from '../domain/normalize'
import type { Game, GameEntry, GamePlan } from '../domain/model'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { EntryForm, GameForm, PlanForm } from '../ui/forms'
import { conditionLabel, completionLabel, formatDate, formatMoney, planStatusLabel, priorityLabel } from '../ui/format'

type ModalState =
  | { kind: 'game'; game?: Game }
  | { kind: 'entry'; gameId: string; entry?: GameEntry }
  | { kind: 'plan'; gameId: string; plan?: GamePlan }
  | { kind: 'convert'; plan: GamePlan }
  | null

export function CollectionPage() {
  const { data, addGame, updateGame, deleteGame, addEntry, updateEntry, deleteEntry, addPlan, updatePlan, deletePlan, convertPlan } = useCollection()
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('all')
  const [view, setView] = useState<'grouped' | 'flat'>('grouped')
  const [filter, setFilter] = useState<'all' | 'owned' | 'planned' | 'completed' | 'sealed' | 'used'>('all')
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
      || (filter === 'completed' && entries.some((entry) => entry.completion === 'completed'))
      || (filter === 'sealed' && entries.some((entry) => entry.condition === 'sealed'))
      || (filter === 'used' && entries.some((entry) => entry.condition === 'used'))
    return titleMatch && platformMatch && filterMatch
  }).sort((a, b) => a.title.localeCompare(b.title)), [data, filter, platform, query])

  const openGame = (game: Game): void => setExpanded((current) => new Set(current).add(game.id))
  const confirmDeleteGame = (game: Game): void => {
    if (window.confirm(`Usunąć „${game.title}” wraz z wpisami i planami?`)) deleteGame(game.id)
  }

  return (
    <div className="page-stack">
      <section className="page-heading-row">
        <div><p className="eyebrow">KATALOG KOLEKCJI</p><h1>Twoje gry</h1><p className="page-lead">{data.entries.length} fizycznych egzemplarzy · {data.plans.length} planów zakupowych</p></div>
        <button className="button button-primary" type="button" onClick={() => setModal({ kind: 'game' })}><Plus size={17} /> Dodaj grę</button>
      </section>

      <section className="toolbar panel">
        <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj po tytule lub aliasie…" /></label>
        <label className="select-field"><span>Platforma</span><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="all">Wszystkie</option>{platforms.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="select-field"><span>Widok</span><select value={view} onChange={(event) => setView(event.target.value as 'grouped' | 'flat')}><option value="grouped">Pogrupowany</option><option value="flat">Płaska lista</option></select></label>
        <div className="filter-tabs" aria-label="Filtruj kolekcję">{[['all', 'Wszystkie'], ['owned', 'Posiadane'], ['planned', 'Plany'], ['completed', 'Ukończone'], ['sealed', 'Zafoliowane'], ['used', 'Używane']].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} type="button" onClick={() => setFilter(value as typeof filter)}><Filter size={13} />{label}</button>)}</div>
      </section>

      {visibleGames.length === 0 ? <EmptyState title="Brak pasujących gier" description={data.games.length === 0 ? 'Dodaj pierwszy tytuł albo zaimportuj istniejący arkusz.' : 'Zmień wyszukiwanie lub wyczyść filtry.'} action={<button className="button button-primary" type="button" onClick={() => setModal({ kind: 'game' })}><Plus size={16} /> Dodaj grę</button>} /> : view === 'grouped' ? <div className="game-list">{visibleGames.map((game) => <GameGroup key={game.id} game={game} expanded={expanded.has(game.id)} onToggle={() => setExpanded((current) => { const next = new Set(current); if (next.has(game.id)) next.delete(game.id); else next.add(game.id); return next })} onEdit={() => setModal({ kind: 'game', game })} onDelete={() => confirmDeleteGame(game)} onAddEntry={() => { openGame(game); setModal({ kind: 'entry', gameId: game.id }) }} onEditEntry={(entry) => setModal({ kind: 'entry', gameId: game.id, entry })} onDeleteEntry={deleteEntry} onAddPlan={() => { openGame(game); setModal({ kind: 'plan', gameId: game.id }) }} onEditPlan={(plan) => setModal({ kind: 'plan', gameId: game.id, plan })} onDeletePlan={deletePlan} onConvertPlan={(plan) => setModal({ kind: 'convert', plan })} />)}</div> : <FlatEntries games={visibleGames} entries={data.entries} onEdit={(entry) => setModal({ kind: 'entry', gameId: entry.gameId, entry })} onDelete={deleteEntry} />}

      {modal?.kind === 'game' && <Modal title={modal.game ? 'Edytuj grę' : 'Dodaj grę'} onClose={() => setModal(null)}><GameForm initial={modal.game} submitLabel={modal.game ? 'Zapisz zmiany' : 'Dodaj grę'} onCancel={() => setModal(null)} onSubmit={(values) => { if (modal.game) updateGame(modal.game.id, values); else { const created = addGame(values.title); if (created) updateGame(created.id, { aliases: values.aliases, notes: values.notes }) } setModal(null) }} /></Modal>}
      {modal?.kind === 'entry' && <Modal title={modal.entry ? 'Edytuj egzemplarz' : 'Dodaj egzemplarz'} wide onClose={() => setModal(null)}><EntryForm initial={modal.entry} submitLabel={modal.entry ? 'Zapisz zmiany' : 'Dodaj egzemplarz'} onCancel={() => setModal(null)} onSubmit={(values) => { if (modal.entry) updateEntry(modal.entry.id, values); else addEntry(modal.gameId, values); setModal(null) }} /></Modal>}
      {modal?.kind === 'plan' && <Modal title={modal.plan ? 'Edytuj plan zakupu' : 'Dodaj plan zakupu'} wide onClose={() => setModal(null)}><PlanForm initial={modal.plan} submitLabel={modal.plan ? 'Zapisz zmiany' : 'Dodaj plan'} onCancel={() => setModal(null)} onSubmit={(values) => { if (modal.plan) updatePlan(modal.plan.id, values); else addPlan(modal.gameId, values); setModal(null) }} /></Modal>}
      {modal?.kind === 'convert' && <Modal title="Zamień plan na egzemplarz" wide onClose={() => setModal(null)}><EntryForm initial={{ platform: modal.plan.platform, version: modal.plan.version, notes: modal.plan.notes, condition: 'unknown', completion: 'not-started' }} submitLabel="Dodaj do kolekcji" onCancel={() => setModal(null)} onSubmit={(values) => { convertPlan(modal.plan.id, values); setModal(null) }} /></Modal>}
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
  const entries = data.entries.filter((entry) => entry.gameId === game.id)
  const plans = data.plans.filter((plan) => plan.gameId === game.id)
  const completed = entries.some((entry) => entry.completion === 'completed')
  return <article className={`game-group${expanded ? ' expanded' : ''}`}><div className="game-group-header"><button className="group-toggle" type="button" onClick={onToggle}>{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}<span className="game-avatar large">{game.title.slice(0, 1).toUpperCase()}</span><span className="group-title"><strong>{game.title}</strong><small>{entries.length} {entries.length === 1 ? 'egzemplarz' : 'egzemplarze'}{plans.length ? ` · ${plans.length} plan` : ''}</small></span></button><div className="group-summary">{completed && <span className="mini-status completed">Ukończona</span>}{entries.length > 0 && <span className="mini-status owned">Posiadana</span>}{plans.length > 0 && <span className="mini-status planned">Plan</span>}<button className="icon-button" type="button" aria-label={`Edytuj ${game.title}`} onClick={onEdit}><Pencil size={15} /></button><button className="icon-button danger" type="button" aria-label={`Usuń ${game.title}`} onClick={onDelete}><Trash2 size={15} /></button></div></div>{expanded && <div className="game-group-body"><div className="group-actions"><button className="button button-small button-secondary" type="button" onClick={onAddEntry}><Plus size={14} /> Dodaj egzemplarz</button><button className="button button-small button-quiet" type="button" onClick={onAddPlan}><Plus size={14} /> Dodaj plan</button></div>{entries.map((entry) => <EntryRow key={entry.id} entry={entry} onEdit={() => onEditEntry(entry)} onDelete={() => { if (window.confirm('Usunąć ten egzemplarz?')) onDeleteEntry(entry.id) }} />)}{plans.map((plan) => <PlanRow key={plan.id} plan={plan} onEdit={() => onEditPlan(plan)} onDelete={() => { if (window.confirm('Usunąć ten plan?')) onDeletePlan(plan.id) }} onConvert={() => onConvertPlan(plan)} />)}</div>}</article>
}

function EntryRow({ entry, onEdit, onDelete }: { entry: GameEntry; onEdit: () => void; onDelete: () => void }) {
  return <div className="entry-row"><span className="entry-type entry-owned">Egzemplarz</span><div className="entry-main"><strong>{entry.platform}</strong><span>{entry.version || 'Wersja podstawowa'} · {conditionLabel[entry.condition]}</span></div><span className={`pill pill-${entry.completion}`}>{completionLabel[entry.completion]}</span><span className="entry-price">{formatMoney(entry.price, entry.currency)}</span><div className="entry-actions"><button className="icon-button" type="button" aria-label="Edytuj egzemplarz" onClick={onEdit}><Pencil size={15} /></button><button className="icon-button danger" type="button" aria-label="Usuń egzemplarz" onClick={onDelete}><Trash2 size={15} /></button></div></div>
}

function PlanRow({ plan, onEdit, onDelete, onConvert }: { plan: GamePlan; onEdit: () => void; onDelete: () => void; onConvert: () => void }) {
  return <div className="entry-row plan-row"><span className="entry-type entry-plan">Plan</span><div className="entry-main"><strong>{plan.platform || 'Dowolna platforma'}</strong><span>{plan.version || 'Dowolna wersja'} · {planStatusLabel[plan.status]} · priorytet {priorityLabel[plan.priority]}</span></div><span className="plan-date">{formatDate(plan.plannedDate)}</span><span className="entry-price">{formatMoney(plan.targetPrice, plan.currency)}</span><div className="entry-actions"><button className="icon-button" type="button" aria-label="Oznacz jako kupione" onClick={onConvert}><Check size={15} /></button><button className="icon-button" type="button" aria-label="Edytuj plan" onClick={onEdit}><Pencil size={15} /></button><button className="icon-button danger" type="button" aria-label="Usuń plan" onClick={onDelete}><Trash2 size={15} /></button></div></div>
}

function FlatEntries({ games, entries, onEdit, onDelete }: { games: Game[]; entries: GameEntry[]; onEdit: (entry: GameEntry) => void; onDelete: (entryId: string) => void }) {
  const gameIds = new Set(games.map((game) => game.id))
  const filtered = entries.filter((entry) => gameIds.has(entry.gameId))
  return <div className="flat-table panel"><div className="flat-table-header"><span>Gra</span><span>Platforma</span><span>Wersja</span><span>Stan</span><span>Status</span><span>Cena</span><span /></div>{filtered.map((entry) => <div className="flat-table-row" key={entry.id}><strong data-label="Gra">{games.find((game) => game.id === entry.gameId)?.title}</strong><span data-label="Platforma">{entry.platform}</span><span data-label="Wersja">{entry.version || '—'}</span><span data-label="Stan">{conditionLabel[entry.condition]}</span><span data-label="Status">{completionLabel[entry.completion]}</span><span data-label="Cena">{formatMoney(entry.price, entry.currency)}</span><span className="flat-actions"><button className="icon-button" type="button" aria-label="Edytuj" onClick={() => onEdit(entry)}><Pencil size={15} /></button><button className="icon-button danger" type="button" aria-label="Usuń" onClick={() => { if (window.confirm('Usunąć ten egzemplarz?')) onDelete(entry.id) }}><Trash2 size={15} /></button></span></div>)}</div>
}
