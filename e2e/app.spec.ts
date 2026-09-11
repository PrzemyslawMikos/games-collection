import { expect, test } from '@playwright/test'

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
