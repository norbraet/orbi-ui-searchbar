const home = {
  title: 'Search Bar Component',
  description: 'A Vue search component with mock data.',
  searchDemo: {
    open: 'Search workspace',
    hint: 'Try “decision”, “design”, “tokens”, or “canary”.',
    catalog: '{count} sample items · {scopes} scopes',
    scenario: 'Scenario',
    default: 'Results and suggestions',
    empty: 'No results',
    error: 'Service unavailable',
    slow: 'Slow response',
    noPreview: 'Missing preview',
    scopes: {
      documents: 'Documents',
      decisions: 'Decisions',
      links: 'Links',
      issues: 'Issues',
      notes: 'Notes',
      'design-files': 'Design files',
    },
  },
  meta: { title: 'Search Bar Component · Orbi Search' },
} as const

export default home
