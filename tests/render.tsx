import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { InvoiceRenderer } from '../src/components/invoice/InvoiceRenderer'
import { type Invoice } from '../src/features/invoices/schema'
import '@fontsource-variable/noto-sans-arabic'
import '@fontsource-variable/cairo'
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
import '../src/styles/globals.css'
import '../src/styles/invoice.css'
import '../src/styles/print.css'
const root = createRoot(document.getElementById('fixture')!)
declare global {
  interface Window {
    renderFixture: (invoice: Invoice) => Promise<void>
  }
}
window.renderFixture = async (invoice) => {
  flushSync(() => root.render(<InvoiceRenderer invoice={invoice} />))
  await document.fonts.ready
}
