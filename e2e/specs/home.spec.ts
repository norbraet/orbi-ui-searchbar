import { test, expect } from '../index'
import { checkA11y } from '../a11y/checkA11y'

test.describe('Search playground', () => {
  test('has accessible content and project branding', async ({ homePage }) => {
    await checkA11y(homePage.page)
    await expect(homePage.page).toHaveTitle('Search Bar Component · Orbi Search')
    await expect(homePage.logo).toHaveText('Orbi Search')
    await expect(homePage.heading).toContainText('Search Bar Component')
  })

  test('appearance control updates the shared theme', async ({ homePage }) => {
    await homePage.appearanceSelect.click()
    await homePage.page.getByRole('option', { name: 'Dark', exact: true }).click()
    await expect(homePage.page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect.poll(() => homePage.page.evaluate(() => document.getAnimations().length)).toBe(0)
    await checkA11y(homePage.page)
    await homePage.page.reload()
    await expect(homePage.appearanceSelect).toHaveAccessibleName('Appearance: Dark')
  })

  test('the launcher opens the real search component and returns focus', async ({ homePage }) => {
    const launcher = homePage.page.getByRole('button', { name: 'Search workspace', exact: true })
    await launcher.click()
    const input = homePage.page.getByRole('combobox', { name: 'Search', exact: true })
    await expect(input).toBeFocused()
    await input.fill('canary')
    await expect(homePage.page.getByRole('dialog').getByRole('option')).toHaveCount(1)
    await expect(homePage.page.getByRole('heading', { name: 'Deployment runbook' })).toBeVisible()
    await input.press('Escape')
    await expect(launcher).toBeFocused()
  })

  test('language changes update the playground and search controls together', async ({
    homePage,
  }) => {
    await homePage.page.getByRole('button', { name: /^Language selector:/ }).click()
    await homePage.page.getByRole('option', { name: /Deutsch/ }).click()
    await expect(homePage.page.locator('html')).toHaveAttribute('lang', 'de')
    await expect(homePage.heading).toContainText('Suchleisten-Komponente')
    await homePage.page
      .getByRole('button', { name: 'Arbeitsbereich durchsuchen', exact: true })
      .click()
    await expect(homePage.page.getByRole('group', { name: 'Suchbereich' })).toBeVisible()
    await expect(
      homePage.page.getByRole('button', { name: 'Dokumente', exact: true })
    ).toBeVisible()
  })

  test('narrow layouts and enlarged text do not overflow the page', async ({ homePage }) => {
    await homePage.page.setViewportSize({ width: 320, height: 700 })
    for (const fontSize of ['16px', '32px']) {
      await homePage.page.locator('html').evaluate((el, size) => {
        el.style.fontSize = size
      }, fontSize)
      await expect
        .poll(() =>
          homePage.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
        )
        .toBe(true)
      await expect(
        homePage.page.getByRole('button', { name: 'Search workspace', exact: true })
      ).toBeVisible()
    }
  })
})

test('shared dropdowns support keyboard selection, dismissal, and exclusive opening', async ({
  homePage,
}) => {
  const page = homePage.page
  const theme = homePage.appearanceSelect
  const language = page.getByRole('button', { name: /^Language selector:/ })
  await theme.focus()
  await theme.press('ArrowDown')
  const themes = page.getByRole('listbox', { name: 'Appearance', exact: true })
  await expect(themes.getByRole('option', { name: 'System', exact: true })).toBeFocused()
  await page.keyboard.press('End')
  await expect(themes.getByRole('option', { name: 'Dark', exact: true })).toBeFocused()
  await page.keyboard.press('Home')
  await page.keyboard.press('l')
  await expect(themes.getByRole('option', { name: 'Light', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(theme).toBeFocused()
  await theme.click()
  await themes.evaluate((element) =>
    Promise.allSettled(
      element.getAnimations({ subtree: true }).map((animation) => animation.finished)
    )
  )
  await checkA11y(page)
  await language.click()
  await expect(themes).toHaveCount(0)
  const languages = page.getByRole('listbox', { name: 'Language selector', exact: true })
  await expect(languages.getByRole('option', { name: /English/ })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(languages.getByRole('option', { name: /Deutsch/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(language).toBeFocused()
  await expect(language).toHaveAccessibleName('Language selector: English')
  await language.click()
  await page.keyboard.press('Tab')
  await expect(languages).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Search workspace', exact: true })).toBeFocused()
  await language.click()
  await page.keyboard.press('Shift+Tab')
  await expect(theme).toBeFocused()
  await expect(languages).toHaveCount(0)
  await theme.click()
  await page.getByText('32 sample items · 6 scopes', { exact: true }).click()
  await expect(themes).toHaveCount(0)
})

test('theme colors settle together without inherited text trailing behind', async ({
  homePage,
}) => {
  const page = homePage.page
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const result = await page.evaluate(async () => {
    document.documentElement.dataset.theme = 'light'
    void getComputedStyle(document.body).backgroundColor
    await Promise.allSettled(document.getAnimations().map((animation) => animation.finished))
    const heading = document.querySelector('h1')!
    const initial = getComputedStyle(heading).color
    document.documentElement.dataset.theme = 'dark'
    const animations = document.getAnimations()
    await Promise.all(animations.map((animation) => animation.ready))
    for (const animation of animations) {
      animation.pause()
      animation.currentTime = Number(animation.effect!.getTiming().duration) / 2
    }
    const midpoint = {
      heading: getComputedStyle(heading).color,
      scenario: getComputedStyle(document.querySelector('.scenario-label')!).color,
      shortcut: getComputedStyle(document.querySelector('.shortcut')!).color,
      keys: getComputedStyle(document.querySelector('kbd')!).color,
    }
    for (const animation of animations) animation.finish()
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return { initial, midpoint, trailing: document.getAnimations().length }
  })
  expect(result.midpoint.heading).not.toBe(result.initial)
  expect(result.midpoint.heading).toBe(result.midpoint.scenario)
  expect(result.midpoint.keys).toBe(result.midpoint.shortcut)
  expect(result.trailing).toBe(0)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const transitions = await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light'
    return document.getAnimations().length
  })
  expect(transitions).toBe(0)
})
