import { useEffect, useState } from 'react'
import { type Invoice } from '../features/invoices/schema'
import { invoiceQrPayload } from './zatca-qr'
export function useQr(invoice: Invoice) {
  let payload = ''
  let validationError = ''
  if (invoice.qr.enabled) {
    try {
      payload = invoiceQrPayload(invoice)
    } catch (error) {
      validationError = error instanceof Error ? error.message : 'QR validation failed'
    }
  }
  const [generated, setGenerated] = useState({ payload: '', url: '', error: '' })
  useEffect(() => {
    if (!payload) return
    let current = true
    void import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 4, width: 360 }),
      )
      .then(
        (url) => {
          if (current) setGenerated({ payload, url, error: '' })
        },
        () => {
          if (current)
            setGenerated({ payload, url: '', error: 'Could not generate QR; disable it or retry' })
        },
      )
    return () => {
      current = false
    }
  }, [payload])
  const current = generated.payload === payload && !!generated.url
  return {
    url: invoice.qr.enabled && current && !validationError ? generated.url : undefined,
    error: validationError || (generated.payload === payload ? generated.error : ''),
    ready: !invoice.qr.enabled || (!!payload && current && !validationError),
  }
}
