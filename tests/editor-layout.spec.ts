import { test, expect } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
test('layout controls survive tabs, save/reload and export, with one aligned QR in print', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await expect(page.locator('.app-sidebar')).toBeHidden()
  await expect(page.getByRole('textbox', { name: 'Name · English', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .fill('Synthetic layout seller')
  await page.getByRole('textbox', { name: 'VAT', exact: true }).fill('300000000000003')
  await page.getByRole('checkbox', { name: 'Show “From” label', exact: true }).uncheck()
  await expect(page.locator('.party-seller > .eyebrow')).toHaveCount(0)
  await expect(page.locator('.party-seller')).toContainText('Synthetic layout seller')
  await page.getByRole('button', { name: 'Bill to', exact: true }).click()
  await page.getByRole('textbox', { name: 'Name · English', exact: true }).fill('Synthetic buyer')
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await page.getByRole('button', { name: 'Appearance', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Header text · English', exact: true })
    .fill('Custom heading')
  await page
    .getByRole('textbox', { name: 'Footer text · English', exact: true })
    .fill('Custom closing')
  await page.getByRole('button', { name: 'Reset design', exact: true }).click()
  await expect(page.getByTestId('custom-header')).toContainText('Custom heading')
  await expect(page.getByTestId('custom-footer')).toContainText('Custom closing')
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Show “From” label', exact: true }).uncheck()
  await page.getByRole('button', { name: 'Items & taxes', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Add named tax', exact: true })).toHaveCount(0)
  await page
    .getByRole('textbox', { name: 'Description · English', exact: true })
    .fill('Synthetic service')
  await page.getByRole('textbox', { name: 'Unit price', exact: true }).fill('100')
  await page.getByRole('button', { name: 'Named taxes', exact: true }).click()
  await page.getByRole('button', { name: 'Add named tax', exact: true }).click()
  await page.getByRole('textbox', { name: 'Name · English', exact: true }).fill('VAT')
  await page.getByRole('textbox', { name: 'Rate (%)', exact: true }).fill('15')
  await page.getByRole('combobox', { name: 'Tax kind', exact: true }).selectOption('vat')
  await page.getByRole('button', { name: 'Line items', exact: true }).click()
  await page.getByRole('combobox', { name: 'Tax treatment', exact: true }).selectOption('taxed')
  await page.getByRole('checkbox', { name: 'VAT', exact: true }).check()
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await page.getByRole('button', { name: 'Labels', exact: true }).click()
  await page.getByRole('textbox', { name: 'Invoice · English', exact: true }).fill('Custom invoice')
  await page.getByRole('button', { name: 'Table columns', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Unit price', exact: true }).uncheck()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'ZATCA', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Phase 1-format QR', exact: true }).check()
  await page.getByRole('checkbox', { name: 'VAT', exact: true }).check()
  const article = page.getByTestId('invoice')
  await mkdir('output/playwright', { recursive: true })
  for (const position of ['top', 'bottom'])
    for (const align of ['left', 'center', 'right']) {
      await page.getByRole('combobox', { name: 'QR position', exact: true }).selectOption(position)
      await page.getByRole('combobox', { name: 'QR alignment', exact: true }).selectOption(align)
      await expect(article.locator('.qr-image')).toHaveCount(1)
      await expect(article.locator('.invoice-qr')).toHaveClass(new RegExp(`qr-align-${align}`))
      const image = await article.locator('.qr-image').boundingBox()
      const row = await article.locator('.invoice-qr').boundingBox()
      expect(image).not.toBeNull()
      expect(row).not.toBeNull()
      const delta =
        align === 'left'
          ? image!.x - row!.x
          : align === 'right'
            ? image!.x + image!.width - row!.x - row!.width
            : image!.x + image!.width / 2 - row!.x - row!.width / 2
      expect(Math.abs(delta)).toBeLessThan(2)
      const adjacent = await article
        .locator('.invoice-qr')
        .evaluate(
          (el, top) =>
            (top ? el.previousElementSibling : el.nextElementSibling)?.getAttribute('data-testid'),
          position === 'top',
        )
      expect(adjacent).toBe(position === 'top' ? 'custom-header' : 'custom-footer')
      if (
        (position === 'top' && align === 'left') ||
        (position === 'bottom' && align === 'right')
      ) {
        await page.evaluate(() => document.fonts.ready)
        await article.locator('.qr-image').evaluate((el) => (el as HTMLImageElement).decode())
        await page.pdf({
          path: `output/playwright/editor-${position}-${align}.pdf`,
          format: 'A4',
          preferCSSPageSize: true,
        })
      }
    }
  await page.screenshot({ path: 'output/playwright/editor-layout.png' })
  await page.getByRole('button', { name: 'Save now', exact: true }).click()
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup', exact: true }).last().click()
  const file = await (await downloaded).path()
  const backup = JSON.parse(await readFile(file!, 'utf8'))
  expect(backup.invoices[0]).toMatchObject({
    headerText: { en: 'Custom heading' },
    footerText: { en: 'Custom closing' },
    design: { showSellerLabel: false, qrPosition: 'bottom', qrAlign: 'right' },
  })
  await page.getByRole('button', { name: 'Save now', exact: true }).click()
  await page.reload()
  await expect(page.locator('.app-sidebar')).toBeVisible()
  await page.getByRole('button', { name: 'INV-', exact: false }).first().click()
  await expect(page.locator('.app-sidebar')).toBeHidden()
  await expect(article.getByTestId('custom-header')).toContainText('Custom heading')
  await expect(article.getByTestId('custom-footer')).toContainText('Custom closing')
  await expect(article.locator('.party-seller > .eyebrow')).toHaveCount(0)
  await expect(article.locator('.qr-image')).toBeVisible()
  await expect(article.locator('.grand-total')).toContainText('115.00')
})
