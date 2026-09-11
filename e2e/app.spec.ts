import { expect, test } from '@playwright/test'

test('adds and displays a canonical game', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Twoja kolekcja/ })).toBeVisible()
  await page.getByRole('link', { name: 'Kolekcja' }).click()
  await page.getByRole('button', { name: 'Dodaj grę' }).first().click()
  await page.getByLabel('Tytuł gry').fill('Testowy tytuł')
  await page.getByRole('button', { name: 'Dodaj grę' }).last().click()
  await expect(page.getByText('Testowy tytuł')).toBeVisible()
})
