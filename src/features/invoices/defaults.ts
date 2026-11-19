import { type Design, type Invoice, type Party, type Workspace, columnIds } from './schema'
export const uuid = () => crypto.randomUUID()
export const emptyParty = (): Party => ({
  name: {},
  address: {},
  vat: '',
  registration: '',
  phone: '',
  email: '',
  website: '',
  fields: [],
})
export const defaultDesign = (): Design => ({
  templateId: 'pure',
  mode: 'en',
  order: 'en-first',
  font: 'noto',
  accent: '#234d46',
  color: '#23312f',
  size: 'medium',
  spacing: 'normal',
  border: 'none',
  logoPosition: 'start',
  logoSize: 64,
  showSellerLabel: true,
  qrPosition: 'bottom',
  qrAlign: 'right',
  columns: columnIds.map((id) => ({
    id,
    visible: ['description', 'quantity', 'unitPrice', 'total'].includes(id),
    label: {},
    align: id === 'description' ? 'start' : 'end',
    width: id === 'description' ? 4 : 1,
  })),
  labels: {},
})
export function newItem(): Invoice['items'][number] {
  return {
    id: uuid(),
    description: { en: '' },
    sku: '',
    unit: {},
    quantity: '1',
    unitPrice: '0',
    treatment: 'none',
    taxIds: [],
    explanation: {},
  }
}
export function newInvoice(
  settings?: Workspace['settings'],
  company?: Workspace['companies'][number],
): Invoice {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    number: 'INV-' + new Date().getUTCFullYear() + '/001',
    type: 'invoice',
    status: 'draft',
    issuedAt: now,
    timezone: 'Asia/Riyadh',
    dueDate: '',
    reference: '',
    headerText: {},
    footerText: {},
    currency: company?.currency ?? settings?.defaultCurrency ?? 'SAR',
    numerals: 'latn',
    priceMode: 'exclusive',
    seller: structuredClone(company?.party ?? emptyParty()),
    customer: emptyParty(),
    taxes: structuredClone(company?.taxes ?? settings?.defaultTaxes ?? []),
    items: [newItem()],
    sections: structuredClone(company?.sections ?? []),
    design: structuredClone(company?.design ?? settings?.defaultDesign ?? defaultDesign()),
    qr: { enabled: false, sellerLanguage: 'en', vatTaxIds: [] },
    createdAt: now,
    updatedAt: now,
  }
}
export const emptyWorkspace = (): Workspace => ({
  settings: {
    uiLanguage: 'en',
    defaultCurrency: 'SAR',
    defaultDesign: defaultDesign(),
    defaultTaxes: [],
    backupReminder: true,
  },
  companies: [],
  invoices: [],
})
export function duplicateInvoice(invoice: Invoice): Invoice {
  const now = new Date().toISOString()
  return {
    ...structuredClone(invoice),
    id: uuid(),
    number: invoice.number + '-copy',
    status: 'draft',
    items: invoice.items.map((i) => ({ ...structuredClone(i), id: uuid() })),
    sections: invoice.sections.map((s) => ({ ...structuredClone(s), id: uuid() })),
    createdAt: now,
    updatedAt: now,
  }
}
