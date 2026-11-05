import type {
  SearchResult,
  SearchScope,
  SearchService,
  SearchSuggestion,
} from '@/features/search-palette/types'
import { mockSearchResults } from '@/features/search-palette/mocks/fixtures'
export { mockSearchResults } from '@/features/search-palette/mocks/fixtures'

export type MockScenario = 'default' | 'empty' | 'error' | 'slow' | 'no-preview'

const scopeDefinitions = [
  { id: 'documents', label: 'Documents', kind: 'Document' },
  { id: 'decisions', label: 'Decisions', kind: 'Decision' },
  { id: 'links', label: 'Links', kind: 'Link' },
  { id: 'issues', label: 'Issues', kind: 'Issue' },
  { id: 'notes', label: 'Notes', kind: 'Note' },
  { id: 'design-files', label: 'Design files', kind: 'Design file' },
]

export const mockSearchScopes: readonly SearchScope[] = scopeDefinitions.map(({ id, label }) => ({
  id,
  label,
}))

const suggestions: SearchSuggestion[] = [
  { id: 'suggest-decision', label: 'Architecture decisions', query: 'decision' },
  { id: 'suggest-design', label: 'Design guidelines', query: 'design' },
  { id: 'suggest-keyboard', label: 'Keyboard interaction', query: 'keyboard' },
  { id: 'suggest-tokens', label: 'Shared tokens', query: 'tokens' },
  { id: 'suggest-deployment', label: 'Deployment guides', query: 'deployment' },
]

function normalize(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function searchableText(result: SearchResult): string {
  return [
    result.title,
    result.kind,
    result.source,
    result.location,
    result.excerpt,
    result.preview?.text,
    result.url,
  ]
    .filter(Boolean)
    .join(' ')
}

/** Demo-only fixture matching behind the service boundary; no production index or ranking. */
export function createMockSearchService(scenario: MockScenario = 'default'): SearchService {
  return ({ query, scopeId, signal }) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason)
        return
      }
      const abort = () => {
        clearTimeout(timer)
        reject(signal.reason)
      }
      const timer = setTimeout(
        () => {
          signal.removeEventListener('abort', abort)
          if (scenario === 'error') {
            reject(new Error('Mock service unavailable'))
            return
          }
          const terms = normalize(query).split(/\s+/u).filter(Boolean)
          const matches = (text: string) => {
            const normalized = normalize(text)
            return terms.every((term) => normalized.includes(term))
          }
          const matchingResults =
            scenario === 'empty' || !terms.length
              ? []
              : mockSearchResults.filter((result) => matches(searchableText(result)))
          const scopeKind = scopeDefinitions.find((scope) => scope.id === scopeId)?.kind
          const inScope = (result: SearchResult) =>
            scopeId === undefined || result.kind === scopeKind
          const results = matchingResults.filter(inScope)
          const candidates = mockSearchResults.filter(inScope)
          const scopedSuggestions = suggestions.filter((suggestion) => {
            const term = normalize(suggestion.query)
            return candidates.some((result) => normalize(searchableText(result)).includes(term))
          })
          const relatedSuggestions = terms.length
            ? scopedSuggestions.filter(
                (suggestion) =>
                  normalize(suggestion.query) !== terms.join(' ') &&
                  matches(suggestion.label + ' ' + suggestion.query)
              )
            : scopedSuggestions
          resolve({
            scopeCounts: terms.length
              ? Object.fromEntries(
                  scopeDefinitions.map((scope) => [
                    scope.id,
                    matchingResults.filter((result) => result.kind === scope.kind).length,
                  ])
                )
              : undefined,
            results: results.map(({ preview, ...result }) =>
              preview && scenario !== 'no-preview' ? { ...result, preview: { ...preview } } : result
            ),
            // Recovery suggestions are separate from results; never substitute unrelated matches.
            suggestions: (results.length || relatedSuggestions.length
              ? relatedSuggestions
              : scopedSuggestions.slice(0, 4)
            ).map((suggestion) => ({ ...suggestion })),
          })
        },
        scenario === 'slow' ? 1800 : 240
      )
      signal.addEventListener('abort', abort, { once: true })
    })
}
