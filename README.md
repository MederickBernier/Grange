# @jyga/m3e-react

Material 3 Expressive components for React, built on our own spec reference instead of a paid library.
Google never shipped M3 Expressive for the web, so this package implements it from Google's token values.

**Stack:** React 18/19 · [React Aria](https://react-spectrum.adobe.com/react-aria/) for behavior and accessibility · [Motion](https://motion.dev) for spring physics · plain CSS custom properties + CSS Modules (works next to Tailwind, CSS Modules or anything else).

## Quick start

```bash
pnpm install
pnpm storybook        # http://localhost:6006
pnpm test             # unit tests
pnpm build            # tokens + library -> dist/
```

In an app:

```tsx
import { M3EProvider, Button, ToggleButton, ButtonGroup } from '@jyga/m3e-react';
import '@jyga/m3e-react/styles.css';

<M3EProvider scheme="expressive">
  <Button variant="filled" size="m" onPress={save}>Save</Button>
</M3EProvider>
```

Dark mode follows `prefers-color-scheme`; force it with `data-theme="dark"` (or `"light"`) on `<html>` or any container.

## What's here

| Area | Contents |
| --- | --- |
| Tokens | `tokens/m3e-tokens.json` (Google's values) + `tokens/theme.json` (our seed color and overrides) → `pnpm tokens` → `src/tokens/generated/tokens.css` and `tokens.ts` |
| Motion | `M3EProvider` (expressive / standard scheme, reduced-motion aware), `useSpring(name)` for the six M3E springs |
| Primitives | State layer, ripple, focus ring, elevation, 48px touch target (`src/primitives`), and `ButtonBase`, the shared interactive core |
| Components | `Button` (5 variants × 5 sizes × round/square), `ToggleButton`, `IconButton` (4 variants, 3 widths, toggle), `ButtonGroup` (pressed item widens 15%), `ConnectedButtonGroup` (single / multi select) |
| Storybook | Every component and state, light/dark and expressive/standard toolbar switches, and **Foundations / Motion playground** for tuning springs live |

## Theming

- **Brand color:** set `seed` in `tokens/theme.json` and run `pnpm tokens`. Palettes are generated with Google's `material-color-utilities` (Tonal Spot), and roles map to tones exactly as in Compose.
- **Figma Variables:** paste exported hex values into `overrides.light` / `overrides.dark` (keys are role names such as `primary`, `surface-container-high`). Overrides win over generated values.
- **Fonts:** `typeface.brand` / `typeface.plain` in the same file. The app is responsible for loading the font files.

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
3. Colors only via `--md-sys-color-*` roles, never hex. Shapes via `shapeCorner`, springs via `useSpring`.
4. Add a story covering every variant, size, state, and dark mode.

## Known gaps

- Group widening uses padding, so a squeezed neighbour's label can clip if it has almost no padding left. Same limit as Compose.
- Connected group inner corners use the Small token (8px, 4px pressed) at every size; Compose only publishes the Small values.
- No visual regression tests yet. Playwright screenshots of the stories are the planned next step.

See `NOTICE` for Apache 2.0 attributions (Material Web, Jetpack Compose).
