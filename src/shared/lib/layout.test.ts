// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { calculatePanelHeight, calculateScrollTop } from './layout'

describe('calculatePanelHeight', () => {
  const content = { primaryHeight: 300, secondaryHeight: 200 }

  it('uses the taller pane for columns and caps their combined height when stacked', () => {
    expect(calculatePanelHeight({ ...content, stacked: false })).toBe(300)
    expect(calculatePanelHeight({ ...content, stacked: true, primaryMaxHeight: 100 })).toBe(300)
    expect(calculatePanelHeight({ ...content, stacked: true, maxHeight: 400 })).toBe(400)
  })

  it('handles absent previews and rounds fractional measurements up', () => {
    expect(calculatePanelHeight({ primaryHeight: 70.2, stacked: false })).toBe(71)
    expect(calculatePanelHeight({ ...content, stacked: false, primaryMaxHeight: 100 })).toBe(300)
  })
})

describe('calculateScrollTop', () => {
  const viewport = { scrollTop: 100, viewportHeight: 200, itemHeight: 40 }

  it('keeps visible items stationary and reveals items above or below with padding', () => {
    expect(calculateScrollTop({ ...viewport, itemTop: 120 })).toBe(100)
    expect(calculateScrollTop({ ...viewport, itemTop: 50, paddingTop: 8 })).toBe(42)
    expect(calculateScrollTop({ ...viewport, itemTop: 280, paddingBottom: 8 })).toBe(128)
  })

  it('aligns oversized items to their top and prevents negative scrolling', () => {
    expect(calculateScrollTop({ ...viewport, itemTop: 120, itemHeight: 300 })).toBe(120)
    expect(calculateScrollTop({ ...viewport, itemTop: 0, paddingTop: 8 })).toBe(0)
  })
})
