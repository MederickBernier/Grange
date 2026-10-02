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
| Overrides | `GrangeProvider` takes `defaultProps`, `classNames` (per slot, add or replace), `behavior` (ripple, spring roles, touch target, inner corners) and `sizes` (geometry). Providers nest and merge |
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

## Overrides beyond color

`GrangeProvider` carries four things a product can change without forking a component. Providers
nest and merge, so a subtree can change one part and inherit the rest.

```tsx
<GrangeProvider
  defaultProps={{ Button: { variant: 'tonal', size: 'm' } }}
  classNames={{ Button: { root: 'shadow-sm', label: 'uppercase tracking-wide' } }}
  behavior={{ ripple: { enabled: false }, springs: { press: 'fastSpatial' } }}
  sizes={{ button: { s: { height: 32, padding: 10 } } }}
>
```

| Field | Changes |
| --- | --- |
| `defaultProps` | What a bare `<Button>` means. Props at the call site still win |
| `classNames` | The classes each slot carries (`root`, `label`, `icon`) |
| `behavior` | Ripple timings and whether it runs, which spring each interaction uses, the touch-target threshold, connected-group inner corners |
| `sizes` | Height, padding, icon box, gap and corner radii per size |

Hoist the objects you pass, or memoize them, so the provider does not rebuild its config on
every parent render.

### Class names

Overrides **add** by default, so theming cannot accidentally break layout. `{ replace }` drops
the library's own classes for that slot, for a team restyling from scratch. Layers apply outer
provider → inner provider → instance `classNames` → `className`.

```tsx
<Button classNames={{ label: 'uppercase' }} />                 // added
<Button classNames={{ root: { replace: 'my-button' } }} />     // library classes dropped
```

Each slot also carries a **stable, unhashed hook class** that no override ever removes and that
the library attaches no styles to. It is there so plain CSS and tests can find the element:

```css
.grange-button[data-variant='filled'] { text-transform: uppercase; }
```

The hooks are `grange-button`, `grange-icon-button`, `grange-button-label`, `grange-button-icon`,
`grange-button-group`, `grange-connected-group`, `grange-connected-item`, plus the primitives
`grange-state-layer`, `grange-ripple`, `grange-elevation` and `grange-touch`. State comes from the
`data-*` attributes the components already set: `data-variant`, `data-size`, `data-shape`,
`data-selected`, `data-hovered`, `data-focus-visible`, `data-pressed`, `data-disabled`.

### Behavior

`springOverrides` retunes a spring; `behavior.springs` reassigns which spring an interaction
uses — `press` (corner morph), `selection` (toggle shape swap) and `groupWidth` (group widening).

Turning the ripple off is not just cosmetic: a pointer press then falls back to the pressed
state layer, the way a keyboard press already does, so the press still reads.

### Size geometry

Geometry flows from the config outward. `src/components/Button/specs.ts` is the only place it is
written down; the component resolves its spec and hands CSS `--_height`, `--_gap` and `--_icon`.
It works that way because the pill radius is derived from `height` in JS and the padding is
spring-animated, so a CSS-only override would let the two drift. Override it through `sizes` and
both stay in step.

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
- Connected group inner corners default to the Small token (8px, 4px pressed) at every size, because Compose only publishes the Small values. Override them with `behavior.connectedInnerCorner`.
- No visual regression tests yet. Playwright screenshots of the stories are the planned next step.

See `NOTICE` for Apache 2.0 attributions (Material Web, Jetpack Compose).
