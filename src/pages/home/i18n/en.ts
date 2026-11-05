const home = {
  title: 'Vue 3 + TypeScript Template',
  subtitle: 'A minimal, opinionated starting point for Vue 3 projects using Feature Sliced Design.',
  viewGuide: 'View Guide',
  stackTitle: "What's included",
  searchDemo: {
    title: 'Find your next thought.',
    description:
      'Try “decision”, “design”, “tokens”, or “deployment”, or choose a scenario to explore empty and error states.',
    open: 'Search workspace',
    scenario: 'Demo scenario',
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
  meta: {
    title: 'Home',
  },
} as const

export default home
