import type { SearchResult } from '@/features/search-palette/types'
import { additionalFixtures } from '@/features/search-palette/mocks/additional-fixtures'

export const mockSearchResults: readonly SearchResult[] = [
  {
    id: 'search-behavior',
    title: 'Search behavior and presentation',
    kind: 'Decision',
    source: 'Workspace',
    location: 'Engineering / Decisions / ADR-0001',
    url: 'https://vuejs.org/guide/reusability/composables.html',
    excerpt: 'Keep query state, selection, and request handling independent of the interface.',
    preview: {
      text: 'A search experience should be easy to reshape.\n\nThe headless composable owns the query, asynchronous requests, and selected result. The interface owns presentation, focus, and keyboard integration.\n\nEach project supplies its own search service and handles opening destinations.',
      updatedAt: '2026-11-03',
    },
  },
  {
    id: 'design',
    title: 'Designing with materials',
    kind: 'Link',
    source: 'Apple Developer',
    location: 'Design / Human Interface Guidelines',
    url: 'https://developer.apple.com/design/human-interface-guidelines/materials',
    excerpt: 'Use materials to establish hierarchy while keeping content legible.',
    preview: {
      text: 'Material study\n\nA mocked page thumbnail illustrates the preview capability. It is a local fixture, not a live capture of the destination.',
      imageUrl: '/search-material-preview.svg',
      imageAlt: 'Illustrative material study with a floating search panel',
    },
  },
  {
    id: 'keyboard',
    title: 'Keyboard interaction checklist',
    kind: 'Document',
    source: 'Workspace',
    location: 'Design / Accessibility',
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    excerpt: 'Focus, active results, composition input, and returning to your previous task.',
    preview: {
      text: 'Keep input focus while navigating results.\n\nArrow keys change the active result. Enter opens it. Escape dismisses search and restores focus. Tab moves between available controls.',
    },
  },
  {
    id: 'no-preview',
    title: 'Component library roadmap',
    kind: 'Document',
    source: 'Workspace',
    location: 'Product / Planning',
    url: 'https://vuejs.org/guide/components/slots.html',
    excerpt: 'A result without a preview, to exercise the fallback state.',
  },
  ...additionalFixtures,
]
