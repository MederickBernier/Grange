# @jyga/grange-react

**Material 3 Expressive components for React.** Google never shipped M3 Expressive for the web,
so this library implements it from Google's own published values: the token files are read
straight out of androidx by a script, not transcribed from screenshots of the spec.

[**Documentation and live examples →**](https://mederickbernier.github.io/Grange/)

Every component is three things:

- **Behaviour** from [React Aria](https://react-spectrum.adobe.com/react-aria/) wherever a hook
  exists for it, so the keyboard, focus management and announcements are the ones Adobe
  maintains rather than ones invented here.
- **Geometry and colour** from Compose's token files wherever they exist. Where they do not —
  Material has no gauge, no barcode, no spacing scale — the value is chosen, and the reason is
  written at the value.
- **A written decision** wherever the two disagree or neither applies. Those are in the source,
  above the component, and they are what the documentation site renders.

101 components, 1,339 tests, 512 visual baselines.

---

## Install

```sh
npm install @jyga/grange-react
# pnpm add @jyga/grange-react
# yarn add @jyga/grange-react
```

React 18.2 or newer is a peer dependency. Everything else the components need — React Aria,
React Stately, Motion, `@internationalized/date` — comes with the package.

> **ESM only.** The package ships `"type": "module"` with no CommonJS build. Vite, Next.js,
> Remix, Parcel and modern Webpack handle that as a matter of course; a project still running
> `require()` through an old bundler will not.

## Quick start

```tsx
import { GrangeProvider, FilledButton, OutlinedTextField } from '@jyga/grange-react';
import '@jyga/grange-react/styles.css';

export function App() {
  return (
    <GrangeProvider>
      <OutlinedTextField label="Name" />
      <FilledButton onClick={() => save()}>Save</FilledButton>
    </GrangeProvider>
  );
}
```

Two things are doing the work there.

**The stylesheet carries the design tokens.** Every colour role, type style, shape corner,
duration, easing and spacing step is a CSS custom property in `styles.css`. Import it once,
anywhere, before anything renders. Without it the components have no values to read and will
look unstyled.

**`GrangeProvider` carries motion and configuration.** It is optional for a single button and
necessary for anything spring-animated, and it is where app-wide defaults, class names and
behaviour overrides live. Nest providers to change one subtree.

## Dark mode

Colours follow `prefers-color-scheme` on their own. To force a scheme, set `data-theme` on any
element — the document, or one container:

```html
<html data-theme="dark">
```

```tsx
<div data-theme="light">{/* stays light inside a dark page */}</div>
```

## What is in it

<details>
<summary><strong>101 components</strong> — click to expand</summary>

**Buttons** — `FilledButton`, `FilledTonalButton`, `OutlinedButton`, `ElevatedButton`,
`TextButton`, `IconButton`, `FilledIconButton`, `FilledTonalIconButton`, `OutlinedIconButton`,
`ToggleButton`, `ButtonGroup`, `ConnectedButtonGroup`, `Fab`, `ExtendedFab`, `FabMenu`,
`SplitButton`.

**Form controls** — `FilledTextField`, `OutlinedTextField`, `NumberField`, `MaskedTextField`,
`Checkbox`, `CheckboxGroup`, `Switch`, `RadioGroup`, `Slider`, `Rating`, `Signature`, `Form`,
`FormField`, `FieldArray`.

**Pickers** — `Select`, `ComboBox`, `Autocomplete`, `MultiSelect`, `DropDownTree`,
`MultiSelectTree`, `ColorPicker`, `FlatColorPicker`, `ColorArea`, `ColorSlider`, `ColorWheel`,
`ColorField`, `ColorSwatchPicker`.

**Dates and times** — `Calendar`, `RangeCalendar`, `DateField`, `DatePicker`,
`DateRangePicker`, `DateTimePicker`, `TimeField`, `TimePicker`, plus the `dates` helpers.

**Overlays** — `Dialog`, `Tooltip`, `RichTooltip`, `Menu`, `MenuButton`, `ContextMenu`,
`PopoverTrigger`, `Snackbar`, `BottomSheet`, `SideSheet`, `Window`.

**Navigation and layout** — `AppBar`, `NavigationBar`, `NavigationRail`, `NavigationDrawer`,
`Tabs`, `Breadcrumbs`, `Stepper`, `Stack`, `Grid`, `Splitter`, `TileLayout`, `Card`,
`ExpansionPanel`, `Accordion`, `Divider`, `FloatingToolbar`, `DockedToolbar`.

**Collections** — `List`, `SelectableList`, `TreeView`, `Sortable`, `TransferList`, `Pager`,
`FilterBuilder`, `Carousel`, `Timeline`.

**Display and feedback** — `Avatar`, `Badge`, `Chip`, `ChipGroup`, `Skeleton`, `Search`,
`LinearProgress`, `CircularProgress`, `ChunkProgress`, `LoadingIndicator`, `ArcGauge`,
`CircularGauge`, `RadialGauge`, `LinearGauge`, `Sparkline`, `Barcode`, `QRCode`, `Icon`.

**Files** — `Upload`, `DropZone`.

</details>

Beyond the components: a typed **data layer** (`query` — filter, sort, group, aggregate and
page, locale-aware and non-mutating), the **shape library** (all 35 M3E shapes by name, as a
port of androidx's rounded-polygon geometry), and the **motion system** (the six M3E springs,
reduced-motion aware).

## Theming

Two namespaces are in play, deliberately. `--md-sys-*` and `--md-ref-*` are Google's token
names, kept verbatim so every value cross-references Compose and the Figma variables.
`--grange-*` and `grange-*` are this library's own — and the distinction is load-bearing: the
spacing scale is `--grange-space-*` precisely because Material publishes no spacing tokens, and
putting a chosen value in Google's namespace would claim a provenance it does not have.

### From CSS

Every token is a custom property, so an override is an ordinary rule:

```css
:root {
  --md-sys-color-primary: #005bbb;
  --md-sys-shape-corner-large: 20px;
}
```

### From Sass

The Sass API validates names, which `var(--typo)` cannot — a misspelling is a build error
listing the near misses:

```scss
@use '@jyga/grange-react/scss' as grange;

.acme-brand {
  @include grange.theme(
    $colors: (primary: #005bbb, surface-container-low: #eef3fb),
    $corners: (large: 20px),
    $spacing: (lg: 20px)
  );
}

.callout {
  color: grange.color(on-primary-container);
  border-radius: grange.corner(large-increased);
  padding: grange.space(lg);
  transition: opacity grange.duration(short3) grange.easing(emphasized);
  @include grange.typescale(title-medium);
}
```

Roles you do not list keep following the generated palette and the light/dark switch.

### From a seed colour

To regenerate the whole palette from one brand colour you need the source, not the package:
set `seed` in `tokens/theme.json` and run `pnpm tokens`. Palettes come from Google's
`material-color-utilities` (Tonal Spot) and roles map to tones exactly as Compose does. Exported
Figma hex values go in `overrides.light` / `overrides.dark` and win over generated ones.

## Configuration

`GrangeProvider` carries four things a product can change without forking a component. Providers
nest and merge, so a subtree changes one part and inherits the rest.

```tsx
<GrangeProvider
  defaultProps={{ Button: { variant: 'tonal', size: 'm' } }}
  classNames={{ Button: { root: 'shadow-sm', label: 'uppercase' } }}
  behavior={{ ripple: { enabled: false }, springs: { press: 'fastSpatial' } }}
  sizes={{ button: { s: { height: 32, padding: 10 } } }}
>
```

| Field | Changes |
| --- | --- |
| `defaultProps` | What a bare `<Button>` means. Props at the call site still win |
| `classNames` | The classes each slot carries. Added by default; `{ replace }` drops the library's own |
| `behavior` | Ripple timings and whether it runs, which spring each interaction uses, the touch-target threshold |
| `sizes` | Height, padding, icon box, gap and corner radii per size |

Hoist or memoize the objects you pass, so the provider does not rebuild its config on every
parent render.

Every slot also carries a **stable, unhashed hook class** that no override removes and that the
library attaches no styles to. It is there so plain CSS and tests can find the element:

```css
.grange-button[data-variant='filled'] { text-transform: uppercase; }
```

State comes from the `data-*` attributes the components already set: `data-variant`,
`data-size`, `data-shape`, `data-selected`, `data-hovered`, `data-focus-visible`,
`data-pressed`, `data-disabled`.

## Server rendering

The components render on the server. Three things to know:

- **Mark them client components.** In Next.js's app router, a file importing anything from this
  package needs `'use client'` at the top — these are interactive controls with state and
  effects, not static markup.
- **Import the stylesheet once**, in the root layout, not per component.
- **Overlays portal to `document.body`** by default. Pass `portalContainer` to `GrangeProvider`
  to scope them somewhere else, which is what a shadow root or a modal host needs.

## Accessibility

This is the reason the library is built on hooks rather than on markup. What that buys, in
practice:

- Keyboard parity for everything that can be dragged — the splitter, the window, the tile
  layout, `Sortable`. Reordering a list with the arrow keys is a path most drag-and-drop
  libraries do not have at all.
- Announcements where a press changes something elsewhere: a pager's summary, a transfer list's
  moves, an upload's per-file status are all live regions.
- Roles chosen for what the markup can actually hold. `TreeView` is a `treegrid` and `Sortable`
  is a grid, because a `treeitem` and a listbox `option` cannot contain a focusable control —
  which is a thing people put in tree rows every day.
- Where no ARIA role fits — a window's move handle, a tile's resize grip — the element is a
  labelled focus stop and the component says so in its own documentation rather than borrowing
  a role that would describe it wrongly.

Known limits are listed in [`docs/components.md`](docs/components.md); the honest one is that
`Signature` cannot be used without a pointer, and nothing can fix that.

## TypeScript

Types ship with the package. Everything is written under `strict` and
`noUncheckedIndexedAccess`, and the public API has no `any`.

## Documentation

| | |
| --- | --- |
| [Live docs and examples](https://mederickbernier.github.io/Grange/) | Every component, both colour schemes, both motion schemes, with the written reasoning behind each one |
| [`docs/components.md`](docs/components.md) | The Material 3 catalog — all 36 of it — and the recorded gaps |
| [`docs/kendo-catalog.md`](docs/kendo-catalog.md) | 144 KendoReact components mapped against this library: 101 covered, 43 out of scope with a reason each |
| [`docs/contributing.md`](docs/contributing.md) | Building from source, the token pipeline, the test suites, adding a component, releasing |

## Licence

MIT — see [LICENSE](LICENSE).

Token values, the shape library and some geometry are derived from Apache-2.0 projects
(Material Web, Jetpack Compose, androidx.graphics.shapes). [`NOTICE`](NOTICE) records what came
from where, and is published with the package because Apache 2.0 requires it to travel with the
software.
