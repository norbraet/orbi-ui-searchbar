import { test, expect } from '../index'

test.describe('Navigation', () => {
  test('home page loads at root URL', async ({ homePage }) => {
    await expect(homePage.page).toHaveURL('/')
  })

  test('logo returns to the component demo from an unknown route', async ({ notFoundPage }) => {
    await notFoundPage.logo.click()
    await expect(notFoundPage.page).toHaveURL('/')
    await expect(notFoundPage.page.getByRole('heading', { level: 1 })).toHaveText(
      'Search Bar Component'
    )
  })

  test('unknown URL renders the 404 page', async ({ notFoundPage }) => {
    await expect(notFoundPage.errorCode).toContainText('404')
  })
})
