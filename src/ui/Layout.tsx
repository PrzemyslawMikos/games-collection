import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Cloud, CloudOff, Download, Gamepad2, LayoutDashboard, Menu, Moon, PackageOpen, Settings, Sun, X } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { applyThemePreference, getThemePreference, resolveTheme, saveThemePreference, type ThemePreference } from './theme'

const navItems = [
  { to: '/', label: 'Przegląd', icon: LayoutDashboard, end: true },
  { to: '/collection', label: 'Kolekcja', icon: Gamepad2 },
  { to: '/games', label: 'Gry', icon: PackageOpen },
  { to: '/import-export', label: 'Import i kopie', icon: Download },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
]

export function Layout() {
  const { auth, dirty, saving, error, sync, login, completeLogin, loginPrompt, setError } = useCollection()
  const [menuOpen, setMenuOpen] = useState(false)
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getThemePreference())
  const navigate = useNavigate()

  useEffect(() => {
    applyThemePreference(themePreference)
    if (themePreference !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateForSystemTheme = (): void => applyThemePreference('system')
    mediaQuery.addEventListener('change', updateForSystemTheme)
    return () => mediaQuery.removeEventListener('change', updateForSystemTheme)
  }, [themePreference])

  useEffect(() => {
    const handleThemeChange = (): void => setThemePreference(getThemePreference())
    window.addEventListener('themechange', handleThemeChange)
    return () => window.removeEventListener('themechange', handleThemeChange)
  }, [])

  const runSync = async (): Promise<void> => {
    try {
      if (!auth) {
        if (loginPrompt) await completeLogin()
        else await login()
      } else {
        await sync()
      }
    } catch {
      // The provider exposes the actionable error state.
    }
  }

  return (
    <div className="app-frame">
      <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Gamepad2 size={21} /></div>
          <div>
            <strong>Kolekcja Gier</strong>
            <span>prywatny katalog</span>
          </div>
          <button className="icon-button mobile-close" type="button" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="main-nav" aria-label="Główna nawigacja">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className={`connection-chip ${auth ? 'connected' : ''}`}>
            {auth ? <Cloud size={16} /> : <CloudOff size={16} />}
            <span>{auth ? 'GitHub połączony' : 'Tryb lokalny'}</span>
          </div>
          <button className="theme-button" type="button" onClick={() => saveThemePreference(resolveTheme(themePreference) === 'light' ? 'dark' : 'light')}>
            {resolveTheme(themePreference) === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {resolveTheme(themePreference) === 'light' ? 'Ciemny motyw' : 'Jasny motyw'}
          </button>
        </div>
      </aside>

      {menuOpen && <button className="mobile-overlay" type="button" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)} />}
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" aria-label="Otwórz menu" onClick={() => setMenuOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="topbar-spacer" />
          <div className="sync-status">
            <span className={`status-dot ${dirty ? 'status-dot-dirty' : 'status-dot-ok'}`} />
            {dirty ? 'Niezapisane zmiany' : 'Dane lokalne aktualne'}
          </div>
          <button className="button button-primary button-compact" type="button" disabled={saving} onClick={() => void runSync()}>
            <Cloud size={16} />
            {saving ? 'Synchronizuję…' : auth ? 'Synchronizuj' : loginPrompt ? 'Potwierdź autoryzację' : 'Połącz GitHub'}
          </button>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button className="icon-button" type="button" aria-label="Ukryj komunikat" onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}
        {loginPrompt && <div className="info-banner login-prompt"><span>Najpierw otwórz GitHub i wpisz ten kod:</span><strong>{loginPrompt.code}</strong><a href={loginPrompt.url} target="_blank" rel="noreferrer">Otwórz GitHub</a><button className="button button-small button-secondary" type="button" disabled={saving} onClick={() => void completeLogin()}>Potwierdź autoryzację</button></div>}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <button className="mobile-sync-fab" type="button" onClick={() => navigate('/settings')} aria-label="Ustawienia synchronizacji">
        <Cloud size={18} />
      </button>
    </div>
  )
}
