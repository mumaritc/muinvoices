import '@testing-library/jest-dom/vitest'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from './Editor'
import { newInvoice, emptyWorkspace } from '../../features/invoices/defaults'
import { useWorkspace } from '../../features/invoices/store'
afterEach(cleanup)
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
