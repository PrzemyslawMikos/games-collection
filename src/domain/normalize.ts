export const normalizeTitle = (value: string): string =>
  value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('pl-PL')
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/[.:,;!?()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')

export const matchesTitle = (query: string, title: string, aliases: string[]): boolean => {
  const normalizedQuery = normalizeTitle(query)
  if (!normalizedQuery) return true

  return [title, ...aliases].some((candidate) => normalizeTitle(candidate).includes(normalizedQuery))
}
