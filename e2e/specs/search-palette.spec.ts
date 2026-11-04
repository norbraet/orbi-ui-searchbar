import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const consumer = '/e2e/fixtures/search-palette.html'

test('Missing preview keeps normal matches and suggestions while showing preview fallback content', async ({
  page,
}) => {
  await page.goto('/')
  await page.locator('#search-demo-scenario').selectOption('no-preview')
  await page.getByRole('button', { name: /^Search workspace/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Design guidelines' }).click()
  const input = dialog.getByRole('combobox')
  await expect(input).toHaveValue('design')
  await expect(dialog.getByRole('option', { name: /Designing with materials/ })).toBeVisible()
  await expect(
    dialog.getByText('No preview available. Open the result to read more.')
  ).toBeVisible()
  await expect(dialog.locator('.search-palette-thumbnail')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Open result' })).toBeVisible()

  await input.fill('canary')
  await expect(dialog.getByRole('option')).toHaveCount(1)
  await expect(dialog.getByRole('heading', { name: 'Deployment runbook' })).toBeVisible()
  await expect(
    dialog.getByText('No preview available. Open the result to read more.')
  ).toBeVisible()
  await input.press('Escape')

  await page.locator('#search-demo-scenario').selectOption('default')
  await page.getByRole('button', { name: /^Search workspace/ }).click()
  await dialog.getByRole('combobox').fill('canary')
  await expect(dialog.getByText(/Begin with a canary deployment/)).toBeVisible()
  await expect(dialog.getByText('No preview available. Open the result to read more.')).toHaveCount(
    0
  )
})

test('new searches start at the top while keyboard navigation scrolls only the results pane', async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 650 })
  await page.goto('/')
  await page.getByRole('button', { name: /^Search workspace/ }).click()
  const dialog = page.getByRole('dialog')
  const input = dialog.getByRole('combobox')
  const results = dialog.locator('.search-palette-results')
  const preview = dialog.locator('.search-palette-preview')
  await dialog.getByRole('button', { name: 'Architecture decisions' }).waitFor()
  await page.mouse.move(0, 0)
  await input.fill('design')
  await dialog.getByRole('option', { name: /Designing with materials/ }).waitFor()
  await dialog.evaluate((element) =>
    Promise.allSettled(
      element.getAnimations({ subtree: true }).map((animation) => animation.finished)
    )
  )
  expect(await results.evaluate((element) => element.scrollTop)).toBe(0)
  expect(await preview.evaluate((element) => element.scrollTop)).toBe(0)
  await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')

  const count = await dialog.getByRole('option').count()
  for (let index = 1; index < count; index += 1) await input.press('ArrowDown')
  await expect(dialog.getByRole('option').last()).toHaveAttribute('aria-selected', 'true')
  expect(await results.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  const bounds = await results.evaluate((element) => {
    const selected = element.querySelector('[aria-selected="true"]')!.getBoundingClientRect()
    const pane = element.getBoundingClientRect()
    return { top: selected.top - pane.top, bottom: pane.bottom - selected.bottom }
  })
  expect(bounds.top).toBeGreaterThanOrEqual(0)
  expect(bounds.bottom).toBeGreaterThanOrEqual(0)
  expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0)
  await expect(input).toBeFocused()

  for (let index = 1; index < count; index += 1) await input.press('ArrowUp')
  expect(await results.evaluate((element) => element.scrollTop)).toBe(0)
  await results.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await preview.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await input.fill('search')
  await dialog.getByRole('option', { name: /Search behavior and presentation/ }).waitFor()
  await dialog.evaluate((element) =>
    Promise.allSettled(
      element.getAnimations({ subtree: true }).map((animation) => animation.finished)
    )
  )
  expect(await results.evaluate((element) => element.scrollTop)).toBe(0)
  expect(await preview.evaluate((element) => element.scrollTop)).toBe(0)
})

test('height grows for results and shrinks for empty states without moving the input', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Search workspace/ }).click()
  const dialog = page.getByRole('dialog')
  const input = dialog.getByRole('combobox')
  const body = dialog.locator('.search-palette-body')
  await dialog.getByRole('button', { name: 'Architecture decisions' }).waitFor()
  await dialog.evaluate((element) =>
    Promise.allSettled(
      element.getAnimations({ subtree: true }).map((animation) => animation.finished)
    )
  )
  const compact = (await body.boundingBox())!.height
  const inputY = (await input.boundingBox())!.y

  await input.fill('decision')
  await dialog.getByRole('option', { name: /Design token governance/ }).waitFor()
  await expect.poll(async () => (await body.boundingBox())!.height).toBeGreaterThan(compact + 80)
  expect(Math.abs((await input.boundingBox())!.y - inputY)).toBeLessThan(1)

  await input.fill('qzx-unmatched-7391')
  await dialog.getByText('No results. Try another query or broaden your search.').waitFor()
  await expect.poll(async () => (await body.boundingBox())!.height).toBeLessThan(compact + 80)
  await expect(dialog.locator('.search-palette-preview')).toHaveCount(0)
  expect(Math.abs((await input.boundingBox())!.y - inputY)).toBeLessThan(1)

  await input.fill('')
  await dialog.getByRole('button', { name: 'Architecture decisions' }).waitFor()
  await expect.poll(async () => (await body.boundingBox())!.height).toBeLessThanOrEqual(compact + 1)
  await expect(input).toBeFocused()

  await page.setViewportSize({ width: 375, height: 667 })
  await input.fill('decision')
  await dialog.getByRole('option', { name: /Design token governance/ }).waitFor()
  const bounds = (await dialog.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(375)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(667)
})

test('blank input shows only suggestions even when the provider returns context items', async ({
  page,
}) => {
  await page.goto(consumer)
  await page.getByRole('button', { name: 'Open search' }).click()
  const dialog = page.getByRole('dialog')
  const input = dialog.getByRole('combobox')
  await expect(dialog.getByRole('button', { name: 'Try design' })).toBeVisible()
  await expect(dialog.getByRole('option')).toHaveCount(0)
  await expect(dialog.locator('.search-palette-preview')).toHaveCount(0)
  await expect(
    dialog.getByText('No results. Try another query or broaden your search.')
  ).toHaveCount(0)
  await expect(dialog.getByRole('status')).toHaveText('')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(dialog).toBeVisible()
  await expect(page.locator('#activation')).toHaveText('')

  await input.fill('document')
  await expect(dialog.getByRole('option')).toHaveCount(2)
  await input.fill('   ')
  await expect(dialog.getByRole('button', { name: 'Try design' })).toBeVisible()
  await expect(dialog.getByRole('option')).toHaveCount(0)
  await expect(dialog.locator('.search-palette-preview')).toHaveCount(0)
  await expect(dialog.getByRole('status')).toHaveText('')
})

test('demo searches the larger catalog and recovers from no matches', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Search workspace/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Search your workspace' })
  const input = dialog.getByRole('combobox')
  await expect(dialog.getByRole('button', { name: 'Architecture decisions' })).toBeVisible()
  await expect(dialog.getByRole('option')).toHaveCount(0)
  await expect(dialog.locator('.search-palette-preview')).toHaveCount(0)
  await expect(
    dialog.getByText('No results. Try another query or broaden your search.')
  ).toHaveCount(0)

  await input.fill('Decision')
  await expect(dialog.getByRole('option', { name: /Design token governance/ })).toBeVisible()
  await expect(dialog.getByRole('option', { name: /Designing with materials/ })).toHaveCount(0)

  await input.fill('Release checklist')
  await expect(dialog.getByRole('option')).toHaveCount(1)
  await expect(dialog.getByRole('option', { name: /Release checklist/ })).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Release checklist' })).toBeVisible()

  await input.fill('qzx-unmatched-7391')
  await expect(
    dialog.getByText('No results. Try another query or broaden your search.')
  ).toBeVisible()
  await expect(dialog.getByRole('option')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Open result' })).toHaveCount(0)

  await dialog.getByRole('button', { name: 'Architecture decisions' }).click()
  await expect(input).toHaveValue('decision')
  await expect(dialog.getByRole('option', { name: /Design token governance/ })).toBeVisible()
  await input.fill('')
  await expect(dialog.getByRole('button', { name: 'Architecture decisions' })).toBeVisible()
  await expect(dialog.getByRole('option')).toHaveCount(0)
  await expect(dialog.locator('.search-palette-preview')).toHaveCount(0)
  await input.press('Enter')
  await expect(dialog).toBeVisible()
})

test('works without app providers: keyboard preview, focus containment, activation, and restoration', async ({
  page,
}) => {
  await page.goto(consumer)
  const trigger = page.getByRole('button', { name: 'Open search' })
  await trigger.click()
  const input = page.getByRole('combobox', { name: 'Search', exact: true })
  const dialog = page.getByRole('dialog', { name: 'Search your workspace' })
  await expect(input).toBeFocused()
  await input.fill('document')
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
  await expect(page.getByRole('option')).toHaveCount(0)
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
  await input.fill('document')
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
  await page.getByRole('combobox').fill('missing')
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
  await page.getByRole('button', { name: 'Try design' }).waitFor()
  await page.getByRole('combobox').fill('document')
  await expect(
    page.getByText('Search is unavailable. Please try again.', { exact: true }).first()
  ).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('option')).toHaveCount(2)
  await expect(page.locator('#calls')).toHaveText('3')
})

test('broken preview images fall back and layout fits a small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto(`${consumer}?scenario=broken-image`)
  await page.getByRole('button', { name: 'Open search' }).click()
  await page.getByRole('combobox').fill('document')
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
  await page.getByRole('combobox').fill('document')
  await expect(page.getByRole('option')).toHaveCount(2)
  // Measure final colors rather than a partially transparent entrance frame.
  await page
    .locator('dialog')
    .evaluate((element) =>
      Promise.allSettled(
        element.getAnimations({ subtree: true }).map((animation) => animation.finished)
      )
    )
  const { violations } = await new AxeBuilder({ page }).include('dialog').analyze()
  expect(violations).toEqual([])
  await page.getByRole('combobox').press('Escape')
  await expect(page.getByRole('button', { name: 'Open search' })).toBeFocused()
})

test('keeps exit content stable and can reopen before the exit finishes', async ({ page }) => {
  await page.goto(consumer)
  await page.getByRole('button', { name: 'Open search' }).click()
  await page.getByRole('combobox').fill('document')
  await expect(page.getByRole('option')).toHaveCount(2)
  const dialog = page.locator('dialog')
  await dialog.evaluate((element) => element.style.setProperty('--motion-fast', '1000ms'))
  await page.getByRole('combobox').press('Escape')
  await expect(dialog).toHaveAttribute('data-phase', 'closing')
  expect(await dialog.evaluate((element: HTMLDialogElement) => element.open)).toBe(true)
  await expect(dialog.locator('[role="option"]')).toHaveCount(2)
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('combobox')).toBeFocused()
  await expect(page.getByRole('button', { name: 'Try design' })).toBeVisible()
  await expect(page.getByRole('option')).toHaveCount(0)
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
  await page.getByRole('combobox').fill('document')
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
  await page.getByRole('combobox').fill('document')
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
