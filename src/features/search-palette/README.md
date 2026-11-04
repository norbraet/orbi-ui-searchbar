# Search palette

A reusable Vue 3 search palette with headless behavior, optional result/preview slots, native modal
semantics, and the library's shared design tokens. The component requires Vue 3.5 or later. It does not require
Pinia, Vue Router, Vue I18n, or the demo app's CSS reset. Distribution packaging into a library remains
a separate step.

## Use in a host component

```vue
<script setup lang="ts">
  import { ref } from 'vue'
  // Load the shared foundation once in the consuming application's entry point.
  import '@/app/styles/tokens.css'
  import { SearchPalette } from '@/features/search-palette'
  import type { SearchResult, SearchService } from '@/features/search-palette'

  const props = defineProps<{ search: SearchService }>()
  const emit = defineEmits<{ activate: [result: SearchResult] }>()
  const open = ref(false)
</script>

<template>
  <button type="button" @click="open = true">Search workspace</button>
  <SearchPalette v-model:open="open" :search="props.search" @activate="emit('activate', $event)" />
</template>
```

The service receives `{ query, context, signal }` and returns a promise for `{ results, suggestions? }`.
The empty query is sent immediately on open, allowing the service to provide starting items and
suggestions. Subsequent query changes are debounced; results retain the service's order. There is no
frontend indexing, filtering, or ranking. A changed context invalidates the current search.

Each result has a stable unique `id`, `title`, `url`, `kind`, `source`, and `location`. Optional `excerpt`
and `preview` fields enrich presentation. Preview data can include text, an image URL and alternative
text, and a display-ready update date. Treat supplied content as text rather than HTML.

The component emits `activate` and closes when a current result is chosen. The host decides whether
to route, open a new tab, or perform another action. Validate destinations at that boundary; the demo
allows only HTTP(S). The component never calls a router or opens a URL itself. Image previews allow
HTTP(S) and relative URLs, and failed images fall back to available text or the no-preview message.

## Inputs and customization

| Input          | Purpose                                                           | Default |
| -------------- | ----------------------------------------------------------------- | ------- |
| `v-model:open` | Coordinate opening and closing with the host                      | Closed  |
| `search`       | Required asynchronous service callback                            | None    |
| `context`      | Host-owned context record forwarded to the service                | None    |
| `labels`       | Partial typed label overrides, including a result-count formatter | English |
| `debounceMs`   | Delay after query changes; set when creating the instance         | 180 ms  |
| `shortcut`     | Character used with Cmd or Ctrl; `false` disables the listener    | `k`     |

The `result` slot receives `{ result, selected }`; its wrapper retains the option ID, role, selection,
and interaction handlers. Supply non-interactive row content rather than nested buttons or links.
The `preview` slot receives `{ result }`, with the standard open action retained outside the slot.
The component owns accessibility semantics and focus behavior; slots customize content.

English defaults and German labels are exported as `searchPaletteLabels` and `searchPaletteLabelsDe`.
A consuming project can supply translated labels through any translation system. The component has
no translation-plugin dependency.

Component styles are included with the component; `style.css` is also its explicit CSS entry for
library extraction. Load the shared [token foundation](../../app/styles/tokens.css) once in the host
application. It contains primitives, semantic roles, themes, and accessibility overrides without the
demo's reset or base styles. The demo already loads it through `global.css`.

The palette consumes semantic tokens directly, including `--color-text`, `--color-primary-subtle`,
`--material-regular-background`, `--space-component-*`, `--radius-modal`, and `--motion-*`. Customize the
shared theme centrally rather than maintaining a palette-specific token set. Palette width, body
height, and preview proportions remain local CSS layout rules that hosts can override with selectors.
System appearance, `data-theme`, contrast, and transparency preferences all use the shared foundation.
CSS styling approximates Liquid Glass; it does not reproduce native macOS rendering. Compact controls
use `--radius-control`, while inputs use `--radius-input`.

Opening and closing use a short fade and scale, with a matching backdrop fade. Result arrivals and
preview changes fade into place, and the body keeps a stable height while requests are pending.
Closing cancels search immediately, preserves a non-interactive visual snapshot for the exit, then
restores focus. Reopening interrupts that exit safely. No animation timing is part of the headless
model. Tune timing through shared `--motion-fast`, `--motion-normal`, `--motion-emphasized`, and easing
roles. Reduced-motion preferences disable all component animations and transitions, including in a
consumer that loads only the shared token foundation and component styles.

## Headless usage

`useSearchPalette({ search, context?, debounceMs? })` exposes readonly `state` and `selectedResult`,
plus `open`, `close`, `setQuery`, `select`, `moveSelection`, `retry`, `activate`, and `dispose`.
`context` can be a reactive value or getter. `activate()` returns a result or `null`; it does not close
or navigate, leaving those decisions to the UI integration. Closing resets query and responses.

The composable cancels superseded work and ignores stale responses even if a service ignores its
abort signal. It cleans up with its Vue effect scope. Call `dispose()` manually if creating it outside
a scope. It is safe to construct during server rendering; call `open()` on the client when appropriate.

## Demo and verification

The home page supplies scripted mock responses and selectable success, empty, error, slow, and
missing-preview scenarios. All normal queries intentionally return the same scripted result set;
the demo does not simulate relevance. The illustrated thumbnail is a local mock, not a captured Apple
page. Mocks have their own entry in `mocks/` and are absent from the production public entry.

- `model/useSearchPalette.test.ts`: Node tests for requests, races, selection, context, and lifecycle.
- `ui/SearchPalette.test.ts`: provider-free server-rendering check.
- `ui/SearchPalette.stories.ts`: component examples and a keyboard interaction check.
- `e2e/specs/search-palette.spec.ts`: actual browser behavior using `e2e/fixtures/search-palette.html`,
  which imports Vue, the public component entry, and shared tokens, without app reset/base styles or
  providers. It also verifies that shared theme and token overrides reach the palette.

Use the repository's unit and Storybook commands. Run the browser suite with
`pnpm exec playwright test e2e/specs/search-palette.spec.ts --project=chromium --project=webkit`.
