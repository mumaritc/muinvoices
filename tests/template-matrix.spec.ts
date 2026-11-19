import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { templates, templateDefaults } from '../src/features/templates/registry'
import { newInvoice, newItem, uuid } from '../src/features/invoices/defaults'
import { type Design } from '../src/features/invoices/schema'
function fixture(
  id: Design['templateId'],
  mode: Design['mode'],
  content: 'short' | 'long' | 'pathological',
) {
  const i = newInvoice()
  const tax = uuid()
  i.design = { ...templateDefaults(id), mode }
  i.seller.name = { en: 'Synthetic Studio', ar: 'استوديو تجريبي' }
  i.seller.address = {
    en: '18 Example Street\nRiyadh · Synthetic data',
    ar: '١٨ شارع تجريبي\nالرياض · بيانات تجريبية',
  }
  i.seller.vat = '300000000000003'
  i.customer.name = { en: 'Sample Client', ar: 'عميل تجريبي' }
  i.customer.email = 'hello@example.test'
  i.number = 'INV-2026/001'
  i.reference = 'PROJECT-26/01'
  i.dueDate = '2026-12-01'
  i.issuedAt = '2026-11-16T12:00:00Z'
  i.taxes = [{ id: tax, name: { en: 'VAT', ar: 'ضريبة القيمة المضافة' }, rate: '15', kind: 'vat' }]
  i.items = Array.from({ length: content === 'long' ? 100 : 1 }, (_, n) => ({
    ...newItem(),
    description: {
      en: `Row-${n + 1} · Brand identity and design`,
      ar: `البند-${n + 1} · الهوية البصرية والتصميم`,
    },
    sku: 'SKU-001',
    unit: { en: 'Project', ar: 'مشروع' },
    unitPrice: '1000',
    discount: { type: 'percent', value: '10' },
    treatment: 'taxed',
    taxIds: [tax],
  }))
  i.sections = [
    {
      id: uuid(),
      title: { en: 'Payment details', ar: 'تفاصيل الدفع' },
      text: {
        en: 'Please quote INV-2026/001. Bank reference: SYNTHETIC-001.',
        ar: 'يرجى ذكر INV-2026/001. مرجع البنك: SYNTHETIC-001.',
      },
      kind: 'text',
      fields: [],
      visible: true,
      position: 'afterItems',
    },
  ]
  if (content === 'pathological') {
    i.items[0].description.ar = 'ROW-START ' + 'وصف تجريبي طويل '.repeat(250) + ' ROW-END'
    i.sections[0].text.ar =
      'SECTION-START ' + 'نص تجريبي '.repeat(1000).slice(0, 9974) + ' SECTION-END'
    i.items[0].description.en = 'ROW-START ' + 'Long descriptive text '.repeat(200) + ' ROW-END'
    i.sections[0].text.en =
      'SECTION-START ' + 'Long section '.repeat(750).slice(0, 9974) + ' SECTION-END'
    i.customer.website = 'https://example.test/' + 'long-identifier'.repeat(150)
    i.design.columns.forEach((c) => {
      c.visible = true
    })
  }
  return i
}
for (const batch of ['A', 'B', 'C', 'D', 'E']) {
  test(`batch ${batch}: every template × language × content class`, async ({
    page,
    browserName,
  }) => {
    test.setTimeout(180000)
    await page.goto('/tests/render.html')
    await mkdir('output/playwright/matrix', { recursive: true })
    if (process.env.UPDATE_THUMBNAILS) await mkdir('public/thumbnails', { recursive: true })
    for (const template of templates.filter((t) => t.batch === batch)) {
      for (const mode of ['en', 'ar', 'bilingual'] as const) {
        for (const content of ['short', 'long', 'pathological'] as const) {
          const invoice = fixture(template.id, mode, content)
          await page.evaluate((i) => window.renderFixture(i), invoice)
          const article = page.getByTestId('invoice')
          await expect(article.locator('tbody').first().locator('tr')).toHaveCount(
            content === 'long' ? 100 : 1,
          )
          await expect(article.locator('.grand-total')).toContainText(
            content === 'long' ? '103500.00' : '1035.00',
          )
          await expect(article).toContainText('INV-2026/001')
          if (content === 'pathological') {
            await expect(article).toContainText('ROW-END')
            await expect(article).toContainText('SECTION-END')
          }
          const bounds = await article.evaluate((el) => ({
            width: el.clientWidth,
            scroll: el.scrollWidth,
          }))
          expect(bounds.scroll, `${template.id}/${mode}/${content}`).toBeLessThanOrEqual(
            bounds.width + 1,
          )
          if (content === 'short') {
            await article.screenshot({
              path: `output/playwright/matrix/${template.id}-${mode}.png`,
            })
            if (process.env.UPDATE_THUMBNAILS && mode === 'en')
              await article.screenshot({ path: `public/thumbnails/${template.id}.png` })
          }
          if (
            browserName === 'chromium' &&
            ((content === 'long' && mode === 'bilingual') ||
              (content === 'pathological' && mode === 'ar'))
          ) {
            await page.pdf({
              path: `output/playwright/matrix/${template.id}-${mode}-${content}.pdf`,
              preferCSSPageSize: true,
              format: 'A4',
              printBackground: false,
            })
          }
        }
      }
    }
  })
}
