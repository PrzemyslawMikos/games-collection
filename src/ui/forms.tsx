import { useState, type FormEvent } from 'react'
import type { CompletionStatus, Condition, GameEntry, GamePlan, Priority } from '../domain/model'
import { useTranslation } from '../i18n'
import { conditionLabelKey, completionLabelKey, planStatusLabelKey, priorityLabelKey } from './format'
import { AutocompleteField } from './AutocompleteField'

interface GameFormProps {
  initial?: { title?: string; aliases?: string[]; notes?: string }
  submitLabel: string
  onSubmit: (values: { title: string; aliases: string[]; notes: string }) => void
  onCancel?: () => void
}

export function GameForm({ initial, submitLabel, onSubmit, onCancel }: GameFormProps) {
  const { t } = useTranslation()
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
      <label className="field"><span>{t('forms.gameTitle')}</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('forms.titlePlaceholder')} required /></label>
      <label className="field"><span>{t('forms.titleAliases')}</span><textarea value={aliases} onChange={(event) => setAliases(event.target.value)} rows={2} placeholder={t('forms.aliasPlaceholder')} /></label>
      <label className="field"><span>{t('forms.gameNotes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder={t('forms.gameNotesPlaceholder')} /></label>
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>{t('common.cancel')}</button><button className="button button-primary" type="submit">{submitLabel}</button></div>
    </form>
  )
}

interface EntryFormProps {
  initial?: Partial<GameEntry>
  submitLabel: string
  platformSuggestions: string[]
  currencySuggestions: string[]
  onSubmit: (values: Partial<Omit<GameEntry, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  onCancel?: () => void
}

export function EntryForm({ initial, submitLabel, platformSuggestions, currencySuggestions, onSubmit, onCancel }: EntryFormProps) {
  const { t } = useTranslation()
  const defaultPlatform = initial?.platform ?? (!initial && platformSuggestions.length === 1 ? platformSuggestions[0] : '')
  const defaultCurrency = initial?.currency ?? (!initial && currencySuggestions.length === 1 ? currencySuggestions[0] : 'PLN')
  const [platform, setPlatform] = useState(defaultPlatform)
  const [platformConfirmed, setPlatformConfirmed] = useState(() => Boolean(initial?.platform) || (!initial && platformSuggestions.length === 1))
  const [platformError, setPlatformError] = useState('')
  const [version, setVersion] = useState(initial?.version ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [currencyConfirmed, setCurrencyConfirmed] = useState(() => Boolean(initial?.currency) || (!initial && currencySuggestions.length === 1))
  const [currencyError, setCurrencyError] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? '')
  const [condition, setCondition] = useState<Condition>(initial?.condition ?? 'unknown')
  const [completion, setCompletion] = useState<CompletionStatus>(initial?.completion ?? 'not-started')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    if (!platform.trim()) {
      setPlatformError(t('forms.requiredField'))
      return
    }
    if (!platformConfirmed) {
      setPlatformError(t('forms.chooseSuggestion'))
      return
    }
    if (currency.trim().length !== 3) {
      setCurrencyError(t('forms.currencyLength'))
      return
    }
    if (!currencyConfirmed) {
      setCurrencyError(t('forms.chooseSuggestion'))
      return
    }
    const parsedPrice = price.trim() ? Number(price.replace(',', '.')) : null
    onSubmit({
      platform: platform.trim(),
      version: version.trim(),
      price: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
      currency: currency.trim().toUpperCase(),
      purchaseDate: purchaseDate || null,
      condition,
      completion,
      notes: notes.trim(),
    })
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid form-grid-two">
        <AutocompleteField
          label={t('forms.platform')}
          value={platform}
          suggestions={platformSuggestions}
          placeholder={t('forms.platformPlaceholder')}
          createLabel={t('forms.createValue', { value: platform.trim() })}
          error={platformError}
          required
          autoFocus
          onChange={(value) => { setPlatform(value); setPlatformConfirmed(false); setPlatformError('') }}
          onCommit={(value) => { setPlatform(value.trim()); setPlatformConfirmed(true); setPlatformError('') }}
        />
        <label className="field"><span>{t('forms.version')}</span><input value={version} onChange={(event) => setVersion(event.target.value)} placeholder={t('forms.versionPlaceholder')} /></label>
      </div>
      <div className="form-grid form-grid-three">
        <label className="field"><span>{t('forms.purchasePrice')}</span><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={t('common.optional')} /></label>
        <AutocompleteField
          label={t('forms.currency')}
          value={currency}
          suggestions={currencySuggestions}
          createLabel={t('forms.createValue', { value: currency.trim().toUpperCase() })}
          error={currencyError}
          maxLength={3}
          required
          canCreate={(value) => value.length === 3}
          formatValue={(value) => value.trim().toUpperCase()}
          onChange={(value) => { setCurrency(value); setCurrencyConfirmed(false); setCurrencyError('') }}
          onCommit={(value) => { setCurrency(value.trim().toUpperCase()); setCurrencyConfirmed(true); setCurrencyError('') }}
        />
        <label className="field"><span>{t('forms.purchaseDate')}</span><input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></label>
      </div>
      <div className="form-grid form-grid-two">
        <label className="field"><span>{t('forms.condition')}</span><select value={condition} onChange={(event) => setCondition(event.target.value as Condition)}>{Object.entries(conditionLabelKey).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}</select></label>
        <label className="field"><span>{t('forms.completion')}</span><select value={completion} onChange={(event) => setCompletion(event.target.value as CompletionStatus)}>{Object.entries(completionLabelKey).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}</select></label>
      </div>
      <label className="field"><span>{t('forms.copyNotes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder={t('forms.copyNotesPlaceholder')} /></label>
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>{t('common.cancel')}</button><button className="button button-primary" type="submit">{submitLabel}</button></div>
    </form>
  )
}

interface PlanFormProps {
  initial?: Partial<GamePlan>
  submitLabel: string
  platformSuggestions: string[]
  currencySuggestions: string[]
  onSubmit: (values: Partial<Omit<GamePlan, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>) => void
  onCancel?: () => void
}

export function PlanForm({ initial, submitLabel, platformSuggestions, currencySuggestions, onSubmit, onCancel }: PlanFormProps) {
  const { t } = useTranslation()
  const defaultPlatform = initial?.platform ?? (!initial && platformSuggestions.length === 1 ? platformSuggestions[0] : '')
  const defaultCurrency = initial?.currency ?? (!initial && currencySuggestions.length === 1 ? currencySuggestions[0] : 'PLN')
  const [platform, setPlatform] = useState(defaultPlatform)
  const [platformConfirmed, setPlatformConfirmed] = useState(() => !initial || Boolean(initial.platform) || platformSuggestions.length === 1)
  const [platformError, setPlatformError] = useState('')
  const [version, setVersion] = useState(initial?.version ?? '')
  const [targetPrice, setTargetPrice] = useState(initial?.targetPrice?.toString() ?? '')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [currencyConfirmed, setCurrencyConfirmed] = useState(() => Boolean(initial?.currency) || (!initial && currencySuggestions.length === 1))
  const [currencyError, setCurrencyError] = useState('')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'normal')
  const [plannedDate, setPlannedDate] = useState(initial?.plannedDate ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'planned')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    if (platform.trim() && !platformConfirmed) {
      setPlatformError(t('forms.chooseSuggestion'))
      return
    }
    if (currency.trim().length !== 3) {
      setCurrencyError(t('forms.currencyLength'))
      return
    }
    if (!currencyConfirmed) {
      setCurrencyError(t('forms.chooseSuggestion'))
      return
    }
    const parsedPrice = targetPrice.trim() ? Number(targetPrice.replace(',', '.')) : null
    onSubmit({
      platform: platform.trim(),
      version: version.trim(),
      targetPrice: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
      currency: currency.trim().toUpperCase(),
      priority,
      plannedDate: plannedDate || null,
      status,
      notes: notes.trim(),
    })
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid form-grid-two">
        <AutocompleteField
          label={t('forms.platform')}
          value={platform}
          suggestions={platformSuggestions}
          placeholder={t('common.anyPlatform')}
          createLabel={t('forms.createValue', { value: platform.trim() })}
          error={platformError}
          autoFocus
          onChange={(value) => { setPlatform(value); setPlatformConfirmed(false); setPlatformError('') }}
          onCommit={(value) => { setPlatform(value.trim()); setPlatformConfirmed(true); setPlatformError('') }}
        />
        <label className="field"><span>{t('forms.version')}</span><input value={version} onChange={(event) => setVersion(event.target.value)} placeholder={t('common.optional')} /></label>
      </div>
      <div className="form-grid form-grid-three">
        <label className="field"><span>{t('forms.targetPrice')}</span><input type="number" min="0" step="0.01" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} placeholder={t('common.optional')} /></label>
        <AutocompleteField
          label={t('forms.currency')}
          value={currency}
          suggestions={currencySuggestions}
          createLabel={t('forms.createValue', { value: currency.trim().toUpperCase() })}
          error={currencyError}
          maxLength={3}
          required
          canCreate={(value) => value.length === 3}
          formatValue={(value) => value.trim().toUpperCase()}
          onChange={(value) => { setCurrency(value); setCurrencyConfirmed(false); setCurrencyError('') }}
          onCommit={(value) => { setCurrency(value.trim().toUpperCase()); setCurrencyConfirmed(true); setCurrencyError('') }}
        />
        <label className="field"><span>{t('forms.priority')}</span><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{Object.entries(priorityLabelKey).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}</select></label>
      </div>
      <div className="form-grid form-grid-two">
        <label className="field"><span>{t('forms.plannedDate')}</span><input type="date" value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)} /></label>
        <label className="field"><span>{t('forms.planStatus')}</span><select value={status} onChange={(event) => setStatus(event.target.value as 'planned' | 'ordered')}>{Object.entries(planStatusLabelKey).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}</select></label>
      </div>
      <label className="field"><span>{t('forms.planNotes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder={t('forms.planNotesPlaceholder')} /></label>
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>{t('common.cancel')}</button><button className="button button-primary" type="submit">{submitLabel}</button></div>
    </form>
  )
}
