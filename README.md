# @jyga/grange-react

Material 3 Expressive components for React, built on our own spec reference instead of a paid library.
Google never shipped M3 Expressive for the web, so this package implements it from Google's token values.

**Stack:** React 18/19 · [React Aria](https://react-spectrum.adobe.com/react-aria/) for behavior and accessibility · [Motion](https://motion.dev) for spring physics · Sass (CSS Modules) authored over plain CSS custom properties, so it drops in next to Tailwind, CSS Modules or anything else.

## Quick start

```bash
pnpm install
pnpm storybook        # http://localhost:6006
pnpm test             # unit tests
pnpm build            # tokens + library -> dist/
```

In an app:

```tsx
import { GrangeProvider, Button, ToggleButton, ButtonGroup } from '@jyga/grange-react';
import '@jyga/grange-react/styles.css';

<GrangeProvider scheme="expressive">
  <Button variant="filled" size="m" onPress={save}>Save</Button>
</GrangeProvider>
```

Dark mode follows `prefers-color-scheme`; force it with `data-theme="dark"` (or `"light"`) on `<html>` or any container.

## What's here

| Area | Contents |
| --- | --- |
| Tokens | `tokens/m3-expressive.json` (Google's values) + `tokens/theme.json` (our seed color and overrides) → `pnpm tokens` → `src/tokens/generated/tokens.css`, `tokens.ts` and `src/scss/_data.scss` |
| Sass API | `src/scss` → `@use '@jyga/grange-react/scss'`: `theme()` to override roles, `color()` / `corner()` / `duration()` / `easing()` / `type-prop()` to reference them, `typescale()` to apply a text style. Unknown names fail the build |
| Motion | `GrangeProvider` (expressive / standard scheme, reduced-motion aware), `useSpring(name)` for the six M3E springs |
| Primitives | State layer, ripple, focus ring, elevation, 48px touch target (`src/primitives`), and `ButtonBase`, the shared interactive core |
| Components | `Button` (5 variants × 5 sizes × round/square), `ToggleButton`, `IconButton` (4 variants, 3 widths, toggle), `ButtonGroup` (pressed item widens 15%), `ConnectedButtonGroup` (single / multi select) |
| Storybook | Every component and state, light/dark and expressive/standard toolbar switches, and **Foundations / Motion playground** for tuning springs live |

## Theming

Two namespaces are in play, deliberately. `--md-sys-*` and `--md-ref-*` are Google's Material
Design System token names, kept verbatim so every value cross-references Compose and the Figma
variables. `grange-*` classes and `--grange-*` properties are this library's own.

- **Brand color:** set `seed` in `tokens/theme.json` and run `pnpm tokens`. Palettes are generated with Google's `material-color-utilities` (Tonal Spot), and roles map to tones exactly as in Compose.
- **Figma Variables:** paste exported hex values into `overrides.light` / `overrides.dark` (keys are role names such as `primary`, `surface-container-high`). Overrides win over generated values.
- **Fonts:** `typeface.brand` / `typeface.plain` in the same file. The app is responsible for loading the font files.

### Overriding roles from your app

Every token is a CSS custom property, so an override is an ordinary scoped rule. The Sass API
validates the names, which `var(--typo)` cannot:

```scss
@use '@jyga/grange-react/scss' as grange;

// whole app
:root {
  @include grange.theme((primary: #005bbb, on-primary: #fff));
}

// or one subtree, composing with light/dark
.acme-brand {
  @include grange.theme(
    $colors: (primary: #005bbb, surface-container-low: #eef3fb),
    $corners: (large: 20px),
    $typeface: (brand: '"Inter", sans-serif')
  );
}
```

Roles you do not list keep following the generated palette and the `data-theme` / `prefers-color-scheme`
switch. A misspelled role is a Sass error naming the near misses, not a property nothing reads.

The same API is how you reference tokens in your own styles:

```scss
.callout {
  color: grange.color(on-primary-container);
  border-radius: grange.corner(large-increased);
  transition: opacity grange.duration(short3) grange.easing(emphasized);
  @include grange.typescale(title-medium);
}
```

`Foundations / Theming` in Storybook shows both, side by side with the default palette.

## Motion rules (from the M3E spec)

| Interaction | Spring | Why |
| --- | --- | --- |
| Button press corner morph | `defaultEffects` | Compose deliberately avoids bounce here |
| Toggle select shape swap, button group widening | `fastSpatial` | Expressive overshoot |
| Color, opacity, elevation | CSS transitions on the M3 duration tokens | Effects never overshoot |

Springs are tuned in the Motion playground story. The "Changed values" panel there gives the JSON to paste back as the agreed values.

## Adding a component

1. Read its section in the spec doc and pull its Compose token file (sizes, colors, shapes).
2. Build it on `ButtonBase` (or the primitives directly) so it gets press, hover, focus, ripple and state layers for free.
3. Colors only via `grange.color(<role>)`, never hex. Corners via `grange.corner()` or `shapeCorner`, springs via `useSpring`.
4. Add a story covering every variant, size, state, and dark mode.

## Known gaps

- Group widening uses padding, so a squeezed neighbour's label can clip if it has almost no padding left. Same limit as Compose.
- Connected group inner corners use the Small token (8px, 4px pressed) at every size; Compose only publishes the Small values.
- No visual regression tests yet. Playwright screenshots of the stories are the planned next step.

See `NOTICE` for Apache 2.0 attributions (Material Web, Jetpack Compose).
