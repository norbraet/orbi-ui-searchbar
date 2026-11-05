# Search demo recording

The root README embeds `search-demo.gif`. `search-demo.webm` contains the smoother browser recording.
Both show the actual component with mock data: opening search, navigating results, reading previews,
filtering with scope chips, and recovering from no matches. A small pointer indicator makes clicks visible.

To record again, install the project dependencies and Playwright Chromium, then start `pnpm dev`.
With FFmpeg available on your PATH, run from the project root:

```sh
node scripts/record-search-demo.mjs
```

Use `FFMPEG_PATH` for an FFmpeg executable outside your PATH, or `DEMO_URL` for a different local server.
The script records at 1100 × 760 in dark mode and exports a looping 960-pixel-wide, 10 fps GIF. Raw captures stay in
the ignored `node_modules/.cache/search-demo` folder. Review both outputs before committing them.
