# Component inventory

The complete Material 3 component catalog, what Grange has, and what each remaining component
needs. The catalog is the 36 components under `m3.material.io/components` (taken from the M3
sitemap, so it is their list rather than a guess).

Three reference points per component:

- **M3E** — one of the fourteen components Material 3 Expressive added or restyled. These have
  current spec pages and Compose token files, so they are the ones worth building from directly.
- **Material Web** — Google shipped it as a web component, so there is a DOM structure, a
  stylesheet and an interaction model to port instead of invent. Twenty of the 36 exist there.
- **React Aria** — the behavior and accessibility layer is already in our dependency tree. This
  is the single biggest factor in effort: a component with a hook is mostly tokens and CSS.

## Status

| | Count |
| --- | --- |
| In the M3 catalog | 36 |
| Done | 32 |
| Remaining | 4 |

Plus `Icon`, which the catalog does not list as a component of its own although Material Web
ships it as `md-icon`, so it is not counted above.

Of the 4 remaining, split by how much of the behavior already exists:

| | Count | Meaning |
| --- | --- | --- |
| Dedicated React Aria hook | 2 | The behavior and accessibility are solved. Mostly tokens, CSS and motion |
| Generic React Aria pieces only | 2 | `usePress`, `useButton` or `useModalOverlay` apply, but the structure and motion are ours |
| No React Aria support | 2 | Behavior written from scratch: the carousel, and side sheets, which have no tokens either |

### Done

| Component | Notes |
| --- | --- |
| Buttons | 5 variants × 5 sizes × round/square, one component per variant |
| Icon buttons | 4 variants, 3 widths, plain and toggle |
| Button groups | Standard (pressed item widens 15%) and connected (single / multi select) |
| Segmented buttons | Covered by `ConnectedButtonGroup`, which M3E replaces segmented buttons with |
| Divider | Horizontal and vertical, full-width and inset (both ends, start, end), on `useSeparator` |
| FAB | 4 sizes from FabSmall/Baseline/Medium/Large, 4 colour options, level 3 to 4 elevation, renders as a link |
| Split button | All 5 sizes from the SplitButton token files, 4 colour variants, inner corners that grow on hover and press and round fully when expanded, RTL mirrored |
| Progress indicators | Linear and circular, determinate and indeterminate, each flat or with the M3E wavy track, on `useProgressBar` |
| Extended FAB | 3 sizes, 4 colours, lowered elevation, collapses to the plain FAB of the same height |
| FAB menu | Labelled actions revealed nearest-first, with focus containment, arrow keys, Escape and outside-click |
| Toolbars | Floating (standard and vibrant, horizontal and vertical) and docked, on `useToolbar` for arrow keys, RTL and Tab-out |
| Checkbox | Checked, unchecked and indeterminate, error state, real `<input type="checkbox">` under it |
| Switch | Handle grows 16 to 24 to 28 on the selection spring, optional icons, real input with the switch role |
| Radio button | `RadioGroup` owns the value and the arrow keys; vertical or horizontal, error state, per-option disable |
| Sliders | The Expressive restyle: 16px track, 4 by 44 handle in a gap, narrowing while held. Single or range, opt-in stop indicators, value bubble |
| Text fields | Filled and outlined, floating label, supporting and error text, icons, prefix and suffix, counter, multiline, aria or native validation |
| Dialogs | Modal, scroll locked, rest of the page hidden from assistive tech, Escape and outside-click, optional icon and full screen |
| Tooltips | Plain variant, warmup delay, immediate on focus, never on touch, flips when there is no room. Rich variant captured but not built |
| Menus | Anchored, sections, selection, disabled items, typeahead and full keyboard from the collection. The M3E Standard and Vibrant menu styles are captured but not built |
| Snackbar | Queue outside React, one visible by default, single action, optional dismiss, held open while hovered |
| Select † | Filled and outlined, floating label, rich options, real hidden select so it posts in a form |
| Tabs | Primary and secondary, stacked or inline icons, scrollable strip, one tab stop with arrow navigation |
| Cards | Elevated, filled and outlined; plain by default, or a button or link when given a handler |
| Lists | One, two and three line rows, leading and trailing slots, trailing text, rows that become buttons or links, selection by composition |
| App bars | Five sizes including the two M3E flexible ones, subtitle, leading and trailing controls, the on-scroll treatment |
| Navigation bar | Stacked or inline items, the taller bar, badges, selected icons, links or buttons, aria-current |
| Navigation rail | Collapsed at 96 or 80px, expanded inline within the tokens' 220 to 360px range, header slot |
| Navigation drawer | Modal or standard, either edge, headlines, reusing the shared navigation item resized to the drawer's own pill |
| Bottom sheets | Modal or standard, drag handle that works from the pointer and the keyboard, drag or Escape to dismiss |
| Chips | All four kinds, the M3E shape change on selection, elevated option, removable with the remove button beside the action rather than inside it |
| Badges | Dot and counted, hidden from assistive tech unless labelled |
| Search | Searchbox semantics, Escape to clear, docked or full screen view, locale-aware filtering re-exported |
| Loading indicator | The M3E morph, over the regular shapes. Reduced motion holds a shape still |
| Icon † | Sizes and colours an SVG or a Material Symbols ligature. Reads `--grange-icon-size`, so it matches whatever control it sits in. Filled axis, RTL flip |

† Not a separate entry in the M3 catalog, so it is excluded from the counts.

Also done, as primitives rather than components: state layer, ripple, focus ring, elevation and
the 48px touch target. Material Web ships those four as components (`md-ripple`,
`md-focus-ring`, `md-elevation`); here they are `src/primitives` plus `ButtonBase`.

## Foundations to build first

Not components, but most of the list below is blocked on them.

| Gap | Why it blocks things | Notes |
| --- | --- | --- |
| ~~Icon~~ ✅ | | Done. The sizing contract is `--grange-icon-size`, which the buttons publish and `Icon` reads |
| ~~Overlay layer~~ ✅ | | Done. `Overlay` portals and contains focus, `useModalOverlay` brings the scroll lock, the Escape and outside-click handling and `ariaHideOutside`. `portalContainer` on `GrangeProvider` scopes where overlays land; it is passed per overlay because React Aria's `PortalProvider` is still an `UNSAFE_` export |
| ~~Positioning~~ ✅ | | Done for tooltips via `useOverlayPosition`, which flips when there is no room. Menus and select will reuse the same hook |
| **List selection** | `List` is semantic markup rather than a listbox, since a row is content and `Select` already owns the listbox role. Selection is a `Checkbox` or `Radio` in a slot, which is how the spec draws it | A keyboard-navigable selectable list would want `useListBox` or `useGridList`, and is not built |
| **Menu semantics** | `FabMenu` still carries its own roving focus rather than the collection, so it has no typeahead | `useMenu` is in now, so FabMenu can move onto it |
| ~~State layer~~ ✅ | | Done. `react-stately` is a direct dependency and externalised from the bundle, which unblocks every remaining control that needs state: radio, slider, select, menus, tabs |
| ~~Collections~~ ✅ | | Done through `Menu`. Items are described with `Item` and read by `useTreeState`, which is what pays for typeahead. The identifier is the React `key`, not an `id` prop, which is this API's convention and is documented on `MenuItem`. Select, Lists and Tabs reuse the same shape |
| ~~Link rendering~~ ✅ | | Done. An `href` renders `motion.a` with `elementType: 'a'`, keeping the button role so the announced role matches the keyboard behavior. A disabled button drops the href |
| ~~Form integration~~ ✅ | | Done, and it turned out `useButton` already emitted `type`, `form`, `name` and `value`; it only needed tests, including a real form submission |
| ~~RTL~~ ✅ | | Done. `Icon` takes `flipInRtl`, the connected group mirrors its outer corners through `useLocale`, and the dividers use logical margins |
| ~~Token capture~~ ✅ | | Done. `pnpm capture-tokens <Name>` reads the generated Compose token objects straight out of androidx, so a component's geometry is never hand-typed. It reproduces every previously captured object byte for byte |
| **Side sheet tokens** | The catalog lists side sheets, but Compose publishes no token file for them: only SheetBottomTokens exists | Building one means choosing values rather than reading them, so it is the one component here that cannot be token-backed |
| **Shape library** | Partly resolved, and not the way it looked. `shapeLibrary` in the token file is 35 **names** and no geometry, so nothing can be drawn from it. The real shapes are `RoundedPolygon`s in `androidx.graphics.shapes`, defined by vertex lists with per-corner rounding and smoothing | The loading indicator implements the morph for the regular polygons, which can be derived exactly. The irregular ones, the slanted and fan and clam shell, need that library porting, which is a library rather than a component |

## Remaining components

### Selection and input

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |

### Overlays

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |
| Side sheets | | | `useModalOverlay` | Modal and non-modal, left or right, resizable |

† Not a separate entry in the M3 catalog, which folds it into menus and text fields. Material
Web ships it as `md-select`, and an app needs it, so it is listed here and excluded from the
counts above.

### Navigation

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |

### Actions

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |

### Content

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |
| Carousel | | | custom | Multi-browse / uncontained / hero / full-screen layouts, snapping, keyboard and drag. No React Aria hook |

### Pickers

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |
| Date pickers | | | `useCalendar`, `useRangeCalendar`, `useDatePicker`, `useDateRangePicker`, `useDateField` | Docked / modal / modal input, single date and range, month and year navigation. React Aria covers the calendar logic and internationalisation, which is the hard part |
| Time pickers | | | `useTimeField` | Dial and input modes, 12 and 24 hour |

## Suggested order

Each phase is useful on its own and unblocks the next.

1. ~~**Foundations**~~ — done: `Icon`, `Divider`, link rendering and form props on `ButtonBase`, RTL.
2. ~~**Form controls**~~ — done: Checkbox, Switch, Radio button, Sliders, Text fields. A checkbox group still wants `useCheckboxGroup` for shared validation, and the text field has no password reveal yet.
3. ~~**Overlay infrastructure plus its components**~~ — done: the portal and positioning layer, Dialogs, Tooltips, Menus, Select and Snackbar. — the portal and positioning layer, then Dialogs, Menus, Select, Tooltips, Snackbar. One hard piece of plumbing, then five components come cheaply.
4. ~~**Navigation and structure**~~ — done: Toolbars, Tabs, Cards, Lists, App bars, Navigation bar, Navigation rail, Navigation drawer.
5. **M3E signature pieces** — ~~FAB~~, ~~Split button~~, ~~Progress indicators~~, ~~Extended FAB~~, ~~FAB menu~~, then the Loading indicator, which still wants the shape library. These are what makes the library visibly M3 Expressive rather than generic M3, and the ones with no web precedent to port. Token data for all of them is captured.
6. **Long tail** — ~~Bottom sheets~~, ~~Chips~~, ~~Badges~~, ~~Search~~, ~~Loading indicator~~, then Date and Time pickers, the Carousel, and Side sheets. ← next

## Before building any of them

The recipe in the README still applies: read the component's spec section, pull its Compose token
file for sizes, colors and shapes, build on `ButtonBase` or the primitives, reference tokens only
through `grange.color()` and friends, and add a story covering every variant, size, state and
dark mode. The capability lists above are a scope sketch, not a substitute for the token files.
