# Liquid Glass styling tokens

These tokens translate Apple's design guidance into a web styling foundation. They are not an exact
copy of the native macOS renderer: CSS backdrop filters do not reproduce its dynamic refraction,
vibrancy, or automatic adaptation to underlying content. The blur, opacity, shadow, corner, color,
spacing, and motion values here are project choices, not an Apple CSS specification.

## Layers and roles

- `primitives/` holds reusable scales and raw values.
- `semantics/` names roles that components consume.
- `themes/` supplies light and dark appearances and accessibility overrides.
- `base.css` applies typography, focus, and motion preferences globally.

Use `--color-surface` and related opaque surface roles for content. Use glass sparingly for floating
controls and navigation, including the search palette shell. Avoid stacking translucent surfaces on
every result row or content card.

The regular material is intended for text-heavy interfaces. The clear material is an optional choice
over rich media backgrounds and needs contrast validation against that background; it is not the
default search material. `--color-on-primary` supplies text on a filled primary control, while
`--color-selection-text` supplies text on a selected result. Existing `--color-text-inverse` uses remain
compatible with filled primary controls in each theme.

## Consuming a material

Components opt in explicitly; changing tokens does not add blur to every existing surface:

```css
.search-palette {
  background: var(--material-regular-background);
  -webkit-backdrop-filter: var(--material-regular-filter);
  backdrop-filter: var(--material-regular-filter);
  border: var(--border-width-thin) solid var(--material-border);
  border-radius: var(--radius-modal);
  box-shadow: var(--material-shadow);
  color: var(--color-text);
}
```

The shadow includes a subtle inner highlight. Do not animate blur or add continuous decorative
movement; use the semantic duration and easing tokens for purposeful interface transitions. The system
font stack uses the platform's installed UI font, including San Francisco on macOS, without bundling
Apple fonts. Typography uses relative units and a compact desktop body size.

## Appearance and accessibility

With no `data-theme`, the system appearance applies. `data-theme="light"` or `data-theme="dark"`
explicitly selects an appearance, including on scoped preview containers.

Materials remain opaque when backdrop filtering is unsupported. Reduced-transparency and increased
contrast preferences remove transparency and blur; increased contrast also strengthens labels and
borders. Forced colors uses system colors. Reduced motion disables transitions and animations,
including on pseudo-elements. Support for preference media queries depends on the browser; opaque
surfaces remain available for contexts that need them.

Verify the actual component over varied backgrounds in both themes, with keyboard focus, browser
zoom, and accessibility preferences. Tokens alone cannot guarantee contrast for arbitrary content
behind translucent materials or reproduce native spring-driven animation and concentric geometry.

## Sources

- [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Apple HIG: Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
