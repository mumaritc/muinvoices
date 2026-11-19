import {
  type PrintProps,
  PartyDetails,
  InvoiceMetadata,
  ItemsTable,
  Totals,
  Sections,
  InvoiceTitle,
  Signature,
  LocalText,
  Label,
  Money,
} from '../../components/invoice/blocks'
const Seller = (p: PrintProps) => <PartyDetails {...p} party={p.invoice.seller} title="seller" />
const Customer = (p: PrintProps) => (
  <PartyDetails {...p} party={p.invoice.customer} title="customer" />
)
const Before = (p: PrintProps) => <Sections invoice={p.invoice} position="beforeItems" />
const After = (p: PrintProps) => <Sections invoice={p.invoice} position="afterItems" />
const Footer = (p: PrintProps) => <Sections invoice={p.invoice} position="footer" />

export function CleanLine(p: PrintProps) {
  return (
    <>
      <header className="ruled-header">
        <InvoiceTitle {...p} />
      </header>
      <div className="metadata-band">
        <InvoiceMetadata {...p} />
      </div>
      <div className="party-pair">
        <Seller {...p} />
        <Customer {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <Totals {...p} />
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function Monochrome(p: PrintProps) {
  return (
    <>
      <header className="framed-masthead">
        <Seller {...p} />
        <InvoiceTitle {...p} />
      </header>
      <div className="fact-sheet boxed">
        <InvoiceMetadata {...p} />
        <Customer {...p} />
      </div>
      <Before {...p} />
      <div className="dense-grid">
        <ItemsTable {...p} />
      </div>
      <div className="boxed end-summary">
        <Totals {...p} />
      </div>
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function Air(p: PrintProps) {
  return (
    <>
      <header className="centered-identity">
        <Seller {...p} />
        <InvoiceTitle {...p} />
      </header>
      <div className="narrow-metadata">
        <InvoiceMetadata {...p} />
      </div>
      <div className="air-customer">
        <Customer {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <After {...p} />
      <div className="air-totals">
        <Totals {...p} />
      </div>
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function Executive(p: PrintProps) {
  return (
    <>
      <header className="letterhead">
        <Seller {...p} />
        <InvoiceTitle {...p} />
      </header>
      <div className="metadata-band">
        <InvoiceMetadata {...p} />
      </div>
      <div className="party-card">
        <Customer {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="summary-rail">
        <After {...p} />
        <Totals {...p} />
      </div>
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function TaxBreakdown(p: PrintProps) {
  return (
    <table className="tax-breakdown">
      <thead>
        <tr>
          <th>
            <Label name="tax" invoice={p.invoice} />
          </th>
          <th>
            <Label name="net" invoice={p.invoice} />
          </th>
          <th>
            <Label name="total" invoice={p.invoice} />
          </th>
        </tr>
      </thead>
      <tbody>
        {p.totals.breakdown.map((tax) => (
          <tr key={tax.id + tax.treatment}>
            <td>
              {tax.id ? (
                <LocalText
                  invoice={p.invoice}
                  value={p.invoice.taxes.find((t) => t.id === tax.id)!.name}
                />
              ) : (
                <Label invoice={p.invoice} name={tax.treatment as 'none'} />
              )}{' '}
              <bdi>{tax.rate}%</bdi>
            </td>
            <td>
              <Money invoice={p.invoice} value={tax.base} />
            </td>
            <td>
              <Money invoice={p.invoice} value={tax.amount} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
export function Ledger(p: PrintProps) {
  return (
    <>
      <header className="ledger-heading">
        <InvoiceTitle {...p} />
        <InvoiceMetadata {...p} />
      </header>
      <div className="party-pair ledger-parties">
        <Seller {...p} />
        <Customer {...p} />
      </div>
      <Before {...p} />
      <div className="dense-grid">
        <ItemsTable {...p} />
      </div>
      <TaxBreakdown {...p} />
      <Totals {...p} />
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function BlueOffice(p: PrintProps) {
  return (
    <>
      <header className="title-band">
        <InvoiceTitle {...p} />
      </header>
      <div className="three-blocks">
        <Seller {...p} />
        <Customer {...p} />
        <InvoiceMetadata {...p} />
      </div>
      <Before {...p} />
      <div className="shaded-table">
        <ItemsTable {...p} />
      </div>
      <div className="office-closing">
        <After {...p} />
        <div className="summary-panel">
          <Totals {...p} />
        </div>
      </div>
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function Structured(p: PrintProps) {
  return (
    <>
      <header className="structured-head">
        <InvoiceTitle {...p} />
        <InvoiceMetadata {...p} />
      </header>
      <section className="numbered-panel">
        <div className="section-index">
          01 · <Label name="seller" invoice={p.invoice} />
        </div>
        <Seller {...p} />
      </section>
      <section className="numbered-panel">
        <div className="section-index">
          02 · <Label name="customer" invoice={p.invoice} />
        </div>
        <Customer {...p} />
      </section>
      <Before {...p} />
      <div className="section-index">
        03 · <Label name="items" invoice={p.invoice} />
      </div>
      <div className="dense-grid">
        <ItemsTable {...p} />
      </div>
      <div className="structured-end">
        <After {...p} />
        <Totals {...p} />
      </div>
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function Formal(p: PrintProps) {
  return (
    <>
      <header className="formal-title">
        <InvoiceTitle {...p} />
      </header>
      <div className="fact-sheet">
        <Seller {...p} />
        <Customer {...p} />
      </div>
      <div className="formal-facts">
        <InvoiceMetadata {...p} />
      </div>
      <Before {...p} />
      <div className="double-rule">
        <ItemsTable {...p} />
      </div>
      <div className="formal-summary">
        <Totals {...p} />
        <Signature {...p} />
      </div>
      <After {...p} />
      <Footer {...p} />
    </>
  )
}
export function GradientEdge(p: PrintProps) {
  return (
    <>
      <header className="edge-opening">
        <Seller {...p} />
        <InvoiceTitle {...p} />
      </header>
      <div className="edge-facts">
        <Customer {...p} />
        <InvoiceMetadata {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="outlined-summary">
        <Totals {...p} />
      </div>
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function BoldHeader(p: PrintProps) {
  return (
    <>
      <header className="bold-title">
        <InvoiceTitle {...p} />
      </header>
      <div className="metadata-band">
        <InvoiceMetadata {...p} />
      </div>
      <div className="compact-parties">
        <Seller {...p} />
        <Customer {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="total-banner">
        <Totals {...p} />
      </div>
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function SplitPanel(p: PrintProps) {
  return (
    <>
      <header className="split-opening">
        <div>
          <Seller {...p} />
          <InvoiceTitle {...p} />
        </div>
        <div className="split-facts">
          <InvoiceMetadata {...p} />
        </div>
      </header>
      <Customer {...p} />
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="payment-total-pair">
        <After {...p} />
        <Totals {...p} />
      </div>
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function AccentBar(p: PrintProps) {
  return (
    <>
      <header className="accent-title">
        <InvoiceTitle {...p} />
        <InvoiceMetadata {...p} />
      </header>
      <div className="asymmetric-parties">
        <div className="accent-section">
          <Seller {...p} />
        </div>
        <Customer {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="underlined-summary">
        <Totals {...p} />
      </div>
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function Studio(p: PrintProps) {
  return (
    <>
      <header className="studio-brand">
        <Seller {...p} />
        <InvoiceMetadata {...p} />
      </header>
      <div className="project-lead">
        <p>
          <Label name="reference" invoice={p.invoice} /> ·{' '}
          <bdi dir="auto">{p.invoice.reference || p.invoice.number}</bdi>
        </p>
        <InvoiceTitle {...p} />
      </div>
      <Customer {...p} />
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="studio-notes">
        <After {...p} />
      </div>
      <div className="studio-end">
        <Signature {...p} />
        <Totals {...p} />
      </div>
      <Footer {...p} />
    </>
  )
}
export function Geometric(p: PrintProps) {
  return (
    <>
      <header className="geometric-opening">
        <InvoiceTitle {...p} />
        <div className="staggered-seller">
          <Seller {...p} />
        </div>
      </header>
      <div className="staggered-facts">
        <InvoiceMetadata {...p} />
        <Customer {...p} />
      </div>
      <Before {...p} />
      <div className="angular-divider" />
      <ItemsTable {...p} />
      <div className="geometric-totals boxed">
        <Totals {...p} />
      </div>
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function Editorial(p: PrintProps) {
  return (
    <>
      <header className="editorial-title">
        <InvoiceTitle {...p} />
        <InvoiceMetadata {...p} />
      </header>
      <div className="editorial-parties">
        <Seller {...p} />
        <Customer {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="editorial-closing">
        <After {...p} />
        <Signature {...p} />
      </div>
      <div className="editorial-total">
        <Totals {...p} />
      </div>
      <Footer {...p} />
    </>
  )
}
export function ColorBlock(p: PrintProps) {
  return (
    <>
      <header className="block-opening">
        <div className="brand-block">
          <Seller {...p} />
        </div>
        <div className="invoice-block">
          <InvoiceTitle {...p} />
        </div>
      </header>
      <div className="block-facts">
        <Customer {...p} />
        <InvoiceMetadata {...p} />
      </div>
      <Before {...p} />
      <div className="grouped-table">
        <ItemsTable {...p} />
      </div>
      <div className="broad-summary">
        <Totals {...p} />
      </div>
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function SignatureLayout(p: PrintProps) {
  return (
    <>
      <header className="personal-letterhead">
        <Seller {...p} />
        <InvoiceTitle {...p} />
      </header>
      <div className="flowing-parties">
        <Customer {...p} />
      </div>
      <InvoiceMetadata {...p} />
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="signature-led">
        <Signature {...p} />
        <Totals {...p} />
      </div>
      <After {...p} />
      <Footer {...p} />
    </>
  )
}
export function LuxuryGold(p: PrintProps) {
  return (
    <>
      <header className="stationery-header">
        <Seller {...p} />
        <InvoiceTitle {...p} />
      </header>
      <div className="symmetric-facts">
        <Customer {...p} />
        <InvoiceMetadata {...p} />
      </div>
      <Before {...p} />
      <div className="thin-grid">
        <ItemsTable {...p} />
      </div>
      <div className="symmetric-closing">
        <div>
          <After {...p} />
          <Signature {...p} />
        </div>
        <Totals {...p} />
      </div>
      <Footer {...p} />
    </>
  )
}
export function ElegantSerif(p: PrintProps) {
  return (
    <>
      <header className="serif-masthead">
        <InvoiceTitle {...p} />
      </header>
      <div className="serif-facts">
        <Seller {...p} />
        <InvoiceMetadata {...p} />
      </div>
      <div className="serif-customer">
        <Customer {...p} />
      </div>
      <Before {...p} />
      <div className="borderless-table">
        <ItemsTable {...p} />
      </div>
      <div className="typographic-total">
        <Totals {...p} />
      </div>
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function ArabicClassic(p: PrintProps) {
  return (
    <>
      <header className="classic-masthead">
        <Seller {...p} />
        <InvoiceTitle {...p} />
      </header>
      <div className="labeled-party-row">
        <Customer {...p} />
        <InvoiceMetadata {...p} />
      </div>
      <Before {...p} />
      <div className="traditional-table">
        <ItemsTable {...p} />
      </div>
      <div className="leading-totals">
        <Totals {...p} />
      </div>
      <After {...p} />
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function ArabicModern(p: PrintProps) {
  return (
    <>
      <header className="modern-opening">
        <InvoiceTitle {...p} />
        <Seller {...p} />
      </header>
      <div className="metadata-tiles">
        <InvoiceMetadata {...p} />
      </div>
      <div className="modern-buyer">
        <Customer {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <div className="modern-closing">
        <After {...p} />
        <Totals {...p} />
      </div>
      <Signature {...p} />
      <Footer {...p} />
    </>
  )
}
export function ArabicFormal(p: PrintProps) {
  return (
    <>
      <header className="framed-title">
        <InvoiceTitle {...p} />
      </header>
      <div className="stacked-identifiers">
        <Seller {...p} />
        <Customer {...p} />
      </div>
      <div className="formal-meta-grid">
        <InvoiceMetadata {...p} />
      </div>
      <Before {...p} />
      <div className="dense-grid">
        <ItemsTable {...p} />
      </div>
      <Totals {...p} />
      <div className="signature-terms">
        <Signature {...p} />
        <After {...p} />
      </div>
      <Footer {...p} />
    </>
  )
}
export function DualColumn(p: PrintProps) {
  return (
    <>
      <header className="dual-title">
        <InvoiceTitle {...p} />
      </header>
      <div className="language-lanes">
        <Seller {...p} />
        <Customer {...p} />
        <InvoiceMetadata {...p} />
      </div>
      <div className="language-lanes">
        <Before {...p} />
      </div>
      <ItemsTable {...p} />
      <div className="dual-closing language-lanes">
        <After {...p} />
        <Totals {...p} />
      </div>
      <Signature {...p} />
      <div className="language-lanes">
        <Footer {...p} />
      </div>
    </>
  )
}
export function SaudiBusiness(p: PrintProps) {
  return (
    <>
      <header className="identifier-opening">
        <div className="seller-panel">
          <Seller {...p} />
        </div>
        <InvoiceTitle {...p} />
      </header>
      <div className="buyer-facts-grid">
        <Customer {...p} />
        <InvoiceMetadata {...p} />
      </div>
      <Before {...p} />
      <ItemsTable {...p} />
      <TaxBreakdown {...p} />
      <div className="qr-summary-region">
        <Signature {...p} />
        <Totals {...p} />
      </div>
      <After {...p} />
      <Footer {...p} />
    </>
  )
}
