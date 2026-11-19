import { test, expect } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
test('updates only after saving and removes old app caches without touching unrelated caches', async ({
  page,
}) => {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect(page.getByText('Ready offline', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Synthetic update survivor')
  await page.getByRole('button', { name: 'Save now', exact: true }).click()
  await page.evaluate(() => caches.open('unrelated-test-cache'))
  const original = await readFile('dist/sw.js', 'utf8')
  try {
    await writeFile(
      'dist/sw.js',
      original.replace(/muinvoice-shell-[a-f0-9]{16}/, 'muinvoice-shell-update-test'),
    )
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration?.update()
    })
    await expect(
      page.getByRole('button', { name: 'Save & update app', exact: true }),
    ).toBeDisabled()
    await page.getByRole('button', { name: 'Invoices', exact: true }).click()
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Save & update app', exact: true }).click(),
    ])
    await page.getByRole('button', { name: 'INV-', exact: false }).first().click()
    await expect(page.getByTestId('invoice')).toContainText('Synthetic update survivor')
    const keys = await page.evaluate(() => caches.keys())
    expect(keys.filter((key) => key.startsWith('muinvoice-shell-'))).toEqual([
      'muinvoice-shell-update-test',
    ])
    expect(keys).toContain('unrelated-test-cache')
  } finally {
    await writeFile('dist/sw.js', original)
  }
})
