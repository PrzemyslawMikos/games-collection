import type { TranslationKey, TranslationValues } from './index'

export class LocalizedError extends Error {
  readonly key: TranslationKey
  readonly values?: TranslationValues

  constructor(key: TranslationKey, values?: TranslationValues) {
    super(key)
    this.name = 'LocalizedError'
    this.key = key
    this.values = values
  }
}

export const localizedErrorMessage = (
  error: unknown,
  t: (key: TranslationKey, values?: TranslationValues) => string,
  fallback: TranslationKey,
): string => {
  if (error instanceof LocalizedError) return t(error.key, error.values)
  return error instanceof Error ? error.message : t(fallback)
}
