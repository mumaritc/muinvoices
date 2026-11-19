import { useFormContext, useWatch } from 'react-hook-form'
import { type Invoice } from '../../features/invoices/schema'
import { t } from '../../locales/dictionary'
import { FormSection, SelectField } from './Fields'
export function QrForm({ lang }: { lang: 'en' | 'ar' }) {
  const form = useFormContext<Invoice>()
  const taxes = useWatch({ control: form.control, name: 'taxes' })
  return (
    <FormSection title={t('qr', lang)}>
      <label className="check-label">
        <input type="checkbox" {...form.register('qr.enabled')} />
        {t('qr', lang)}
      </label>
      <p className="help">{t('qrDisclaimer', lang)}</p>
      <SelectField
        name="design.qrPosition"
        label="qrPosition"
        values={['top', 'bottom']}
        lang={lang}
      />
      <SelectField
        name="design.qrAlign"
        label="qrAlign"
        values={['left', 'center', 'right']}
        lang={lang}
      />
      <SelectField name="qr.sellerLanguage" label="qrSeller" values={['en', 'ar']} lang={lang} />
      <p className="help">{t('qrMapping', lang)}</p>
      {taxes
        .filter((t) => t.kind === 'vat')
        .map((tax) => (
          <label key={tax.id} className="check-label">
            <input type="checkbox" value={tax.id} {...form.register('qr.vatTaxIds')} />
            {tax.name[lang] || tax.name.en || tax.name.ar || t('vat', lang)}
          </label>
        ))}
    </FormSection>
  )
}
