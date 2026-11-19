import { type ReactNode } from 'react'
import { type Invoice, type LocalizedText, type Party } from '../../features/invoices/schema'
import { type Calculation } from '../../lib/calculations'
import { localizedValues, t, type CopyKey } from '../../locales/dictionary'

export type PrintProps = {
  invoice: Invoice
  totals: Calculation
  assetUrls: Record<string, string>
}
export function LocalText({ value, invoice }: { value: LocalizedText; invoice: Invoice }) {
  return (
    <span className="localized">
      {localizedValues(value, invoice.design.mode, invoice.design.order).map((v) => (
        <span key={v.language} lang={v.language} dir={v.language === 'ar' ? 'rtl' : 'ltr'}>
          <bdi>{v.text}</bdi>
        </span>
      ))}
    </span>
  )
}
export function Label({ name, invoice }: { name: CopyKey; invoice: Invoice }) {
  const custom = invoice.design.labels[name as keyof Invoice['design']['labels']]
  return (
    <LocalText
      invoice={invoice}
      value={custom?.en || custom?.ar ? custom : { en: t(name, 'en'), ar: t(name, 'ar') }}
    />
  )
}
export function Money({ value, invoice }: { value: string; invoice: Invoice }) {
  const display =
    invoice.numerals === 'arab'
      ? value.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]).replace('.', '٫')
      : value
  return <bdi dir="ltr">{display}</bdi>
}
export function PartyDetails({
  party,
  invoice,
  title,
  assetUrls,
}: {
  party: Party
  invoice: Invoice
  title: 'seller' | 'customer'
  assetUrls: Record<string, string>
}) {
  return (
    <section className={`party party-${title}`}>
      {title !== 'seller' || invoice.design.showSellerLabel ? (
        <p className="eyebrow">
          <Label name={title} invoice={invoice} />
        </p>
      ) : null}
      {party.logoAssetId && assetUrls[party.logoAssetId] ? (
        <img
          className={`invoice-logo logo-${invoice.design.logoPosition}`}
          style={{ width: invoice.design.logoSize }}
          src={assetUrls[party.logoAssetId]}
          alt=""
        />
      ) : null}
      <h2>
        <LocalText value={party.name} invoice={invoice} />
      </h2>
      <div className="preserve">
        <LocalText value={party.address} invoice={invoice} />
      </div>
      {(['vat', 'registration', 'phone', 'email', 'website'] as const).map((key) =>
        party[key] ? (
          <div key={key} className="party-detail">
            <Label name={key} invoice={invoice} /> <bdi dir="auto">{party[key]}</bdi>
          </div>
        ) : null,
      )}
      {party.fields
        .filter((f) => f.visible)
        .map((f) => (
          <div key={f.id}>
            <LocalText value={f.label} invoice={invoice} />:{' '}
            <LocalText value={f.value} invoice={invoice} />
          </div>
        ))}
    </section>
  )
}
export function InvoiceMetadata({ invoice }: PrintProps) {
  return (
    <dl className="invoice-meta">
      <div>
        <dt>
          <Label name="number" invoice={invoice} />
        </dt>
        <dd>
          <bdi>{invoice.number}</bdi>
        </dd>
      </div>
      <div>
        <dt>
          <Label name="issued" invoice={invoice} />
        </dt>
        <dd>
          <bdi>
            {new Intl.DateTimeFormat(
              invoice.design.mode === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB',
              { dateStyle: 'medium', timeStyle: 'short', timeZone: invoice.timezone },
            ).format(new Date(invoice.issuedAt))}
          </bdi>
        </dd>
      </div>
      {invoice.dueDate ? (
        <div>
          <dt>
            <Label name="due" invoice={invoice} />
          </dt>
          <dd>
            <bdi>{invoice.dueDate}</bdi>
          </dd>
        </div>
      ) : null}
      {invoice.reference ? (
        <div>
          <dt>
            <Label name="reference" invoice={invoice} />
          </dt>
          <dd>
            <bdi dir="auto">{invoice.reference}</bdi>
          </dd>
        </div>
      ) : null}
    </dl>
  )
}
export function ItemsTable({ invoice, totals }: PrintProps) {
  const columns = invoice.design.columns.filter((c) => c.visible)
  function cell(id: (typeof columns)[number]['id'], index: number): ReactNode {
    const item = invoice.items[index]
    const line = totals.lines[index]
    switch (id) {
      case 'number':
        return <bdi>{index + 1}</bdi>
      case 'description':
        return (
          <>
            <LocalText value={item.description} invoice={invoice} />
            {item.explanation.en || item.explanation.ar ? (
              <small>
                <LocalText value={item.explanation} invoice={invoice} />
              </small>
            ) : null}
          </>
        )
      case 'sku':
        return <bdi>{item.sku}</bdi>
      case 'unit':
        return <LocalText value={item.unit} invoice={invoice} />
      case 'quantity':
        return <Money value={item.quantity} invoice={invoice} />
      case 'unitPrice':
        return <Money value={item.unitPrice} invoice={invoice} />
      case 'discount':
        return <Money value={line.discount} invoice={invoice} />
      case 'tax':
        return <Money value={line.tax} invoice={invoice} />
      case 'total':
        return <Money value={line.total} invoice={invoice} />
    }
  }
  const weight = columns.reduce((sum, c) => sum + c.width, 0)
  return (
    <table className={`items-table borders-${invoice.design.border}`}>
      <colgroup>
        {columns.map((c) => (
          <col key={c.id} style={{ width: `${(c.width / weight) * 100}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.id} style={{ textAlign: c.align }} scope="col">
              {c.label.en || c.label.ar ? (
                <LocalText value={c.label} invoice={invoice} />
              ) : (
                <Label name={c.id === 'number' ? 'number' : c.id} invoice={invoice} />
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {invoice.items.map((item, index) => (
          <tr
            className={
              JSON.stringify([item.description, item.sku, item.unit, item.explanation]).length >
              1800
                ? 'oversized-row'
                : ''
            }
            key={item.id}
          >
            {columns.map((c) => (
              <td style={{ textAlign: c.align }} key={c.id}>
                {cell(c.id, index)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
export function Totals({ invoice, totals }: PrintProps) {
  const row = (label: CopyKey, value: string, className = '') => (
    <div className={className}>
      <dt>
        <Label name={label} invoice={invoice} />
      </dt>
      <dd>
        <Money invoice={invoice} value={value} />
      </dd>
    </div>
  )
  return (
    <section className={`totals ${totals.breakdown.length > 20 ? 'oversized-block' : ''}`}>
      <dl>
        {row('subtotal', totals.subtotal)}
        {totals.itemDiscount !== (0).toFixed(totals.scale)
          ? row('discount', totals.itemDiscount)
          : null}
        {totals.overallDiscount !== (0).toFixed(totals.scale)
          ? row('allocation', totals.overallDiscount)
          : null}
        {row('net', totals.netTotal)}
        {totals.breakdown
          .filter((b) => b.treatment !== 'none')
          .map((b) => (
            <div key={b.id + b.treatment}>
              <dt>
                {b.id ? (
                  <LocalText
                    invoice={invoice}
                    value={invoice.taxes.find((t) => t.id === b.id)!.name}
                  />
                ) : (
                  <Label name="tax" invoice={invoice} />
                )}{' '}
                <bdi>{b.rate}%</bdi> ·{' '}
                <Label name={b.treatment as 'taxed' | 'exempt' | 'zeroRated'} invoice={invoice} />
              </dt>
              <dd>
                <Money invoice={invoice} value={b.amount} />
              </dd>
            </div>
          ))}
        {row('tax', totals.taxTotal)}
        {row('total', totals.grandTotal, 'grand-total')}
      </dl>
      <p className="currency-code">
        <bdi>{invoice.currency}</bdi>
      </p>
    </section>
  )
}
export function Sections({
  invoice,
  position,
}: {
  invoice: Invoice
  position: Invoice['sections'][number]['position']
}) {
  return (
    <div className={`invoice-sections sections-${position}`}>
      {invoice.sections
        .filter((s) => s.visible && s.position === position)
        .map((s) => (
          <section key={s.id}>
            <h3>
              <LocalText value={s.title} invoice={invoice} />
            </h3>
            {s.kind === 'text' ? (
              <p className="preserve">
                <LocalText value={s.text} invoice={invoice} />
              </p>
            ) : (
              <dl>
                {s.fields
                  .filter((f) => f.visible)
                  .map((f) => (
                    <div key={f.id}>
                      <dt>
                        <LocalText value={f.label} invoice={invoice} />
                      </dt>
                      <dd>
                        <LocalText value={f.value} invoice={invoice} />
                      </dd>
                    </div>
                  ))}
              </dl>
            )}
          </section>
        ))}
    </div>
  )
}
export function InvoiceTitle({ invoice }: PrintProps) {
  return (
    <div className="invoice-title">
      <h1>
        <Label name={invoice.type} invoice={invoice} />
      </h1>
      <p>
        <bdi>{invoice.number}</bdi>
      </p>
    </div>
  )
}
export function Signature({ invoice, assetUrls }: PrintProps) {
  return (
    <div className="signature-qr">
      {invoice.signatureAssetId && assetUrls[invoice.signatureAssetId] ? (
        <figure>
          <img className="signature-image" src={assetUrls[invoice.signatureAssetId]} alt="" />
          <figcaption>
            <Label name="signature" invoice={invoice} />
          </figcaption>
        </figure>
      ) : null}
    </div>
  )
}
export function Pure(props: PrintProps) {
  return (
    <>
      <header className="pure-header">
        <InvoiceTitle {...props} />
        <InvoiceMetadata {...props} />
      </header>
      <div className="pure-parties">
        <PartyDetails {...props} party={props.invoice.seller} title="seller" />
        <PartyDetails {...props} party={props.invoice.customer} title="customer" />
      </div>
      <Sections invoice={props.invoice} position="beforeItems" />
      <ItemsTable {...props} />
      <div className="closing">
        <Sections invoice={props.invoice} position="afterItems" />
        <Totals {...props} />
      </div>
      <Signature {...props} />
      <Sections invoice={props.invoice} position="footer" />
    </>
  )
}
