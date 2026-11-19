import { test, expect } from '@playwright/test'
test('reopens all bundled resources offline and preserves edits through cache recovery', async ({
  page,
  context,
  baseURL,
}) => {
  const external: string[] = []
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))

  const dataRequests: string[] = []
  page.on('request', (req) => {
    if (req.url().startsWith('http') && !req.url().startsWith(new URL(baseURL!).origin))
      external.push(req.url())
    if (req.method() !== 'GET') dataRequests.push(req.url())
  })
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect(page.getByText('Ready offline', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Offline Synthetic Studio')
  await page.getByRole('button', { name: 'Save now', exact: true }).click()
  await expect(page.getByRole('status').first()).toContainText('All changes saved')
  await context.setOffline(true)
  await page.reload()

  const notices = await page.evaluate(async () =>
    (await fetch('./licenses/dependencies.txt')).text(),
  )
  expect(notices).toContain('muinvoice third-party licenses')
  expect(notices).toContain('react@')
  expect(notices).toContain('Apache License')

  await page.getByRole('button', { name: 'INV-', exact: false }).first().click()
  await expect(page.getByTestId('invoice')).toContainText('Offline Synthetic Studio')
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await page.getByText('Template gallery', { exact: false }).click()
  await page.getByRole('button', { name: 'Template Saudi Business', exact: true }).click()
  await expect(page.getByTestId('invoice')).toHaveClass(/template-saudi-business/)
  await page.getByRole('combobox', { name: 'Typeface', exact: true }).selectOption('cairo')
  await page.getByRole('button', { name: 'Items & taxes', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Description · English', exact: true })
    .fill('Offline design')
  await page.getByRole('textbox', { name: 'Unit price', exact: true }).fill('100')
  await page.getByRole('button', { name: 'Named taxes', exact: true }).click()
  await page.getByRole('button', { name: 'Add named tax' }).click()
  await page.getByRole('textbox', { name: 'Name · English', exact: true }).fill('VAT')
  await page.getByRole('textbox', { name: 'Rate (%)', exact: true }).fill('15')
  await page.getByRole('combobox', { name: 'Tax kind', exact: true }).selectOption('vat')
  await page.getByRole('button', { name: 'Line items', exact: true }).click()
  await page.getByRole('combobox', { name: 'Tax treatment' }).selectOption('taxed')
  await page.getByRole('checkbox', { name: 'VAT', exact: true }).check()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page.getByRole('textbox', { name: 'VAT', exact: true }).first().fill('300000000000003')
  await page.getByRole('button', { name: 'ZATCA', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Phase 1-format QR', exact: true }).check()
  await page.getByRole('checkbox', { name: 'VAT', exact: true }).check()
  await expect(page.locator('.qr-image')).toBeVisible()
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = 'yes'
    }
  })
  await page.getByRole('button', { name: 'Print / save PDF', exact: true }).click()
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'yes')
  await page.evaluate(() => document.fonts.ready)
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys()
    const cache = await caches.open(keys.find((key) => key.startsWith('muinvoice-shell-'))!)
    return (await cache.keys()).map((request) => request.url)
  })
  expect(cached.some((url) => url.includes('cairo-arabic'))).toBe(true)
  expect(cached.filter((url) => url.includes('/thumbnails/'))).toHaveLength(25)
  expect(cached.every((url) => !url.includes('blob:') && !url.includes('backup.json'))).toBe(true)
  expect(runtimeErrors).toEqual([])
  expect(external).toEqual([])
  expect(dataRequests).toEqual([])
  await context.setOffline(false)
  await page.getByRole('button', { name: 'Save now', exact: true }).click()
  await page.evaluate(async () => {
    for (const key of await caches.keys())
      if (key.startsWith('muinvoice-shell-')) await caches.delete(key)
    for (const registration of await navigator.serviceWorker.getRegistrations())
      await registration.unregister()
  })
  await page.reload()
  await page.getByRole('button', { name: 'INV-', exact: false }).first().click()
  await expect(page.getByTestId('invoice')).toContainText('Offline Synthetic Studio')
})
