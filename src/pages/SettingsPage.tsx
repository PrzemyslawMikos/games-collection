import { useEffect, useState } from 'react'
import { CheckCircle2, Cloud, ExternalLink, Languages, LogOut, Moon, RefreshCw, ShieldCheck, Sun, Trash2 } from 'lucide-react'
import { useCollection } from '../app/useCollection'
import { useTranslation } from '../i18n'
import { localizedErrorMessage } from '../i18n/errors'
import { clearLocalData } from '../storage/local'
import { applyThemePreference, getThemePreference, saveThemePreference, type ThemePreference } from '../ui/theme'

export function SettingsPage() {
  const { auth, login, logout, repositoryReference, loadRemote, saving, setError } = useCollection()
  const { locale, setLocale, t } = useTranslation()
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
    if (!window.confirm(t('settings.resetConfirm'))) return
    await clearLocalData()
    window.location.reload()
  }

  const refreshRemote = async (): Promise<void> => {
    try {
      await loadRemote()
      setMessage(t('settings.remoteFetched'))
    } catch {
      // Provider renders the error details.
    }
  }

  return <div className="page-stack settings-page">
    <section className="page-heading-row"><div><p className="eyebrow">{t('settings.eyebrow')}</p><h1>{t('settings.title')}</h1><p className="page-lead">{t('settings.description')}</p></div></section>
    {message && <div className="success-banner"><CheckCircle2 size={17} />{message}</div>}
    <section className="settings-grid">
      <article className="panel settings-card"><div className="settings-card-heading"><div className="settings-symbol"><Cloud size={19} /></div><div><p className="eyebrow">{t('settings.syncEyebrow')}</p><h2>GitHub</h2></div></div><p className="settings-description">{t('settings.githubDescription')}</p>{auth ? <><div className="connected-callout"><ShieldCheck size={18} /><div><strong>{t('settings.connectionActive')}</strong><span>{auth.username ?? t('settings.authorizedGithub')}</span></div></div><div className="setting-detail"><span>{t('settings.repository')}</span><code>{repositoryReference}</code></div><div className="setting-actions"><button className="button button-secondary" type="button" disabled={saving} onClick={() => void refreshRemote()}><RefreshCw size={15} /> {t('settings.fetchData')}</button><button className="button button-quiet" type="button" onClick={logout}><LogOut size={15} /> {t('settings.logout')}</button></div></> : <><div className="warning-callout"><ShieldCheck size={18} /><span>{t('settings.localWarning')}</span></div><button className="button button-primary" type="button" onClick={() => void login().catch((error: unknown) => setError(localizedErrorMessage(error, t, 'errors.loginFailed')))}><Cloud size={16} /> {t('settings.connectAccount')}</button></>}</article>
      <article className="panel settings-card"><div className="settings-card-heading"><div className="settings-symbol"><Sun size={19} /></div><div><p className="eyebrow">{t('settings.appearanceEyebrow')}</p><h2>{t('settings.appTheme')}</h2></div></div><p className="settings-description">{t('settings.themeDescription')}</p><div className="theme-options"><button className={theme === 'system' ? 'theme-option selected' : 'theme-option'} type="button" onClick={() => changeTheme('system')}><span className="theme-preview system-preview" /><strong><Sun size={15} /> {t('settings.system')}</strong></button><button className={theme === 'light' ? 'theme-option selected' : 'theme-option'} type="button" onClick={() => changeTheme('light')}><span className="theme-preview light-preview" /><strong><Sun size={15} /> {t('settings.light')}</strong></button><button className={theme === 'dark' ? 'theme-option selected' : 'theme-option'} type="button" onClick={() => changeTheme('dark')}><span className="theme-preview dark-preview" /><strong><Moon size={15} /> {t('settings.dark')}</strong></button></div></article>
      <article className="panel settings-card"><div className="settings-card-heading"><div className="settings-symbol"><Languages size={19} /></div><div><p className="eyebrow">{t('settings.languageEyebrow')}</p><h2>{t('settings.language')}</h2></div></div><p className="settings-description">{t('settings.languageDescription')}</p><label className="field"><span>{t('settings.language')}</span><select value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'pl')}><option value="pl">{t('settings.polish')}</option><option value="en">{t('settings.english')}</option></select></label></article>
      <article className="panel settings-card danger-card"><div className="settings-card-heading"><div className="settings-symbol"><Trash2 size={19} /></div><div><p className="eyebrow">{t('settings.localDataEyebrow')}</p><h2>{t('settings.resetBrowser')}</h2></div></div><p className="settings-description">{t('settings.resetDescription')}</p><button className="button button-danger" type="button" onClick={() => void resetLocal()}><Trash2 size={16} /> {t('settings.clearLocal')}</button></article>
    </section>
    <footer className="app-footer"><span>{t('settings.footer')}</span><a href="https://docs.github.com/en/rest/repos/contents" target="_blank" rel="noreferrer">GitHub Contents API <ExternalLink size={13} /></a></footer>
  </div>
}
