# Search palette implementation plan

Working branch: `feat/search-palette`.

## Current implementation

The first complete flow is implemented: service contract and searchable mock fixtures, headless behavior,
controlled Vue component, keyboard/pointer navigation, previews, suggestions, loading/empty/error
states, and a home-page demo. The reusable component uses the shared token foundation and has no application-provider
dependency. Closing resets the search; history/pinning and library distribution
packaging remain follow-up work.

Scope chips now provide an optional, host-defined single scope, service-owned facet counts, and
query-preserving recovery. See the [scope chip interaction plan](scope-chips-plan.md) for the UX,
service boundary, and possible extensions.

The demo mock now searches 32 fixtures, with suggestions only for an empty query. Simple matching
lives behind the service boundary; unknown queries produce an empty state with separate recovery
suggestions. Blank or whitespace-only input never exposes context items, a preview, or a result count.
This is a fixture simulation, not production indexing or relevance ranking.

See the [component usage guide](../src/features/search-palette/README.md). Behavior tests run in Node;
browser tests use an isolated Vue consumer with shared tokens but no app providers, reset, or base styles. Storybook includes
representative states and an interaction check. Chromium and WebKit cover focus, navigation, retry,
missing previews, small layouts, and accessibility checks.

This plan turns the [project scope](README.md) into small implementation steps. The behavior/UI
separation is a requirement; file names, API details, and visual choices below are a starting point
that can change during implementation. The architecture decision is recorded in
[ADR-0001](adr/adr-0001-separate-search-behavior-from-presentation.md).

The component is intended for the maintainer's own **Vue component library**, for reuse in different
Vue projects. A headless Vue composable is therefore the recommended behavior layer; cross-framework
portability is not a current goal.

## Boundaries

| Part                       | Owns                                                                                                  | Does not own                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Headless model             | Open state, query, request lifecycle, result selection, derived preview, retry, and activation intent | Markup, CSS, DOM focus, global listeners, routing, or mock fixtures |
| Search service             | Asynchronous search contract returning ordered results and optional suggestions                       | Palette state, UI rendering, or browser navigation                  |
| UI and browser integration | Rendering, accessible markup, focus, shortcut listeners, mapping input to commands, and cleanup       | Fetching results, ranking, or duplicating model state               |
| Host application           | Supplying context and the service, mounting the palette, and handling destination opening             | Search algorithms or indexing                                       |

Use an instance-based Vue composable for the headless model. Reactive state is useful here without
requiring rendered components. Keep deterministic selection helpers as plain functions when useful;
avoid introducing a second state system or a state-machine dependency in advance of a concrete need.
Do not place palette state in the existing theme store or require Pinia for the first implementation.

The model depends on an injected service interface, not its mock implementation. The mock is wired at
the demo/host boundary so replacing it later does not affect model or presentation code.

## Proposed feature structure

Keep feature-specific code in `src/features/search-palette/` and respect the repository's import
boundaries:

```text
search-palette/
  types/     Search requests, results, previews, and service contract
  model/     Headless composable, small helpers, and behavior tests
  lib/       Feature-specific browser integration if it needs extraction
  mocks/     Deterministic service and representative fixtures
  ui/        Palette shell, result list, preview, stories, and interaction checks
  i18n/      Default labels and typed overrides, independent of a translation plugin
  index.ts   Public feature API
```

Create files only as they become necessary. Keep orchestration thin and promote code to `shared/`
only when it is genuinely reusable outside search. The app or a demo page imports the public feature
API, supplies the mock, and handles navigation.

## Vue library integration

- Export the component, headless composable, and consumer-facing service/result types from the public
  entry. Keep fixtures and demo wiring outside the production entry.
- Accept a service and context through explicit inputs; emit selected-result activation to the host.
  Do not assume a particular backend, URL structure, router, global store, or authentication provider.
- Expose open state through a Vue binding so a host can coordinate its own trigger, alongside the
  component's supported trigger integration. Keep one source of truth for controlled state.
- Offer sensible default rendering and typed label overrides. Add result/preview slots where needed;
  retain listbox IDs, roles, selection, and keyboard handling in the owning component rather than
  requiring each consumer to rebuild accessibility.
- Let hosts translate labels using their own approach. The demo can supply English/German labels
  through its existing Vue I18n setup without making that plugin a component dependency.
- Provide an explicit component CSS entry that consumes the library's shared semantic token foundation.
  Consuming projects should not need this app's global reset, base styles, or theme store.
- Keep browser effects lifecycle-bound and avoid accessing browser globals during module import or
  server rendering. Test that separate component instances do not share mutable state or duplicate
  global shortcut handling.
- Before extraction into the library, validate a minimal consumer that imports only the public API
  and component styles plus shared tokens, without demo providers. Decide packaging and Vue peer dependencies then.

## Delivery steps

### 1. Define the smallest useful contract and fixtures

- Describe requests in terms of query and supplied context, with room for future scope filters.
- Give results stable IDs, a title, a destination, a content kind, and source/location information.
  Excerpts and preview metadata are optional; missing previews are a supported case.
- Return backend-ordered results without client-side matching or sorting. Keep query suggestions
  distinct from navigable results when they are added.
- Support request cancellation through a signal. A real service may still complete after cancellation,
  so cancellation alone must not guarantee correctness.
- Supply deterministic scenarios for success, empty results, failure/retry, missing previews, delays,
  and responses arriving out of order. Fixture selection is not a search algorithm.

Done when the contract and fixtures can exercise the first user journey without any UI dependency.

### 2. Implement and test behavior before styling

- Expose readonly state and explicit commands such as open, close, update query, select/move selection,
  retry, and activate. Keep the final API small rather than exposing every internal ref.
- Represent idle, loading, successful, and failed requests explicitly; derive empty results and the
  selected preview from that state rather than maintaining parallel flags or a duplicate preview.
- Debounce query changes through one defined policy. Inject the search service; use controlled promises
  and fake timers in tests rather than real network calls or wall-clock delays.
- Cancel superseded work and use a request identity guard. Only the latest valid request may update
  results, loading state, or errors, even if a service ignores cancellation.
- Invalidate pending work on close/disposal and cancel scheduled searches. Reopening must not resurrect
  a previous request. Start with a simple reset-on-close policy; search resumption is a later extension.
- Clear actionable results when the query changes. Select the first result after a successful response,
  clamp movement at list boundaries, and allow no selection for empty or unavailable results.
- Return an activation intent for the selected current result. Do not call `window.open`, route, or
  inspect elements inside the model.

Done when tests establish observable behavior for rapid typing, out-of-order success and failure,
selection boundaries, empty results, retry, closing during a request, disposal, and invalid activation.
Tests should survive a visual redesign and should not assert private implementation details.

### 3. Build the first complete UI journey

- Render the model through a thin feature container and presentational components with props/events.
  The container wires commands; visual children do not import the search service or own search state.
- Add a visible trigger and configurable platform-aware shortcut. Keep the shortcut within the web
  application, avoid browser/OS conflicts where possible, ignore composition and key repeats, and
  clean up listeners when unmounted.
- Implement a labelled modal and search combobox/listbox interaction. Keep focus on the input while
  moving the active result; map Arrow keys and Enter to commands, use Tab for focus navigation, and
  let Escape dismiss the palette. Ignore result navigation/activation while an IME is composing text.
- Contain modal focus, make the background inert, provide a visible close control, and return focus
  to the opener when possible. Keyboard selection and pointer selection must use the same commands.
- Show result location, selected preview or fallback, and loading/empty/error states with a retry path.
  Announce status changes without reading every keystroke aloud.
- Open the provided destination through the host boundary. Define supported destinations there and
  reject unsafe URL schemes; the model remains independent of the router and browser.
- Apply semantic tokens, support small viewports and accessibility preferences, and accept user-facing
  labels from the host, using the demo's i18n system only in demo wiring. Verify macOS control shapes against
  the styling notes rather than treating the current tokens as exact native measurements.

Done when a user can open, type, navigate, inspect a preview, and open a destination using either
keyboard or pointer, then dismiss the palette and return to their previous place.

### 4. Validate the integration and extend deliberately

- Use Storybook for representative states, both themes, missing previews, and narrow layouts.
- Check the public API in an isolated consumer without the demo's router, Pinia, or i18n providers.
- Use component/browser tests for accessible relationships, focus containment/restoration, keyboard
  and pointer parity, composition handling, shortcut lifecycle, and destination-opening intent.
- Run the repository's relevant formatting, lint, typecheck, unit, Storybook, and build checks as the
  corresponding implementation lands. Browser checks should verify DOM behavior that model tests
  cannot establish; do not repeat the entire model test matrix through the UI.
- Add suggestions and useful empty-input starting points next, then source/type scopes. Distinguish
  selecting a suggestion (updates query) from activating a result (opens content).
- Revisit related-content exploration, matching-passage previews, action menus, and search resumption
  after the core flow is usable. Add them through the same boundaries when their interaction is clear.

## Decisions to defer

We do not need to settle the final layout, complete result schema, exact timings, preview dimensions,
shortcut, persistence policy, or distribution tooling to begin the headless implementation. Choose small
defaults as needed and validate them through the demo. An ADR is useful for a consequential boundary
change, not every local implementation choice.
