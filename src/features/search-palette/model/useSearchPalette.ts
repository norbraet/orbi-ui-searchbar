import { computed, getCurrentScope, onScopeDispose, reactive, readonly, toValue, watch } from 'vue'
import type {
  SearchResult,
  SearchStatus,
  SearchSuggestion,
  UseSearchPaletteOptions,
} from '@/features/search-palette/types'

export function useSearchPalette(options: UseSearchPaletteOptions) {
  const state = reactive({
    isOpen: false,
    query: '',
    status: 'idle' as SearchStatus,
    results: [] as SearchResult[],
    suggestions: [] as SearchSuggestion[],
    selectedId: null as string | null,
    error: null as unknown,
  })

  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let requestId = 0
  let disposed = false

  const selectedResult = computed(
    () => state.results.find((result) => result.id === state.selectedId) ?? null
  )

  function invalidate() {
    requestId += 1
    clearTimeout(timer)
    timer = undefined
    controller?.abort()
    controller = undefined
  }

  function clearResponse() {
    state.results = []
    state.suggestions = []
    state.selectedId = null
    state.error = null
  }

  async function request(id: number) {
    if (disposed || !state.isOpen || id !== requestId) return

    const activeController = new AbortController()
    controller = activeController
    const query = state.query.trim()

    try {
      const response = await options.search({
        query,
        context: toValue(options.context),
        signal: activeController.signal,
      })

      if (disposed || !state.isOpen || id !== requestId) return

      // Empty input is a suggestions-only state, even if a provider returns items.
      state.results = query ? response.results : []
      state.suggestions = response.suggestions ?? []
      state.selectedId = state.results[0]?.id ?? null
      state.status = 'success'
    } catch (error) {
      if (disposed || !state.isOpen || id !== requestId) return

      state.error = error
      state.status = 'error'
    } finally {
      if (id === requestId) controller = undefined
    }
  }

  function schedule(immediate = false) {
    invalidate()
    clearResponse()

    if (disposed || !state.isOpen) {
      state.status = 'idle'
      return
    }

    state.status = 'loading'
    const id = requestId

    if (immediate) void request(id)
    else timer = setTimeout(() => void request(id), Math.max(0, options.debounceMs ?? 180))
  }

  function open() {
    if (disposed || state.isOpen) return

    state.isOpen = true
    schedule(true)
  }

  function close() {
    invalidate()
    state.isOpen = false
    state.query = ''
    clearResponse()
    state.status = 'idle'
  }

  function setQuery(query: string) {
    if (disposed || query === state.query) return

    state.query = query
    schedule(!query.trim())
  }

  function select(id: string) {
    if (
      state.isOpen &&
      state.status === 'success' &&
      state.results.some((item) => item.id === id)
    ) {
      state.selectedId = id
    }
  }

  function moveSelection(direction: -1 | 1) {
    if (!state.isOpen || state.status !== 'success' || !state.results.length) return

    const current = state.results.findIndex((item) => item.id === state.selectedId)
    const next = Math.max(0, Math.min(state.results.length - 1, current + direction))

    state.selectedId = state.results[next]!.id
  }

  function activate(): SearchResult | null {
    return state.isOpen && state.status === 'success' ? selectedResult.value : null
  }

  function retry() {
    if (state.status === 'error') schedule(true)
  }

  const stopContextWatch = watch(
    () => toValue(options.context),
    () => {
      if (state.isOpen) schedule(true)
    },
    { deep: true, flush: 'sync' }
  )

  function dispose() {
    disposed = true
    stopContextWatch()
    close()
  }

  if (getCurrentScope()) onScopeDispose(dispose)

  return {
    state: readonly(state),
    selectedResult: readonly(selectedResult),
    open,
    close,
    setQuery,
    select,
    moveSelection,
    activate,
    retry,
    dispose,
  }
}
