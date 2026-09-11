import { ArrowRight, CircleCheck, Coins, Package, ShoppingBag, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCollection } from '../app/useCollection'
import { formatMoney } from '../ui/format'

export function DashboardPage() {
  const { data, stats } = useCollection()
  const latestEntries = [...data.entries]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  const gameName = (gameId: string): string => data.games.find((game) => game.id === gameId)?.title ?? 'Nieznana gra'
  const spend = stats.totalSpend.map((item) => formatMoney(item.amount, item.currency)).join(' + ') || '0,00 zł'

  return (
    <div className="page-stack">
      <section className="hero-row">
        <div>
          <p className="eyebrow">PRZEGLĄD KOLEKCJI</p>
          <h1>Twoja kolekcja,<br /><em>w jednym miejscu.</em></h1>
          <p className="hero-copy">Przeglądaj fizyczne wydania, pilnuj planów zakupowych i sprawdzaj postęp bez arkusza kalkulacyjnego.</p>
        </div>
        <div className="hero-note">
          <Sparkles size={18} />
          <span>{stats.plannedGames === 0 ? 'Nie ma jeszcze planów zakupowych.' : `${stats.plannedGames} gier czeka na zakup.`}</span>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard icon={<Package size={20} />} label="Gry w katalogu" value={stats.totalGames} detail={`${stats.ownedGames} posiadanych`} accent="coral" />
        <StatCard icon={<ShoppingBag size={20} />} label="Egzemplarze" value={stats.totalEntries} detail={`${stats.sealedEntries} zafoliowanych`} accent="blue" />
        <StatCard icon={<CircleCheck size={20} />} label="Ukończone" value={stats.completedGames} detail={`${stats.completionProgress}% egzemplarzy`} accent="green" />
        <StatCard icon={<Coins size={20} />} label="Wydane" value={spend} detail={`${stats.plannedBudget.length ? 'plus budżet planów' : 'brak planów cenowych'}`} accent="gold" />
      </section>

      <section className="dashboard-grid">
        <div className="panel progress-panel">
          <div className="panel-heading"><div><p className="eyebrow">POSTĘP KOLEKCJI</p><h2>Każdy tytuł ma swoją historię</h2></div><Link className="text-link" to="/collection">Otwórz kolekcję <ArrowRight size={15} /></Link></div>
          <div className="progress-visual">
            <div className="progress-ring" style={{ '--progress': `${stats.ownedGames === 0 ? 0 : Math.round((stats.completedGames / stats.ownedGames) * 100)}%` } as React.CSSProperties}>
              <strong>{stats.ownedGames === 0 ? 0 : Math.round((stats.completedGames / stats.ownedGames) * 100)}%</strong><span>ukończonych gier</span>
            </div>
            <div className="progress-list">
              <ProgressLine label="Posiadane gry" value={stats.ownedGames} total={Math.max(stats.totalGames, 1)} color="coral" />
              <ProgressLine label="Ukończone gry" value={stats.completedGames} total={Math.max(stats.ownedGames, 1)} color="green" />
              <ProgressLine label="Plany zakupowe" value={stats.plannedGames} total={Math.max(stats.totalGames, 1)} color="gold" />
            </div>
          </div>
        </div>

        <div className="panel platform-panel">
          <div className="panel-heading"><div><p className="eyebrow">PLATFORMY</p><h2>Rozkład kolekcji</h2></div><Link className="icon-link" to="/collection" aria-label="Zobacz kolekcję"><ArrowRight size={17} /></Link></div>
          {stats.platformTotals.length === 0 ? <p className="muted-copy">Dodaj pierwszy egzemplarz, aby zobaczyć rozkład platform.</p> : <div className="platform-list">{stats.platformTotals.map((platform) => <div className="platform-row" key={platform.platform}><span className="platform-badge">{platform.platform.slice(0, 2)}</span><div className="platform-name"><strong>{platform.platform}</strong><span>{platform.entries} {platform.entries === 1 ? 'egzemplarz' : 'egzemplarze'}</span></div><strong>{formatMoney(platform.ownedSpend, platform.currency)}</strong></div>)}</div>}
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><p className="eyebrow">OSTATNIE ZMIANY</p><h2>Ostatnio aktualizowane</h2></div><Link className="text-link" to="/collection">Wszystkie wpisy <ArrowRight size={15} /></Link></div>
        {latestEntries.length === 0 ? <p className="muted-copy">Kolekcja jest gotowa na pierwszy wpis.</p> : <div className="recent-list">{latestEntries.map((entry) => <div className="recent-row" key={entry.id}><div className="game-avatar">{gameName(entry.gameId).slice(0, 1).toUpperCase()}</div><div><strong>{gameName(entry.gameId)}</strong><span>{entry.platform} {entry.version && `· ${entry.version}`}</span></div><span className={`pill pill-${entry.completion}`}>{entry.completion === 'completed' ? 'Ukończona' : entry.completion === 'not-completed' ? 'Nie ukończona' : 'Nie rozpoczęta'}</span><strong className="recent-price">{formatMoney(entry.price, entry.currency)}</strong></div>)}</div>}
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
