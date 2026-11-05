// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useSearchPalette } from './useSearchPalette'
import type { SearchResponse, SearchResult, SearchService } from '../types'

const item: SearchResult = {
  id: 'a',
  title: 'Design guide',
  kind: 'Document',
  source: 'Docs',
  location: 'Guide',
  url: '/a',
}
const definitions = [
  { id: 'documents', label: 'Documents' },
  { id: 'decisions', label: 'Decisions' },
]

describe('search scopes without rendering', () => {
  let scope = effectScope()
  beforeEach(() => {
    scope = effectScope()
    vi.useFakeTimers()
  })
  afterEach(() => {
    scope.stop()
    vi.useRealTimers()
  })
  const create = (search: SearchService) => {
    const scopes = ref(definitions.map((definition) => ({ ...definition })))
    const context = ref({ workspace: 'one' })
    const model = scope.run(() => useSearchPalette({ search, scopes, context, debounceMs: 100 }))!
    model.setQuery('design')
    return { model, scopes, context }
  }

  it('accepts configured scopes, skips redundant/unknown choices, and resets on toggle', async () => {
    const search = vi.fn<SearchService>().mockResolvedValue({ results: [item] })
    const { model } = create(search)
    model.open()
    await nextTick()
    model.setScope('unknown')
    expect(model.state.scopeId).toBeNull()
    expect(search).toHaveBeenCalledTimes(1)
    model.setScope('documents')
    expect(search).toHaveBeenCalledTimes(2)
    expect(search.mock.calls[0]![0].signal.aborted).toBe(false)
    model.setScope('documents')
    expect(search).toHaveBeenCalledTimes(2)
    expect(search.mock.calls[1]![0]).toMatchObject({ query: 'design', scopeId: 'documents' })
    model.toggleScope('documents')
    expect(model.state.scopeId).toBeNull()
    expect(search.mock.calls[2]![0].scopeId).toBeUndefined()
  })

  it('searches immediately with the latest query and invalidates actionable results', async () => {
    const search = vi.fn<SearchService>().mockResolvedValue({ results: [item] })
    const { model } = create(search)
    model.open()
    await nextTick()
    model.setQuery('new query')
    model.setScope('decisions')
    expect(model.state.query).toBe('new query')
    expect(model.state.results).toEqual([])
    expect(model.activate()).toBeNull()
    expect(search.mock.calls[1]![0]).toMatchObject({ query: 'new query', scopeId: 'decisions' })
    await vi.runAllTimersAsync()
    expect(search).toHaveBeenCalledTimes(2)
    // Matching and ordering belong to the service, even if its kind differs from the scope label.
    expect(model.state.results).toEqual([item])
  })

  it.each(['resolve', 'reject'] as const)(
    'ignores obsolete scope request %s and aborts its signal',
    async (finish) => {
      let resolve!: (response: SearchResponse) => void
      let reject!: (error: Error) => void
      const pending = new Promise<SearchResponse>((yes, no) => {
        resolve = yes
        reject = no
      })
      const search = vi
        .fn<SearchService>()
        .mockReturnValueOnce(pending)
        .mockResolvedValue({ results: [], scopeCounts: { documents: 0, decisions: 3 } })
      const { model } = create(search)
      model.open()
      model.setScope('decisions')
      expect(search.mock.calls[0]![0].signal.aborted).toBe(true)
      await nextTick()
      if (finish === 'resolve') resolve({ results: [item], scopeCounts: { documents: 99 } })
      else reject(new Error('Obsolete failure'))
      await nextTick()
      expect(model.state.status).toBe('success')
      expect(model.state.results).toEqual([])
      expect(model.state.scopeCounts).toEqual({ documents: 0, decisions: 3 })
      expect(model.state.scopeId).toBe('decisions')
    }
  )

  it('preserves scope on clearing input but ignores blank-query items and counts', async () => {
    const search = vi.fn<SearchService>().mockResolvedValue({
      results: [item],
      scopeCounts: { documents: 5 },
      suggestions: [{ id: 's', label: 'Try design', query: 'design' }],
    })
    const { model } = create(search)
    model.setScope('documents')
    expect(search).not.toHaveBeenCalled()
    model.open()
    await nextTick()
    model.setQuery(' ')
    await nextTick()
    expect(model.state.scopeId).toBe('documents')
    expect(model.state.results).toEqual([])
    expect(model.state.scopeCounts).toEqual({})
    expect(model.state.suggestions).toHaveLength(1)
    model.close()
    model.open()
    expect(model.state.scopeId).toBeNull()
    expect(search.mock.calls[search.mock.calls.length - 1]![0].scopeId).toBeUndefined()
  })

  it('refreshes a removed active scope but not a relabelled scope', async () => {
    const search = vi.fn<SearchService>().mockResolvedValue({ results: [item] })
    const { model, scopes } = create(search)
    model.open()
    model.setScope('documents')
    await nextTick()
    scopes.value[0]!.label = 'Dokumente'
    await nextTick()
    expect(search).toHaveBeenCalledTimes(2)
    scopes.value = []
    expect(model.state.scopeId).toBeNull()
    expect(search).toHaveBeenCalledTimes(3)
    expect(model.state.results).toEqual([])
  })

  it('keeps scope for context refresh and error retries, and cleans up on disposal', async () => {
    const search = vi.fn<SearchService>().mockRejectedValue(new Error('Offline'))
    const { model, context, scopes } = create(search)
    model.setScope('documents')
    model.open()
    await nextTick()
    model.retry()
    expect(search.mock.calls[1]![0].scopeId).toBe('documents')
    context.value = { workspace: 'two' }
    expect(search.mock.calls[2]![0]).toMatchObject({
      scopeId: 'documents',
      context: { workspace: 'two' },
    })
    model.dispose()
    scopes.value = []
    model.setScope('decisions')
    expect(model.state.scopeId).toBeNull()
    expect(search).toHaveBeenCalledTimes(3)
  })
})
