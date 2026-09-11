export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const THEME_KEY = 'games-collection-theme'

export const getThemePreference = (): ThemePreference => {
  const saved = localStorage.getItem(THEME_KEY)
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
}

export const resolveTheme = (preference: ThemePreference): ResolvedTheme => {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const saveThemePreference = (preference: ThemePreference): void => {
  localStorage.setItem(THEME_KEY, preference)
  window.dispatchEvent(new Event('themechange'))
}

export const applyThemePreference = (preference: ThemePreference): void => {
  document.documentElement.dataset.theme = resolveTheme(preference)
}
