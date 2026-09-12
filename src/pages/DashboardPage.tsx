import { useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Check, CircleCheck, Coins, GripVertical, Package, Plus, ShoppingBag, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCollection } from '../app/useCollection'
import { useTranslation } from '../i18n'
import { AutocompleteField } from '../ui/AutocompleteField'
import {
  CompletionDistributionChart,
  ConditionDistributionChart,
  OwnershipDistributionChart,
  PlatformDistributionChart,
  PurchaseTimelineChart,
  SpendingChart,
} from '../ui/DashboardCharts'
import { formatMoney } from '../ui/format'
import { Modal } from '../ui/Modal'

export function DashboardPage() {
  const { data, stats } = useCollection()
  const { t, plural, locale } = useTranslation()
  const latestEntries = [...data.entries]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  const gameName = (gameId: string): string => data.games.find((game) => game.id === gameId)?.title ?? t('dashboard.unknownGame')
  const spend = stats.totalSpend.map((item) => formatMoney(item.amount, item.currency, locale)).join(' + ') || formatMoney(0, 'PLN', locale)

  return (
    <div className="page-stack">
      <section className="hero-row">
        <div>
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1>{t('dashboard.titleLine1')}<br /><em>{t('dashboard.titleLine2')}</em></h1>
          <p className="hero-copy">{t('dashboard.description')}</p>
        </div>
        <div className="hero-note">
          <Sparkles size={18} />
          <span>{stats.plannedGames === 0 ? t('dashboard.noPlans') : plural('dashboard.plansWaiting', stats.plannedGames)}</span>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard icon={<Package size={20} />} label={t('dashboard.catalogGames')} value={stats.totalGames} detail={plural('dashboard.ownedCount', stats.ownedGames)} accent="coral" />
        <StatCard icon={<ShoppingBag size={20} />} label={t('dashboard.copies')} value={stats.totalEntries} detail={plural('dashboard.sealedCount', stats.sealedEntries)} accent="blue" />
        <StatCard icon={<CircleCheck size={20} />} label={t('dashboard.completed')} value={stats.completedGames} detail={t('dashboard.completedCopies', { count: stats.completionProgress })} accent="green" />
        <StatCard icon={<Coins size={20} />} label={t('dashboard.spent')} value={spend} detail={t(stats.plannedBudget.length ? 'dashboard.plusPlannedBudget' : 'dashboard.noPlannedPrices')} accent="gold" />
      </section>

      <section className="dashboard-grid">
        <div className="panel progress-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.progressEyebrow')}</p><h2>{t('dashboard.progressTitle')}</h2></div><Link className="text-link" to="/collection">{t('dashboard.openCollection')} <ArrowRight size={15} /></Link></div>
          <div className="progress-visual">
            <div className="progress-ring" style={{ '--progress': `${stats.ownedGames === 0 ? 0 : Math.round((stats.completedGames / stats.ownedGames) * 100)}%` } as React.CSSProperties}>
              <strong>{stats.ownedGames === 0 ? 0 : Math.round((stats.completedGames / stats.ownedGames) * 100)}%</strong><span>{t('dashboard.completedGames')}</span>
            </div>
            <div className="progress-list">
              <ProgressLine label={t('dashboard.ownedGames')} value={stats.ownedGames} total={Math.max(stats.totalGames, 1)} color="coral" />
              <ProgressLine label={t('dashboard.completedGames')} value={stats.completedGames} total={Math.max(stats.ownedGames, 1)} color="green" />
              <ProgressLine label={t('dashboard.plannedPurchases')} value={stats.plannedGames} total={Math.max(stats.totalGames, 1)} color="gold" />
            </div>
          </div>
        </div>

        <div className="panel chart-panel platform-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.platformsEyebrow')}</p><h2>{t('dashboard.collectionBreakdown')}</h2></div><Link className="icon-link" to="/collection" aria-label={t('dashboard.viewCollection')}><ArrowRight size={17} /></Link></div>
          <PlatformDistributionChart data={stats.platformDistribution} />
        </div>
      </section>

      <FuturePlayPanel />

      <section className="chart-grid">
        <div className="panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.ownershipEyebrow')}</p><h2>{t('dashboard.ownershipStatus')}</h2></div></div>
          <OwnershipDistributionChart data={stats.ownershipTotals} />
        </div>
        <div className="panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.completionEyebrow')}</p><h2>{t('dashboard.completionStatus')}</h2></div></div>
          <CompletionDistributionChart data={stats.completionTotals} />
        </div>
        <div className="panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.conditionEyebrow')}</p><h2>{t('dashboard.conditionStatus')}</h2></div></div>
          <ConditionDistributionChart data={stats.conditionTotals} />
        </div>
        <div className="panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.spendingEyebrow')}</p><h2>{t('dashboard.byPlatform')}</h2></div></div>
          <SpendingChart data={stats.platformSpending} />
        </div>
      </section>

      <section className="panel chart-panel chart-panel-wide">
        <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.historyEyebrow')}</p><h2>{t('dashboard.purchasesOverTime')}</h2></div></div>
        <PurchaseTimelineChart data={stats.purchaseTimeline} />
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.recentEyebrow')}</p><h2>{t('dashboard.recentlyUpdated')}</h2></div><Link className="text-link" to="/collection">{t('dashboard.allEntries')} <ArrowRight size={15} /></Link></div>
        {latestEntries.length === 0 ? <p className="muted-copy">{t('dashboard.readyForFirstEntry')}</p> : <div className="recent-list">{latestEntries.map((entry) => <div className="recent-row" key={entry.id}><div className="game-avatar">{gameName(entry.gameId).slice(0, 1).toUpperCase()}</div><div><strong>{gameName(entry.gameId)}</strong><span>{entry.platform} {entry.version && `· ${entry.version}`}</span></div><span className={`pill pill-${entry.completion}`}>{entry.completion === 'completed' ? t('dashboard.completedStatus') : entry.completion === 'not-completed' ? t('dashboard.notCompletedStatus') : t('dashboard.notStartedStatus')}</span><strong className="recent-price">{formatMoney(entry.price, entry.currency, locale)}</strong></div>)}</div>}
      </section>
    </div>
  )
}

function FuturePlayPanel() {
  const { data, addFuturePlayGame, finishFuturePlayGame, moveFuturePlayGame, reorderFuturePlayGame } = useCollection()
  const { t } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectionError, setSelectionError] = useState('')
  const [draggedGameId, setDraggedGameId] = useState<string | null>(null)
  const ownedGameIds = new Set(data.entries.map((entry) => entry.gameId))
  const unfinishedGameIds = new Set(data.entries.filter((entry) => entry.completion !== 'completed').map((entry) => entry.gameId))
  const candidates = data.games
    .filter((game) => ownedGameIds.has(game.id) && unfinishedGameIds.has(game.id) && !data.futurePlayGameIds.includes(game.id))
    .sort((a, b) => a.title.localeCompare(b.title))
  const rows = data.futurePlayGameIds
    .map((gameId) => data.games.find((game) => game.id === gameId))
    .filter((game): game is NonNullable<typeof game> => Boolean(game))

  const openAdd = (): void => {
    setSelectedTitle('')
    setSelectedGameId(null)
    setSelectionError('')
    setAddOpen(true)
  }

  const addGame = (): void => {
    if (!selectedGameId) {
      setSelectionError(t('dashboard.futurePlayChooseGame'))
      return
    }
    addFuturePlayGame(selectedGameId)
    setAddOpen(false)
  }

  const platformNames = (gameId: string): string[] => {
    const platforms = new Map<string, string>()
    for (const entry of data.entries.filter((candidate) => candidate.gameId === gameId)) {
      const platform = entry.platform.trim()
      if (platform) platforms.set(platform.toLocaleLowerCase(), platform)
    }
    return [...platforms.values()].sort((a, b) => a.localeCompare(b))
  }

  return (
    <section className="panel future-play-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t('dashboard.futurePlayEyebrow')}</p>
          <h2>{t('dashboard.futurePlayTitle')}</h2>
        </div>
        <div className="future-play-heading-actions">
          <span className="count-badge">{data.futurePlayGameIds.length}/5</span>
          <button className="button button-primary button-compact" type="button" disabled={data.futurePlayGameIds.length >= 5 || candidates.length === 0} onClick={openAdd}>
            <Plus size={15} /> {t('dashboard.futurePlayAdd')}
          </button>
        </div>
      </div>
      <p className="future-play-description">{t('dashboard.futurePlayDescription')}</p>
      {rows.length === 0 ? (
        <div className="future-play-empty">
          <p>{candidates.length === 0 ? t('dashboard.futurePlayNoCandidates') : t('dashboard.futurePlayEmpty')}</p>
          {candidates.length > 0 && <button className="button button-secondary" type="button" onClick={openAdd}><Plus size={15} /> {t('dashboard.futurePlayAdd')}</button>}
        </div>
      ) : (
        <div className="future-play-table">
          <div className="future-play-header" aria-hidden="true"><span>{t('dashboard.futurePlayGame')}</span><span>{t('dashboard.futurePlayPlatform')}</span><span>{t('dashboard.futurePlayPriority')}</span><span>{t('dashboard.futurePlayActions')}</span></div>
          {rows.map((game, index) => {
            const platforms = platformNames(game.id)
            return <div
              className="future-play-row"
              draggable
              key={game.id}
              onDragStart={(event) => { setDraggedGameId(game.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', game.id) }}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}
              onDrop={(event) => {
                event.preventDefault()
                const sourceId = event.dataTransfer.getData('text/plain') || draggedGameId
                if (sourceId) reorderFuturePlayGame(sourceId, index)
                setDraggedGameId(null)
              }}
              onDragEnd={() => setDraggedGameId(null)}
            >
              <div className="future-play-game" data-label={t('dashboard.futurePlayGame')}><span className="future-drag-handle" aria-hidden="true"><GripVertical size={16} /></span><span className="game-avatar">{game.title.slice(0, 1).toUpperCase()}</span><span><strong>{game.title}</strong><small>{t('dashboard.futurePlayRank', { count: index + 1 })}</small></span></div>
              <div className="future-play-platforms" data-label={t('dashboard.futurePlayPlatform')}>{platforms.length > 0 ? platforms.map((platform) => <span className="future-platform" key={platform}>{platform}</span>) : <span>{t('dashboard.futurePlayNoPlatform')}</span>}</div>
              <span className="future-play-position" data-label={t('dashboard.futurePlayPriority')}>{t('dashboard.futurePlayRank', { count: index + 1 })}</span>
              <div className="future-play-actions" data-label={t('dashboard.futurePlayActions')}>
                <button className="icon-button future-order-button" type="button" disabled={index === 0} aria-label={t('dashboard.futurePlayMoveUp', { title: game.title })} onClick={() => moveFuturePlayGame(game.id, 'up')}><ArrowUp size={16} /></button>
                <button className="icon-button future-order-button" type="button" disabled={index === rows.length - 1} aria-label={t('dashboard.futurePlayMoveDown', { title: game.title })} onClick={() => moveFuturePlayGame(game.id, 'down')}><ArrowDown size={16} /></button>
                <button className="button button-small future-finish-button" type="button" onClick={() => finishFuturePlayGame(game.id)}><Check size={15} /> {t('dashboard.futurePlayFinished')}</button>
              </div>
            </div>
          })}
        </div>
      )}
      {addOpen && <Modal title={t('dashboard.futurePlayAddTitle')} onClose={() => setAddOpen(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); addGame() }}><p className="modal-copy">{t('dashboard.futurePlayAddDescription')}</p><AutocompleteField label={t('dashboard.futurePlayGame')} value={selectedTitle} suggestions={candidates.map((game) => game.title)} placeholder={t('dashboard.futurePlaySearch')} createLabel={t('dashboard.futurePlayChooseGame')} canCreate={() => false} error={selectionError} autoFocus required onChange={(value) => { setSelectedTitle(value); setSelectedGameId(null); setSelectionError('') }} onCommit={(value) => { const game = candidates.find((candidate) => candidate.title === value); setSelectedTitle(value); setSelectedGameId(game?.id ?? null); setSelectionError(game ? '' : t('dashboard.futurePlayChooseGame')) }} /><div className="future-play-selection">{selectedGameId ? <div><p className="eyebrow">{t('dashboard.futurePlayAvailablePlatforms')}</p><div className="future-play-selection-platforms">{platformNames(selectedGameId).map((platform) => <span className="future-platform" key={platform}>{platform}</span>)}</div></div> : <p className="future-play-selection-note">{t('dashboard.futurePlaySelectionHint')}</p>}{selectedGameId && <p className="future-play-selection-note">{t('dashboard.futurePlaySelectionNote', { count: data.futurePlayGameIds.length + 1 })}</p>}</div><div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setAddOpen(false)}>{t('common.cancel')}</button><button className="button button-primary" type="submit">{t('dashboard.futurePlayAdd')}</button></div></form></Modal>}
    </section>
  )
}

function StatCard({ icon, label, value, detail, accent }: { icon: React.ReactNode; label: string; value: string | number; detail: string; accent: string }) {
  return <article className={`stat-card stat-${accent}`}><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function ProgressLine({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = Math.min(Math.round((value / total) * 100), 100)
  return <div className="progress-line"><div><span>{label}</span><strong>{value}</strong></div><div className="bar"><i className={`bar-${color}`} style={{ width: `${percentage}%` }} /></div></div>
}
