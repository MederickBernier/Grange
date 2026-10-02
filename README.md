# @jyga/grange-react

Material 3 Expressive components for React, built on our own spec reference instead of a paid library.
Google never shipped M3 Expressive for the web, so this package implements it from Google's token values.

**Stack:** React 18/19 · [React Aria](https://react-spectrum.adobe.com/react-aria/) and React Stately for behavior, state and accessibility · [Motion](https://motion.dev) for spring physics · Sass (CSS Modules) authored over plain CSS custom properties, so it drops in next to Tailwind, CSS Modules or anything else.

## Quick start

```bash
pnpm install
pnpm storybook        # http://localhost:6006
pnpm test             # unit tests
pnpm build            # tokens + library -> dist/
```

In an app:

```tsx
import { GrangeProvider, FilledButton, OutlinedButton } from '@jyga/grange-react';
import '@jyga/grange-react/styles.css';

<GrangeProvider scheme="expressive">
  <FilledButton size="m" onClick={save}>Save</FilledButton>
  <OutlinedButton onClick={cancel}>Cancel</OutlinedButton>
</GrangeProvider>
```

Dark mode follows `prefers-color-scheme`; force it with `data-theme="dark"` (or `"light"`) on `<html>` or any container.

## What's here

| Area | Contents |
| --- | --- |
| Tokens | `pnpm capture-tokens <Name>` reads Compose token objects straight out of androidx into `tokens/m3-expressive.json`, so component geometry is never hand-typed. Then `tokens/m3-expressive.json` (Google's values) + `tokens/theme.json` (our seed color and overrides) → `pnpm tokens` → `src/tokens/generated/tokens.css`, `tokens.ts` and `src/scss/_data.scss` |
| Sass API | `src/scss` → `@use '@jyga/grange-react/scss'`: `theme()` to override roles, `color()` / `corner()` / `duration()` / `easing()` / `type-prop()` to reference them, `typescale()` to apply a text style. Unknown names fail the build |
| Overrides | `GrangeProvider` takes `defaultProps`, `classNames` (per slot, add or replace), `behavior` (ripple, spring roles, touch target, inner corners) and `sizes` (geometry). Providers nest and merge |
| Motion | `GrangeProvider` (expressive / standard scheme, reduced-motion aware), `useSpring(name)` for the six M3E springs |
| Primitives | State layer, ripple, focus ring, elevation, 48px touch target (`src/primitives`), and `ButtonBase`, the shared interactive core. `Icon` sizes itself from `--grange-icon-size`; `Divider` is horizontal or vertical, full-width or inset |
| Components | `Fab` (4 sizes × 4 colours), `ExtendedFab` (3 sizes, collapsible), `FabMenu`, `SplitButton` (5 sizes, expandable trailing half), `FloatingToolbar` and `DockedToolbar`, `Checkbox` (with indeterminate), `Switch`, `RadioGroup` and `Slider` (single or range), `LinearProgress` and `CircularProgress` (determinate or indeterminate, flat or M3E wavy), and one button per variant, as Material Web ships one element each: `FilledButton`, `FilledTonalButton`, `OutlinedButton`, `ElevatedButton`, `TextButton`, and `IconButton` / `FilledIconButton` / `FilledTonalIconButton` / `OutlinedIconButton`. Plus `ToggleButton`, `ButtonGroup` (pressed item widens 15%) and `ConnectedButtonGroup` (single / multi select) |
| Roadmap | [`docs/components.md`](docs/components.md) — the full M3 catalog, what is done, and what each remaining component needs |
| Storybook | Every component and state, light/dark and expressive/standard toolbar switches, and **Foundations / Motion playground** for tuning springs live |

## Component API

One component per variant, the way Material Web ships one custom element per variant and Compose
one composable each. There is no variant string to misspell and no way to ask for two at once.

| Material Web | Here |
| --- | --- |
| `<md-filled-button>` | `<FilledButton>` |
| `<md-filled-tonal-button>` | `<FilledTonalButton>` |
| `<md-outlined-button>` | `<OutlinedButton>` |
| `<md-elevated-button>` | `<ElevatedButton>` |
| `<md-text-button>` | `<TextButton>` |
| `<md-icon-button>` | `<IconButton>` |
| `<md-filled-icon-button>` | `<FilledIconButton>` |
| `<md-filled-tonal-icon-button>` | `<FilledTonalIconButton>` |
| `<md-outlined-icon-button>` | `<OutlinedIconButton>` |

`Button` and `IconButton` keep their `variant` prop for the case the named components cannot
cover, a variant chosen at runtime:

```tsx
<Button variant={variantFromCms}>Save</Button>
```

**Props follow Material Web**, not React Aria, and are mapped onto React Aria internally:
`disabled`, `selected`, `defaultSelected`, `toggle`. `onClick` fires on a real click; `onPress`
also works and additionally covers touch and keyboard activation.

```tsx
<FilledButton disabled>Save</FilledButton>
<IconButton toggle defaultSelected aria-label="Favourite" ariaLabelSelected="Unfavourite">
  <HeartIcon />
</IconButton>
```

**Icons** work like their single `slot="icon"`: one icon, before the label by default, moved
after it by the `trailingIcon` flag.

```tsx
<FilledButton icon={<SendIcon />}>Send</FilledButton>
<TextButton icon={<OpenIcon />} trailingIcon>Open</TextButton>
```

Size and shape stay props, because Material Web has no size scale — M3 Expressive's five sizes
are not in its stable release.

```tsx
<FilledButton size="l" shape="square">Save</FilledButton>
```

**An `href` renders an `<a>`**, as Material Web's buttons do, so you get middle-click and open-in-new-tab.
It keeps the button role and Space-to-activate, so what assistive tech announces matches how the
control behaves. A disabled one drops the href and cannot navigate.

```tsx
<FilledButton href="/save" target="_blank" rel="noreferrer">Save</FilledButton>
```

**Form props work**: `type`, `name`, `value` and `form` reach the `<button>`, and `type` defaults
to `"button"` so a button never submits a form by accident.

**RTL**: `Icon` takes `flipInRtl` for direction-sensitive glyphs, and `ConnectedButtonGroup`
mirrors its outer corners. Wrap the app in React Aria's `I18nProvider` to set the locale.

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
3. Give it one component per variant, built on `ButtonBase`. Colors only via `grange.color(<role>)`, never hex. Corners via `grange.corner()` or `shapeCorner`, springs via `useSpring`.
4. Add a story covering every variant, size, state, and dark mode.

## What's missing

Fifteen of the 36 components in the Material 3 catalog are done: buttons, icon buttons, button
groups, (through `ConnectedButtonGroup`) segmented buttons, `Divider`, `Fab`, `ExtendedFab`,
`FabMenu`, `SplitButton`, the toolbars, the progress indicators, `Checkbox`, `Switch`,
`RadioGroup` and `Slider`, plus `Icon`, which the catalog does not list separately. Of the 21
remaining, 11 have a dedicated React Aria hook, so their behavior and accessibility are already
solved.

See [`docs/components.md`](docs/components.md) for the full catalog, what each remaining
component needs, and the foundations most of them are blocked on.

## Known gaps

- Group widening uses padding, so a squeezed neighbour's label can clip if it has almost no padding left. Same limit as Compose.
- Connected group inner corners default to the Small token (8px, 4px pressed) at every size, because Compose only publishes the Small values. Override them with `behavior.connectedInnerCorner`.
- No visual regression tests yet. Playwright screenshots of the stories are the planned next step.

See `NOTICE` for Apache 2.0 attributions (Material Web, Jetpack Compose).
