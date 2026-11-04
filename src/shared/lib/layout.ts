/** Calculate a panel's height from measured content, before applying it to the DOM. */
export function calculatePanelHeight({
  primaryHeight,
  secondaryHeight = 0,
  stacked,
  primaryMaxHeight = Infinity,
  maxHeight = Infinity,
}: {
  primaryHeight: number
  secondaryHeight?: number
  stacked: boolean
  primaryMaxHeight?: number
  maxHeight?: number
}): number {
  const height = stacked
    ? Math.min(primaryHeight, primaryMaxHeight) + secondaryHeight
    : Math.max(primaryHeight, secondaryHeight)
  return Math.ceil(Math.min(height, maxHeight))
}

/** Reveal an item within its own scroll container, without scrolling ancestors. */
export function calculateScrollTop({
  scrollTop,
  viewportHeight,
  itemTop,
  itemHeight,
  paddingTop = 0,
  paddingBottom = 0,
}: {
  scrollTop: number
  viewportHeight: number
  itemTop: number
  itemHeight: number
  paddingTop?: number
  paddingBottom?: number
}): number {
  const top = itemTop - paddingTop
  const bottom = itemTop + itemHeight + paddingBottom
  if (top < scrollTop || itemHeight > viewportHeight) return Math.max(0, top)
  if (bottom > scrollTop + viewportHeight) return Math.max(0, bottom - viewportHeight)
  return scrollTop
}
