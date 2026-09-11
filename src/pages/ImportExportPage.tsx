import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { importWorkbook, type ImportResult } from '../domain/importer'
import { Modal } from '../ui/Modal'
import { formatMoney } from '../ui/format'

export function ImportExportPage() {
  const { data, replaceData, loadRemote, sync, saving, auth } = useCollection()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleWorkbook = async (file: File): Promise<void> => {
    setBusy(true)
    setMessage(null)
    try {
      setPreview(await importWorkbook(file))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nie udało się odczytać pliku.')
    } finally {
      setBusy(false)
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
    setMessage('Kopia JSON została pobrana.')
  }

  const importPreview = (): void => {
    if (!preview) return
    replaceData(preview.data)
    setPreview(null)
    setMessage('Dane zostały zaimportowane lokalnie. Zapisz je przez synchronizację, aby wysłać je na GitHub.')
  }

  const remoteAction = async (action: () => Promise<void>, success: string): Promise<void> => {
    setBusy(true)
    try {
      await action()
      setMessage(success)
    } catch {
      // Error details are shown by the provider banner.
    } finally {
      setBusy(false)
    }
  }

  return <div className="page-stack">
    <section className="page-heading-row"><div><p className="eyebrow">DANE I KOPIE</p><h1>Import i kopie zapasowe</h1><p className="page-lead">Przenoś dane z Excela i zachowuj niezależne kopie JSON.</p></div></section>
    {message && <div className="success-banner"><CheckCircle2 size={17} />{message}</div>}
    <section className="import-grid">
      <article className="panel import-card featured-import"><div className="import-icon"><FileSpreadsheet size={23} /></div><p className="eyebrow">MIGRACJA JEDNORAZOWA</p><h2>Importuj arkusz Excel</h2><p>Wybierz plik `.xlsm` lub `.xlsx`. Aplikacja pokaże podgląd wpisów, planów, tytułów kanonicznych i ostrzeżeń przed zapisaniem.</p><input ref={inputRef} className="visually-hidden" type="file" accept=".xlsm,.xlsx" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleWorkbook(file); event.target.value = '' }} /><button className="button button-primary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}><Upload size={16} />{busy ? 'Czytam arkusz…' : 'Wybierz plik Excel'}</button></article>
      <article className="panel import-card"><div className="import-icon soft"><Download size={23} /></div><p className="eyebrow">BACKUP LOKALNY</p><h2>Eksportuj JSON</h2><p>Plik zawiera wersjonowany model danych i może zostać użyty jako kopia zapasowa lub do ręcznego odtworzenia kolekcji.</p><button className="button button-secondary" type="button" onClick={exportJson}><Download size={16} /> Pobierz kopię JSON</button></article>
    </section>
    <section className="panel sync-panel"><div><p className="eyebrow">SYNCHRONIZACJA</p><h2>GitHub jako prywatny magazyn</h2><p>{auth ? 'Połączenie jest aktywne. Dane lokalne pozostają dostępne offline, a synchronizacja tworzy wersjonowany commit.' : 'Połącz konto GitHub w ustawieniach, aby udostępnić dane między urządzeniami.'}</p></div><div className="sync-actions"><button className="button button-secondary" type="button" disabled={!auth || saving} onClick={() => void remoteAction(loadRemote, 'Pobrano zdalną wersję danych.') }><RefreshCw size={16} /> Pobierz z GitHub</button><button className="button button-primary" type="button" disabled={!auth || saving} onClick={() => void remoteAction(sync, 'Dane zsynchronizowane.') }><Upload size={16} /> Zapisz na GitHub</button></div></section>
    {preview && <Modal title="Podgląd importu z Excela" wide onClose={() => setPreview(null)}><div className="import-preview"><div className="preview-summary"><div><strong>{preview.summary.games}</strong><span>tytułów</span></div><div><strong>{preview.summary.entries}</strong><span>egzemplarzy</span></div><div><strong>{preview.summary.plans}</strong><span>planów</span></div><div className={preview.summary.warnings ? 'warning-stat' : ''}><strong>{preview.summary.warnings}</strong><span>ostrzeżeń</span></div></div><p className="modal-copy">Puste statusy własności zostaną zapisane jako plany zakupowe. Ceny zostaną odczytane jako PLN. Sprawdź ostrzeżenia przed zastąpieniem lokalnych danych.</p>{preview.warnings.length > 0 && <div className="warning-list">{preview.warnings.slice(0, 20).map((warning, index) => <div className="warning-row" key={`${warning.row}-${warning.platform}-${index}`}><AlertTriangle size={15} /><span><strong>{warning.title}</strong> · {warning.platform}, wiersz {warning.row}: {warning.message}</span></div>)}{preview.warnings.length > 20 && <p className="muted-copy">Pozostałe ostrzeżenia: {preview.warnings.length - 20}</p>}</div>}<div className="preview-examples"><p className="eyebrow">PRZYKŁADOWE CENY</p>{preview.data.entries.slice(0, 5).map((entry) => <span key={entry.id}>{entry.platform}: {formatMoney(entry.price, entry.currency)}</span>)}</div><div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setPreview(null)}>Anuluj</button><button className="button button-primary" type="button" onClick={importPreview}>Zastąp lokalne dane</button></div></div></Modal>}
  </div>
}
