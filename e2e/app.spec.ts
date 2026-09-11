import { expect, test } from '@playwright/test'

test('renders dashboard charts and their empty states', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Rozkład kolekcji' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stan kolekcji' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Według platformy' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Zakupy w czasie' })).toBeVisible()
  await expect(page.getByText('Dodaj pierwszy egzemplarz, aby zobaczyć rozkład platform.')).toBeVisible()
  await expect(page.getByText('Brak danych o statusie kolekcji.')).toBeVisible()
  await expect(page.getByText('Brak cen zakupów do pokazania.')).toBeVisible()
  await expect(page.getByText('Dodaj daty zakupu, aby zobaczyć oś czasu.')).toBeVisible()
})

test('switches language and keeps the preference after navigation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Ustawienia' }).click()
  await page.getByLabel('Język aplikacji', { exact: true }).selectOption('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await page.getByRole('link', { name: 'Overview' }).click()
  await expect(page.getByRole('heading', { name: /Your collection/ })).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Your collection/ })).toBeVisible()
})

test('adds and displays a canonical game', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Twoja kolekcja/ })).toBeVisible()
  await page.getByRole('link', { name: 'Kolekcja' }).click()
  await page.getByRole('button', { name: 'Dodaj grę' }).first().click()
  await page.getByLabel('Tytuł gry').fill('Testowy tytuł')
  await page.getByRole('button', { name: 'Dodaj grę' }).last().click()
  await expect(page.getByText('Testowy tytuł')).toBeVisible()
  await page.locator('.group-toggle').filter({ hasText: 'Testowy tytuł' }).click()
  await page.getByRole('button', { name: 'Dodaj egzemplarz' }).first().click()
  await page.getByRole('textbox', { name: 'Platforma' }).fill('PS4')
  await page.getByRole('button', { name: 'Dodaj egzemplarz' }).last().click()

  const doesItPlayLink = page.getByRole('link', { name: 'Sprawdź Testowy tytuł w DoesItPlay' })
  await expect(doesItPlayLink).toHaveAttribute('href', 'https://www.doesitplay.org/list?platform=PS4')
  await expect(doesItPlayLink).toHaveAttribute('target', '_blank')
  await expect(doesItPlayLink).toHaveAttribute('rel', 'noreferrer')
})
