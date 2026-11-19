import { useFormContext, useWatch } from 'react-hook-form'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { type Invoice } from '../../features/invoices/schema'
import { uuid } from '../../features/invoices/defaults'
import { templates, templateDefaults } from '../../features/templates/registry'
import { useWorkspace } from '../../features/invoices/store'
import { verifyImage } from '../../lib/assets'
import { t } from '../../locales/dictionary'
import { Button } from '../ui/button'
import { Field, LocalFields, SelectField, FormSection } from './Fields'
export function DesignForm({
  lang,
  onError,
  panel,
}: {
  lang: 'en' | 'ar'
  panel: 'appearance' | 'columns' | 'labels'
  onError: (message: string) => void
}) {
  const form = useFormContext<Invoice>()
  const design = useWatch({ control: form.control, name: 'design' })
  async function upload(file: File | undefined, path: 'seller.logoAssetId' | 'signatureAssetId') {
    if (!file) return
    try {
      const asset = await verifyImage(file, uuid(), file.name)
      const state = useWorkspace.getState()
      if (state.assets.length >= 100) throw new Error('Maximum 100 images')
      state.update(state.workspace, [...state.assets, asset])
      form.setValue(path, asset.id)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Image failed')
    }
  }
  function move(index: number, offset: number) {
    const columns = [...form.getValues('design.columns')]
    const [c] = columns.splice(index, 1)
    columns.splice(index + offset, 0, c)
    form.setValue('design.columns', columns)
  }
  return (
    <>
      {panel === 'appearance' ? (
        <>
          <FormSection title={t('design', lang)}>
            <div className="template-pure-swatch">
              <span>μ</span>
              <div>
                <strong>{templates.find((t) => t.id === design.templateId)?.name}</strong>
                <p>{t('flowing', lang)}</p>
              </div>
            </div>
            <details className="gallery">
              <summary>{t('gallery', lang)} · 25</summary>
              <div className="template-grid">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="template-choice"
                    aria-label={`${t('template', lang)} ${template.name}`}
                    aria-pressed={design.templateId === template.id}
                    onClick={() => form.setValue('design.templateId', template.id)}
                  >
                    <img
                      loading="lazy"
                      src={`${import.meta.env.BASE_URL}thumbnails/${template.id}.png`}
                      alt=""
                    />
                    <span>{template.name}</span>
                  </Button>
                ))}
              </div>
            </details>
            <Button
              variant="outline"
              onClick={() => form.setValue('design', templateDefaults(design.templateId))}
            >
              {t('reset', lang)}
            </Button>
            <div className="design-controls">
              <SelectField
                name="design.mode"
                label="mode"
                values={['en', 'ar', 'bilingual']}
                lang={lang}
              />
              <SelectField
                name="design.order"
                label="order"
                values={['en-first', 'ar-first']}
                lang={lang}
              />
              <Field
                name="design.font"
                label={t('font', lang)}
                lang={lang}
                options={[
                  { value: 'noto', label: 'Noto Sans Arabic' },
                  { value: 'cairo', label: 'Cairo' },
                  { value: 'plex', label: 'IBM Plex Sans Arabic' },
                ]}
              />
              <div className="field-pair">
                <Field name="design.accent" label={t('accent', lang)} lang={lang} type="color" />
                <Field name="design.color" label={t('color', lang)} lang={lang} type="color" />
              </div>
              <SelectField
                name="design.size"
                label="size"
                values={['small', 'medium', 'large']}
                lang={lang}
              />
              <SelectField
                name="design.spacing"
                label="spacing"
                values={['compact', 'normal', 'airy']}
                lang={lang}
              />
              <SelectField
                name="design.border"
                label="border"
                values={['none', 'rules', 'grid']}
                lang={lang}
              />
              <SelectField
                name="design.logoPosition"
                label="logoPosition"
                values={['start', 'center', 'end']}
                lang={lang}
              />
              <label className="field">
                <span>{t('logoSize', lang)}</span>
                <input
                  aria-label={t('logoSize', lang)}
                  type="range"
                  min="24"
                  max="160"
                  {...form.register('design.logoSize', { valueAsNumber: true })}
                />
              </label>
            </div>
            <p className="help">{t('missing', lang)}</p>
            {(['seller.logoAssetId', 'signatureAssetId'] as const).map((path, index) => (
              <div className="asset-control" key={path}>
                <label className="upload-button">
                  {t(index === 0 ? 'logo' : 'signature', lang)}
                  <input
                    aria-label={t(index === 0 ? 'logo' : 'signature', lang)}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      void upload(e.target.files?.[0], path)
                      e.target.value = ''
                    }}
                  />
                </label>
                <Button variant="ghost" onClick={() => form.setValue(path, undefined)}>
                  {t('remove', lang)}
                </Button>
              </div>
            ))}
            <p className="help">{t('uploadHelp', lang)}</p>
          </FormSection>
          <FormSection title={t('headerFooter', lang)}>
            <LocalFields name="headerText" label={t('headerText', lang)} lang={lang} multiline />
            <LocalFields name="footerText" label={t('footerText', lang)} lang={lang} multiline />
          </FormSection>
        </>
      ) : null}
      {panel === 'columns' ? (
        <FormSection title={t('columns', lang)}>
          {design.columns.filter((c) => c.visible).length > 6 ? (
            <p className="help">{t('columnWarning', lang)}</p>
          ) : null}
          {design.columns.map((column, index) => (
            <section key={column.id} className="item-card column-card">
              <div className="section-heading">
                <label className="check-label">
                  <input
                    type="checkbox"
                    disabled={
                      column.visible && design.columns.filter((c) => c.visible).length === 1
                    }
                    {...form.register(`design.columns.${index}.visible`)}
                  />
                  {t(column.id, lang)}
                </label>
                <div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${t('up', lang)} ${t(column.id, lang)}`}
                    disabled={!index}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${t('down', lang)} ${t(column.id, lang)}`}
                    disabled={index === design.columns.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              </div>
              <LocalFields
                name={`design.columns.${index}.label`}
                label={t('label', lang)}
                lang={lang}
              />
              <SelectField
                name={`design.columns.${index}.align`}
                label="align"
                values={['start', 'center', 'end']}
                lang={lang}
              />
              <label className="field">
                <span>{t('width', lang)}</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  aria-label={`${t('width', lang)} ${t(column.id, lang)}`}
                  {...form.register(`design.columns.${index}.width`, { valueAsNumber: true })}
                />
              </label>
            </section>
          ))}
        </FormSection>
      ) : null}
      {panel === 'labels' ? (
        <FormSection title={t('labels', lang)}>
          {(
            [
              'invoice',
              'seller',
              'customer',
              'subtotal',
              'discount',
              'tax',
              'total',
              'due',
              'reference',
              'signature',
            ] as const
          ).map((key) => (
            <LocalFields key={key} name={`design.labels.${key}`} label={t(key, lang)} lang={lang} />
          ))}
        </FormSection>
      ) : null}
    </>
  )
}
