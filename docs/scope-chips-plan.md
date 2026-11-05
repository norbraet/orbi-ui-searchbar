# Search scope chips

## Goal and examples

Help people narrow a mixed result list without rewriting their query or opening another view.
For example, search for "design", choose Decisions, then switch to Documents to compare matches.
A host can instead provide project, workspace, or source scopes; scope IDs are opaque to the UI.

## First implementation

- A persistent chip rail sits between the input and results. It is omitted when no scopes are supplied.
- All content is the default. One scope is active at a time. Clicking the active scope again clears it.
- Scope changes preserve the query, cancel stale work, clear actionable results, and search immediately.
- Empty input remains suggestions-only, even with a scope selected. Suggestions come from the provider.
- Clearing the query retains the scope; closing the palette resets both. Removing the active scope
  from the host configuration returns to All content and refreshes an open palette.
- Optional provider counts describe matches for the current query in each scope, before applying
  the selected scope. Zero-count chips stay usable, and counts are hidden while a request is pending
  or has failed. No count is inferred from the current filtered result list.
- Empty scoped searches offer Search all content, preserving the query.

## Interaction and presentation

Use native toggle buttons in a labelled group, with a checkmark and selected styling. Tab reaches
each chip; Enter/Space selects it. Left/right and Home/End move focus within the rail without changing
the scope until activation. Keep keyboard focus on the chip, so its pressed state is inspectable and
switching remains predictable. Pointer activation can preserve input focus.

The rail scrolls horizontally rather than consuming several rows on mobile. Controls have generous
touch targets and focus outlines. A keyboard-focused chip scrolls into view within the rail only.
Shared semantic tokens supply colors, spacing, rounding, and short transitions; reduced motion is
respected. Stable chip identities and reserved count widths reduce movement during requests.

## Boundaries

The host supplies `{ id, label }` scopes. The headless model validates and owns `scopeId`, forwards
it through the injected search service, and manages request cancellation. The backend owns scope
meaning, matching, counts, and suggestions. The demo backend simulates those behaviors over fixtures.
The Vue components own rendering, focus, scrolling, and event mapping.

Multi-select, combining multiple filter dimensions, scope persistence/history, and query syntax such
as `type:document` are possible extensions, not requirements for this iteration.

## Verification

Model tests cover validation, lifecycle, immediate requests, context/configuration changes, and stale
responses. Mock tests cover scoped matching, counts, and suggestions. Storybook and browser tests
cover narrowing/broadening without query loss, empty recovery, keyboard and touch interaction,
narrow-screen scrolling, accessible semantics, and optional scopes/counts.
