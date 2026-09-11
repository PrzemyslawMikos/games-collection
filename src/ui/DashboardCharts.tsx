import type {
  CompletionTotal,
  ConditionTotal,
  OwnershipTotal,
  PlatformDistribution,
  PlatformSpending,
  PurchaseTimelinePoint,
} from '../domain/stats'
import type { TranslationKey } from '../i18n'
import { useTranslation } from '../i18n'
import { formatMoney, formatTimelinePeriod } from './format'

const chartColors = ['var(--coral)', 'var(--blue)', 'var(--green)', 'var(--gold)', '#9c7ac7', '#6aa8a1', '#d4866e', '#718096', '#b08b50']

const ownershipLabelKeys: Record<OwnershipTotal['status'], 'charts.bought' | 'charts.planned'> = {
  bought: 'charts.bought',
  planned: 'charts.planned',
}

const completionLabelKeys: Record<CompletionTotal['status'], 'charts.completed' | 'charts.inProgress' | 'charts.notStarted'> = {
  completed: 'charts.completed',
  'not-completed': 'charts.inProgress',
  'not-started': 'charts.notStarted',
}

const conditionLabelKeys: Record<ConditionTotal['status'], 'charts.used' | 'charts.sealed'> = {
  used: 'charts.used',
  sealed: 'charts.sealed',
}

function ChartEmpty({ children }: { children: string }) {
  return <p className="chart-empty">{children}</p>
}

function ChartDataDetails({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <details className="chart-data-details">
      <summary>{title}</summary>
      <ul>
        {items.map((item) => <li key={item.label}><span>{item.label}</span><strong>{item.value}</strong></li>)}
      </ul>
    </details>
  )
}

export function PlatformDistributionChart({ data }: { data: PlatformDistribution[] }) {
  const { t } = useTranslation()
  if (data.length === 0) return <ChartEmpty>{t('charts.platformEmpty')}</ChartEmpty>
  const platformLabel = (platform: PlatformDistribution): string => platform.isOther ? t('charts.otherPlatforms') : platform.platform

  const total = data.reduce((sum, item) => sum + item.entries, 0)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="chart-content">
      <div className="donut-layout">
        <svg className="donut-chart" viewBox="0 0 132 132" role="img" aria-label={t('charts.platformDistribution')}>
          <circle className="donut-track" cx="66" cy="66" r={radius} />
          {data.map((item, index) => {
            const length = (item.entries / total) * circumference
            const circle = (
              <circle
                key={item.platform}
                className="donut-segment"
                cx="66"
                cy="66"
                r={radius}
                stroke={chartColors[index % chartColors.length]}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                tabIndex={0}
              >
                <title>{`${platformLabel(item)}: ${item.entries} ${t('charts.copies')}`}</title>
              </circle>
            )
            offset += length
            return circle
          })}
          <text className="donut-total" x="66" y="63" textAnchor="middle">{total}</text>
          <text className="donut-caption" x="66" y="77" textAnchor="middle">{t('charts.copies')}</text>
        </svg>
        <div className="chart-legend">
          {data.map((item, index) => (
            <div className="chart-legend-row" key={item.platform}>
              <span className="chart-swatch" style={{ background: chartColors[index % chartColors.length] }} />
              <span>{platformLabel(item)}</span>
              <strong>{item.entries}</strong>
            </div>
          ))}
        </div>
      </div>
      <ChartDataDetails title={t('charts.chartData')} items={data.map((item) => ({
        label: platformLabel(item),
        value: `${item.entries} (${Math.round((item.entries / total) * 100)}%)`,
      }))} />
    </div>
  )
}

function DistributionChart<T extends string>({
  data,
  labelFor,
  emptyMessage,
  ariaLabel,
  dataTitle,
}: {
  data: Array<{ status: T; count: number }>
  labelFor: (status: T) => string
  emptyMessage: string
  ariaLabel: string
  dataTitle: string
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0)
  if (total === 0) return <ChartEmpty>{emptyMessage}</ChartEmpty>

  return (
    <div className="chart-content">
      <div className="status-bar" role="img" aria-label={ariaLabel}>
        {data.map((item, index) => item.count > 0 && (
          <div
            className="status-segment"
            key={item.status}
            style={{ width: `${(item.count / total) * 100}%`, background: chartColors[index % chartColors.length] }}
            tabIndex={0}
            aria-label={`${labelFor(item.status)}: ${item.count}`}
            title={`${labelFor(item.status)}: ${item.count}`}
          >
            <span>{item.count}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend chart-legend-grid">
        {data.map((item, index) => (
          <div className="chart-legend-row" key={item.status}>
            <span className="chart-swatch" style={{ background: chartColors[index % chartColors.length] }} />
            <span>{labelFor(item.status)}</span>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>
      <ChartDataDetails title={dataTitle} items={data.map((item) => ({ label: labelFor(item.status), value: `${item.count} (${Math.round((item.count / total) * 100)}%)` }))} />
    </div>
  )
}

function useDistributionLabel<T extends string>(keys: Record<T, TranslationKey>) {
  const { t } = useTranslation()
  return (status: T): string => t(keys[status])
}

export function OwnershipDistributionChart({ data }: { data: OwnershipTotal[] }) {
  const { t } = useTranslation()
  const labelFor = useDistributionLabel(ownershipLabelKeys)
  return <DistributionChart data={data} labelFor={labelFor} emptyMessage={t('charts.ownershipEmpty')} ariaLabel={t('charts.ownership')} dataTitle={t('charts.chartData')} />
}

export function CompletionDistributionChart({ data }: { data: CompletionTotal[] }) {
  const { t } = useTranslation()
  const labelFor = useDistributionLabel(completionLabelKeys)
  return <DistributionChart data={data} labelFor={labelFor} emptyMessage={t('charts.completionEmpty')} ariaLabel={t('charts.completion')} dataTitle={t('charts.chartData')} />
}

export function ConditionDistributionChart({ data }: { data: ConditionTotal[] }) {
  const { t } = useTranslation()
  const labelFor = useDistributionLabel(conditionLabelKeys)
  return <DistributionChart data={data} labelFor={labelFor} emptyMessage={t('charts.conditionEmpty')} ariaLabel={t('charts.condition')} dataTitle={t('charts.chartData')} />
}

export function SpendingChart({ data }: { data: PlatformSpending[] }) {
  const { t, locale } = useTranslation()
  if (data.length === 0) return <ChartEmpty>{t('charts.spendingEmpty')}</ChartEmpty>

  return (
    <div className="chart-content spending-chart">
      {data.map((currencyData) => {
        const maximum = Math.max(...currencyData.platforms.map((platform) => platform.amount), 1)
        return (
          <section className="spending-currency" key={currencyData.currency}>
            <h3>{currencyData.currency}</h3>
            <div className="spending-bars">
              {currencyData.platforms.map((platform) => (
                <div className="spending-row" key={platform.platform}>
                  <div className="spending-label"><span>{platform.platform}</span><strong>{formatMoney(platform.amount, currencyData.currency, locale)}</strong></div>
                  <div className="spending-track"><i style={{ width: `${(platform.amount / maximum) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
      <ChartDataDetails title={t('charts.chartData')} items={data.flatMap((currencyData) => currencyData.platforms.map((platform) => ({
        label: `${platform.platform} (${currencyData.currency})`,
        value: formatMoney(platform.amount, currencyData.currency, locale),
      })))} />
    </div>
  )
}

export function PurchaseTimelineChart({ data }: { data: PurchaseTimelinePoint[] }) {
  const { t, locale } = useTranslation()
  if (data.length === 0) return <ChartEmpty>{t('charts.timelineEmpty')}</ChartEmpty>

  const maximum = Math.max(...data.map((point) => point.purchases), 1)
  const chartWidth = 620
  const chartHeight = 220
  const left = 30
  const right = 590
  const baseline = 160
  const width = data.length === 1 ? 36 : Math.min(54, ((right - left) / data.length) * .62)
  const step = data.length === 1 ? 0 : (right - left) / (data.length - 1)

  return (
    <div className="chart-content timeline-chart">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={t('dashboard.purchasesOverTime')}>
        <line className="timeline-axis" x1={left} x2={right} y1={baseline} y2={baseline} />
        {data.map((point, index) => {
          const x = data.length === 1 ? chartWidth / 2 : left + step * index
          const height = (point.purchases / maximum) * 125
          return (
            <g key={point.period}>
              <rect
                className="timeline-bar"
                x={x - width / 2}
                y={baseline - height}
                width={width}
                height={height}
                rx="4"
                tabIndex={0}
              >
                <title>{`${formatTimelinePeriod(point.period, locale)}: ${point.purchases} ${t('charts.purchases')}`}</title>
              </rect>
              <text className="timeline-value" x={x} y={Math.max(baseline - height - 8, 15)} textAnchor="middle">{point.purchases}</text>
              <text className="timeline-label" x={x} y="183" textAnchor="middle">{formatTimelinePeriod(point.period, locale)}</text>
            </g>
          )
        })}
      </svg>
      <ChartDataDetails title={t('charts.chartData')} items={data.map((point) => ({ label: formatTimelinePeriod(point.period, locale), value: String(point.purchases) }))} />
    </div>
  )
}
