import { type CSSProperties } from 'react'
import { type Invoice } from '../../features/invoices/schema'
import { calculateInvoice } from '../../lib/calculations'
import { templates } from '../../features/templates/registry'
import { LocalText } from './blocks'
export function InvoiceRenderer({
  invoice,
  assetUrls = {},
  qrUrl,
}: {
  invoice: Invoice
  assetUrls?: Record<string, string>
  qrUrl?: string
}) {
  const calculation = calculateInvoice(invoice)
  if (!calculation.ok) return <p role="alert">Invalid invoice</p>
  const rtl =
    invoice.design.mode === 'ar' ||
    (invoice.design.mode === 'bilingual' && invoice.design.order === 'ar-first')
  const style = {
    '--invoice-accent': invoice.design.accent,
    '--invoice-color': invoice.design.color,
  } as CSSProperties
  const Composition = templates.find((t) => t.id === invoice.design.templateId)!.component
  const qr = qrUrl ? (
    <div className={`invoice-qr qr-align-${invoice.design.qrAlign}`} dir="ltr">
      <img className="qr-image" src={qrUrl} alt="QR" />
    </div>
  ) : null
  return (
    <article
      data-testid="invoice"
      className={`invoice template-${invoice.design.templateId} font-${invoice.design.font} type-${invoice.design.size} spacing-${invoice.design.spacing} mode-${invoice.design.mode}`}
      lang={rtl ? 'ar' : 'en'}
      dir={rtl ? 'rtl' : 'ltr'}
      style={style}
    >
      {invoice.headerText.en || invoice.headerText.ar ? (
        <div className="document-header-text preserve" data-testid="custom-header">
          <LocalText value={invoice.headerText} invoice={invoice} />
        </div>
      ) : null}
      {invoice.design.qrPosition === 'top' ? qr : null}
      <Composition invoice={invoice} totals={calculation.value} assetUrls={assetUrls} />
      {invoice.design.qrPosition === 'bottom' ? qr : null}
      {invoice.footerText.en || invoice.footerText.ar ? (
        <div className="document-footer-text preserve" data-testid="custom-footer">
          <LocalText value={invoice.footerText} invoice={invoice} />
        </div>
      ) : null}
    </article>
  )
}
