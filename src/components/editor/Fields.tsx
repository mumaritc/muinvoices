import { useContext, useId, type ReactNode } from 'react'
import { useFormContext, type FieldPath } from 'react-hook-form'
import { type Invoice } from '../../features/invoices/schema'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { NativeSelect } from '../ui/native-select'
import { type CopyKey, t } from '../../locales/dictionary'
import { ValidationContext } from './validation-context'
export function Field({
  name,
  label,
  lang,
  multiline = false,
  options,
  type = 'text',
}: {
  name: FieldPath<Invoice>
  label: string
  lang: 'en' | 'ar'
  multiline?: boolean
  options?: { value: string; label: string }[]
  type?: string
}) {
  const { register } = useFormContext<Invoice>()
  const id = useId()
  const error = useContext(ValidationContext).find(
    (e) => name === e.path || name.startsWith(e.path + '.'),
  )
  const props = {
    ...register(name),
    id,
    maxLength: 10000,
    'aria-label': label,
    'aria-invalid': !!error,
    'aria-describedby': error ? id + '-error' : undefined,
    dir: 'auto' as const,
  }
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {options ? (
        <NativeSelect {...props}>
          {options.map((o) => (
            <option value={o.value} key={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      ) : multiline ? (
        <Textarea {...props} />
      ) : (
        <Input
          {...props}
          type={type}
          inputMode={
            name.endsWith('quantity') ||
            name.endsWith('unitPrice') ||
            name.endsWith('value') ||
            name.endsWith('rate')
              ? 'decimal'
              : undefined
          }
        />
      )}
      {error ? (
        <span className="field-error" id={id + '-error'}>
          {lang === 'ar' ? t('invalid', lang) : error.message}
        </span>
      ) : null}
    </label>
  )
}
export function LocalFields({
  name,
  label,
  lang,
  multiline = false,
}: {
  name: string
  label: string
  lang: 'en' | 'ar'
  multiline?: boolean
}) {
  return (
    <div className="field-pair">
      <Field
        name={`${name}.en` as FieldPath<Invoice>}
        label={`${label} · English`}
        lang={lang}
        multiline={multiline}
      />
      <Field
        name={`${name}.ar` as FieldPath<Invoice>}
        label={`${label} · العربية`}
        lang={lang}
        multiline={multiline}
      />
    </div>
  )
}
export function SelectField({
  name,
  label,
  values,
  lang,
}: {
  name: FieldPath<Invoice>
  label: CopyKey
  values: readonly CopyKey[]
  lang: 'en' | 'ar'
}) {
  return (
    <Field
      name={name}
      lang={lang}
      label={t(label, lang)}
      options={values.map((v) => ({ value: v, label: t(v, lang) }))}
    />
  )
}
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="form-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
