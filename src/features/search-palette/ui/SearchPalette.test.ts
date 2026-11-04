// @vitest-environment node
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { expect, expectTypeOf, it, vi } from 'vitest'
import { SearchPalette } from '../index'
import type { SearchResult } from '../types'

it('exposes typed result and preview slots to library consumers', () => {
  type Slots = InstanceType<typeof SearchPalette>['$slots']
  expectTypeOf<NonNullable<Slots['result']>>().parameter(0).toEqualTypeOf<{
    result: SearchResult
    selected: boolean
  }>()
  expectTypeOf<NonNullable<Slots['preview']>>().parameter(0).toEqualTypeOf<{
    result: SearchResult
  }>()
})

it('renders on the server without providers, browser globals, or a search request', async () => {
  const search = vi.fn(async () => ({ results: [] }))
  expect(typeof window).toBe('undefined')
  expect(typeof document).toBe('undefined')
  const html = await renderToString(
    createSSRApp({
      render: () => h(SearchPalette, { search, open: true }),
    })
  )
  expect(html).toContain('<dialog')
  expect(html).toContain('Search your workspace')
  expect(search).not.toHaveBeenCalled()
})
