// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useSearchPalette } from './useSearchPalette'
import type { SearchResponse, SearchResult, SearchService } from '@/features/search-palette/types'

const first: SearchResult = {
  id: 'a',
  title: 'Alpha',
  kind: 'Document',
  source: 'Docs',
  location: 'Guide',
  url: '/a',
}
const second: SearchResult = { ...first, id: 'b', title: 'Beta', url: '/b' }
function deferred() {
  let resolve!: (value: SearchResponse) => void
  let reject!: (error: Error) => void
  const promise = new Promise<SearchResponse>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

describe('useSearchPalette (without rendering)', () => {
  let scope = effectScope()
  const create = (
    search: SearchService,
    context?: ReturnType<typeof ref<Record<string, unknown>>>,
    query = 'example'
  ) => {
    const model = scope.run(() => useSearchPalette({ search, context, debounceMs: 100 }))!
    model.setQuery(query)
    return model
  }

  beforeEach(() => {
    scope = effectScope()
    vi.useFakeTimers()
  })
  afterEach(() => {
    scope.stop()
    vi.useRealTimers()
  })

  it('loads initial suggestions and preserves backend ordering', async () => {
    const search = vi.fn<SearchService>().mockResolvedValue({
      results: [second, first],
      suggestions: [{ id: 's', label: 'Try Alpha', query: 'alpha' }],
    })
    const model = create(search)
    expect(search).not.toHaveBeenCalled()
    expect(model.activate()).toBeNull()
    model.open()
    await nextTick()
    expect(search.mock.calls[0]![0].query).toBe('example')
    expect(model.state.results.map((x) => x.id)).toEqual(['b', 'a'])
    expect(model.selectedResult.value?.id).toBe('b')
    expect(model.state.suggestions[0]?.query).toBe('alpha')
  })

  it.each(['', '  \t  '])(
    'ignores provider results for blank input %j while keeping suggestions',
    async (query) => {
      const model = create(
        async () => ({
          results: [first],
          suggestions: [{ id: 's', label: 'Try Alpha', query: 'alpha' }],
        }),
        undefined,
        query
      )
      model.open()
      await nextTick()
      expect(model.state.status).toBe('success')
      expect(model.state.results).toEqual([])
      expect(model.state.suggestions[0]?.query).toBe('alpha')
      expect(model.selectedResult.value).toBeNull()
      expect(model.activate()).toBeNull()
    }
  )

  it('clearing the query removes results and restores suggestions immediately without a debounce', async () => {
    const model = create(async () => ({
      results: [first],
      suggestions: [{ id: 's', label: 'Try Alpha', query: 'alpha' }],
    }))
    model.open()
    await nextTick()
    expect(model.activate()?.id).toBe('a')
    model.setQuery(' ')
    expect(model.activate()).toBeNull()
    await nextTick()
    expect(model.state.results).toEqual([])
    expect(model.state.suggestions[0]?.query).toBe('alpha')
  })

  it('debounces typing and clears stale actionable results immediately', async () => {
    const search = vi.fn<SearchService>().mockResolvedValue({ results: [first] })
    const model = create(search)
    model.open()
    await nextTick()
    model.setQuery('a')
    model.setQuery('alpha ')
    expect(model.activate()).toBeNull()
    expect(model.state.results).toEqual([])
    await vi.advanceTimersByTimeAsync(99)
    expect(search).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(search).toHaveBeenCalledTimes(2)
    expect(search.mock.calls[1]![0].query).toBe('alpha')
  })

  it.each(['resolve', 'reject'] as const)(
    'ignores superseded request %s even if cancellation is ignored',
    async (finish) => {
      const old = deferred()
      const latest = deferred()
      const search = vi
        .fn<SearchService>()
        .mockReturnValueOnce(old.promise)
        .mockReturnValueOnce(latest.promise)
      const model = create(search)
      model.open()
      model.setQuery('new')
      expect(search.mock.calls[0]![0].signal.aborted).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      latest.resolve({ results: [second] })
      await nextTick()
      if (finish === 'resolve') old.resolve({ results: [first] })
      else old.reject(new Error('Old request failed'))
      await nextTick()
      expect(model.state.status).toBe('success')
      expect(model.selectedResult.value?.id).toBe('b')
      expect(model.state.error).toBeNull()
    }
  )

  it('keeps loading until the latest request finishes', async () => {
    const old = deferred()
    const latest = deferred()
    const model = create(
      vi.fn<SearchService>().mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    )
    model.open()
    model.setQuery('new')
    await vi.advanceTimersByTimeAsync(100)
    old.resolve({ results: [first] })
    await nextTick()
    expect(model.state.status).toBe('loading')
    latest.resolve({ results: [second] })
    await nextTick()
    expect(model.state.status).toBe('success')
  })

  it('clamps selection and returns activation intent without navigating', async () => {
    const model = create(async () => ({ results: [first, second] }))
    model.open()
    await nextTick()
    model.moveSelection(-1)
    expect(model.activate()?.id).toBe('a')
    model.moveSelection(1)
    model.moveSelection(1)
    expect(model.activate()?.id).toBe('b')
    model.select('missing')
    expect(model.activate()?.id).toBe('b')
    model.select('a')
    expect(model.selectedResult.value?.id).toBe('a')
  })

  it('supports empty results without a selected preview or activation', async () => {
    const model = create(async () => ({ results: [] }))
    model.open()
    await nextTick()
    model.moveSelection(1)
    expect(model.state.status).toBe('success')
    expect(model.selectedResult.value).toBeNull()
    expect(model.activate()).toBeNull()
  })

  it('retries a failed request with the same context', async () => {
    const context = ref({ workspace: 'demo' })
    const search = vi
      .fn<SearchService>()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce({ results: [first] })
    const model = create(search, context)
    model.open()
    await nextTick()
    expect(model.state.status).toBe('error')
    model.retry()
    await nextTick()
    expect(search.mock.calls[1]![0].context).toEqual({ workspace: 'demo' })
    expect(model.activate()?.id).toBe('a')
  })

  it('invalidates pending responses and scheduled work on close and reopen', async () => {
    const old = deferred()
    const search = vi
      .fn<SearchService>()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValue({ results: [second] })
    const model = create(search)
    model.open()
    model.setQuery('later')
    model.close()
    await vi.advanceTimersByTimeAsync(200)
    expect(search).toHaveBeenCalledTimes(1)
    model.open()
    await nextTick()
    old.resolve({ results: [first] })
    await nextTick()
    expect(model.state.query).toBe('')
    expect(model.activate()).toBeNull()
    model.setQuery('second')
    await vi.advanceTimersByTimeAsync(100)
    expect(model.activate()?.id).toBe('b')
  })

  it('refreshes when supplied context changes', async () => {
    const context = ref({ workspace: 'one' })
    const search = vi.fn<SearchService>().mockResolvedValue({ results: [first] })
    const model = create(search, context)
    model.open()
    await nextTick()
    context.value = { workspace: 'two' }
    await nextTick()
    expect(search).toHaveBeenCalledTimes(2)
    expect(search.mock.calls[1]![0].context).toEqual({ workspace: 'two' })
  })

  it('disposes work with its scope and cannot reopen after disposal', async () => {
    const pending = deferred()
    const search = vi.fn<SearchService>().mockReturnValue(pending.promise)
    const model = create(search)
    model.open()
    scope.stop()
    expect(search.mock.calls[0]![0].signal.aborted).toBe(true)
    pending.resolve({ results: [first] })
    await nextTick()
    model.open()
    expect(model.state.isOpen).toBe(false)
    expect(model.state.results).toEqual([])
  })

  it('isolates separate instances', async () => {
    const a = create(async () => ({ results: [first] }))
    const b = create(async () => ({ results: [second] }))
    a.open()
    b.open()
    await nextTick()
    a.close()
    expect(b.state.isOpen).toBe(true)
    expect(b.activate()?.id).toBe('b')
  })
})
