import { ArrowRight, CircleCheck, Coins, Package, ShoppingBag, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCollection } from '../app/useCollection'
import { useTranslation } from '../i18n'
import { PlatformDistributionChart, PurchaseTimelineChart, SpendingChart, StatusDistributionChart } from '../ui/DashboardCharts'
import { formatMoney } from '../ui/format'

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

      <section className="chart-grid">
        <div className="panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">{t('dashboard.statusEyebrow')}</p><h2>{t('dashboard.collectionStatus')}</h2></div></div>
          <StatusDistributionChart data={stats.statusTotals} />
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

function StatCard({ icon, label, value, detail, accent }: { icon: React.ReactNode; label: string; value: string | number; detail: string; accent: string }) {
  return <article className={`stat-card stat-${accent}`}><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function ProgressLine({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = Math.min(Math.round((value / total) * 100), 100)
  return <div className="progress-line"><div><span>{label}</span><strong>{value}</strong></div><div className="bar"><i className={`bar-${color}`} style={{ width: `${percentage}%` }} /></div></div>
}
