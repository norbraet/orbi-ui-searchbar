export interface MessageSchema {
  common: {
    appName: string
    skipToContent: string
    appearance: string
  }
  home: {
    title: string
    description: string
    searchDemo: {
      open: string
      hint: string
      catalog: string
      scenario: string
      default: string
      empty: string
      error: string
      slow: string
      noPreview: string
      scopes: {
        documents: string
        decisions: string
        links: string
        issues: string
        notes: string
        'design-files': string
      }
    }
    meta: { title: string }
  }
  notFound: {
    title: string
    description: string
    goHome: string
    goBack: string
    meta: { title: string }
  }
  theme: {
    currentLabel: string
    switchedTo: string
    options: { light: string; dark: string; system: string }
  }
  notifications: { close: string }
  languageSelector: { ariaLabel: string; openMenu: string; closeMenu: string }
}
