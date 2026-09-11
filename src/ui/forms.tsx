import { useState, type FormEvent } from 'react'
import type { CompletionStatus, Condition, GameEntry, GamePlan, Priority } from '../domain/model'
import { conditionLabel, completionLabel, planStatusLabel, priorityLabel } from './format'

interface GameFormProps {
  initial?: { title?: string; aliases?: string[]; notes?: string }
  submitLabel: string
  onSubmit: (values: { title: string; aliases: string[]; notes: string }) => void
  onCancel?: () => void
}

export function GameForm({ initial, submitLabel, onSubmit, onCancel }: GameFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [aliases, setAliases] = useState(initial?.aliases?.join('\n') ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), aliases: [...new Set(aliases.split('\n').map((alias) => alias.trim()).filter(Boolean))], notes: notes.trim() })
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label className="field"><span>Tytuł gry</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="np. The Witcher 3" required /></label>
      <label className="field"><span>Aliasy tytułu</span><textarea value={aliases} onChange={(event) => setAliases(event.target.value)} rows={2} placeholder="Jeden alias w każdym wierszu…" /></label>
      <label className="field"><span>Notatki do gry</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Ogólne informacje o tytule…" /></label>
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Anuluj</button><button className="button button-primary" type="submit">{submitLabel}</button></div>
    </form>
  )
}

interface EntryFormProps {
  initial?: Partial<GameEntry>
  submitLabel: string
  onSubmit: (values: Partial<Omit<GameEntry, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  onCancel?: () => void
}

export function EntryForm({ initial, submitLabel, onSubmit, onCancel }: EntryFormProps) {
  const [platform, setPlatform] = useState(initial?.platform ?? '')
  const [version, setVersion] = useState(initial?.version ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'PLN')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? '')
  const [condition, setCondition] = useState<Condition>(initial?.condition ?? 'unknown')
  const [completion, setCompletion] = useState<CompletionStatus>(initial?.completion ?? 'not-started')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    if (!platform.trim()) return
    const parsedPrice = price.trim() ? Number(price.replace(',', '.')) : null
    onSubmit({
      platform: platform.trim(),
      version: version.trim(),
      price: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
      currency: currency.toUpperCase(),
      purchaseDate: purchaseDate || null,
      condition,
      completion,
      notes: notes.trim(),
    })
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid form-grid-two">
        <label className="field"><span>Platforma</span><input autoFocus value={platform} onChange={(event) => setPlatform(event.target.value)} placeholder="np. PS5" required /></label>
        <label className="field"><span>Wersja / edycja</span><input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="np. Complete Edition" /></label>
      </div>
      <div className="form-grid form-grid-three">
        <label className="field"><span>Cena zakupu</span><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Opcjonalnie" /></label>
        <label className="field"><span>Waluta</span><input maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value)} /></label>
        <label className="field"><span>Data zakupu</span><input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></label>
      </div>
      <div className="form-grid form-grid-two">
        <label className="field"><span>Stan</span><select value={condition} onChange={(event) => setCondition(event.target.value as Condition)}>{Object.entries(conditionLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field"><span>Status przejścia</span><select value={completion} onChange={(event) => setCompletion(event.target.value as CompletionStatus)}>{Object.entries(completionLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <label className="field"><span>Notatki do egzemplarza</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Stan pudełka, dodatki, miejsce zakupu…" /></label>
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Anuluj</button><button className="button button-primary" type="submit">{submitLabel}</button></div>
    </form>
  )
}

interface PlanFormProps {
  initial?: Partial<GamePlan>
  submitLabel: string
  onSubmit: (values: Partial<Omit<GamePlan, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  onCancel?: () => void
}

export function PlanForm({ initial, submitLabel, onSubmit, onCancel }: PlanFormProps) {
  const [platform, setPlatform] = useState(initial?.platform ?? '')
  const [version, setVersion] = useState(initial?.version ?? '')
  const [targetPrice, setTargetPrice] = useState(initial?.targetPrice?.toString() ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'PLN')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'normal')
  const [plannedDate, setPlannedDate] = useState(initial?.plannedDate ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'planned')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const parsedPrice = targetPrice.trim() ? Number(targetPrice.replace(',', '.')) : null
    onSubmit({
      platform: platform.trim(),
      version: version.trim(),
      targetPrice: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
      currency: currency.toUpperCase(),
      priority,
      plannedDate: plannedDate || null,
      status,
      notes: notes.trim(),
    })
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid form-grid-two">
        <label className="field"><span>Platforma</span><input autoFocus value={platform} onChange={(event) => setPlatform(event.target.value)} placeholder="Dowolna" /></label>
        <label className="field"><span>Wersja / edycja</span><input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="Opcjonalnie" /></label>
      </div>
      <div className="form-grid form-grid-three">
        <label className="field"><span>Cena docelowa</span><input type="number" min="0" step="0.01" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} placeholder="Opcjonalnie" /></label>
        <label className="field"><span>Waluta</span><input maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value)} /></label>
        <label className="field"><span>Priorytet</span><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{Object.entries(priorityLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <div className="form-grid form-grid-two">
        <label className="field"><span>Planowana data</span><input type="date" value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)} /></label>
        <label className="field"><span>Status planu</span><select value={status} onChange={(event) => setStatus(event.target.value as 'planned' | 'ordered')}>{Object.entries(planStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <label className="field"><span>Notatki do planu</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Sklep, wydanie, okazja…" /></label>
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Anuluj</button><button className="button button-primary" type="submit">{submitLabel}</button></div>
    </form>
  )
}
