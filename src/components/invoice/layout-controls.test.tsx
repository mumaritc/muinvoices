import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { InvoiceRenderer } from './InvoiceRenderer'
import { newInvoice } from '../../features/invoices/defaults'
import { templateIds } from '../../features/invoices/schema'
import { makeBackup, parseBackup } from '../../lib/backup'
import { emptyWorkspace } from '../../features/invoices/defaults'

it('renders custom text, seller-label visibility and exactly one positioned QR in every template', () => {
  const invoice = newInvoice()
  invoice.seller.name.en = 'Synthetic seller'
  invoice.items[0].unitPrice = '1000'
  invoice.headerText = { en: 'HEADER <script>escaped</script>', ar: 'ترويسة تجريبية' }
  invoice.footerText = { en: 'FOOTER', ar: 'تذييل تجريبي' }
  invoice.design.mode = 'bilingual'
  invoice.design.showSellerLabel = false
  for (const templateId of templateIds)
    for (const position of ['top', 'bottom'] as const)
      for (const align of ['left', 'center', 'right'] as const) {
        invoice.design = { ...invoice.design, templateId, qrPosition: position, qrAlign: align }
        const doc = new DOMParser().parseFromString(
          renderToStaticMarkup(
            <InvoiceRenderer invoice={invoice} qrUrl="data:image/png;base64,AQ==" />,
          ),
          'text/html',
        )
        const article = doc.querySelector('article')!
        expect(article.querySelectorAll('.qr-image')).toHaveLength(1)
        expect(article.querySelector('.party-seller > .eyebrow')).toBeNull()
        expect(article.querySelector('.party-seller h2')?.textContent).toBe('Synthetic seller')
        expect(article.firstElementChild?.getAttribute('data-testid')).toBe('custom-header')
        expect(article.lastElementChild?.getAttribute('data-testid')).toBe('custom-footer')
        expect(article.querySelector('script')).toBeNull()
        expect(article.querySelector('.grand-total')?.textContent).toContain('1000.00')
        const qr = article.querySelector('.invoice-qr')!
        expect(qr.classList.contains(`qr-align-${align}`)).toBe(true)
        expect(position === 'top' ? qr.previousElementSibling : qr.nextElementSibling).toBe(
          position === 'top' ? article.firstElementChild : article.lastElementChild,
        )
      }
})
it('accepts old v1 backups and round-trips new layout/content settings', () => {
  const workspace = emptyWorkspace()
  const invoice = newInvoice()
  workspace.invoices = [invoice]
  const backup = makeBackup(workspace, [])
  const oldJson = JSON.stringify(backup, (key, value: unknown) =>
    ['showSellerLabel', 'qrPosition', 'qrAlign', 'headerText', 'footerText'].includes(key)
      ? undefined
      : value,
  )
  const restored = parseBackup(oldJson).invoices[0]
  expect(restored.design).toMatchObject({
    showSellerLabel: true,
    qrPosition: 'bottom',
    qrAlign: 'right',
  })
  expect(restored.headerText).toEqual({})
  expect(restored.footerText).toEqual({})
  invoice.design.showSellerLabel = false
  invoice.design.qrPosition = 'top'
  invoice.design.qrAlign = 'left'
  invoice.headerText.en = 'Saved header'
  invoice.footerText.ar = 'تذييل'
  expect(parseBackup(JSON.stringify(makeBackup(workspace, []))).invoices[0]).toEqual(invoice)
})
