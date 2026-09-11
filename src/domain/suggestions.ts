export const normalizeSuggestion = (value: string): string =>
  value.normalize('NFKC').trim().toLocaleLowerCase('pl-PL')

export const collectSuggestions = (
  values: string[],
  format: (value: string) => string = (value) => value.trim(),
): string[] => {
  const seen = new Set<string>()
  const collected: string[] = []

  for (const value of values) {
    const formatted = format(value)
    const normalized = normalizeSuggestion(formatted)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    collected.push(formatted)
  }

  return collected.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export const findSuggestion = (value: string, suggestions: string[]): string | undefined => {
  const normalized = normalizeSuggestion(value)
  return suggestions.find((suggestion) => normalizeSuggestion(suggestion) === normalized)
}

export const rankSuggestions = (query: string, suggestions: string[]): string[] => {
  const normalizedQuery = normalizeSuggestion(query)

  return suggestions
    .filter((suggestion) => !normalizedQuery || normalizeSuggestion(suggestion).includes(normalizedQuery))
    .sort((a, b) => {
      const rank = (value: string): number => {
        if (!normalizedQuery) return 0
        const normalized = normalizeSuggestion(value)
        if (normalized === normalizedQuery) return 0
        if (normalized.startsWith(normalizedQuery)) return 1
        return 2
      }

      return rank(a) - rank(b) || a.localeCompare(b, undefined, { sensitivity: 'base' })
    })
}
