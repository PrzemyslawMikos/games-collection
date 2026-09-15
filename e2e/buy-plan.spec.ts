import { expect, test } from '@playwright/test'

test('shows purchase plans and reuses the plan edit modal', async ({ page }) => {
  await page.goto('./import-export')
  await page.getByRole('button', { name: 'Załaduj dane przykładowe' }).click()
  await page.getByRole('link', { name: 'Plan zakupów' }).click()

  await expect(page.getByRole('heading', { name: 'Co kupić dalej' })).toBeVisible()
  await expect(page.locator('.buy-plan-row')).toHaveCount(9)

  const planRow = page.locator('.buy-plan-row').filter({ hasText: 'Silent Hill 2' })
  await planRow.getByRole('button', { name: 'Edytuj plan zakupowy dla Silent Hill 2' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByLabel('Platforma')).toHaveValue('PS5')

  await page.setViewportSize({ width: 390, height: 844 })
  const rowBox = await planRow.boundingBox()
  const actionsBox = await planRow.locator('.buy-plan-actions').boundingBox()
  expect(rowBox).not.toBeNull()
  expect(actionsBox).not.toBeNull()
  if (rowBox && actionsBox) expect(actionsBox.x + actionsBox.width).toBeLessThanOrEqual(rowBox.x + rowBox.width)
})
