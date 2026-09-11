import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Database, Download, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { importWorkbook, type ImportResult } from '../domain/importer'
import { parseJsonCollection } from '../domain/jsonImporter'
import { useTranslation } from '../i18n'
import { localizedErrorMessage } from '../i18n/errors'
import { Modal } from '../ui/Modal'
import { formatMoney } from '../ui/format'

export function ImportExportPage() {
  const { data, replaceData, loadMockData, loadRemote, sync, saving, auth } = useCollection()
  const { t, locale } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [busyAction, setBusyAction] = useState<'excel' | 'json' | 'remote' | null>(null)

  const showSuccess = (text: string): void => setMessage({ text, error: false })
  const showError = (text: string): void => setMessage({ text, error: true })

  const handleWorkbook = async (file: File): Promise<void> => {
    setBusyAction('excel')
    setMessage(null)
    try {
      setPreview(await importWorkbook(file))
    } catch (error) {
      showError(localizedErrorMessage(error, t, 'errors.importRead'))
    } finally {
      setBusyAction(null)
    }
  }

  const handleJson = async (file: File): Promise<void> => {
    setBusyAction('json')
    setMessage(null)
    try {
      replaceData(parseJsonCollection(await file.text()))
      showSuccess(t('import.successImported'))
    } catch {
      showError(t('errors.importJson'))
    } finally {
      setBusyAction(null)
    }
  }

  const exportJson = (): void => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kolekcja-gier-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    showSuccess(t('import.successJson'))
  }

  const handleMockData = (): void => {
    setMessage(null)
    const result = loadMockData()
    showSuccess(t('import.mockLoaded', {
      games: result.addedGames,
      entries: result.addedEntries,
      plans: result.addedPlans,
    }))
  }

  const importPreview = (): void => {
    if (!preview) return
    replaceData(preview.data)
    setPreview(null)
    showSuccess(t('import.successImported'))
  }

  const remoteAction = async (action: () => Promise<void>, success: string): Promise<void> => {
    setBusyAction('remote')
    try {
      await action()
      showSuccess(success)
    } catch {
      // Error details are shown by the provider banner.
    } finally {
      setBusyAction(null)
    }
  }

  return <div className="page-stack">
    <section className="page-heading-row"><div><p className="eyebrow">{t('import.eyebrow')}</p><h1>{t('import.title')}</h1><p className="page-lead">{t('import.description')}</p></div></section>
    {message && <div className={message.error ? 'error-banner import-message' : 'success-banner'} role={message.error ? 'alert' : 'status'}>{message.error ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}{message.text}</div>}
    <section className="import-grid">
      <article className="panel import-card featured-import"><div className="import-icon"><FileSpreadsheet size={23} /></div><p className="eyebrow">{t('import.excelEyebrow')}</p><h2>{t('import.excelTitle')}</h2><p>{t('import.excelDescription')}</p><input ref={inputRef} className="visually-hidden" type="file" accept=".xlsm,.xlsx" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleWorkbook(file); event.target.value = '' }} /><button className="button button-primary" type="button" disabled={busyAction !== null} onClick={() => inputRef.current?.click()}><Upload size={16} />{busyAction === 'excel' ? t('import.reading') : t('import.chooseExcel')}</button></article>
      <article className="panel import-card"><div className="import-icon soft"><Download size={23} /></div><p className="eyebrow">{t('import.backupEyebrow')}</p><h2>{t('import.jsonTitle')}</h2><p>{t('import.jsonDescription')}</p><div className="import-actions"><button className="button button-secondary" type="button" onClick={exportJson}><Download size={16} /> {t('import.downloadJson')}</button><input ref={jsonInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleJson(file); event.target.value = '' }} /><button className="button button-primary" type="button" disabled={busyAction !== null} onClick={() => jsonInputRef.current?.click()}><Upload size={16} />{busyAction === 'json' ? t('import.readingJson') : t('import.chooseJson')}</button></div></article>
      <article className="panel import-card"><div className="import-icon mock"><Database size={23} /></div><p className="eyebrow">{t('import.mockEyebrow')}</p><h2>{t('import.mockTitle')}</h2><p>{t('import.mockDescription')}</p><button className="button button-secondary" type="button" disabled={busyAction !== null} onClick={handleMockData}><Database size={16} /> {t('import.loadMock')}</button></article>
    </section>
    <section className="panel sync-panel"><div><p className="eyebrow">{t('import.syncEyebrow')}</p><h2>{t('import.githubStorage')}</h2><p>{auth ? t('import.githubActive') : t('import.githubInactive')}</p></div><div className="sync-actions"><button className="button button-secondary" type="button" disabled={!auth || saving || busyAction !== null} onClick={() => void remoteAction(loadRemote, t('import.remoteFetched'))}><RefreshCw size={16} /> {t('import.fetchGithub')}</button><button className="button button-primary" type="button" disabled={!auth || saving || busyAction !== null} onClick={() => void remoteAction(sync, t('import.dataSynced'))}><Upload size={16} /> {t('import.saveGithub')}</button></div></section>
    {preview && <Modal title={t('import.previewTitle')} wide onClose={() => setPreview(null)}><div className="import-preview"><div className="preview-summary"><div><strong>{preview.summary.games}</strong><span>{t('import.summaryTitles')}</span></div><div><strong>{preview.summary.entries}</strong><span>{t('import.summaryCopies')}</span></div><div><strong>{preview.summary.plans}</strong><span>{t('import.summaryPlans')}</span></div><div className={preview.summary.warnings ? 'warning-stat' : ''}><strong>{preview.summary.warnings}</strong><span>{t('import.summaryWarnings')}</span></div></div><p className="modal-copy">{t('import.previewDescription')}</p>{preview.warnings.length > 0 && <div className="warning-list">{preview.warnings.slice(0, 20).map((warning, index) => <div className="warning-row" key={`${warning.row}-${warning.platform}-${index}`}><AlertTriangle size={15} /><span><strong>{warning.title}</strong> · {warning.platform}, {t('import.warningRow', { row: warning.row })}: {t(warning.messageKey, warning.messageValues)}</span></div>)}{preview.warnings.length > 20 && <p className="muted-copy">{t('import.remainingWarnings', { count: preview.warnings.length - 20 })}</p>}</div>}<div className="preview-examples"><p className="eyebrow">{t('import.examplePrices')}</p>{preview.data.entries.slice(0, 5).map((entry) => <span key={entry.id}>{entry.platform}: {formatMoney(entry.price, entry.currency, locale)}</span>)}</div><div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setPreview(null)}>{t('common.cancel')}</button><button className="button button-primary" type="button" onClick={importPreview}>{t('import.replaceLocal')}</button></div></div></Modal>}
  </div>
}
