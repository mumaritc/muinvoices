import Decimal from 'decimal.js'
import { currencyScale, invoiceSchema, type Invoice } from '../features/invoices/schema'
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP })
export type CalculationError = { path: string; message: string }
export type Calculation = ReturnType<typeof compute>

function compute(invoice: Invoice) {
  const scale = currencyScale(invoice.currency)
  const round = (v: Decimal) => v.toDecimalPlaces(scale)
  const money = (v: Decimal) => {
    if (v.greaterThanOrEqualTo('1000000000000'))
      throw new Error('Calculated amount exceeds 12 integer digits')
    return v.toFixed(scale)
  }
  const discount = (base: Decimal, value: Invoice['overallDiscount']) => {
    if (!value) return new D(0)
    const amount =
      value.type === 'percent' ? round(base.mul(value.value).div(100)) : new D(value.value)
    if (amount.decimalPlaces() > scale || amount.gt(base))
      throw new Error('Fixed discounts must fit the currency scale and cannot exceed the net base')
    return amount
  }
  const lines = invoice.items.map((item) => {
    const taxes =
      item.treatment === 'taxed'
        ? item.taxIds.map((id) => invoice.taxes.find((t) => t.id === id)!)
        : []
    const entered = new D(item.quantity).mul(item.unitPrice)
    const rate = taxes.reduce((sum, tax) => sum.add(tax.rate), new D(0))
    const base = round(
      invoice.priceMode === 'inclusive' ? entered.div(rate.div(100).add(1)) : entered,
    )
    const itemDiscount = discount(base, item.discount)
    return {
      item,
      taxes,
      base,
      itemDiscount,
      discounted: base.minus(itemDiscount),
      allocation: new D(0),
      remainder: new D(0),
    }
  })
  const subtotal = lines.reduce((sum, l) => sum.add(l.discounted), new D(0))
  const overall = discount(subtotal, invoice.overallDiscount)
  const unit = new D(10).pow(scale)
  if (subtotal.gt(0) && overall.gt(0)) {
    for (const line of lines) {
      const share = overall.mul(unit).mul(line.discounted).div(subtotal)
      line.allocation = share.floor().div(unit)
      line.remainder = share.minus(share.floor())
    }
    const remaining = overall
      .minus(lines.reduce((s, l) => s.add(l.allocation), new D(0)))
      .mul(unit)
      .toNumber()
    const ranked = lines
      .map((line, index) => ({ line, index }))
      .filter((v) => v.line.discounted.gt(0))
      .sort((a, b) => b.line.remainder.cmp(a.line.remainder) || a.index - b.index)
    for (let i = 0; i < remaining; i++)
      ranked[i].line.allocation = ranked[i].line.allocation.add(new D(1).div(unit))
  }
  const breakdown = new Map<
    string,
    { id: string; treatment: string; rate: string; base: Decimal; amount: Decimal }
  >()
  const resultLines = lines.map((l) => {
    const net = l.discounted.minus(l.allocation)
    let taxTotal = new D(0)
    for (const taxId of l.item.taxIds.length ? l.item.taxIds : ['']) {
      const tax = invoice.taxes.find((t) => t.id === taxId)
      const amount =
        l.item.treatment === 'taxed' && tax ? round(net.mul(tax.rate).div(100)) : new D(0)
      taxTotal = taxTotal.add(amount)
      const key = taxId + ':' + l.item.treatment
      const row = breakdown.get(key) ?? {
        id: taxId,
        treatment: l.item.treatment,
        rate: tax?.rate ?? '0',
        base: new D(0),
        amount: new D(0),
      }
      row.base = row.base.add(net)
      row.amount = row.amount.add(amount)
      breakdown.set(key, row)
    }
    return {
      id: l.item.id,
      base: money(l.base),
      discount: money(l.itemDiscount),
      allocation: money(l.allocation),
      net: money(net),
      tax: money(taxTotal),
      total: money(net.add(taxTotal)),
    }
  })
  const sum = (key: 'base' | 'discount' | 'net' | 'tax' | 'total') =>
    money(resultLines.reduce((s, l) => s.add(l[key]), new D(0)))
  return {
    scale,
    lines: resultLines,
    subtotal: sum('base'),
    itemDiscount: sum('discount'),
    overallDiscount: money(overall),
    netTotal: sum('net'),
    taxTotal: sum('tax'),
    grandTotal: sum('total'),
    breakdown: Array.from(breakdown.values(), (b) => ({
      ...b,
      base: money(b.base),
      amount: money(b.amount),
    })),
  }
}
export function calculateInvoice(
  input: unknown,
): { ok: true; value: Calculation } | { ok: false; errors: CalculationError[] } {
  const parsed = invoiceSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    }
  try {
    return { ok: true, value: compute(parsed.data) }
  } catch (error) {
    return {
      ok: false,
      errors: [
        { path: 'items', message: error instanceof Error ? error.message : 'Calculation failed' },
      ],
    }
  }
}
export function printableErrors(invoice: Invoice) {
  const errors: string[] = []
  if (!invoice.number.trim()) errors.push('Invoice number is required')
  if (!invoice.seller.name.en?.trim() && !invoice.seller.name.ar?.trim())
    errors.push('Seller name is required')
  if (
    !invoice.items.length ||
    invoice.items.some((i) => !i.description.en?.trim() && !i.description.ar?.trim())
  )
    errors.push('At least one described item is required; describe every item')
  return errors
}
