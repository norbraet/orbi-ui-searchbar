// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockSearchService, type MockScenario } from './index'
import { mockSearchResults } from './fixtures'

async function search(query: string, scenario: MockScenario = 'default') {
  const response = createMockSearchService(scenario)({
    query,
    signal: new AbortController().signal,
  })
  await vi.runAllTimersAsync()
  return response
}

describe('mock search backend', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('provides a diverse catalog with stable unique result IDs', () => {
    expect(mockSearchResults.length).toBeGreaterThanOrEqual(30)
    expect(new Set(mockSearchResults.map((result) => result.id)).size).toBe(
      mockSearchResults.length
    )
    expect(new Set(mockSearchResults.map((result) => result.kind)).size).toBeGreaterThanOrEqual(5)
  })

  it('returns only suggestions for empty input', async () => {
    const response = await search('   ')
    expect(response.results).toEqual([])
    expect(response.suggestions?.length).toBeGreaterThan(0)
  })

  it('matches content kind without returning the whole starting set', async () => {
    const response = await search('Decision')
    expect(response.results.map((result) => result.id)).toContain('search-behavior')
    expect(response.results.map((result) => result.id)).toContain('token-governance')
    expect(response.results.map((result) => result.id)).not.toContain('design')
    expect(response.results.map((result) => result.id)).not.toContain('keyboard')
  })

  it('matches multiple words case-insensitively and requires every word', async () => {
    const response = await search('   RELEASE    checklist  ')
    expect(response.results.map((result) => result.id)).toEqual(['release-checklist'])
    expect((await search('release nonexistentword')).results).toEqual([])
  })

  it('finds words that appear only in preview content', async () => {
    expect((await search('canary')).results.map((result) => result.id)).toEqual([
      'deployment-runbook',
    ])
  })

  it('matches sources, locations, and partial words', async () => {
    expect((await search('figma')).results.map((result) => result.id)).toEqual([
      'palette-mockup',
      'responsive-layout',
    ])
    expect((await search('engineering delivery')).results.map((result) => result.id)).toEqual([
      'shared-styles',
      'release-checklist',
      'deployment-runbook',
    ])
    expect((await search('compos')).results.map((result) => result.id)).toContain('search-behavior')
  })

  it('normalizes accented queries and fixture text', async () => {
    expect((await search('ubergabe')).results.map((result) => result.id)).toEqual(['handoff-note'])
    expect((await search('ÜBERGABE')).results.map((result) => result.id)).toEqual(['handoff-note'])
  })

  it('returns no unrelated items for an unmatched query and offers working recovery suggestions', async () => {
    const response = await search('qzx-unmatched-7391')
    expect(response.results).toEqual([])
    expect(response.suggestions?.length).toBeGreaterThan(0)
    for (const suggestion of response.suggestions ?? []) {
      expect((await search(suggestion.query)).results.length).toBeGreaterThan(0)
    }
  })

  it('offers query completions separately from navigable results', async () => {
    expect((await search('key')).suggestions).toContainEqual({
      id: 'suggest-keyboard',
      label: 'Keyboard interaction',
      query: 'keyboard',
    })
  })

  it('keeps the forced-empty scenario while respecting the suggestions-only initial state', async () => {
    expect((await search('decision', 'empty')).results).toEqual([])
    expect((await search('', 'no-preview')).results).toEqual([])
  })

  it.each(['decision', 'design', 'roadmap', 'canary'])(
    'missing-preview searches the normal catalog for %s and omits preview data',
    async (query) => {
      const normal = await search(query)
      const unavailable = await search(query, 'no-preview')
      expect(normal.results.length).toBeGreaterThan(0)
      expect(unavailable.results).toEqual(
        normal.results.map((result) => {
          const copy = { ...result }
          delete copy.preview
          return copy
        })
      )
      expect(unavailable.suggestions).toEqual(normal.suggestions)
    }
  )

  it('missing-preview suggestions lead to matches without changing the shared catalog', async () => {
    const initial = await search('', 'no-preview')
    for (const suggestion of initial.suggestions ?? []) {
      const response = await search(suggestion.query, 'no-preview')
      expect(response.results.length).toBeGreaterThan(0)
      expect(response.results.every((result) => !result.preview)).toBe(true)
    }
    expect((await search('canary')).results[0]?.preview?.text).toContain('canary')
  })

  it('isolates fixture data between requests and service instances', async () => {
    const first = await search('canary')
    first.results[0]!.title = 'Changed by consumer'
    first.results[0]!.preview!.text = 'Changed preview'
    const second = await search('canary')
    expect(second.results[0]!.title).toBe('Deployment runbook')
    expect(second.results[0]!.preview!.text).toContain('canary')
  })

  it('preserves slow responses and rejects aborted requests', async () => {
    const controller = new AbortController()
    const pending = createMockSearchService('slow')({ query: 'canary', signal: controller.signal })
    const settled = vi.fn()
    void pending.then(settled, settled)
    await vi.advanceTimersByTimeAsync(1000)
    expect(settled).not.toHaveBeenCalled()
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await rejected
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps forced errors observable for the error-state demo', async () => {
    const response = createMockSearchService('error')({
      query: 'decision',
      signal: new AbortController().signal,
    })
    const rejected = expect(response).rejects.toThrow('Mock service unavailable')
    await vi.runAllTimersAsync()
    await rejected
  })
})
