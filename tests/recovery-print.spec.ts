import { test, expect } from '@playwright/test'
import { emptyWorkspace, newInvoice, newItem, uuid } from '../src/features/invoices/defaults'
import { makeBackup } from '../src/lib/backup'
import { mkdir } from 'node:fs/promises'
for (const mode of ['en', 'ar', 'bilingual'] as const) {
  test(`Pure ${mode} backup restoration, 100-item print and second-tab protection`, async ({
    page,
    context,
  }) => {
    const workspace = emptyWorkspace()
    const invoice = newInvoice()
    invoice.id = uuid()
    invoice.number = `INV-2026/${mode}`
    invoice.design.mode = mode
    invoice.seller.name = { en: 'Synthetic Studio', ar: 'استوديو تجريبي' }
    invoice.customer.name = { en: 'Synthetic Client', ar: 'عميل تجريبي' }
    invoice.items = Array.from({ length: 100 }, (_, n) => ({
      ...newItem(),
      description: { en: `Row-${n + 1} · Design services`, ar: `البند-${n + 1} · خدمات التصميم` },
      unitPrice: '10',
    }))
    workspace.invoices = [invoice]
    await page.goto('/')
    await page.getByRole('button', { name: 'Backups & settings', exact: true }).click()
    await page.getByLabel('Restore backup', { exact: true }).setInputFiles({
      name: 'recovery.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(makeBackup(workspace, []))),
    })
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Replace workspace', exact: true }).click()
    await page.getByRole('button', { name: 'Invoices 1', exact: true }).click()
    await page.getByRole('button', { name: invoice.number, exact: false }).first().click()
    await expect(page.getByTestId('invoice').locator('tbody tr')).toHaveCount(100)
    await expect(page.getByTestId('invoice').locator('.grand-total')).toContainText('1000.00')
    await page.evaluate(() => document.fonts.ready)
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('.app-sidebar')).toBeHidden()
    await expect(page.getByTestId('invoice')).toBeVisible()
    await mkdir('output/playwright', { recursive: true })
    await page.pdf({
      path: `output/playwright/pure-${mode}-100.pdf`,
      format: 'A4',
      preferCSSPageSize: true,
    })
    await page.emulateMedia({ media: 'screen' })
    await page.screenshot({ path: `output/playwright/pure-${mode}.png`, fullPage: false })
    const second = await context.newPage()
    await second.goto('/')
    await expect(second.getByRole('alert')).toContainText('Another muinvoice tab')
    await second.close()
    invoice.items = invoice.items.slice(0, 1)
    await page.goto('/tests/render.html')
    await page.evaluate((i) => window.renderFixture(i), invoice)
    await page.pdf({
      path: `output/playwright/pure-${mode}-short.pdf`,
      format: 'A4',
      preferCSSPageSize: true,
    })
  })
}
test('denied browser storage retains editable work and exposes backup', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new Error('Storage denied for test')
      },
    })
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Storage denied')
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Unsaved Synthetic Seller')
  await expect(page.getByTestId('invoice')).toContainText('Unsaved Synthetic Seller')
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup', exact: true }).last().click()
  expect((await downloaded).suggestedFilename()).toContain('muinvoice')
  await expect(page.getByRole('status').first()).not.toContainText('All changes saved')
})
