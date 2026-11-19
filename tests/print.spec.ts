import { expect, test } from '@playwright/test'
import { newInvoice, newItem } from '../src/features/invoices/defaults'
import { mkdir } from 'node:fs/promises'
for (const font of ['noto', 'cairo', 'plex'] as const) {
  test(`Pure pathological content flows with ${font}`, async ({ page }) => {
    await page.goto('/tests/render.html')
    const invoice = newInvoice()
    invoice.seller.name = { en: 'Synthetic Studio', ar: 'استوديو تجريبي' }
    invoice.design.font = font
    invoice.design.mode = 'bilingual'
    invoice.design.columns.forEach((c) => {
      c.visible = true
    })
    invoice.items = [
      {
        ...newItem(),
        description: {
          en: 'ROW-START ' + 'Long flowing description '.repeat(250) + ' ROW-END',
          ar: 'وصف تجريبي طويل '.repeat(150),
        },
        sku: 'IDENTIFIER'.repeat(100),
        unitPrice: '10',
      },
    ]
    invoice.sections = [
      {
        id: crypto.randomUUID(),
        title: { en: 'Long section', ar: 'قسم طويل' },
        text: {
          en: 'SECTION-START ' + 'Flowing content. '.repeat(600).slice(0, 9974) + ' SECTION-END',
        },
        kind: 'text',
        fields: [],
        visible: true,
        position: 'footer',
      },
    ]
    await page.evaluate((i) => window.renderFixture(i), invoice)
    await expect(page.getByTestId('invoice')).toContainText('ROW-END')
    await expect(page.getByTestId('invoice')).toContainText('SECTION-END')
    await page.emulateMedia({ media: 'print' })
    const bounds = await page
      .getByTestId('invoice')
      .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }))
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1)
    await mkdir('output/playwright', { recursive: true })
    await page.pdf({
      path: `output/playwright/pure-stress-${font}.pdf`,
      format: 'A4',
      preferCSSPageSize: true,
      printBackground: false,
    })
  })
}
test('short print contains the same invoice DOM and waits for readiness', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Synthetic Seller')
  await page.getByRole('button', { name: 'Items & taxes', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Description · English', exact: true })
    .fill('Print this description')
  await page.getByRole('textbox', { name: 'Unit price', exact: true }).fill('1000')
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed =
        document.querySelector('[data-testid=invoice]')?.textContent ?? ''
    }
  })
  await page.getByRole('button', { name: 'Print / save PDF', exact: true }).click()
  await expect(page.locator('body')).toHaveAttribute('data-printed', /Print this description/)
  await expect(page.locator('.document-name')).toContainText('Draft')
  await page.evaluate(() => {
    const reminder = document.createElement('div')
    reminder.className = 'backup-reminder'
    reminder.textContent = 'Backup reminder test'
    document.body.append(reminder)
  })
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.backup-reminder')).toBeHidden()
  await page.pdf({
    path: 'output/playwright/pure-short.pdf',
    format: 'A4',
    preferCSSPageSize: true,
  })
})
