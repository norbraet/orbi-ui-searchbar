import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

export abstract class AppPage extends BasePage {
  readonly logo: Locator
  readonly langueageSelector: Locator

  constructor(page: Page) {
    super(page)
    this.logo = page.locator('a.logo')
    this.langueageSelector = page.locator('.selector-trigger')
  }
}
