/** Accept HTTP(S) and relative image URLs; preserve the original value for rendering. */
export function getPreviewImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    return ['http:', 'https:'].includes(new URL(url, 'https://preview.invalid').protocol)
      ? url
      : undefined
  } catch {
    return undefined
  }
}
