import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useWorkspace } from '../../features/invoices/store'
import { uuid } from '../../features/invoices/defaults'
import { type Invoice } from '../../features/invoices/schema'
import { t } from '../../locales/dictionary'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { NativeSelect } from '../ui/native-select'
import { FormSection } from './Fields'
import { calculateInvoice } from '../../lib/calculations'
export function Profiles({
  lang,
  valid,
  onError,
}: {
  lang: 'en' | 'ar'
  valid: boolean
  onError: (message: string) => void
}) {
  const form = useFormContext<Invoice>()
  const { workspace, update } = useWorkspace()
  const [label, setLabel] = useState('')
  const [selected, setSelected] = useState('')
  const profile = workspace.companies.find((c) => c.id === selected)
  return (
    <FormSection title={t('profiles', lang)}>
      <p className="help">{t('profileHelp', lang)}</p>
      <label className="field">
        <span>{t('label', lang)}</span>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={10000} />
      </label>
      <Button
        variant="outline"
        disabled={!valid || !label.trim() || workspace.companies.length >= 100}
        onClick={() => {
          const i = structuredClone(workspace.invoices.find((i) => i.id === form.getValues('id'))!)
          const now = new Date().toISOString()
          const existing = profile
          const c = {
            id: existing?.id ?? uuid(),
            label,
            party: i.seller,
            currency: i.currency,
            taxes: i.taxes,
            design: i.design,
            sections: i.sections,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          }
          update({
            ...workspace,
            companies: [...workspace.companies.filter((p) => p.id !== c.id), c],
          })
          setSelected(c.id)
        }}
      >
        {t('saveProfile', lang)}
      </Button>
      <label className="field profile-select">
        <span>{t('profiles', lang)}</span>
        <NativeSelect
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value)
            setLabel(workspace.companies.find((c) => c.id === e.target.value)?.label ?? '')
          }}
        >
          <option value="">—</option>
          {workspace.companies.map((c) => (
            <option value={c.id} key={c.id}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
      </label>
      {profile ? (
        <div className="button-row">
          <Button
            variant="outline"
            disabled={!valid}
            onClick={() => {
              if (!window.confirm(t('replaceSeller', lang))) return
              const value = structuredClone(profile)
              const i = form.getValues()
              const available = new Set(value.taxes.map((t) => t.id))
              const next = {
                ...i,
                seller: value.party,
                currency: value.currency,
                taxes: value.taxes,
                design: value.design,
                sections: value.sections,
                items: i.items.map((item) => ({
                  ...item,
                  treatment: 'none' as const,
                  taxIds: item.taxIds.filter((id) => available.has(id)),
                })),
                qr: { ...i.qr, enabled: false, vatTaxIds: [] },
              }
              next.items.forEach((item) => {
                item.taxIds = []
              })
              const result = calculateInvoice(next)
              if (!result.ok) {
                onError(result.errors[0].message)
                return
              }
              form.reset(next)
              update({
                ...workspace,
                invoices: workspace.invoices.map((x) => (x.id === i.id ? next : x)),
              })
            }}
          >
            {t('replaceProfile', lang)}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm(t('deleteProfileConfirm', lang))) {
                update({
                  ...workspace,
                  companies: workspace.companies.filter((c) => c.id !== selected),
                  settings: {
                    ...workspace.settings,
                    defaultCompanyId:
                      workspace.settings.defaultCompanyId === selected
                        ? undefined
                        : workspace.settings.defaultCompanyId,
                  },
                })
                setSelected('')
              }
            }}
          >
            {t('delete', lang)}
          </Button>
        </div>
      ) : null}
      <Button
        variant="ghost"
        disabled={!valid}
        onClick={() => {
          const i = workspace.invoices.find((i) => i.id === form.getValues('id'))!
          update({
            ...workspace,
            settings: {
              ...workspace.settings,
              defaultCurrency: i.currency,
              defaultDesign: structuredClone(i.design),
              defaultTaxes: structuredClone(i.taxes),
              defaultCompanyId: profile?.id,
            },
          })
        }}
      >
        {t('defaults', lang)}
      </Button>
    </FormSection>
  )
}
