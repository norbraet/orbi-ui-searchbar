import type { SearchPaletteLabels } from '@/features/search-palette/types'

export const searchPaletteLabels: SearchPaletteLabels = {
  title: 'Search your workspace',
  search: 'Search',
  placeholder: 'Search documents, links, and decisions…',
  close: 'Close search',
  results: 'Search results',
  suggestions: 'Try searching for',
  loading: 'Searching…',
  empty: 'No results. Try another query or broaden your search.',
  error: 'Search is unavailable. Please try again.',
  retry: 'Try again',
  preview: 'Preview',
  noPreview: 'No preview available. Open the result to read more.',
  openResult: 'Open result',
  navigationHint: '↑ ↓ to navigate · Enter to open · Esc to close',
  updated: 'Updated',
  resultCount: (count) => `${count} ${count === 1 ? 'result' : 'results'}`,
}
