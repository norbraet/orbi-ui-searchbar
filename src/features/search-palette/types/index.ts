import type { MaybeRefOrGetter } from 'vue'

export interface SearchResult {
  id: string
  title: string
  url: string
  kind: string
  source: string
  location: string
  excerpt?: string
  preview?: {
    text?: string
    imageUrl?: string
    imageAlt?: string
    updatedAt?: string
  }
}

export interface SearchSuggestion {
  id: string
  label: string
  query: string
}

export type SearchContext = Readonly<Record<string, unknown>>

export interface SearchRequest {
  query: string
  context?: SearchContext
  signal: AbortSignal
}

export interface SearchResponse {
  results: SearchResult[]
  suggestions?: SearchSuggestion[]
}

export type SearchService = (request: SearchRequest) => Promise<SearchResponse>
export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface SearchPaletteLabels {
  title: string
  search: string
  placeholder: string
  close: string
  results: string
  suggestions: string
  loading: string
  empty: string
  error: string
  retry: string
  preview: string
  noPreview: string
  openResult: string
  navigationHint: string
  updated: string
  resultCount: (count: number) => string
}

export interface UseSearchPaletteOptions {
  search: SearchService
  context?: MaybeRefOrGetter<SearchContext | undefined>
  debounceMs?: number
}
