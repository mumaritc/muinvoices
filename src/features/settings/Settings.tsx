import { useMemo, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useWorkspace, commitReplacement } from '../invoices/store'
import { backupSchema, type Backup } from '../invoices/schema'
import { emptyWorkspace } from '../invoices/defaults'
import { mergeBackup, parseBackup, MAX_BACKUP } from '../../lib/backup'
import { decodeAsset, encodeAsset } from '../../lib/assets'
import { t } from '../../locales/dictionary'
import { Button } from '../../components/ui/button'
import { exportWorkspace } from '../../lib/export-workspace'
import { explainError } from '../../locales/errors'
export function Settings() {
  const { workspace, assets, update } = useWorkspace()
  const lang = workspace.settings.uiLanguage
  const [incoming, setIncoming] = useState<Backup>()
  const [localAssets, setLocalAssets] = useState<Backup['assets']>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const plan = useMemo(
    () => (incoming ? mergeBackup(workspace, localAssets, incoming) : undefined),
    [incoming, workspace, localAssets],
  )
  async function loadBackup(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setIncoming(undefined)
    try {
      if (file.size > MAX_BACKUP) throw new Error('Backup exceeds 25 MiB')
      const backup = parseBackup(await file.text())
      await Promise.all(backup.assets.map(decodeAsset))
      setLocalAssets(await Promise.all(assets.map(encodeAsset)))
      setIncoming(backup)
      setMessage('')
    } catch (error) {
      setMessage(explainError(error, lang))
    } finally {
      setBusy(false)
    }
  }
  async function apply(mode: 'merge' | 'replace') {
    if (!incoming || !plan || (mode === 'replace' && !window.confirm(t('replaceConfirm', lang))))
      return
    setBusy(true)
    try {
      const next = mode === 'replace' ? incoming : { ...plan.workspace, assets: plan.assets }
      backupSchema.parse({
        ...next,
        app: 'muinvoice',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
      })
      const decoded = await Promise.all(next.assets.map(decodeAsset))
      await commitReplacement(
        { settings: next.settings, companies: next.companies, invoices: next.invoices },
        decoded,
      )
      setIncoming(undefined)
      setMessage(
        mode === 'merge'
          ? `${t('added', lang)}: ${plan.added} · ${t('conflicts', lang)}: ${plan.skipped}`
          : t('saved', lang),
      )
    } catch (error) {
      setMessage(explainError(error, lang))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="settings-card">
      <h2>{t('backup', lang)}</h2>
      <p>{t('privacy', lang)}</p>
      <div className="button-row">
        <Button
          onClick={() => void exportWorkspace().catch((e) => setMessage(explainError(e, lang)))}
        >
          <Download />
          {t('export', lang)}
        </Button>
        <label className="upload-button">
          <Upload />
          {t('import', lang)}
          <input
            disabled={busy}
            aria-label={t('import', lang)}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              void loadBackup(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {incoming && plan ? (
        <div className="import-plan">
          <p>
            {incoming.invoices.length} {t('invoices', lang)} · {incoming.companies.length}{' '}
            {t('profiles', lang)} · {incoming.assets.length} {t('assets', lang)}
          </p>
          <p>
            {t('added', lang)}: {plan.added} · {t('identical', lang)}: {plan.identical} ·{' '}
            {t('conflicts', lang)}: {plan.skipped}
          </p>
          {plan.conflicts.length ? (
            <p className="help">
              <bdi>{plan.conflicts.join(', ')}</bdi>
            </p>
          ) : null}
          <p>{t('restoreHelp', lang)}</p>
          <div className="button-row">
            <Button disabled={busy} variant="outline" onClick={() => void apply('merge')}>
              {t('merge', lang)}
            </Button>
            <Button disabled={busy} variant="destructive" onClick={() => void apply('replace')}>
              {t('replace', lang)}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setIncoming(undefined)}>
              {t('cancel', lang)}
            </Button>
          </div>
        </div>
      ) : null}
      {message ? (
        <p role="status" className="settings-message">
          {message}
        </p>
      ) : null}
      <label className="check-label">
        <input
          type="checkbox"
          checked={workspace.settings.backupReminder}
          onChange={(e) =>
            update({
              ...workspace,
              settings: { ...workspace.settings, backupReminder: e.target.checked },
            })
          }
        />
        {t('backupReminder', lang)}
      </label>
      <div className="button-row">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const granted = await navigator.storage?.persist?.()
              setMessage(`${t('persistHelp', lang)} (${t(granted ? 'granted' : 'denied', lang)})`)
            } catch (error) {
              setMessage(explainError(error, lang))
            }
          }}
        >
          {t('persist', lang)}
        </Button>
      </div>
      <p>{t('persistHelp', lang)}</p>
      <p className="help">{t('printHelp', lang)}</p>
      <Button
        variant="destructive"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm(t('deleteAllConfirm', lang))) return
          try {
            await commitReplacement(emptyWorkspace(), [])
            setIncoming(undefined)
            setMessage(t('saved', lang))
          } catch (error) {
            setMessage(explainError(error, lang))
          }
        }}
      >
        {t('deleteAll', lang)}
      </Button>
    </section>
  )
}
