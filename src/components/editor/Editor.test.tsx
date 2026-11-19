import '@testing-library/jest-dom/vitest'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from './Editor'
import { newInvoice, emptyWorkspace, uuid } from '../../features/invoices/defaults'
import { useWorkspace } from '../../features/invoices/store'
afterEach(cleanup)
it.each([1, 2])(
  'keeps tax arrays on added/reindexed items with %i named taxes',
  async (taxCount) => {
    const user = userEvent.setup()
    const invoice = newInvoice()
    const taxId = uuid()
    invoice.seller.name.en = 'Synthetic seller'
    invoice.taxes = [{ id: taxId, name: { en: 'VAT 15' }, rate: '15', kind: 'vat' }]
    if (taxCount === 2)
      invoice.taxes.push({ id: uuid(), name: { en: 'Service tax' }, rate: '5', kind: 'other' })
    invoice.items[0].description.en = 'First service'
    invoice.items[0].unitPrice = '100'
    invoice.items[0].treatment = 'taxed'
    invoice.items[0].taxIds = [taxId]
    useWorkspace.setState({
      workspace: { ...emptyWorkspace(), invoices: [invoice] },
      assets: [],
      ready: true,
      status: 'saved',
      error: '',
    })
    render(<Editor invoiceId={invoice.id} onLeave={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Items & taxes' }))
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    const second = within(
      screen.getByRole('heading', { name: 'Description 2' }).closest('section')!,
    )
    await user.type(
      second.getByRole('textbox', { name: 'Description · English' }),
      'Second service',
    )
    const price = second.getByRole('textbox', { name: 'Unit price' })
    await user.clear(price)
    await user.type(price, '200')
    await user.selectOptions(second.getByRole('combobox', { name: 'Tax treatment' }), 'taxed')
    await user.click(second.getByRole('checkbox', { name: 'VAT 15' }))
    expect(useWorkspace.getState().workspace.invoices[0].items[1].taxIds).toEqual([taxId])
    expect(screen.getByTestId('invoice').querySelector('.grand-total dd')).toHaveTextContent(
      '345.00',
    )
    expect(screen.getByRole('button', { name: 'Print / save PDF' })).toBeEnabled()
    if (taxCount === 2) {
      const otherTax = second.getByRole('checkbox', { name: 'Service tax' })
      await user.click(otherTax)
      expect(useWorkspace.getState().workspace.invoices[0].items[1].taxIds).toEqual([
        taxId,
        invoice.taxes[1].id,
      ])
      expect(screen.getByTestId('invoice').querySelector('.grand-total dd')).toHaveTextContent(
        '355.00',
      )
      await user.click(otherTax)
    }
    await user.click(screen.getByRole('button', { name: 'Named taxes' }))
    await user.click(screen.getByRole('button', { name: 'Line items' }))
    await user.click(screen.getByRole('button', { name: 'Remove 1' }))
    const tax = screen.getByRole('checkbox', { name: 'VAT 15' })
    expect(tax).toBeChecked()
    await user.click(tax)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tax treatment' }), 'none')
    expect(useWorkspace.getState().workspace.invoices[0].items[0].taxIds).toEqual([])
    expect(screen.getByTestId('invoice').querySelector('.grand-total dd')).toHaveTextContent(
      '200.00',
    )
    expect(screen.getByRole('button', { name: 'Print / save PDF' })).toBeEnabled()
  },
)
it('keeps invalid edits in RHF while preview/store retain the last valid snapshot', async () => {
  const user = userEvent.setup()
  const invoice = newInvoice()
  invoice.seller.name.en = 'Synthetic seller'
  invoice.items[0].description.en = 'Synthetic work'
  invoice.items[0].unitPrice = '1000'
  useWorkspace.setState({
    workspace: { ...emptyWorkspace(), invoices: [invoice] },
    assets: [],
    ready: true,
    status: 'saved',
    error: '',
  })
  render(<Editor invoiceId={invoice.id} onLeave={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Items & taxes' }))
  let price = screen.getByRole('textbox', { name: 'Unit price' })
  await user.clear(price)
  await user.type(price, 'invalid')
  expect(price).toHaveValue('invalid')
  expect(price).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByRole('button', { name: 'Print / save PDF' })).toBeDisabled()
  expect(screen.getByTestId('invoice').querySelector('.grand-total dd')).toHaveTextContent(
    '1000.00',
  )
  expect(useWorkspace.getState().workspace.invoices[0].items[0].unitPrice).toBe('1000')
  await user.click(screen.getByRole('button', { name: 'Named taxes' }))
  await user.click(screen.getByRole('button', { name: 'Line items' }))
  price = screen.getByRole('textbox', { name: 'Unit price' })
  expect(price).toHaveValue('invalid')
  await user.clear(price)
  await user.type(price, '50')
  expect(price).toHaveAttribute('aria-invalid', 'false')
  expect(screen.getByRole('button', { name: 'Print / save PDF' })).toBeEnabled()
  expect(useWorkspace.getState().workspace.invoices[0].items[0].unitPrice).toBe('50')
})
