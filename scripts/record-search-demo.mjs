import { chromium, expect } from '@playwright/test'
import { mkdir, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const baseURL = process.env.DEMO_URL ?? 'http://localhost:3000'
const ffmpeg = process.env.FFMPEG_PATH ?? 'ffmpeg'
const output = resolve('docs/media')
const cache = resolve('node_modules/.cache/search-demo')
const videoPath = resolve(output, 'search-demo.webm')
const gifPath = resolve(output, 'search-demo.gif')
let rawVideoPath

if (spawnSync(ffmpeg, ['-version'], { stdio: 'ignore' }).status !== 0) {
  throw new Error('FFmpeg is required. Install it or set FFMPEG_PATH to its executable.')
}

await mkdir(output, { recursive: true })
await mkdir(cache, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1100, height: 760 },
  deviceScaleFactor: 1,
  colorScheme: 'dark',
  locale: 'en-US',
  recordVideo: { dir: cache, size: { width: 1100, height: 760 } },
})
await context.addInitScript(() => {
  localStorage.setItem('theme', 'dark')
  localStorage.setItem('locale', 'en')
})

try {
  const page = await context.newPage()
  const video = page.video()
  const pause = (ms) => page.waitForTimeout(ms)
  await page.goto(baseURL)
  await page.getByRole('heading', { name: 'Search Bar Component', exact: true }).waitFor()

  // Browser recordings omit the system pointer; show a small click indicator.
  await page.evaluate(() => {
    const pointer = document.createElement('div')
    pointer.setAttribute('aria-hidden', 'true')
    pointer.style.cssText =
      'position:fixed;left:-40px;top:-40px;width:22px;height:22px;border:2px solid #8ac1ff;border-radius:50%;background:#8ac1ff30;pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%)'
    document.body.append(pointer)
    document.addEventListener('pointermove', (event) => {
      pointer.style.left = `${event.clientX}px`
      pointer.style.top = `${event.clientY}px`
    })
    document.addEventListener('pointerdown', () => {
      pointer.animate([{ scale: '1' }, { scale: '1.7' }, { scale: '1' }], { duration: 280 })
    })
  })

  const click = async (locator) => {
    const box = await locator.boundingBox()
    if (!box) throw new Error('Demo target is not visible')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 16 })
    await pause(250)
    await locator.click()
  }

  await pause(900)
  await click(page.getByRole('button', { name: 'Search workspace', exact: true }))
  const dialog = page.getByRole('dialog')
  const input = dialog.getByRole('combobox')
  await expect(input).toBeFocused()
  await page.mouse.move(1030, 690, { steps: 12 })
  await pause(800)
  await input.pressSequentially('design', { delay: 130 })
  await dialog.getByRole('option', { name: /Designing with materials/ }).waitFor()
  await pause(1700)
  await input.press('ArrowDown')
  await pause(1100)
  await input.press('ArrowDown')
  await pause(1100)
  await click(dialog.getByRole('button', { name: /^Decisions/ }))
  await expect(dialog.getByRole('option')).toHaveCount(1)
  await pause(1500)
  await click(dialog.getByRole('button', { name: /^All content/ }))
  await input.click()
  await input.press('ControlOrMeta+a')
  await input.pressSequentially('canary', { delay: 130 })
  await page.mouse.move(1030, 690, { steps: 12 })
  await expect(dialog.getByRole('heading', { name: 'Deployment runbook' })).toBeVisible()
  await pause(2000)
  await input.press('ControlOrMeta+a')
  await input.pressSequentially('release checklist', { delay: 80 })
  await expect(dialog.getByRole('option')).toHaveCount(1)
  await pause(1100)
  await click(dialog.getByRole('button', { name: /^Links/ }))
  await dialog.getByText('No results. Try another query or broaden your search.').waitFor()
  await pause(1500)
  await click(dialog.getByRole('button', { name: 'Search all content', exact: true }))
  await expect(dialog.getByRole('heading', { name: 'Release checklist' })).toBeVisible()
  await page.mouse.move(1030, 690, { steps: 12 })
  await pause(1500)
  await input.press('Escape')
  await expect(dialog).not.toBeVisible()
  await pause(350)
  await page.mouse.move(80, 690, { steps: 16 })
  await pause(1000)
  await context.close()
  rawVideoPath = await video.path()
} finally {
  await browser.close()
}

// Trim the initial browser paint and encode a shareable WebM.
const videoExport = spawnSync(
  ffmpeg,
  [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    '0.35',
    '-i',
    rawVideoPath,
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '0',
    '-crf',
    '20',
    '-deadline',
    'realtime',
    '-cpu-used',
    '4',
    '-an',
    videoPath,
  ],
  { stdio: 'inherit' }
)
if (videoExport.status !== 0) throw new Error('WebM export failed')

// A single palette keeps text crisp and avoids GIF palette flicker between frames.
const conversion = spawnSync(
  ffmpeg,
  [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    videoPath,
    '-filter_complex',
    'fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    '-loop',
    '0',
    gifPath,
  ],
  { stdio: 'inherit' }
)
if (conversion.status !== 0) throw new Error('GIF conversion failed')
for (const file of [videoPath, gifPath]) {
  console.log(`${file} (${((await stat(file)).size / 1024 / 1024).toFixed(2)} MB)`)
}
