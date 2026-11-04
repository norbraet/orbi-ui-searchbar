// @vitest-environment node
import { expect, it } from 'vitest'
import { getPreviewImageUrl } from './url'

it.each([
  'https://example.com/image.png',
  'http://example.com/image.png',
  '/images/mock.svg',
  './mock.svg',
  '//example.com/image.png',
])('preserves supported image URL %s', (url) => expect(getPreviewImageUrl(url)).toBe(url))

it.each([
  undefined,
  '',
  'javascript:alert(1)',
  'data:image/png;base64,abc',
  'file:///image.png',
  'https://[invalid',
])('rejects unsupported or malformed image URL %s', (url) =>
  expect(getPreviewImageUrl(url)).toBeUndefined()
)
