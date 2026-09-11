import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
/* eslint-disable react-refresh/only-export-components */
import { en, pl, type TranslationKey } from './catalogs'

export type { TranslationKey } from './catalogs'

export type Locale = 'en' | 'pl'
export type TranslationValues = Record<string, number | string>

const LANGUAGE_KEY = 'games-collection-language'
const catalogs: Record<Locale, Record<string, string>> = { en, pl }

export const readLocale = (): Locale => {
  if (typeof window === 'undefined') return 'pl'
  return window.localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'pl'
}

const interpolate = (value: string, values: TranslationValues = {}): string =>
  value.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))

export const translate = (locale: Locale, key: string, values?: TranslationValues): string => {
  const selected = catalogs[locale][key]
  if (selected !== undefined) return interpolate(selected, values)

  const fallback = catalogs.en[key]
  if (fallback !== undefined) {
    if (locale !== 'en' && import.meta.env.DEV) console.warn(`Missing ${locale} translation: ${key}`)
    return interpolate(fallback, values)
  }

  if (import.meta.env.DEV) console.warn(`Missing translation key: ${key}`)
  return key
}

export const pluralize = (locale: Locale, key: string, count: number, values: TranslationValues = {}): string => {
  const category = new Intl.PluralRules(locale).select(count)
  const categoryKey = `${key}.${category}`
  const fallbackKey = `${key}.other`
  return translate(locale, catalogs[locale][categoryKey] ? categoryKey : fallbackKey, { ...values, count })
}

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: TranslationValues) => string
  plural: (key: string, count: number, values?: TranslationValues) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => readLocale())

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_KEY, locale)
    document.documentElement.lang = locale
    document.title = translate(locale, 'meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', translate(locale, 'meta.description'))
  }, [locale])

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, values) => translate(locale, key, values),
    plural: (key, count, values = {}) => pluralize(locale, key, count, values),
  }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useTranslation = (): I18nContextValue => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useTranslation must be used within I18nProvider')
  return context
}

export const languageStorageKey = LANGUAGE_KEY
