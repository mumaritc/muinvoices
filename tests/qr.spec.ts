import { test, expect } from '@playwright/test'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'
import { mkdir } from 'node:fs/promises'
test('current QR updates after editing and unsupported enabled QR blocks printing', async ({
  page,
  browserName,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Synthetic QR Seller')
  await page.getByRole('textbox', { name: 'VAT', exact: true }).first().fill('300000000000003')
  await page.getByRole('button', { name: 'Items & taxes', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Description · English', exact: true })
    .fill('Synthetic work')
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
  await page.getByRole('button', { name: 'ZATCA', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Phase 1-format QR', exact: true }).check()
  await page.getByRole('checkbox', { name: 'VAT', exact: true }).check()
  await expect(page.getByTestId('invoice').locator('.qr-image')).toBeVisible()
  const before = await page.locator('.qr-image').getAttribute('src')
  const decoded = PNG.sync.read(Buffer.from(before!.split(',')[1], 'base64'))
  const payload = jsQR(new Uint8ClampedArray(decoded.data), decoded.width, decoded.height)!.data
  expect(Buffer.from(payload, 'base64').toString()).toContain('115.00')
  await page.evaluate(() => document.fonts.ready)
  if (browserName === 'chromium') {
    await mkdir('output/playwright', { recursive: true })
    await page.locator('.qr-image').evaluate((image) => (image as HTMLImageElement).decode())
    await page.pdf({ path: 'output/playwright/pure-qr.pdf', format: 'A4', preferCSSPageSize: true })
  }
  await page.getByRole('button', { name: 'Items & taxes', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit price', exact: true }).fill('200')
  await expect(page.locator('.qr-image')).not.toHaveAttribute('src', before!)
  await expect(page.getByRole('button', { name: 'Print / save PDF' })).toBeEnabled()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Invoice details', exact: true }).click()
  await page.getByRole('textbox', { name: 'Currency (ISO)' }).fill('USD')
  await expect(page.getByRole('button', { name: 'Print / save PDF' })).toBeDisabled()
  await expect(page.locator('.qr-image')).toHaveCount(0)
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'ZATCA', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Phase 1-format QR', exact: true }).uncheck()
  await expect(page.getByRole('button', { name: 'Print / save PDF' })).toBeEnabled()
})
