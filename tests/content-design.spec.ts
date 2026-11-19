import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
test('profile isolation, bilingual sections, hidden columns, assets and complete backup transfer', async ({
  page,
  browser,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Original Synthetic Seller')
  await page
    .getByRole('textbox', { name: 'Name · العربية', exact: true })
    .first()
    .fill('بائع تجريبي')
  await page.getByRole('textbox', { name: 'Label', exact: true }).fill('Synthetic profile')
  await page.getByRole('button', { name: 'Save seller as profile', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Changed invoice seller')
  await page.getByRole('button', { name: 'Items & taxes', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Description · English', exact: true })
    .fill('Synthetic consulting')
  await page.getByRole('textbox', { name: 'Unit price', exact: true }).fill('115')
  await page.getByRole('button', { name: 'Sections', exact: true }).click()
  await page.getByRole('button', { name: 'Add section' }).click()
  await page.getByRole('textbox', { name: 'Title · English', exact: true }).fill('Payment details')
  await page
    .getByRole('textbox', { name: 'Text · English', exact: true })
    .fill('Bank REF-2026/001 · hello@example.test')
  await page
    .getByRole('textbox', { name: 'Text · العربية', exact: true })
    .fill('مرجع البنك REF-2026/001')
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await page.getByRole('button', { name: 'Appearance', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Document language', exact: true })
    .selectOption('bilingual')
  await page.getByRole('button', { name: 'Table columns', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Unit price', exact: true }).uncheck()
  await expect(page.getByTestId('invoice').locator('.grand-total')).toContainText('115.00')
  await expect(
    page.getByTestId('invoice').getByRole('columnheader', { name: 'Unit price' }),
  ).toHaveCount(0)
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#234d46'
    ctx.fillRect(0, 0, 64, 32)
    return canvas.toDataURL().split(',')[1]
  })
  await page.getByRole('button', { name: 'Appearance', exact: true }).click()
  await page.getByLabel('Seller logo', { exact: true }).setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64'),
  })
  await expect(page.getByTestId('invoice').locator('.invoice-logo')).toBeVisible()
  await page.getByRole('button', { name: 'Save now', exact: true }).click()
  await page.getByRole('button', { name: 'Finalize locally', exact: true }).click()
  await expect(page.locator('fieldset')).toHaveAttribute('disabled', '')
  await page.getByRole('button', { name: 'Return to draft', exact: true }).click()
  await expect(page.locator('fieldset')).not.toHaveAttribute('disabled', '')
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click()
  await page.getByRole('button', { name: 'Invoices', exact: true }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete', exact: true }).first().click()
  await expect(page.getByRole('button', { name: 'Invoices 1', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Backups & settings', exact: true }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup', exact: true }).last().click()
  const filePath = await (await downloadEvent).path()
  const buffer = await readFile(filePath!)
  const backup = JSON.parse(buffer.toString())
  expect(backup.assets).toHaveLength(1)
  expect(backup.companies[0].party.name.en).toBe('Original Synthetic Seller')
  expect(backup.invoices[0].seller.name.en).toBe('Changed invoice seller')
  const other = await browser.newContext()
  const target = await other.newPage()
  await target.goto('/')
  await target.getByRole('button', { name: 'Backups & settings', exact: true }).click()
  await target
    .getByLabel('Restore backup', { exact: true })
    .setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer })
  target.once('dialog', (d) => d.accept())
  await target.getByRole('button', { name: 'Replace workspace', exact: true }).click()
  await expect(target.locator('.settings-message')).toContainText('All changes saved')
  await target.getByRole('button', { name: 'Invoices 1', exact: true }).click()
  await target.getByRole('button', { name: 'INV-', exact: false }).first().click()
  await expect(target.getByTestId('invoice').locator('.invoice-logo')).toBeVisible()
  await expect(target.getByTestId('invoice')).toContainText('REF-2026/001')
  await expect(target.getByTestId('invoice').locator('.grand-total')).toContainText('115.00')
  await target.reload()
  await target.getByRole('button', { name: 'INV-', exact: false }).first().click()
  await expect(target.getByTestId('invoice').locator('.invoice-logo')).toBeVisible()
  await other.close()
})
test('Arabic interface remains independent from document language and mobile controls work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Synthetic Seller')
  await page.getByRole('button', { name: 'Interface language' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.getByRole('button', { name: 'معاينة مباشرة', exact: true }).click()
  await expect(page.getByTestId('invoice')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByTestId('invoice')).toBeVisible()
  await page.screenshot({ path: 'output/playwright/mobile-ar-ui.png' })
})
