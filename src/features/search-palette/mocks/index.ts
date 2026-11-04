import type { SearchResult, SearchService, SearchSuggestion } from '@/features/search-palette/types'
import { mockSearchResults } from '@/features/search-palette/mocks/fixtures'

export type MockScenario = 'default' | 'empty' | 'error' | 'slow' | 'no-preview'

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
  return ({ query, signal }) =>
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
          const results =
            scenario === 'empty' || !terms.length
              ? []
              : mockSearchResults.filter((result) => matches(searchableText(result)))
          const relatedSuggestions = terms.length
            ? suggestions.filter(
                (suggestion) =>
                  normalize(suggestion.query) !== terms.join(' ') &&
                  matches(suggestion.label + ' ' + suggestion.query)
              )
            : suggestions
          resolve({
            results: results.map(({ preview, ...result }) =>
              preview && scenario !== 'no-preview' ? { ...result, preview: { ...preview } } : result
            ),
            // Recovery suggestions are separate from results; never substitute unrelated matches.
            suggestions: (results.length || relatedSuggestions.length
              ? relatedSuggestions
              : suggestions.slice(0, 4)
            ).map((suggestion) => ({ ...suggestion })),
          })
        },
        scenario === 'slow' ? 1800 : 240
      )
      signal.addEventListener('abort', abort, { once: true })
    })
}
