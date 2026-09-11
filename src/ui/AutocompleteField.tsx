import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { findSuggestion, normalizeSuggestion, rankSuggestions } from '../domain/suggestions'

interface AutocompleteFieldProps {
  label: string
  value: string
  suggestions: string[]
  placeholder?: string
  onChange: (value: string) => void
  onCommit: (value: string) => void
  createLabel: string
  canCreate?: (value: string) => boolean
  formatValue?: (value: string) => string
  error?: string
  autoFocus?: boolean
  required?: boolean
  maxLength?: number
}

type Option = { kind: 'suggestion'; value: string } | { kind: 'create'; value: string }

export function AutocompleteField({
  label,
  value,
  suggestions,
  placeholder,
  onChange,
  onCommit,
  createLabel,
  canCreate = () => true,
  formatValue = (nextValue) => nextValue.trim(),
  error,
  autoFocus,
  required,
  maxLength,
}: AutocompleteFieldProps) {
  const inputId = useId()
  const listboxId = `${inputId}-listbox`
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const matches = rankSuggestions(value, suggestions)
  const hasExactMatch = Boolean(findSuggestion(value, suggestions))
  const trimmedValue = value.trim()
  const showCreate = Boolean(trimmedValue) && !hasExactMatch && canCreate(trimmedValue)
  const options: Option[] = [
    ...matches.map((match) => ({ kind: 'suggestion' as const, value: match })),
    ...(showCreate ? [{ kind: 'create' as const, value: trimmedValue }] : []),
  ]

  useEffect(() => {
    if (activeIndex >= options.length) setActiveIndex(Math.max(0, options.length - 1))
  }, [activeIndex, options.length])

  const selectOption = (option: Option): void => {
    const selected = option.kind === 'suggestion'
      ? option.value
      : formatValue(option.value)
    onChange(selected)
    onCommit(selected)
    setOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => options.length ? (current + 1) % options.length : 0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => options.length ? (current - 1 + options.length) % options.length : 0)
    } else if (event.key === 'Enter' && open && options[activeIndex]) {
      event.preventDefault()
      selectOption(options[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const openMenu = (): void => {
    if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current)
    setOpen(true)
    setActiveIndex(0)
  }

  return (
    <div className="autocomplete-field">
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <div className="autocomplete">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open && options.length > 0}
          aria-activedescendant={open && options[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-invalid={Boolean(error)}
          autoFocus={autoFocus}
          autoComplete="off"
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(0) }}
          onFocus={openMenu}
          onBlur={() => { closeTimer.current = window.setTimeout(() => setOpen(false), 100) }}
          onKeyDown={handleKeyDown}
        />
        {open && options.length > 0 && <div className="autocomplete-list" id={listboxId} role="listbox">
          {options.map((option, index) => {
            const isActive = index === activeIndex
            const optionId = `${listboxId}-option-${index}`
            return <button
              className={`autocomplete-option${isActive ? ' active' : ''}`}
              id={optionId}
              key={`${option.kind}-${normalizeSuggestion(option.value)}`}
              role="option"
              aria-selected={isActive}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              {option.kind === 'create' ? createLabel : option.value}
            </button>
          })}
        </div>}
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
