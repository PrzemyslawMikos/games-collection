import { useMemo, useState } from 'react'
import { ArrowRightLeft, Check, Pencil, Search, Tag, Trash2 } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import type { Game } from '../domain/model'
import { matchesTitle } from '../domain/normalize'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { GameForm } from '../ui/forms'

export function GamesPage() {
  const { data, updateGame, mergeGames, deleteGame } = useCollection()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Game | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeTarget, setMergeTarget] = useState('')

  const games = useMemo(() => data.games.filter((game) => matchesTitle(query, game.title, game.aliases)).sort((a, b) => a.title.localeCompare(b.title)), [data.games, query])
  const selectedGames = games.filter((game) => selected.has(game.id))

  const toggle = (id: string): void => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const openMerge = (): void => {
    if (selectedGames.length !== 2) return
    setMergeTarget(selectedGames[0].id)
    setMergeOpen(true)
  }
  const performMerge = (): void => {
    const source = selectedGames.find((game) => game.id !== mergeTarget)
    if (!source) return
    mergeGames(mergeTarget, source.id)
    setSelected(new Set())
    setMergeOpen(false)
  }

  return <div className="page-stack">
    <section className="page-heading-row"><div><p className="eyebrow">KATALOG TYTUŁÓW</p><h1>Gry kanoniczne</h1><p className="page-lead">Jeden tytuł może mieć wiele platform, wydań i egzemplarzy.</p></div><span className="count-badge">{data.games.length} tytułów</span></section>
    <section className="toolbar panel"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj tytułu lub aliasu…" /></label>{selectedGames.length === 2 && <button className="button button-secondary" type="button" onClick={openMerge}><ArrowRightLeft size={16} /> Połącz tytuły</button>}<span className="toolbar-hint">Zaznacz dwa tytuły, aby połączyć je w jeden.</span></section>
    {games.length === 0 ? <EmptyState title="Brak tytułów" description="Dodaj grę w widoku kolekcji albo zaimportuj arkusz." /> : <div className="canonical-list">{games.map((game) => { const entries = data.entries.filter((entry) => entry.gameId === game.id); const plans = data.plans.filter((plan) => plan.gameId === game.id); const isSelected = selected.has(game.id); return <article className={`canonical-card${isSelected ? ' selected' : ''}`} key={game.id}><button className={`check-box${isSelected ? ' checked' : ''}`} type="button" aria-label={`Wybierz ${game.title}`} onClick={() => toggle(game.id)}>{isSelected && <Check size={14} />}</button><div className="canonical-main"><div className="canonical-title-row"><span className="game-avatar">{game.title.slice(0, 1).toUpperCase()}</span><div><h2>{game.title}</h2><span>{entries.length} egz. · {plans.length} plan.</span></div></div>{game.aliases.length > 0 && <div className="alias-list"><Tag size={13} />{game.aliases.map((alias) => <span key={alias}>{alias}</span>)}</div>}{game.notes && <p className="canonical-notes">{game.notes}</p>}</div><div className="canonical-counts"><strong>{entries.length}</strong><span>egzemplarzy</span></div><div className="canonical-counts"><strong>{plans.length}</strong><span>planów</span></div><button className="icon-button" type="button" aria-label={`Edytuj ${game.title}`} onClick={() => setEditing(game)}><Pencil size={16} /></button><button className="icon-button danger" type="button" aria-label={`Usuń ${game.title}`} onClick={() => { if (window.confirm(`Usunąć ${game.title} wraz z wpisami?`)) deleteGame(game.id) }}><Trash2 size={16} /></button></article>})}</div>}
    {editing && <Modal title="Edytuj tytuł" onClose={() => setEditing(null)}><GameForm initial={editing} submitLabel="Zapisz zmiany" onCancel={() => setEditing(null)} onSubmit={(values) => { updateGame(editing.id, values); setEditing(null) }} /></Modal>}
    {mergeOpen && <Modal title="Połącz tytuły" onClose={() => setMergeOpen(false)}><div className="form-stack"><p className="modal-copy">Wybierz tytuł, który pozostanie nazwą kanoniczną. Egzemplarze, plany i aliasy drugiego tytułu zostaną przeniesione.</p><label className="field"><span>Pozostaw jako główny</span><select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)}>{selectedGames.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}</select></label><div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setMergeOpen(false)}>Anuluj</button><button className="button button-primary" type="button" onClick={performMerge}>Połącz tytuły</button></div></div></Modal>}
  </div>
}
