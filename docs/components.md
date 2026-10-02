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
| Done | 15 |
| Remaining | 21 |

Plus `Icon`, which the catalog does not list as a component of its own although Material Web
ships it as `md-icon`, so it is not counted above.

Of the 21 remaining, split by how much of the behavior already exists:

| | Count | Meaning |
| --- | --- | --- |
| Dedicated React Aria hook | 11 | The behavior and accessibility are solved. Mostly tokens, CSS and motion |
| Generic React Aria pieces only | 5 | `usePress`, `useButton` or `useModalOverlay` apply, but the structure and motion are ours |
| No React Aria support | 5 | Behavior written from scratch: badges, carousel, loading indicator, navigation bar, navigation rail |

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
| **Overlay layer** | Dialogs, menus, select, tooltips, sheets, snackbars, date and time pickers all need portalling, focus trapping and dismiss handling | React Aria has all of it: `Overlay`, `PortalProvider`, `FocusScope`, `useOverlay`, `useModalOverlay`, `usePreventScroll`, `useInteractOutside`. Needs a portal container on `GrangeProvider` |
| **Positioning** | Menus, tooltips, select and popovers must anchor to a trigger and flip in a viewport | `useOverlayPosition`, `usePopover`, `useOverlayTrigger` |
| **Menu semantics** | `FabMenu` carries its own roving focus, Escape and outside-click rather than React Aria's menu collection, so it has no typeahead | When `useMenu` lands with the overlay layer, FabMenu should move onto it |
| ~~State layer~~ ✅ | | Done. `react-stately` is a direct dependency and externalised from the bundle, which unblocks every remaining control that needs state: radio, slider, select, menus, tabs |
| **Collections** | Lists, menus, select, tabs and chips all need item collections with typeahead and keyboard navigation | React Aria's `Collection` / `CollectionBuilder` and the `ListKeyboardDelegate` |
| ~~Link rendering~~ ✅ | | Done. An `href` renders `motion.a` with `elementType: 'a'`, keeping the button role so the announced role matches the keyboard behavior. A disabled button drops the href |
| ~~Form integration~~ ✅ | | Done, and it turned out `useButton` already emitted `type`, `form`, `name` and `value`; it only needed tests, including a real form submission |
| ~~RTL~~ ✅ | | Done. `Icon` takes `flipInRtl`, the connected group mirrors its outer corners through `useLocale`, and the dividers use logical margins |
| ~~Token capture~~ ✅ | | Done. `pnpm capture-tokens <Name>` reads the generated Compose token objects straight out of androidx, so a component's geometry is never hand-typed. It reproduces every previously captured object byte for byte |
| **Shape library** | M3E's shape morphing (the loading indicator, FAB menu) needs the 35 shapes in `tokens/m3-expressive.json` | `shapeLibrary` is captured in the token file and read by nothing |

## Remaining components

### Selection and input

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |
| Text fields | | ✅ | `useTextField`, `useField` | Filled and outlined, label / placeholder / supporting text, error, prefix and suffix, leading and trailing icons, character counter, multiline, password reveal |
| Search | | | `useSearchField`, `useComboBox`, `useAutocomplete` | Search bar and expanded search view, suggestions list, leading and trailing actions |
| Chips | | ✅ | `useTagGroup` | Assist, filter, input and suggestion chips; selected state, leading icon, trailing remove, elevated and outlined styles |

### Overlays

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |
| Dialogs | | ✅ | `useDialog`, `useModalOverlay` | Basic and full-screen, headline / content / actions, scrim, focus trap, scroll lock, return focus |
| Menus | | ✅ | `useMenu`, `useContextMenu` | Anchored dropdown, submenus, leading and trailing icons, keyboard typeahead, dividers, disabled items |
| Select † | | ✅ | `useSelect`, `useListBox` | Filled and outlined, same field anatomy as text fields, menu of options, keyboard selection |
| Tooltips | | | `useTooltipTrigger` | Plain and rich variants, hover and focus delay, anchored positioning |
| Snackbar | | | `useToast` | Message, optional single action, optional close, auto-dismiss timing, a queue so two never overlap |
| Bottom sheets | | | `useModalOverlay` + custom | Modal and non-modal, drag handle, snap positions, swipe to dismiss. Drag behavior is ours to write |
| Side sheets | | | `useModalOverlay` | Modal and non-modal, left or right, resizable |

† Not a separate entry in the M3 catalog, which folds it into menus and text fields. Material
Web ships it as `md-select`, and an app needs it, so it is listed here and excluded from the
counts above.

### Navigation

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |
| Tabs | | ✅ | `useTabList` | Primary and secondary, icon and label, scrollable, animated indicator |
| App bars | ✅ | | `useLandmark` | Small / medium / large / center-aligned, scroll-driven collapse, leading and trailing actions |
| Navigation bar | ✅ | | — | Bottom bar, 3 to 5 destinations, active indicator, badges. M3E restyled it |
| Navigation rail | ✅ | | — | Vertical, collapsed and expanded, optional FAB and menu slots. M3E restyled it |
| Navigation drawer | | | `useModalOverlay` | Standard and modal, sections with headlines and dividers, badges |

### Actions

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |

### Content

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |
| Cards | | | `usePress`, `useFocusRing` | Elevated / filled / outlined, optional whole-card click target, media and action slots |
| Lists | | ✅ | `useListBox`, `useGridList` | One / two / three line, leading and trailing slots, dividers, selection, keyboard navigation |
| Badges | | | — | Small dot and large numbered, positioned on an icon or a nav item |
| Carousel | | | custom | Multi-browse / uncontained / hero / full-screen layouts, snapping, keyboard and drag. No React Aria hook |
| Loading indicator | ✅ | | custom | M3E's shape-morphing indicator for waits under five seconds. Needs the shape library. New in M3E |

### Pickers

| Component | M3E | Material Web | React Aria | Capabilities needed |
| --- | --- | --- | --- | --- |
| Date pickers | | | `useCalendar`, `useRangeCalendar`, `useDatePicker`, `useDateRangePicker`, `useDateField` | Docked / modal / modal input, single date and range, month and year navigation. React Aria covers the calendar logic and internationalisation, which is the hard part |
| Time pickers | | | `useTimeField` | Dial and input modes, 12 and 24 hour |

## Suggested order

Each phase is useful on its own and unblocks the next.

1. ~~**Foundations**~~ — done: `Icon`, `Divider`, link rendering and form props on `ButtonBase`, RTL.
2. **Form controls** — ~~Checkbox~~, ~~Switch~~, ~~Radio button~~, ~~Sliders~~, then Text fields. All have React Aria hooks, no overlay needed, and they are what an app needs first. A checkbox group still wants `useCheckboxGroup` for shared validation.
3. **Overlay infrastructure plus its components** — the portal and positioning layer, then Dialogs, Menus, Select, Tooltips, Snackbar. One hard piece of plumbing, then five components come cheaply.
4. **Navigation and structure** — ~~Toolbars~~, then Tabs, App bars, Navigation bar / rail / drawer, Cards, Lists.
5. **M3E signature pieces** — ~~FAB~~, ~~Split button~~, ~~Progress indicators~~, ~~Extended FAB~~, ~~FAB menu~~, then the Loading indicator, which still wants the shape library. These are what makes the library visibly M3 Expressive rather than generic M3, and the ones with no web precedent to port. Token data for all of them is captured.
6. **Long tail** — Chips, Search, Badges, Bottom and Side sheets, Date and Time pickers, Carousel.

## Before building any of them

The recipe in the README still applies: read the component's spec section, pull its Compose token
file for sizes, colors and shapes, build on `ButtonBase` or the primitives, reference tokens only
through `grange.color()` and friends, and add a story covering every variant, size, state and
dark mode. The capability lists above are a scope sketch, not a substitute for the token files.
