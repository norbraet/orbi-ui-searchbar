import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const consumer = '/e2e/fixtures/search-palette.html'

test('works without app providers: keyboard preview, focus containment, activation, and restoration', async ({
  page,
}) => {
  await page.goto(consumer)
  const trigger = page.getByRole('button', { name: 'Open search' })
  await trigger.click()
  const input = page.getByRole('combobox', { name: 'Search', exact: true })
  const dialog = page.getByRole('dialog', { name: 'Search your workspace' })
  await expect(input).toBeFocused()
  await expect(page.getByRole('option')).toHaveCount(2)
  await input.press('ArrowDown')
  await expect(page.getByRole('heading', { name: 'Second document' })).toBeVisible()
  await expect(input).toBeFocused()
  const activeId = await input.getAttribute('aria-activedescendant')
  await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute('aria-selected', 'true')
  await expect(dialog.getByText('No preview available.', { exact: false })).toBeVisible()
  for (let i = 0; i < 7; i += 1) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }
  await input.focus()
  await input.press('Enter')
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('#activation')).toHaveText('/second')
  await expect(trigger).toBeFocused()
})

test('shortcut, suggestion, pointer activation, and listener cleanup', async ({ page }) => {
  await page.goto(consumer)
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('option')).toHaveCount(2)
  await page.getByRole('button', { name: 'Try design' }).click()
  const input = page.getByRole('combobox')
  await expect(input).toHaveValue('design')
  await expect(input).toBeFocused()
  await expect(page.getByRole('option')).toHaveCount(2)
  await page.getByRole('option', { name: /Second document/ }).click()
  await expect(page.locator('#activation')).toHaveText('/second')
  await page.getByRole('button', { name: 'Unmount palette' }).click()
  await page.keyboard.press('Control+k')
  await expect(page.locator('dialog')).toHaveCount(0)
})

test('does not activate or dismiss during IME composition', async ({ page }) => {
  await page.goto(consumer)
  await page.getByRole('button', { name: 'Open search' }).click()
  const input = page.getByRole('combobox')
  await expect(page.getByRole('option')).toHaveCount(2)
  await input.dispatchEvent('compositionstart')
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
  await expect(page.locator('#activation')).toHaveText('')
  await input.press('Escape')
  await expect(page.getByRole('dialog')).toBeVisible()
  await input.dispatchEvent('compositionend')
})

test('empty results cannot activate stale content', async ({ page }) => {
  await page.goto(`${consumer}?scenario=empty`)
  await page.getByRole('button', { name: 'Open search' }).click()
  await expect(
    page.getByText('No results. Try another query or broaden your search.')
  ).toBeVisible()
  await page.getByRole('combobox').press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('#activation')).toHaveText('')
})

test('failed search can retry without closing', async ({ page }) => {
  await page.goto(`${consumer}?scenario=error`)
  await page.getByRole('button', { name: 'Open search' }).click()
  await expect(
    page.getByText('Search is unavailable. Please try again.', { exact: true }).first()
  ).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('option')).toHaveCount(2)
  await expect(page.locator('#calls')).toHaveText('2')
})

test('broken preview images fall back and layout fits a small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto(`${consumer}?scenario=broken-image`)
  await page.getByRole('button', { name: 'Open search' }).click()
  await expect(page.getByRole('option')).toHaveCount(2)
  await page.getByRole('combobox').press('ArrowDown')
  await expect(page.getByText('No preview available.', { exact: false })).toBeVisible()
  await expect(page.locator('.search-palette-thumbnail')).toHaveCount(0)
  expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true
  )
})

test('accessible modal semantics in the isolated consumer', async ({ page }) => {
  await page.goto(consumer)
  await page.getByRole('button', { name: 'Open search' }).click()
  await expect(page.getByRole('option')).toHaveCount(2)
  const { violations } = await new AxeBuilder({ page }).include('dialog').analyze()
  expect(violations).toEqual([])
  await page.getByRole('combobox').press('Escape')
  await expect(page.getByRole('button', { name: 'Open search' })).toBeFocused()
})

test('keeps exit content stable and can reopen before the exit finishes', async ({ page }) => {
  await page.goto(consumer)
  await page.getByRole('button', { name: 'Open search' }).click()
  await expect(page.getByRole('option')).toHaveCount(2)
  const dialog = page.locator('dialog')
  await dialog.evaluate((element) => element.style.setProperty('--motion-fast', '1000ms'))
  await page.getByRole('combobox').press('Escape')
  await expect(dialog).toHaveAttribute('data-phase', 'closing')
  expect(await dialog.evaluate((element: HTMLDialogElement) => element.open)).toBe(true)
  await expect(dialog.locator('[role="option"]')).toHaveCount(2)
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('combobox')).toBeFocused()
  await expect(page.getByRole('option')).toHaveCount(2)
  // Complete every current effect; an obsolete close must not remove the reopened modal.
  await dialog.evaluate((element) =>
    Promise.allSettled(element.getAnimations().map((animation) => animation.finished))
  )
  expect(await dialog.evaluate((element: HTMLDialogElement) => element.open)).toBe(true)
  await expect(page.locator('#activation')).toHaveText('')
})

test('reduced motion skips effects and restores focus on close', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(consumer)
  const trigger = page.getByRole('button', { name: 'Open search' })
  await trigger.click()
  await expect(page.getByRole('option')).toHaveCount(2)
  const dialog = page.locator('dialog')
  expect(await dialog.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
    0
  )
  await page.getByRole('combobox').press('Escape')
  await expect(dialog).not.toHaveAttribute('open', '')
  await expect(trigger).toBeFocused()
})

test('uses shared themes and semantic token overrides directly', async ({ page }) => {
  await page.goto(consumer)
  await page.getByRole('button', { name: 'Open search' }).click()
  await expect(page.getByRole('option')).toHaveCount(2)
  const dialog = page.locator('dialog')
  const colors: string[] = []
  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((root, value) => {
      root.dataset.theme = value
    }, theme)
    const appearance = await dialog.evaluate((element) => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--color-text)'
      element.append(probe)
      const actual = getComputedStyle(element).color
      const expected = getComputedStyle(probe).color
      probe.remove()
      return { actual, expected }
    })
    expect(appearance.actual).toBe(appearance.expected)
    colors.push(appearance.actual)
  }
  expect(colors[0]).not.toBe(colors[1])
  await page.locator('html').evaluate((root) => {
    root.style.setProperty('--space-component-sm', '20px')
    root.style.setProperty('--radius-modal', '18px')
    root.style.setProperty('--material-regular-background', 'rgb(34, 34, 34)')
  })
  await expect(dialog).toHaveCSS('border-radius', '18px')
  await expect(dialog).toHaveCSS('background-color', 'rgb(34, 34, 34)')
  await expect(page.getByRole('option').first()).toHaveCSS('padding', '20px')
})
