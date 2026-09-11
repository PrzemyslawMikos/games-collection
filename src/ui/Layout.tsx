import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Cloud, CloudOff, Download, Gamepad2, LayoutDashboard, Menu, Moon, PackageOpen, Settings, Sun, X } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { useTranslation } from '../i18n'
import { applyThemePreference, getThemePreference, resolveTheme, saveThemePreference, type ThemePreference } from './theme'

const navItems = [
  { to: '/', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/collection', label: 'nav.collection', icon: Gamepad2 },
  { to: '/games', label: 'nav.games', icon: PackageOpen },
  { to: '/import-export', label: 'nav.importExport', icon: Download },
  { to: '/settings', label: 'nav.settings', icon: Settings },
]

export function Layout() {
  const { auth, dirty, saving, error, sync, login, completeLogin, loginPrompt, setError } = useCollection()
  const { locale, setLocale, t } = useTranslation()
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
            <strong>{t('layout.brand')}</strong>
            <span>{t('layout.tagline')}</span>
          </div>
          <button className="icon-button mobile-close" type="button" aria-label={t('layout.closeMenu')} onClick={() => setMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="main-nav" aria-label={t('layout.mainNavigation')}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}>
              <Icon size={18} />
              <span>{t(label as Parameters<typeof t>[0])}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className={`connection-chip ${auth ? 'connected' : ''}`}>
            {auth ? <Cloud size={16} /> : <CloudOff size={16} />}
            <span>{auth ? t('layout.connectedGithub') : t('layout.localMode')}</span>
          </div>
          <button className="theme-button" type="button" onClick={() => saveThemePreference(resolveTheme(themePreference) === 'light' ? 'dark' : 'light')}>
            {resolveTheme(themePreference) === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {resolveTheme(themePreference) === 'light' ? t('layout.darkTheme') : t('layout.lightTheme')}
          </button>
          <label className="language-switcher">
            <span>{t('settings.language')}</span>
            <select value={locale} aria-label={t('settings.language')} onChange={(event) => setLocale(event.target.value as 'en' | 'pl')}>
              <option value="pl">{t('settings.polish')}</option>
              <option value="en">{t('settings.english')}</option>
            </select>
          </label>
        </div>
      </aside>

      {menuOpen && <button className="mobile-overlay" type="button" aria-label={t('layout.closeMenu')} onClick={() => setMenuOpen(false)} />}
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" aria-label={t('layout.openMenu')} onClick={() => setMenuOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="topbar-spacer" />
          <div className="sync-status">
            <span className={`status-dot ${dirty ? 'status-dot-dirty' : 'status-dot-ok'}`} />
            {dirty ? t('layout.unsavedChanges') : t('layout.localDataCurrent')}
          </div>
          <button className="button button-primary button-compact" type="button" disabled={saving} onClick={() => void runSync()}>
            <Cloud size={16} />
            {saving ? t('layout.syncing') : auth ? t('layout.sync') : loginPrompt ? t('layout.confirmAuth') : t('layout.connectGithub')}
          </button>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button className="icon-button" type="button" aria-label={t('layout.hideMessage')} onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}
        {loginPrompt && <div className="info-banner login-prompt"><span>{t('layout.loginPrompt')}</span><strong>{loginPrompt.code}</strong><a href={loginPrompt.url} target="_blank" rel="noreferrer">{t('layout.openGithub')}</a><button className="button button-small button-secondary" type="button" disabled={saving} onClick={() => void completeLogin()}>{t('layout.confirmAuthorization')}</button></div>}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <button className="mobile-sync-fab" type="button" onClick={() => navigate('/settings')} aria-label={t('layout.syncSettings')}>
        <Cloud size={18} />
      </button>
    </div>
  )
}
