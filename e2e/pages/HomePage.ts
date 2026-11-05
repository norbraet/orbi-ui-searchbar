import type { Locator, Page } from '@playwright/test'
import { AppPage } from './AppPage'

export class HomePage extends AppPage {
  readonly heading: Locator
  readonly appearanceSelect: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { level: 1 })
    this.appearanceSelect = page.getByRole('button', { name: /^Appearance:/ })
  }

  async goto(): Promise<void> {
    await this.page.goto('/')
  }
}
