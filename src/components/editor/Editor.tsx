import { useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Printer, Check, Copy, ArrowLeft, Download } from 'lucide-react'
import { invoiceSchema, normalizeDecimal, type Invoice } from '../../features/invoices/schema'
import { duplicateInvoice } from '../../features/invoices/defaults'
import { useWorkspace, flushSave } from '../../features/invoices/store'
import { calculateInvoice, printableErrors } from '../../lib/calculations'
import { printInvoice } from '../../lib/printing'
import { t } from '../../locales/dictionary'
import { Button } from '../ui/button'
import { MetadataForm, PartyForm, ItemsForm, NamedTaxesForm, SectionsForm } from './ContentForms'
import { Profiles } from './Profiles'
import { DesignForm } from './DesignForm'
import { ValidationContext } from './validation-context'
import { InvoiceRenderer } from '../invoice/InvoiceRenderer'
import { useAssetUrls } from '../../lib/use-asset-urls'
import { useQr } from '../../lib/use-qr'
import { QrForm } from './QrForm'
import { explainError } from '../../locales/errors'
import { exportWorkspace } from '../../lib/export-workspace'
import { FormSection } from './Fields'

function canonicalize(invoice: Invoice) {
  const parse = (value: string, path: string) => {
    try {
      return normalizeDecimal(value)
    } catch {
      throw new Error('Invalid decimal input', { cause: path })
    }
  }
  for (const [index, item] of invoice.items.entries()) {
    item.quantity = parse(item.quantity, `items.${index}.quantity`)
    item.unitPrice = parse(item.unitPrice, `items.${index}.unitPrice`)
    if (item.discount)
      item.discount.value = parse(item.discount.value, `items.${index}.discount.value`)
  }
  for (const [index, tax] of invoice.taxes.entries())
    tax.rate = parse(tax.rate, `taxes.${index}.rate`)
  if (invoice.overallDiscount)
    invoice.overallDiscount.value = parse(invoice.overallDiscount.value, 'overallDiscount.value')
  return invoice
}
export function Editor({
  invoiceId,
  onLeave,
}: {
  invoiceId: string
  onLeave: (nextId?: string) => void
}) {
  const workspace = useWorkspace((s) => s.workspace)
  const update = useWorkspace((s) => s.update)
  const invoice = workspace.invoices.find((i) => i.id === invoiceId)!
  const assetUrls = useAssetUrls(useWorkspace((s) => s.assets))
  const qr = useQr(invoice)
  const lang = workspace.settings.uiLanguage
  const form = useForm<Invoice>({ defaultValues: invoice })
  const [tab, setTab] = useState<'details' | 'items' | 'design' | 'sections'>('details')
  const [itemTab, setItemTab] = useState<'lineItems' | 'namedTaxes'>('lineItems')
  const [detailsTab, setDetailsTab] = useState<'metadata' | 'company' | 'customerTab' | 'zatca'>(
    'metadata',
  )
  const [designTab, setDesignTab] = useState<'appearance' | 'columns' | 'labels'>('appearance')
  const [valid, setValid] = useState(true)
  const validRef = useRef(true)
  const [errors, setErrors] = useState<{ path: string; message: string }[]>([])
  const [actionError, setActionError] = useState('')
  const [mobilePreview, setMobilePreview] = useState(false)
  const preview = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const subscription = form.watch(() => {
      try {
        const raw = structuredClone(form.getValues())
        const parsed = invoiceSchema.safeParse(canonicalize(raw))
        if (!parsed.success) {
          validRef.current = false
          setValid(false)
          setErrors(
            parsed.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message })),
          )
          return
        }
        const result = calculateInvoice(parsed.data)
        if (!result.ok) {
          validRef.current = false
          setValid(false)
          setErrors(result.errors)
          return
        }
        validRef.current = true
        setValid(true)
        setErrors([])
        const current = useWorkspace.getState().workspace
        update({
          ...current,
          invoices: current.invoices.map((i) =>
            i.id === invoiceId ? { ...parsed.data, updatedAt: new Date().toISOString() } : i,
          ),
        })
      } catch (error) {
        validRef.current = false
        setValid(false)
        setErrors([
          {
            path: error instanceof Error && typeof error.cause === 'string' ? error.cause : 'items',
            message: 'Invalid decimal input',
          },
        ])
      }
    })
    return () => subscription.unsubscribe()
  }, [form, invoiceId, update])
  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => {
      if (!validRef.current || useWorkspace.getState().status !== 'saved') event.preventDefault()
    }
    window.addEventListener('beforeunload', listener)
    return () => window.removeEventListener('beforeunload', listener)
  }, [])
  const leave = async (nextId?: string) => {
    if (!validRef.current && !window.confirm(t('discard', lang))) return
    try {
      await flushSave()
    } catch {
      if (!window.confirm(t('error', lang))) return
    }
    onLeave(nextId)
  }
  const assetsReady = [
    invoice.seller.logoAssetId,
    invoice.customer.logoAssetId,
    invoice.signatureAssetId,
  ].every((id) => !id || !!assetUrls[id])
  const ready = valid && !printableErrors(invoice).length && qr.ready && assetsReady
  const setStatus = (status: Invoice['status']) => {
    form.setValue('status', status, { shouldDirty: true })
    void flushSave().catch((error) => setActionError(String(error)))
  }
  return (
    <div className={`editor-workspace ${mobilePreview ? 'show-preview' : ''}`}>
      <div className="document-toolbar">
        <Button variant="ghost" onClick={() => void leave()}>
          <ArrowLeft />
          {t('invoices', lang)}
        </Button>
        <div className="document-name">
          <bdi>{invoice.number || t('newInvoice', lang)}</bdi>
          <span className="status-badge">{t(invoice.status, lang)}</span>
        </div>
        <div className="toolbar-actions">
          <Button
            variant="outline"
            onClick={() =>
              void exportWorkspace().catch((e) => setActionError(explainError(e, lang)))
            }
          >
            <Download />
            {t('export', lang)}
          </Button>
          <Button
            variant="outline"
            disabled={!valid || workspace.invoices.length >= 1000}
            onClick={async () => {
              try {
                await flushSave()
                const copy = duplicateInvoice(invoice)
                update({ ...workspace, invoices: [...workspace.invoices, copy] })
                await leave(copy.id)
              } catch (error) {
                setActionError(String(error))
              }
            }}
          >
            <Copy />
            {t('duplicate', lang)}
          </Button>
          <Button
            variant="outline"
            disabled={!valid}
            onClick={() => void flushSave().catch((e) => setActionError(String(e)))}
          >
            <Check />
            {t('save', lang)}
          </Button>
          <Button
            disabled={!ready}
            onClick={() => {
              const generation = useWorkspace.getState().generation
              void printInvoice(
                preview.current,
                flushSave,
                () => validRef.current && useWorkspace.getState().generation === generation,
              ).catch((e) => setActionError(String(e)))
            }}
          >
            <Printer />
            {t('print', lang)}
          </Button>
        </div>
      </div>
      <div className="mobile-switch">
        <Button
          variant={mobilePreview ? 'outline' : 'default'}
          onClick={() => setMobilePreview(false)}
        >
          {t('editor', lang)}
        </Button>
        <Button
          variant={mobilePreview ? 'default' : 'outline'}
          onClick={() => setMobilePreview(true)}
        >
          {t('preview', lang)}
        </Button>
      </div>
      <div className="editor-pane">
        <nav className="editor-tabs" aria-label={t('editor', lang)}>
          {(['details', 'items', 'sections', 'design'] as const).map((v) => (
            <Button
              key={v}
              variant="ghost"
              aria-current={tab === v ? 'page' : undefined}
              onClick={() => setTab(v)}
            >
              {t(v, lang)}
            </Button>
          ))}
        </nav>
        {tab === 'details' ? (
          <nav className="editor-subtabs" aria-label={t('details', lang)}>
            {(['metadata', 'company', 'customerTab', 'zatca'] as const).map((key) => (
              <Button
                key={key}
                variant="ghost"
                aria-current={detailsTab === key ? 'page' : undefined}
                onClick={() => setDetailsTab(key)}
              >
                {t(key, lang)}
              </Button>
            ))}
          </nav>
        ) : null}
        {tab === 'items' ? (
          <nav className="editor-subtabs" aria-label={t('items', lang)}>
            {(['lineItems', 'namedTaxes'] as const).map((key) => (
              <Button
                key={key}
                variant="ghost"
                aria-current={itemTab === key ? 'page' : undefined}
                onClick={() => setItemTab(key)}
              >
                {t(key, lang)}
              </Button>
            ))}
          </nav>
        ) : null}
        {tab === 'design' ? (
          <nav className="editor-subtabs" aria-label={t('design', lang)}>
            {(['appearance', 'columns', 'labels'] as const).map((key) => (
              <Button
                key={key}
                variant="ghost"
                aria-current={designTab === key ? 'page' : undefined}
                onClick={() => setDesignTab(key)}
              >
                {t(key, lang)}
              </Button>
            ))}
          </nav>
        ) : null}
        <ValidationContext value={errors}>
          <FormProvider {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset disabled={invoice.status === 'finalized'}>
                {tab === 'details' && detailsTab === 'metadata' ? (
                  <>
                    <MetadataForm lang={lang} />
                    {invoice.number &&
                    workspace.invoices.filter((i) => i.number === invoice.number).length > 1 ? (
                      <p role="status" className="help">
                        {t('duplicateNumber', lang)}
                      </p>
                    ) : null}
                  </>
                ) : null}
                {tab === 'items' ? (
                  itemTab === 'lineItems' ? (
                    <ItemsForm lang={lang} />
                  ) : (
                    <NamedTaxesForm lang={lang} />
                  )
                ) : null}
                {tab === 'design' ? (
                  <DesignForm panel={designTab} lang={lang} onError={setActionError} />
                ) : null}
                {tab === 'details' && detailsTab === 'company' ? (
                  <>
                    <FormSection title={t('company', lang)}>
                      <label className="check-label">
                        <input type="checkbox" {...form.register('design.showSellerLabel')} />
                        {t('showSellerLabel', lang)}
                      </label>
                    </FormSection>
                    <PartyForm party="seller" lang={lang} />
                    <Profiles lang={lang} valid={valid} onError={setActionError} />
                  </>
                ) : null}
                {tab === 'details' && detailsTab === 'customerTab' ? (
                  <PartyForm party="customer" lang={lang} />
                ) : null}
                {tab === 'details' && detailsTab === 'zatca' ? <QrForm lang={lang} /> : null}
                {tab === 'sections' ? <SectionsForm lang={lang} /> : null}{' '}
              </fieldset>
            </form>
          </FormProvider>
        </ValidationContext>
        {!valid ? (
          <div className="validation-box" role="alert">
            <strong>{t('lastValid', lang)}</strong>
            {errors.slice(0, 8).map((e, i) => (
              <p key={i}>
                <bdi>{e.path}</bdi>: {lang === 'ar' ? t('invalid', lang) : e.message}
              </p>
            ))}
          </div>
        ) : null}
        {invoice.qr.enabled && !qr.ready ? (
          <p role="alert" className="validation-box">
            {t('qrInvalid', lang)} {lang === 'en' ? qr.error : ''}
          </p>
        ) : null}
        {actionError ? (
          <p role="alert" className="validation-box">
            {explainError(actionError, lang)}
          </p>
        ) : null}
        <div className="editor-footer">
          <p className="help">{t('localStatus', lang)}</p>
          <Button
            variant="outline"
            disabled={invoice.status === 'draft' && !ready}
            onClick={() => setStatus(invoice.status === 'draft' ? 'finalized' : 'draft')}
          >
            {t(invoice.status === 'draft' ? 'finalize' : 'editFinal', lang)}
          </Button>
        </div>
      </div>
      <div className="preview-pane">
        <div className="preview-heading">
          <span>
            <span className="live-dot" />
            {t('preview', lang)}
          </span>
          <span>{t('flowing', lang)}</span>
        </div>
        {!valid ? (
          <p role="status" className="preview-warning">
            {t('lastValid', lang)}
          </p>
        ) : !ready ? (
          <p className="preview-warning">{t('incomplete', lang)}</p>
        ) : null}
        <div className="paper-wrap" ref={preview}>
          <InvoiceRenderer invoice={invoice} assetUrls={assetUrls} qrUrl={qr.url} />
        </div>
        <p className="print-help">{t('printHelp', lang)}</p>
      </div>
    </div>
  )
}
