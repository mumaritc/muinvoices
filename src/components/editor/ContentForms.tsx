import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Plus, ArrowUp, ArrowDown } from 'lucide-react'
import { type FieldPath } from 'react-hook-form'
import { type Invoice } from '../../features/invoices/schema'
import { uuid } from '../../features/invoices/defaults'
import { t } from '../../locales/dictionary'
import { Button } from '../ui/button'
import { Field, LocalFields, SelectField, FormSection } from './Fields'
type Lang = { lang: 'en' | 'ar' }
export function CustomFields({
  name,
  lang,
}: Lang & { name: 'seller.fields' | 'customer.fields' | `sections.${number}.fields` }) {
  const { control, register } = useFormContext<Invoice>()
  const fields = useFieldArray({ control, name, keyName: 'formId' })
  return (
    <div className="custom-fields">
      {fields.fields.map((f, i) => (
        <div className="item-card" key={f.formId}>
          <LocalFields name={`${name}.${i}.label`} label={t('label', lang)} lang={lang} />
          <LocalFields name={`${name}.${i}.value`} label={t('value', lang)} lang={lang} />
          <label className="check-label">
            <input type="checkbox" {...register(`${name}.${i}.visible`)} />
            {t('visible', lang)}
          </label>
          <Button variant="ghost" onClick={() => fields.remove(i)}>
            {t('remove', lang)}
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        disabled={fields.fields.length >= 100}
        onClick={() => fields.append({ id: uuid(), label: {}, value: {}, visible: true })}
      >
        <Plus />
        {t('addField', lang)}
      </Button>
    </div>
  )
}
export function PartyForm({ party, lang }: Lang & { party: 'seller' | 'customer' }) {
  return (
    <FormSection title={t(party, lang)}>
      <LocalFields name={`${party}.name`} label={t('name', lang)} lang={lang} />
      <LocalFields name={`${party}.address`} label={t('address', lang)} lang={lang} multiline />
      {(['vat', 'registration', 'phone', 'email', 'website'] as const).map((key) => (
        <Field key={key} name={`${party}.${key}`} label={t(key, lang)} lang={lang} />
      ))}
      <h3 className="subheading">{t('fields', lang)}</h3>
      <CustomFields name={`${party}.fields`} lang={lang} />
    </FormSection>
  )
}
export function MetadataForm({ lang }: Lang) {
  return (
    <FormSection title={t('details', lang)}>
      <Field name="number" label={t('number', lang)} lang={lang} />
      <SelectField
        name="type"
        label="type"
        values={['invoice', 'tax-invoice', 'simplified-tax']}
        lang={lang}
      />
      <Field name="issuedAt" label={t('issuedAt', lang)} lang={lang} />
      <Field name="timezone" label={t('timezone', lang)} lang={lang} />
      <Field name="dueDate" label={t('due', lang)} lang={lang} type="date" />
      <Field name="reference" label={t('reference', lang)} lang={lang} />
      <Field name="currency" label={t('currency', lang)} lang={lang} />
      <SelectField
        name="priceMode"
        label="priceMode"
        values={['exclusive', 'inclusive']}
        lang={lang}
      />
      <SelectField name="numerals" label="numerals" values={['latn', 'arab']} lang={lang} />
      <SelectField name="design.mode" label="mode" values={['en', 'ar', 'bilingual']} lang={lang} />
    </FormSection>
  )
}
export function DiscountForm({
  name,
  lang,
}: Lang & { name: 'overallDiscount' | `items.${number}.discount` }) {
  const form = useFormContext<Invoice>()
  const discount = useWatch({ control: form.control, name })
  return (
    <div className="discount-form">
      {discount ? (
        <>
          <div className="field-pair">
            <SelectField
              name={`${name}.type`}
              label="discount"
              values={['percent', 'fixed']}
              lang={lang}
            />
            <Field name={`${name}.value`} label={t('value', lang)} lang={lang} />
          </div>
          <Button variant="ghost" onClick={() => form.setValue(name, undefined)}>
            {t('remove', lang)}
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          onClick={() => form.setValue(name, { type: 'percent', value: '0' })}
        >
          {t(name === 'overallDiscount' ? 'allocation' : 'discount', lang)}
        </Button>
      )}
    </div>
  )
}
export function ItemsForm({ lang }: Lang) {
  const form = useFormContext<Invoice>()
  const items = useFieldArray({ control: form.control, name: 'items', keyName: 'formId' })
  const liveTaxes = useWatch({ control: form.control, name: 'taxes' })
  const addItem = () =>
    items.append({
      id: uuid(),
      description: {},
      sku: '',
      unit: {},
      quantity: '1',
      unitPrice: '0',
      treatment: 'none',
      taxIds: [],
      explanation: {},
    })
  return (
    <>
      <FormSection title={t('items', lang)}>
        <p className="help">
          {t('decimalHelp', lang)} {t('netHelp', lang)}
        </p>
        {items.fields.map((item, i) => (
          <section className="item-card" key={item.formId}>
            <div className="section-heading">
              <h3>
                {t('description', lang)} {i + 1}
              </h3>
              <Button
                variant="ghost"
                aria-label={`${t('remove', lang)} ${i + 1}`}
                onClick={() => items.remove(i)}
              >
                {t('remove', lang)}
              </Button>
            </div>
            <LocalFields
              name={`items.${i}.description`}
              label={t('description', lang)}
              lang={lang}
              multiline
            />
            <Field name={`items.${i}.sku`} label={t('sku', lang)} lang={lang} />
            <LocalFields name={`items.${i}.unit`} label={t('unit', lang)} lang={lang} />
            <div className="field-pair">
              <Field name={`items.${i}.quantity`} label={t('quantity', lang)} lang={lang} />
              <Field name={`items.${i}.unitPrice`} label={t('unitPrice', lang)} lang={lang} />
            </div>
            <DiscountForm name={`items.${i}.discount`} lang={lang} />
            <SelectField
              name={`items.${i}.treatment`}
              label="treatment"
              values={['none', 'taxed', 'zeroRated', 'exempt']}
              lang={lang}
            />
            {liveTaxes.map((tax) => (
              <label key={tax.id} className="check-label">
                <input type="checkbox" value={tax.id} {...form.register(`items.${i}.taxIds`)} />
                {tax.name[lang] || tax.name.en || tax.name.ar || t('tax', lang)}
              </label>
            ))}
            <LocalFields
              name={`items.${i}.explanation`}
              label={t('explanation', lang)}
              lang={lang}
            />
          </section>
        ))}
        <Button variant="outline" disabled={items.fields.length >= 1000} onClick={addItem}>
          <Plus />
          {t('addItem', lang)}
        </Button>
      </FormSection>
      <FormSection title={t('allocation', lang)}>
        <DiscountForm name="overallDiscount" lang={lang} />
        <p className="help">{t('netHelp', lang)}</p>
      </FormSection>
    </>
  )
}
export function NamedTaxesForm({ lang }: Lang) {
  const form = useFormContext<Invoice>()
  const taxes = useFieldArray({ control: form.control, name: 'taxes', keyName: 'formId' })
  return (
    <FormSection title={t('tax', lang)}>
      {taxes.fields.map((tax, i) => (
        <div className="item-card" key={tax.formId}>
          <LocalFields name={`taxes.${i}.name`} label={t('name', lang)} lang={lang} />
          <Field name={`taxes.${i}.rate`} label={t('rate', lang)} lang={lang} />
          <SelectField
            name={`taxes.${i}.kind`}
            label="taxKind"
            values={['vat', 'other']}
            lang={lang}
          />
          <Button
            variant="ghost"
            onClick={() => {
              const current = form.getValues()
              current.items.forEach((item, j) => {
                form.setValue(
                  `items.${j}.taxIds`,
                  item.taxIds.filter((id) => id !== tax.id),
                )
                if (
                  item.treatment === 'taxed' &&
                  item.taxIds.length === 1 &&
                  item.taxIds[0] === tax.id
                )
                  form.setValue(`items.${j}.treatment`, 'none')
              })
              form.setValue(
                'qr.vatTaxIds',
                current.qr.vatTaxIds.filter((id) => id !== tax.id),
              )
              taxes.remove(i)
            }}
          >
            {t('remove', lang)}
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        disabled={taxes.fields.length >= 100}
        onClick={() => taxes.append({ id: uuid(), name: {}, rate: '0', kind: 'other' })}
      >
        <Plus />
        {t('addTax', lang)}
      </Button>
    </FormSection>
  )
}
export function SectionsForm({ lang }: Lang) {
  const form = useFormContext<Invoice>()
  const sections = useFieldArray({ control: form.control, name: 'sections', keyName: 'formId' })
  const values = useWatch({ control: form.control, name: 'sections' })
  return (
    <FormSection title={t('sections', lang)}>
      {sections.fields.map((s, i) => (
        <div className="item-card" key={s.formId}>
          <div className="section-heading">
            <h3>{i + 1}</h3>
            <div>
              <Button
                variant="ghost"
                aria-label={`${t('up', lang)} ${i + 1}`}
                disabled={!i}
                onClick={() => sections.move(i, i - 1)}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                aria-label={`${t('down', lang)} ${i + 1}`}
                disabled={i === sections.fields.length - 1}
                onClick={() => sections.move(i, i + 1)}
              >
                <ArrowDown />
              </Button>
            </div>
          </div>
          <LocalFields name={`sections.${i}.title`} label={t('title', lang)} lang={lang} />
          <SelectField
            name={`sections.${i}.kind`}
            label="sectionKind"
            values={['text', 'keyValue']}
            lang={lang}
          />
          <SelectField
            name={`sections.${i}.position`}
            label="position"
            values={['beforeItems', 'afterItems', 'footer']}
            lang={lang}
          />
          {values[i]?.kind === 'text' ? (
            <LocalFields
              name={`sections.${i}.text`}
              label={t('text', lang)}
              lang={lang}
              multiline
            />
          ) : (
            <CustomFields name={`sections.${i}.fields`} lang={lang} />
          )}
          <label className="check-label">
            <input
              type="checkbox"
              {...form.register(`sections.${i}.visible` as FieldPath<Invoice>)}
            />
            {t('visible', lang)}
          </label>
          <Button variant="ghost" onClick={() => sections.remove(i)}>
            {t('remove', lang)}
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        disabled={sections.fields.length >= 100}
        onClick={() =>
          sections.append({
            id: uuid(),
            title: {},
            kind: 'text',
            text: {},
            fields: [],
            visible: true,
            position: 'afterItems',
          })
        }
      >
        <Plus />
        {t('addSection', lang)}
      </Button>
    </FormSection>
  )
}
