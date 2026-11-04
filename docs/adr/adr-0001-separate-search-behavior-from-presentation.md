# ADR-0001: Separate search behavior from presentation

| Field           | Value                                                     |
| --------------- | --------------------------------------------------------- |
| Status          | Accepted                                                  |
| Date            | 2026-11-03                                                |
| Decision makers | Project maintainer                                        |
| Related ADRs    | [ADR-0002](adr-0002-use-shared-semantic-design-tokens.md) |
| Supersedes      | None                                                      |
| Superseded by   | None                                                      |

## Context and problem

The search palette needs asynchronous mocked results, query state, selection, previews, and keyboard
interaction. Its appearance will evolve. The maintainer requires behavior to remain testable
independently of the actual UI, and a real backend must eventually replace the mock without rewriting
that behavior. The intended destination is the maintainer's own Vue component library, reused across
multiple Vue projects. Supporting React or other UI frameworks is not currently a requirement.

## Decision drivers

- Verify search and selection behavior without mounting styled components.
- Change presentation without changing request coordination or duplicating state.
- Preserve the repository's feature boundaries and existing Vue/TypeScript testing tools.
- Keep the first implementation small and instance-based.
- Reuse the component without requiring this demo app's router, stores, or translation setup.

## Options considered

| Option                                                  | Advantages                                                                        | Disadvantages / risks                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| A: Component owns behavior and rendering                | Minimal initial wiring                                                            | Couples behavior tests to UI; makes alternative layouts harder  |
| B: Headless Vue composable with injected service        | Fits current stack; reactive state without rendered UI; easy service substitution | Requires explicit contracts and separate DOM interaction checks |
| C: Framework-independent state machine with Vue adapter | Portable behavior and explicit transitions                                        | Adds an abstraction and adapter before portability is required  |

## Decision

We will use **a headless Vue composable with an injected search service**, plus separate presentational
components and browser integration, for the reusable Vue search palette. The maintainer clarified the
Vue component-library scope and authorized implementation of this approach.

The model owns query/request/selection state and exposes commands and readonly state. It neither
imports fixtures nor accesses DOM elements, global listeners, routing, storage, or browser navigation.
The mock implements the same service contract expected of a future backend adapter. A thin feature
container connects presentation events to model commands. Browser focus, shortcuts, and accessibility
semantics remain in the UI integration, and the host handles activation intents.

We accept Vue reactivity in behavior code. We do not initially introduce a global store, a separate
state-machine library, or a parallel framework-independent state representation.

Option A is rejected by the maintainer because it couples behavior to rendering. Option B is
recommended for the clarified Vue-library scope. Option C remains a possible future direction if
cross-framework reuse becomes a real requirement; reuse across Vue projects alone does not require it.

Expose the headless composable, component, and consumer-facing types through a deliberate public API.
Accept the search service and context as inputs, and emit activation events for the host to handle.
Provide typed label overrides and slots for result and preview customization, with defaults that
preserve the component's accessibility responsibilities. Consumers do not need to install Pinia,
Vue Router, or Vue I18n. Demo translations are supplied from outside the reusable component.

Keep component styles and required token defaults available through an explicit style entry. Do not
require consumers to import the demo application's global reset or base styles. Library packaging can
be introduced when the first complete component is ready for a consumer smoke test.

## Consequences

### Benefits

- Request races, cancellation, retry, and selection can be tested without rendering the palette.
- Presentation and mock implementation can change independently of the headless model.
- Multiple instances can be isolated rather than sharing a global palette singleton.
- Different Vue projects can supply their own backend, navigation, labels, and branding.

### Costs and drawbacks

- Props, events, and service contracts need explicit wiring.
- Model tests cannot verify browser focus, accessible markup, or actual keyboard integration.
- Behavior code remains coupled to Vue reactivity.

### Risks and mitigations

- **State duplication:** Derive preview and status from model state; do not mirror them in UI stores.
- **Stale asynchronous responses:** Use cancellation and a request identity guard, tested separately.
- **Incomplete accessibility evidence:** Add browser checks for focus, keyboard interaction, and markup.
- **Premature abstraction:** Extract only necessary helpers and adapters as delivery steps require them.

## Implementation and validation

- **Implementation:** Follow the [search palette plan](../search-palette-plan.md) in small increments.
- **Validation:** Model tests must run without mounting UI components; integration checks must exercise
  the complete trigger-to-result journey and focus restoration.
- **Exit strategy:** Preserve the service contract and presentation boundary if the model later moves
  to a framework-independent implementation.

## Review triggers

The styling delivery described above is refined by [ADR-0002](adr-0002-use-shared-semantic-design-tokens.md):
the palette consumes a shared token foundation rather than maintaining independent defaults.

Revisit if another framework must consume the behavior, palette instances need coordinated shared
state, or nested interaction flows make an explicit state machine materially simpler.
