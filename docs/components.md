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
| Done | 36 |
| Remaining | 0 |

Plus `Icon`, which the catalog does not list as a component of its own although Material Web
ships it as `md-icon`, so it is not counted above.

The catalog is complete. Nearly all of it sits on a React Aria hook, which is where the keyboard
and screen-reader behavior come from, and on a captured Compose token file, which is where the
geometry comes from. The last two, side sheets and the carousel, had neither: both their behavior
and their numbers are ours, and every value either of them uses is labelled in its `specs.ts`
with the part of the spec it came from.

What is left is not components but depth: the gaps recorded below, and the ones in the README.

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
| Checkbox | Checked, unchecked and indeterminate, error state, real `<input type="checkbox">` under it. `CheckboxGroup` validates a set together, on `useCheckboxGroup`, and every box in it points at the one message |
| Switch | Handle grows 16 to 24 to 28 on the selection spring, optional icons, real input with the switch role |
| Radio button | `RadioGroup` owns the value and the arrow keys; vertical or horizontal, error state, per-option disable |
| Sliders | The Expressive restyle: 16px track, 4 by 44 handle in a gap, narrowing while held. Single or range, opt-in stop indicators, value bubble |
| Text fields | Filled and outlined, floating label, supporting and error text, icons, prefix and suffix, counter, multiline, aria or native validation, and the password reveal, which is on by default for `type="password"` |
| Dialogs | Modal, scroll locked, rest of the page hidden from assistive tech, Escape and outside-click, optional icon and full screen |
| Tooltips | `Tooltip` is the plain variant: warmup delay, immediate on focus, never on touch, flips when there is no room. `RichTooltip` is the rich one, which is a different kind of thing — a non-modal `role="dialog"` popover, hover or persistent, with a grace period so the pointer can reach the action inside it |
| Menus | Anchored, sections, selection, disabled items, typeahead and full keyboard from the collection. All three styles: the default plus the M3E `standard` and `vibrant` restyles, which are colour only |
| Snackbar | Queue outside React, one visible by default, single action, optional dismiss, held open while hovered |
| Select † | Filled and outlined, floating label, rich options, real hidden select so it posts in a form |
| Tabs | Primary and secondary, stacked or inline icons, scrollable strip, one tab stop with arrow navigation |
| Cards | Elevated, filled and outlined; plain by default, or a button or link when given a handler |
| Lists | Two kinds. `List` is markup: one, two and three line rows, leading and trailing slots, trailing text, rows that become buttons or links, selection by composition. `SelectableList` is a listbox: single or multiple selection, `onAction`, typeahead, disabled rows by key, vertical or a horizontal snapping strip |
| App bars | Five sizes including the two M3E flexible ones, subtitle, leading and trailing controls, the on-scroll treatment |
| Navigation bar | Stacked or inline items, the taller bar, badges, selected icons, links or buttons, aria-current |
| Navigation rail | Collapsed at 96 or 80px, expanded inline within the tokens' 220 to 360px range, header slot |
| Navigation drawer | Modal or standard, either edge, headlines, reusing the shared navigation item resized to the drawer's own pill |
| Bottom sheets | Modal or standard, drag handle that works from the pointer and the keyboard, drag or Escape to dismiss |
| Chips | All four kinds, the M3E shape change on selection, elevated option, removable with the remove button beside the action rather than inside it |
| Badges | Dot and counted, hidden from assistive tech unless labelled |
| Search | Searchbox semantics, Escape to clear, docked or full screen view, locale-aware filtering re-exported |
| Loading indicator | The M3E morph, over the real 35-shape library. Reduced motion holds a shape still |
| Date pickers | `Calendar` and `RangeCalendar`, on `useCalendar` and `useRangeCalendar`: month navigation, min and max, unavailable dates, full keyboard. Docked as-is, or modal by putting it in a `Dialog`. React Aria brings the first day of the week, the weekday and month names and the non-Gregorian arithmetic |
| Side sheets | `SideSheet`, modal or standard, on either edge, with a header, bottom actions and an inner edge that can be dragged or arrow-keyed to resize between 256 and 400px. No Compose token file exists for it, so it borrows the drawer's |
| Carousel | `Carousel` in the spec's four layouts, including the vertical full-screen one. A real scroll container with CSS snapping, so touch, wheel, momentum and the scrollbar are the platform's; the tab stop, the item-sized arrow keys and mouse dragging are added |
| Time pickers | Both modes the spec draws: `TimeField` is the input one, on `useTimeField`, with a segment per part, arrow keys and typing and optional seconds; `TimePicker` is the dial, a circular slider with two rings on a 24-hour face. 12 or 24 hour from the locale |
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
| ~~Menu semantics~~ ✅ | Closed, but not by moving `FabMenu` onto `useMenu`. It now has typeahead, and the arrows open it from the toggle onto the end they point at, alongside the roving focus it already had | The collection was the wrong trade here. An item is a `ButtonBase`, which is what gives it the FAB's shape, ripple, state layer, press spring and link rendering; `ButtonBase` routes its props through `useButton`, which filters them to real DOM attributes, so `useMenuItem`'s handlers would be dropped on the way through, and layering its `usePress` over `useButton`'s would put two press systems on one node. The collection would have cost the item API and the FAB rendering to buy thirty lines of typeahead |
| ~~State layer~~ ✅ | | Done. `react-stately` is a direct dependency and externalised from the bundle, which unblocks every remaining control that needs state: radio, slider, select, menus, tabs |
| ~~Collections~~ ✅ | | Done through `Menu`. Items are described with `Item` and read by `useTreeState`, which is what pays for typeahead. The identifier is the React `key`, not an `id` prop, which is this API's convention and is documented on `MenuItem`. Select, Lists and Tabs reuse the same shape |
| ~~Link rendering~~ ✅ | | Done. An `href` renders `motion.a` with `elementType: 'a'`, keeping the button role so the announced role matches the keyboard behavior. A disabled button drops the href |
| ~~Form integration~~ ✅ | | Done, and it turned out `useButton` already emitted `type`, `form`, `name` and `value`; it only needed tests, including a real form submission |
| ~~RTL~~ ✅ | | Done. `Icon` takes `flipInRtl`, the connected group mirrors its outer corners through `useLocale`, and the dividers use logical margins |
| ~~Token capture~~ ✅ | | Done, twice over. `pnpm capture-tokens <Name>` reads the generated Compose token objects straight out of androidx, so a component's geometry is never hand-typed, and it reproduces every previously captured object byte for byte. `pnpm capture-shapes` does the same for the shape library, which lives in MaterialShapes.kt rather than in a token object |
| ~~Side sheet tokens~~ ✅ | Resolved as far as it can be. Compose publishes no token file for side sheets: SheetSideTokens and SideSheetTokens are both 404, and only SheetBottomTokens exists | The sheet borrows NavigationDrawerTokens, which is captured, because a side sheet and a navigation drawer are the same panel on the same edge and should not disagree by a pixel. A test asserts the two stay equal |
| ~~Clock dial~~ ✅ | Done. `TimePicker` is the dial mode, on the captured TimePickerTokens: a 256px face, a 48px handle, the hour and minute boxes and the AM/PM selector, with `TimeField` as the other mode behind the same value | It is a circular slider and says so, `role="slider"` with an `aria-valuetext`. The obvious markup — a ring of twelve buttons — would give a keyboard user twelve tab stops and no way to set a minute that is not a multiple of five. The face's arithmetic is in `dial.ts` and tested on its own |
| ~~Carousel tokens~~ ✅ | Resolved as far as it can be. There is no CarouselTokens object either: the Compose carousel keeps its dimensions in its own implementation rather than in a generated token file | The sizes are the spec page's, each one labelled in `specs.ts` with the part of the spec it comes from. The one tokenised value is the corner, CornerExtraLarge at 28px |
| ~~Scoped hook classes~~ ✅ | Fixed, and it had been wrong since the drawer landed. Every class in a `*.module.scss` is scoped, including one named after another component's hook class, so `.grange-navigation-item` compiled to `grange-grange-navigation-item-xxxx` and matched nothing: the drawer's item resizing never applied, and the vibrant toolbar's button colours never applied | They are `:global()` now, and `src/styles.test.ts` fails the build on an unwrapped one. Nothing else would catch it — the stylesheet compiles, the rule is simply dead |
| ~~Carousel semantics~~ ✅ | Resolved by composition rather than by rewriting it. The carousel stays a scroll region — `role="group"` with `aria-roledescription="carousel"`, a tab stop, arrow keys that move a whole item — because browsing is not choosing, and an ARIA listbox means a set of options | A strip of items to choose from is `SelectableList` with `orientation="horizontal"`: the same CSS scroll snapping, but each item is an option with a selected state. Making `Carousel` itself a collection would have changed its children into keyed descriptors to buy semantics that are wrong for browsing |
| **Horizontal listbox arrows** | React Aria's `useListBox` does not pass the text direction into the keyboard delegate it builds, so a horizontal listbox resolves both left-of and right-of to "next": it walks forwards on either arrow and cannot be walked back | `SelectableList` builds its own `ListKeyboardDelegate` with the direction from `useLocale`, which fixes it and carries the collator for typeahead at the same time. Worth revisiting whenever react-aria is upgraded |
| ~~Shape library~~ ✅ | Done, all 35 of them. `shapeLibrary` in the token file is 35 **names** and no geometry, so `pnpm capture-shapes` reads the real definitions out of MaterialShapes.kt instead, and `src/shapes` is a port of the rounded-polygon geometry in `androidx.graphics.shapes`: a vertex list with a radius and a smoothing per corner becomes a closed list of cubics | `Morph` is deliberately not ported. Matching the features of two shapes to decide which corner becomes which is the other half of that library; the loading indicator flattens and resamples each outline to the same number of points and interpolates those, which is why a twelve-cornered shape can become a triangle without a side collapsing |

## Remaining components

None. The 36 in the catalog are built, which is what the table above counts.

The dagger entries, `Select` and `Icon`, are not separate entries in the M3 catalog — it folds
select into menus and text fields, and does not list the icon at all — so they are built and
excluded from the counts rather than counted twice.

## Suggested order

Each phase is useful on its own and unblocks the next.

1. ~~**Foundations**~~ — done: `Icon`, `Divider`, link rendering and form props on `ButtonBase`, RTL.
2. ~~**Form controls**~~ — done: Checkbox, `CheckboxGroup`, Switch, Radio button, Sliders, Text fields including the password reveal.
3. ~~**Overlay infrastructure plus its components**~~ — done: the portal and positioning layer, Dialogs, Tooltips (plain and rich), Menus (all three styles), Select and Snackbar. — the portal and positioning layer, then Dialogs, Menus, Select, Tooltips, Snackbar. One hard piece of plumbing, then five components come cheaply.
4. ~~**Navigation and structure**~~ — done: Toolbars, Tabs, Cards, Lists (both kinds), App bars, Navigation bar, Navigation rail, Navigation drawer.
5. ~~**M3E signature pieces**~~ — done: FAB, Split button, Progress indicators, Extended FAB, FAB menu, Loading indicator, and the shape library the last of those wanted. These are what makes the library visibly M3 Expressive rather than generic M3, and the ones with no web precedent to port. Token data for all of them is captured.
6. ~~**Long tail**~~ — done: Bottom sheets, Chips, Badges, Search, Loading indicator, Date pickers, Time pickers, the Carousel and Side sheets. The last two had neither a React Aria hook nor a token file, so both their behavior and their numbers are ours and labelled as such.

The catalog is finished, and so is the gap list that followed it, with two things left open and
written down above: `useGridList`, for a row that carries its own controls, and the horizontal
listbox arrows upstream does not wire up, which `SelectableList` works around.

That step is done too: `pnpm visual` shoots all 146 stories in both colour schemes and compares
them against `visual/__screenshots__`, which is the only check here that notices a token or a
stylesheet quietly redrawing something. What stands in its way now is not coverage but
portability — the baselines belong to the machine that took them, because nothing loads a
webfont, so the next real step is a pinned container image to take them in.

## Before building any of them

The recipe in the README still applies: read the component's spec section, pull its Compose token
file for sizes, colors and shapes, build on `ButtonBase` or the primitives, reference tokens only
through `grange.color()` and friends, and add a story covering every variant, size, state and
dark mode. The capability lists above are a scope sketch, not a substitute for the token files.

## Visual regression

`pnpm visual` builds Storybook, serves the static build, and takes a picture of every story in
both colour schemes, comparing each against `visual/__screenshots__`. `pnpm visual:update`
rewrites the baselines.

The reason it exists is that no other check here would notice: change a token, a stylesheet or a
shape and every unit test still passes while the component is drawn differently. A deliberate
probe confirmed it works — adding `letter-spacing: 0.08em` to the button label moved 2 to 3% of
the pixels in the button stories and failed them, and reverting it went green again.

Determinism comes from three settings rather than from luck:

| | Why |
| --- | --- |
| `reducedMotion: 'reduce'` | Components that animate on mount settle immediately, and the loading indicator holds one shape instead of morphing, because it reads the same media query |
| `animations: 'disabled'` | Freezes CSS animations and transitions at their end state, which covers the indeterminate progress indicators |
| A pinned viewport and device scale factor | A screenshot is only comparable with another taken the same size |

With those, nothing needed excluding: the indeterminate progress indicators, the morphing loading
indicator and the motion playground were each checked over three runs and left in. The skip list
in `visual/stories.spec.ts` is empty and kept for the first story that does need it.

The one thing not pinned is the font. The typeface tokens fall back to the system sans and nothing
loads a webfont, so the baselines belong to the machine that took them. Playwright suffixes them
with the platform, which is not enough on its own: two Linux machines with different fonts
installed will still disagree. A container image is the fix and is not set up here.
