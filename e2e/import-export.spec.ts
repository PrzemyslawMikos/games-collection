import { expect, test } from '@playwright/test'

const importedCollection = {
  schemaVersion: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  games: [{
    id: 'game_imported',
    title: 'Imported game',
    aliases: [],
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }],
  entries: [],
  plans: [],
}

test('imports a local JSON backup and replaces the collection', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Import i kopie' }).click()

  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedCollection)),
  })

  await expect(page.getByRole('status')).toContainText('Dane zostały zaimportowane lokalnie.')
  await page.getByRole('link', { name: 'Kolekcja' }).click()
  await expect(page.getByText('Imported game')).toBeVisible()
})

test('shows an error and keeps the current collection for an invalid JSON backup', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Import i kopie' }).click()

  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":2}'),
  })

  await expect(page.getByRole('alert')).toContainText('Nie udało się zaimportować kopii JSON.')
})

test('loads mock data, persists the warning, and translates it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Import i kopie' }).click()
  await page.getByRole('button', { name: 'Załaduj dane przykładowe' }).click()

  await expect(page.locator('.mock-data-banner')).toContainText('Dane przykładowe są załadowane.')
  await expect(page.locator('.success-banner')).toContainText('Dane przykładowe załadowane. Dodano tytułów: 27, egzemplarzy: 21, planów: 9.')
  await page.getByRole('link', { name: 'Kolekcja' }).click()
  await expect(page.getByText('Astro Bot')).toBeVisible()
  await expect(page.locator('.mock-data-banner')).toBeVisible()

  await page.getByLabel('Język aplikacji').selectOption('en')
  await expect(page.locator('.mock-data-banner')).toContainText('Mock data is loaded.')
  await page.reload()
  await expect(page.locator('.mock-data-banner')).toContainText('Mock data is loaded.')
})
