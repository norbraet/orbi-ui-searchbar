import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const consumer = '/e2e/fixtures/search-scopes.html'

test('narrows and broadens without rewriting a query, with provider counts and empty recovery', async ({
  page,
}) => {
  await page.goto(consumer)
  await page.getByRole('button', { name: 'Open search' }).click()
  const input = page.getByRole('combobox')
  const group = page.getByRole('group', { name: 'Search scope' })
  const documents = group.getByRole('button', { name: /^Documents/ })
  const links = group.getByRole('button', { name: /^Links/ })
  await expect(group.getByRole('button', { name: 'All content' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(page.getByRole('option')).toHaveCount(0)
  await input.fill('release checklist')
  await expect(page.getByRole('option')).toHaveCount(1)
  await expect(documents).toHaveAccessibleName('Documents 1')
  await expect(links).toHaveAccessibleName('Links 0')
  await links.click()
  await expect(links).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Search all content' })).toBeVisible()
  await expect(page.getByRole('option')).toHaveCount(0)
  await expect(input).toHaveValue('release checklist')
  // Counts describe the unfiltered query, so Documents remains a useful alternative.
  await expect(documents).toHaveAccessibleName('Documents 1')
  await page.getByRole('button', { name: 'Search all content' }).click()
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('release checklist')
  await expect(page.getByRole('option')).toHaveCount(1)
  await expect(group.getByRole('button', { name: 'All content' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
})

test('chip keyboard navigation moves focus without selecting and preserves typing shortcuts', async ({
  page,
}) => {
  await page.goto(consumer)
  await page.getByRole('button', { name: 'Open search' }).click()
  const input = page.getByRole('combobox')
  const group = page.getByRole('group', { name: 'Search scope' })
  const all = group.getByRole('button', { name: 'All content' })
  const documents = group.getByRole('button', { name: /^Documents/ })
  await input.fill('design')
  await expect(page.locator('[role="listbox"]')).toHaveAttribute('data-status', 'success')
  await all.focus()
  await all.press('ArrowRight')
  await expect(documents).toBeFocused()
  await expect(all).toHaveAttribute('aria-pressed', 'true')
  await documents.press('Space')
  await expect(documents).toHaveAttribute('aria-pressed', 'true')
  await expect(documents).toBeFocused()
  await expect(page.locator('[role="listbox"]')).toHaveAttribute('data-status', 'success')
  for (const option of await page.getByRole('option').all())
    await expect(option.locator('.search-palette-kind')).toHaveText('Document')
  await documents.press('Enter')
  await expect(all).toHaveAttribute('aria-pressed', 'true')
  await documents.press('Home')
  await expect(all).toBeFocused()
  await input.focus()
  await input.press('End')
  await input.press('Space')
  await expect(input).toHaveValue('design ')
  await input.press('Escape')
  await expect(page.getByRole('button', { name: 'Open search' })).toBeFocused()
})

test('retains scope for suggestions and clearing input, resets on close and host removal', async ({
  page,
}) => {
  await page.goto(consumer)
  const trigger = page.getByRole('button', { name: 'Open search' })
  await trigger.click()
  const group = page.getByRole('group', { name: 'Search scope' })
  const links = group.getByRole('button', { name: /^Links/ })
  await links.click()
  await expect(links).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('option')).toHaveCount(0)
  await page.getByRole('button', { name: 'Design guidelines' }).click()
  await expect(page.getByRole('option')).toHaveCount(1)
  await expect(page.getByRole('option').locator('.search-palette-kind')).toHaveText('Link')
  await page.getByRole('combobox').fill('')
  await expect(links).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('option')).toHaveCount(0)
  await links.focus()
  await page.locator('#remove-scopes').evaluate((el: HTMLButtonElement) => el.click())
  await expect(group).toHaveCount(0)
  await expect(page.getByRole('combobox')).toBeFocused()
  await expect(page.locator('#requests')).toHaveText(/"scopeId":null}\]$/)
  await page.getByRole('combobox').press('Escape')
  await trigger.click()
  await expect(page.getByRole('combobox')).toHaveValue('')
})

test('scope chips work when a provider omits counts', async ({ page }) => {
  await page.goto(`${consumer}?no-counts`)
  await page.getByRole('button', { name: 'Open search' }).click()
  await page.getByRole('combobox').fill('design')
  const decisions = page
    .getByRole('group', { name: 'Search scope' })
    .getByRole('button', { name: 'Decisions', exact: true })
  await decisions.click()
  await expect(decisions).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[role="listbox"]')).toHaveAttribute('data-status', 'success')
  expect(await page.getByRole('option').count()).toBeGreaterThan(0)
  await expect(page.locator('.search-palette-scope-count')).toHaveCount(0)
})

test.describe('touch scopes', () => {
  test.skip(
    ({ browserName }) => browserName === 'firefox',
    'Playwright Firefox has no touch emulation'
  )
  test.use({ hasTouch: true })
  test('scrolls the chip rail without horizontal page overflow and exposes pressed state', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(consumer)
    await page.getByRole('button', { name: 'Open search' }).tap()
    const input = page.getByRole('combobox')
    await input.fill('design')
    await expect(page.locator('[role="listbox"]')).toHaveAttribute('data-status', 'success')
    const group = page.getByRole('group', { name: 'Search scope' })
    const last = group.getByRole('button', { name: /^Design files/ })
    await group.getByRole('button', { name: 'All content' }).focus()
    await page.keyboard.press('End')
    await expect(last).toBeFocused()
    await expect.poll(() => group.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
    await last.tap()
    await expect(last).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[role="listbox"]')).toHaveAttribute('data-status', 'success')
    const box = await last.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    const dialog = page.getByRole('dialog')
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.setViewportSize({ width: 700, height: 568 })
    await page.setViewportSize({ width: 320, height: 568 })
    await expect(last).toBeInViewport()
    await page.locator('html').evaluate((el) => {
      el.style.fontSize = '32px'
    })
    await expect.poll(() => dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expect(last).toBeInViewport()
    const { violations } = await new AxeBuilder({ page }).include('dialog').analyze()
    expect(violations).toEqual([])
  })
})
