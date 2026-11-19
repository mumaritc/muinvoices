import { useEffect, useState, lazy, Suspense } from 'react'
import {
  Plus,
  FileText,
  ArrowUpRight,
  Download,
  Trash2,
  ShieldCheck,
  Settings2,
  Globe,
} from 'lucide-react'
import { initializeWorkspace, useWorkspace, flushSave } from '../features/invoices/store'
import { newInvoice } from '../features/invoices/defaults'
import { Settings } from '../features/settings/Settings'
import { exportWorkspace } from '../lib/export-workspace'
import { calculateInvoice } from '../lib/calculations'

import { t } from '../locales/dictionary'
import { Button } from '../components/ui/button'
import { OfflineStatus } from './OfflineStatus'
import { exportRawRecovery } from '../lib/recovery'
import { explainError } from '../locales/errors'
const Editor = lazy(() =>
  import('../components/editor/Editor').then((module) => ({ default: module.Editor })),
)
export function App() {
  const { workspace, ready, recovery, status, error, update } = useWorkspace()
  const [activeId, setActiveId] = useState<string>()
  const [settings, setSettings] = useState(false)
  const [message, setMessage] = useState('')
  const [reminderDismissed, setReminderDismissed] = useState(false)
  const [openedAt] = useState(() => Date.now())
  const exportDate = workspace.settings.lastExportedAt
  const changedDate = workspace.settings.lastChangedAt
  const backupDue =
    workspace.settings.backupReminder &&
    !reminderDismissed &&
    changedDate &&
    (!exportDate || changedDate > exportDate) &&
    openedAt - new Date(exportDate ?? workspace.invoices[0]?.createdAt ?? changedDate).getTime() >
      7 * 86400000
  const lang = workspace.settings.uiLanguage
  useEffect(() => {
    void initializeWorkspace()
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])
  const exportData = () =>
    void (recovery ? exportRawRecovery() : exportWorkspace()).catch((e) =>
      setMessage(explainError(e, lang)),
    )
  const openSettings = async () => {
    try {
      await flushSave()
    } catch (error) {
      setMessage(explainError(error, lang))
    }
    setSettings(!settings)
  }
  return (
    <div className={`app-shell ${activeId ? 'editing-invoice' : ''}`}>
      <aside className="app-sidebar">
        <a className="wordmark" href="./" aria-label="muinvoice">
          <span className="brand-mark">μ</span>muinvoice<span className="brand-period">.</span>
        </a>
        <div className="sidebar-label">{t('workspace', lang)}</div>
        <Button
          variant="ghost"
          className="sidebar-active"
          onClick={() => {
            if (!activeId) setSettings(false)
          }}
          disabled={!!activeId}
        >
          <FileText />
          {t('invoices', lang)}
          <span className="count">{workspace.invoices.length}</span>
        </Button>
        <Button variant="ghost" onClick={() => void openSettings()} disabled={!!activeId}>
          <Settings2 />
          {t('backup', lang)}
        </Button>
        <div className="sidebar-bottom">
          <div className="privacy-symbol">
            <ShieldCheck />
          </div>
          <strong>{t('local', lang)}</strong>
          <p>{t('privacy', lang)}</p>
          <Button variant="outline" onClick={exportData}>
            <Download />
            {t('export', lang)}
          </Button>
          <div className="sidebar-links">
            <a
              href="https://github.com/mumaritc/muinvoices"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('githubLink', lang)}
              title={t('githubLink', lang)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
            <a
              href="https://mumaritc.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('websiteLink', lang)}
              title={t('websiteLink', lang)}
            >
              <Globe size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
      </aside>
      <main className="main-shell">
        <header className="app-header">
          <span className="breadcrumb">
            muinvoice <span>/</span> {t('invoices', lang)}
          </span>
          <div className="header-right">
            <Button
              className="mobile-settings"
              variant="ghost"
              aria-label={t('backup', lang)}
              disabled={!!activeId}
              onClick={() => void openSettings()}
            >
              <Settings2 />
            </Button>
            <OfflineStatus lang={lang} editing={!!activeId} />
            <span className={`save-state save-${status}`} role="status">
              <span className="live-dot" />
              {t(status, lang)}
            </span>
            <Button
              variant="ghost"
              aria-label={t('uiLanguage', lang)}
              onClick={() =>
                update({
                  ...workspace,
                  settings: { ...workspace.settings, uiLanguage: lang === 'en' ? 'ar' : 'en' },
                })
              }
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </Button>
          </div>
        </header>
        {message ? (
          <div role="alert" className="global-error">
            {message}
          </div>
        ) : null}
        {error ? (
          <div role="alert" className="global-error">
            {explainError(error, lang)}{' '}
            <Button variant="outline" onClick={exportData}>
              {t('export', lang)}
            </Button>
          </div>
        ) : null}
        {backupDue ? (
          <div className="backup-reminder">
            <span>{t('backupDue', lang)}</span>
            <Button variant="outline" onClick={exportData}>
              {t('export', lang)}
            </Button>
            <Button variant="ghost" onClick={() => setReminderDismissed(true)}>
              {t('cancel', lang)}
            </Button>
          </div>
        ) : null}
        {!ready ? (
          <p className="loading">{t('loading', lang)}</p>
        ) : recovery ? (
          <section className="workspace-content">
            <h1>{t('recoveryTitle', lang)}</h1>
            <p className="help">{t('recoveryHelp', lang)}</p>
            <div className="button-row">
              <Button onClick={exportData}>{t('rawRecovery', lang)}</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                {t('reload', lang)}
              </Button>
            </div>
          </section>
        ) : activeId && workspace.invoices.some((i) => i.id === activeId) ? (
          <Suspense fallback={<p className="loading">{t('loading', lang)}</p>}>
            <Editor key={activeId} invoiceId={activeId} onLeave={setActiveId} />
          </Suspense>
        ) : (
          <div className="workspace-content">
            <div className="page-heading">
              <div>
                <p className="eyebrow">{t('workspace', lang)}</p>
                <h1>{settings ? t('backup', lang) : t('invoices', lang)}</h1>
                <p>{t('tagline', lang)}</p>
              </div>
              <Button
                size="lg"
                disabled={workspace.invoices.length >= 1000}
                onClick={() => {
                  const invoice = newInvoice(
                    workspace.settings,
                    workspace.companies.find((c) => c.id === workspace.settings.defaultCompanyId),
                  )
                  update({ ...workspace, invoices: [...workspace.invoices, invoice] })
                  setActiveId(invoice.id)
                }}
              >
                <Plus />
                {t('newInvoice', lang)}
              </Button>
            </div>
            {settings ? (
              <Settings />
            ) : (
              <>
                <div className="collection-bar">
                  <span>
                    {workspace.invoices.length} {t('invoices', lang)}
                  </span>
                  <span className="local-caption">
                    <ShieldCheck />
                    {t('local', lang)}
                  </span>
                </div>
                {workspace.invoices.length ? (
                  <div className="invoice-list">
                    {workspace.invoices.map((invoice) => {
                      const result = calculateInvoice(invoice)
                      return (
                        <section className="invoice-list-row" key={invoice.id}>
                          <div className="document-icon">
                            <FileText />
                          </div>
                          <button className="open-invoice" onClick={() => setActiveId(invoice.id)}>
                            <strong>
                              <bdi>{invoice.number || t('newInvoice', lang)}</bdi>
                            </strong>
                            <span>
                              <bdi>
                                {invoice.customer.name[lang] ||
                                  invoice.customer.name.en ||
                                  invoice.customer.name.ar ||
                                  '—'}
                              </bdi>
                            </span>
                          </button>
                          <span className="status-badge">{t(invoice.status, lang)}</span>
                          <span className="row-total">
                            <bdi>{result.ok ? result.value.grandTotal : '—'}</bdi>{' '}
                            <small>{invoice.currency}</small>
                          </span>
                          <Button
                            variant="ghost"
                            aria-label={t('delete', lang)}
                            onClick={() => {
                              if (window.confirm(t('deleteConfirm', lang)))
                                update({
                                  ...workspace,
                                  invoices: workspace.invoices.filter((i) => i.id !== invoice.id),
                                })
                            }}
                          >
                            <Trash2 />
                          </Button>
                          <Button
                            variant="ghost"
                            aria-label={t('details', lang)}
                            onClick={() => setActiveId(invoice.id)}
                          >
                            <ArrowUpRight />
                          </Button>
                        </section>
                      )
                    })}
                  </div>
                ) : (
                  <section className="empty-state">
                    <div className="empty-paper">
                      <div className="mini-brand">μ</div>
                      <div className="mini-title" />
                      <div className="mini-line" />
                      <div className="mini-line short" />
                      <div className="mini-table" />
                      <div className="mini-total" />
                    </div>
                    <h2>{t('empty', lang)}</h2>
                    <p>{t('emptyHelp', lang)}</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const invoice = newInvoice(workspace.settings)
                        update({ ...workspace, invoices: [invoice] })
                        setActiveId(invoice.id)
                      }}
                    >
                      <Plus />
                      {t('newInvoice', lang)}
                    </Button>
                  </section>
                )}
                <footer className="workspace-footer">
                  <span>muinvoice · MIT · open source</span>
                  <span>{t('local', lang)}</span>
                </footer>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
