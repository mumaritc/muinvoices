import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test('keyboard access, editor labels, contrast and 200% layout', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'New invoice', exact: true }).first()).toBeVisible()
  let audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(audit.violations).toEqual([])
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Synthetic Seller')
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(audit.violations).toEqual([])
  await page.getByRole('button', { name: 'Table columns', exact: true }).click()
  const move = page.getByRole('button', { name: 'Move up Total', exact: true })
  await move.focus()
  await page.keyboard.press('Enter')
  await expect(move).toBeFocused()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page.getByRole('button', { name: 'Interface language' }).click()
  await page.setViewportSize({ width: 640, height: 900 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await expect(
    page.getByRole('textbox', { name: 'الاسم · العربية', exact: true }).first(),
  ).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflow).toBe(false)
  audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(audit.violations).toEqual([])
})
