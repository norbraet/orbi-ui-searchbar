# ADR-0002: Use shared semantic design tokens

| Field           | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Status          | Accepted                                                           |
| Date            | 2026-11-04                                                         |
| Decision makers | Project maintainer                                                 |
| Related ADRs    | [ADR-0001](adr-0001-separate-search-behavior-from-presentation.md) |
| Supersedes      | None; refines the styling delivery in ADR-0001                     |
| Superseded by   | None                                                               |

## Context and problem

The palette originally provided a separate set of fallback tokens to style itself independently.
That duplicated global colors, spacing, typography, materials, and motion, and allowed components to
drift apart. The maintainer wants consistent styling across their Vue component library.

## Decision drivers

- One shared source of styling decisions and theme/accessibility behavior.
- Fewer tokens to maintain and override across consuming projects.
- Reuse without importing the demo app's reset, base styles, or providers.

## Options considered

| Option                             | Advantages                                    | Disadvantages / risks                             |
| ---------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| Component-specific fallback tokens | Component styles work alone                   | Duplicated defaults and theme rules; visual drift |
| Shared semantic tokens             | Central customization and consistent behavior | Hosts must load the shared foundation             |

## Decision

We will **consume shared semantic tokens directly** in library components. Reuse existing roles first;
extend shared primitives/semantics only for reusable gaps. Keep component-specific dimensions and
proportions as local layout rules.

`src/app/styles/tokens.css` exposes the current shared foundation without reset or base styles.
`global.css` imports it for the demo; other consumers load the token entry alongside component styles.
The palette does not import the app layer itself. Theme and accessibility rules live in the foundation.

## Consequences

### Benefits

- Shared token changes reach the palette directly without synchronizing fallback values.
- Components use consistent materials, typography, spacing, and interaction styles.

### Costs and drawbacks

- Consumers must include the shared token entry; component CSS alone is no longer self-contained.
- Library packaging must expose the foundation when the component is extracted from this repository.

### Risks and mitigations

- **Missing foundation:** Document the required import and verify an isolated consumer with it.
- **Token proliferation:** Promote reusable semantic roles, not every component layout value.

## Implementation and validation

Remove the palette token file and consume the shared roles in its CSS. Validate theme/spacing/radius
overrides, contrast preferences, reduced motion, and the existing browser interaction suite.
