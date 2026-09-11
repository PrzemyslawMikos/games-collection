import { useEffect, useState } from 'react'
import { CheckCircle2, Cloud, ExternalLink, LogOut, Moon, RefreshCw, ShieldCheck, Sun, Trash2 } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { clearLocalData } from '../storage/local'
import { applyThemePreference, getThemePreference, saveThemePreference, type ThemePreference } from '../ui/theme'

export function SettingsPage() {
  const { auth, login, logout, repositoryReference, loadRemote, saving, setError } = useCollection()
  const [theme, setTheme] = useState<ThemePreference>(() => getThemePreference())
  const [message, setMessage] = useState<string | null>(null)

  const changeTheme = (next: ThemePreference): void => {
    setTheme(next)
    applyThemePreference(next)
    saveThemePreference(next)
  }

  useEffect(() => {
    const handleThemeChange = (): void => setTheme(getThemePreference())
    window.addEventListener('themechange', handleThemeChange)
    return () => window.removeEventListener('themechange', handleThemeChange)
  }, [])

  const resetLocal = async (): Promise<void> => {
    if (!window.confirm('Wyczyścić lokalną kopię danych? Zdalny zapis na GitHubie nie zostanie usunięty.')) return
    await clearLocalData()
    window.location.reload()
  }

  const refreshRemote = async (): Promise<void> => {
    try {
      await loadRemote()
      setMessage('Pobrano najnowszą wersję z GitHub.')
    } catch {
      // Provider renders the error details.
    }
  }

  return <div className="page-stack settings-page">
    <section className="page-heading-row"><div><p className="eyebrow">KONFIGURACJA</p><h1>Ustawienia</h1><p className="page-lead">Zarządzaj wyglądem, połączeniem i lokalną kopią danych.</p></div></section>
    {message && <div className="success-banner"><CheckCircle2 size={17} />{message}</div>}
    <section className="settings-grid">
      <article className="panel settings-card"><div className="settings-card-heading"><div className="settings-symbol"><Cloud size={19} /></div><div><p className="eyebrow">SYNCHRONIZACJA</p><h2>GitHub</h2></div></div><p className="settings-description">Dane kolekcji są przechowywane w prywatnym repozytorium. Token aplikacji pozostaje w tej przeglądarce.</p>{auth ? <><div className="connected-callout"><ShieldCheck size={18} /><div><strong>Połączenie aktywne</strong><span>{auth.username ?? 'Autoryzowane konto GitHub'}</span></div></div><div className="setting-detail"><span>Repozytorium danych</span><code>{repositoryReference}</code></div><div className="setting-actions"><button className="button button-secondary" type="button" disabled={saving} onClick={() => void refreshRemote()}><RefreshCw size={15} /> Pobierz dane</button><button className="button button-quiet" type="button" onClick={logout}><LogOut size={15} /> Wyloguj</button></div></> : <><div className="warning-callout"><ShieldCheck size={18} /><span>Aplikacja działa lokalnie. Połącz GitHub, aby synchronizować dane między urządzeniami.</span></div><button className="button button-primary" type="button" onClick={() => void login().catch((error: unknown) => setError(error instanceof Error ? error.message : 'Logowanie nie powiodło się.'))}><Cloud size={16} /> Połącz konto GitHub</button></>}</article>
      <article className="panel settings-card"><div className="settings-card-heading"><div className="settings-symbol"><Sun size={19} /></div><div><p className="eyebrow">WYGLĄD</p><h2>Motyw aplikacji</h2></div></div><p className="settings-description">Dopasuj interfejs do systemu albo wybierz stały motyw na wieczorne katalogowanie.</p><div className="theme-options"><button className={theme === 'system' ? 'theme-option selected' : 'theme-option'} type="button" onClick={() => changeTheme('system')}><span className="theme-preview system-preview" /><strong><Sun size={15} /> System</strong></button><button className={theme === 'light' ? 'theme-option selected' : 'theme-option'} type="button" onClick={() => changeTheme('light')}><span className="theme-preview light-preview" /><strong><Sun size={15} /> Jasny</strong></button><button className={theme === 'dark' ? 'theme-option selected' : 'theme-option'} type="button" onClick={() => changeTheme('dark')}><span className="theme-preview dark-preview" /><strong><Moon size={15} /> Ciemny</strong></button></div></article>
      <article className="panel settings-card danger-card"><div className="settings-card-heading"><div className="settings-symbol"><Trash2 size={19} /></div><div><p className="eyebrow">LOKALNE DANE</p><h2>Reset przeglądarki</h2></div></div><p className="settings-description">Usuń kopię z tego urządzenia. Dane zapisane na GitHubie i historia commitów pozostaną bez zmian.</p><button className="button button-danger" type="button" onClick={() => void resetLocal()}><Trash2 size={16} /> Wyczyść lokalną kopię</button></article>
    </section>
    <footer className="app-footer"><span>Kolekcja Gier · schema v1</span><a href="https://docs.github.com/en/rest/repos/contents" target="_blank" rel="noreferrer">GitHub Contents API <ExternalLink size={13} /></a></footer>
  </div>
}
