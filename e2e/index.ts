import { test as base } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

type E2EFixtures = {
  homePage: HomePage
  notFoundPage: NotFoundPage
}

export const test = base.extend<E2EFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page)
    await homePage.goto()
    await use(homePage)
  },
  notFoundPage: async ({ page }, use) => {
    const notFoundPage = new NotFoundPage(page)
    await notFoundPage.goto()
    await use(notFoundPage)
  },
})

export { expect } from '@playwright/test'
