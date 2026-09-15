import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CollectionProvider } from './app/CollectionProvider'
import { CollectionPage } from './pages/CollectionPage'
import { BuyPlanPage } from './pages/BuyPlanPage'
import { DashboardPage } from './pages/DashboardPage'
import { GamesPage } from './pages/GamesPage'
import { ImportExportPage } from './pages/ImportExportPage'
import { SettingsPage } from './pages/SettingsPage'
import { Layout } from './ui/Layout'
import { I18nProvider } from './i18n'

export function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
  return <I18nProvider><BrowserRouter basename={basename}><CollectionProvider><Routes><Route element={<Layout />}><Route index element={<DashboardPage />} /><Route path="collection" element={<CollectionPage />} /><Route path="buy-plan" element={<BuyPlanPage />} /><Route path="games" element={<GamesPage />} /><Route path="import-export" element={<ImportExportPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></CollectionProvider></BrowserRouter></I18nProvider>
}
