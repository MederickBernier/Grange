# The KendoReact catalog, mapped

## Context

`ComponentsList.txt` is KendoReact's full component catalog: 42 categories, 145 lines, 144
distinct components (`SmartPasteButton` is listed twice, once misspelled). It is a scope list for
Grange, not an API to copy — Kendo is a different design system and a different kind of product,
weighted towards data-heavy enterprise widgets where Grange is a Material 3 Expressive library.

So the list is read as a **checklist**: what does an app need that Grange does not have yet. The
names stay Material's, with the mapping table below to read the list against.

This is the second catalog the project tracks. [`components.md`](components.md) is the Material 3
catalog, which is complete at 36 of 36; this one continues from there.

### The four decisions behind this plan

| | |
| --- | --- |
| **The ten products are out** | Data Grid, TreeList, PivotGrid, Spreadsheet, Scheduler, Gantt, TaskBoard, PDF Viewer, Map and Editor are each weeks of work and each is a product rather than a component. The rest of the catalog comes first |
| **Gauges and the sparkline only** | The four gauges and the sparkline are plain SVG with no new dependencies. The other 23 chart types are a charting library's job |
| **Only the cheap utilities** | Data Query and Date Math as small typed utilities, because the pickers and the collections want them anyway. Excel export, PDF generation, the file saver and the drawing library stay out |
| **Material names, with a mapping** | `Select`, not `DropDownList`. The table below is how the Kendo list is read |

### What this costs in design, not just code

Material 3 has a spec for almost none of this. There is no `StepperTokens`, no `SplitterTokens`,
no `ColorPickerTokens`. `pnpm capture-tokens` will have nothing to read for most of these
components, so their geometry has to be **chosen from the M3 primitives** — the colour roles,
shape scale, type scale, elevation levels and motion springs that are already captured — rather
than read out of androidx.

That is the same position the carousel and the side sheet were in, and the precedent they set
applies: every chosen value is labelled in `specs.ts` with where it came from, and where a
tokenised neighbour exists it wins over the spec page. A few examples of neighbours worth
borrowing: `Avatar` takes `ListTokens`' 40px avatar, `ExpansionPanel` takes the card and list
tokens, `Pager` takes the icon button's geometry, the gauges take the progress indicators'
track and stop-indicator values.

## Status

| | Count |
| --- | --- |
| Distinct components in the list | 144 |
| Already covered by Grange | 60 |
| In scope, to build | 41 (across 7 phases) |
| Out of scope, recorded with a reason | 43 |

At the project's established pace — two components a round, each round ending in a fresh-clone
verification — they are roughly 28 rounds. The three buckets are exhaustive and do not overlap
and always add to 144.

**Phases 1 and 2 are done.** Phase 3 — the rest of the date and time set — is next.

## Already covered

Grange has these under a Material name. Nothing to build; this table is the mapping.

| Kendo | Grange |
| --- | --- |
| Animation | `GrangeProvider` plus `useSpring`, over the M3E motion schemes |
| Button | `Button`, and one component per variant as Material Web ships them |
| Button Group | `ButtonGroup`, with the pressed item widening 15% |
| Chip / ChipList | `Chip` (four kinds) / `ChipGroup` |
| Floating Action Button | `Fab`, `ExtendedFab`, `FabMenu` |
| SegmentedControl | `ConnectedButtonGroup`, single select as a radiogroup |
| SplitButton | `SplitButton`, five sizes |
| Toolbar | `FloatingToolbar`, `DockedToolbar` |
| Calendar | `Calendar`, `RangeCalendar` |
| TimePicker | `TimePicker` (the dial) and `TimeField` (the input) |
| Dialog | `Dialog` |
| DropDownList | `Select` |
| Badge | `Badge` |
| Loader | `LoadingIndicator`, `CircularProgress` |
| Checkbox | `Checkbox`, `CheckboxGroup` |
| Input / TextBox / TextArea | `TextField`, `FilledTextField`, `OutlinedTextField`, `multiline` |
| RadioButton / RadioButtonGroup | `Radio` / `RadioGroup` |
| Slider / RangeSlider | `Slider`, single or range |
| Switch | `Switch` |
| Error / Hint / Label / Floating Label | `TextField`'s `errorText`, `supportingText` and `label` slots |
| ActionSheet | `BottomSheet` |
| AppBar | `AppBar`, five sizes including the two M3E flexible ones |
| BottomNavigation | `NavigationBar` |
| Card | `Card` |
| Drawer | `NavigationDrawer`, and `SideSheet` for content |
| Menu | `Menu`, `MenuTrigger`, `MenuSection`, three styles |
| TabStrip | `Tabs` |
| ListView | `List`, `ListItem`. Paging arrives with `Pager` |
| Notification | `SnackbarRegion` |
| Icon & SvgIcon | `Icon` |
| Keyboard Navigation | React Aria, in every component |
| Typography | The type tokens and the `typescale()` Sass mixin |
| ProgressBar | `LinearProgress`, flat or M3E wavy |
| Ripple | `Ripple` |
| ScrollView (Carousel) | `Carousel`, four layouts |
| Tooltip | `Tooltip`, and `RichTooltip` for the rich variant |

## In scope

Every hook named below was checked against the installed `react-aria@3.52.1` and
`react-stately@3.42.1` — they all exist. A component with a hook is mostly tokens, CSS and
motion; a component without one carries its own behaviour and is marked.

### Phase 1 — Finish the fields

Forms are the biggest hole: the catalog has seventeen inputs and Grange had nine of them.

The first round also extracted **`FieldShell`** out of `TextField`: the floating label, the
outlined variant's notch, the leading and trailing slots, the affixes, the supporting row and the
counter, with no behaviour and no input of its own. `TextField` now renders through it and so does
`NumberField`, and the date field, the combo box and the rest of phase 2 and 3 will too. Without
it each of them reproduces that markup and drifts from it. The 292 existing screenshots were
unchanged by the extraction, which is how it was checked.

| Component | Behaviour | Notes |
| --- | --- | --- |
| ~~`NumberField`~~ ✅ | `useNumberField` | Done. Locale-aware parsing and formatting, step buttons, min and max, currency, percent and unit formats. Not `role="spinbutton"` and not `type="number"`: React Aria uses a described text input in a group, because VoiceOver on iOS mishandles the spinbutton role and a native number input cannot take a locale's decimal separator or a currency |
| ~~`MaskedTextField`~~ ✅ | ours | Done. The pattern logic is `mask.ts`, pure and tested on its own, because masking is a string problem rather than an accessibility one. The field itself is an ordinary `TextField` |
| ~~`Rating`~~ ✅ | ours | Done, on `useRadioGroup`, because that is the pattern a rating is: a set of options where one is chosen. One tab stop, arrows that move and select, real inputs that post in a form, and each option named so a screen reader does not read five unlabelled graphics. `precision={0.5}` doubles the options rather than being a second mechanism; read-only becomes a single labelled image rather than a group nobody can choose from |
| ~~`Signature`~~ ✅ | ours | Done, and as SVG rather than canvas. A canvas signature is a bitmap: it blurs when resized, undo means replaying every stroke into a fresh context, and none of it is testable without a canvas implementation. The strokes as paths stay crisp, export as readable text and undo by dropping an array; the geometry is in `strokes.ts` and tested there. There is no keyboard way to draw, so the pad is `role="img"` saying whether it has been signed rather than pretending to be an input, and the docs say to offer a typed name beside it |
| ~~`Form`, `FormField` (FieldWrapper), `FieldArray`~~ ✅ | ours | Done, and deliberately small: it holds no values, has no notion of touched or dirty, and re-renders nothing as you type. It reads the values out of `FormData` on submit and distributes an error map to the fields by name through React Aria's `FormValidationContext`, which every field here already reads — so errors go in at the top and come out under the right field with no wrapper and no cloning. `FormElement` is folded into `Form`: there is nothing for a second component to do |

The standalone `Label`, `Hint` and `ErrorText` that were pencilled in here turned out to be one
component rather than three: `FormField` labels and describes a control that brings none of its
own, which is what they were wanted for.

Three things this phase changed outside itself, each of which was a real defect:

- **A field has to read its hook's verdict, not only its own `error` prop.** `TextField`,
  `NumberField` and `Select` all ignored `isInvalid` and `validationErrors`, so an error pushed
  in through `FormValidationContext` set `aria-invalid` and no message was ever drawn — the
  plumbing looked broken when it was not.
- **`aria-describedby` has to point at the message that is on screen.** M3 replaces the
  supporting text with the error rather than showing both, so linking both leaves a reference to
  an element that was never rendered. `describedBy` in `TextField/specs.ts` assembles it from
  what is actually there.
- **`Select` never passed `name` to its state**, only to the hidden select, so a form could not
  address it at all. And **`NumberField` never posted its value**: React Aria strips `name` off
  the visible input on purpose, because it holds formatted text like "€1,234.56", and expects a
  hidden input to carry the number.

### Phase 2 — Dropdowns and the popover surface

`OptionList` came out of `Select` in the first round of this phase, for the same reason
`FieldShell` came out of `TextField`: a select, a combo box and a multi-select draw the same rows
and would otherwise each grow a copy. Three things the round turned up, each of which looked
finished and was not:

- **An empty list has to be allowed.** `useComboBoxState` closes the list the moment the filter
  matches nothing, so an empty state has nowhere to be rendered until `allowsEmptyCollection` is
  set — the branch is simply never reached.
- **A popover has to take focus.** `usePopover` listens for Escape on the overlay element, so a
  panel whose content holds nothing focusable leaves focus on the trigger and cannot be dismissed
  from the keyboard. The surface is `tabIndex={-1}` inside a `FocusScope` so there is always
  somewhere for focus to land.
- **The combo box's chevron must not be given a label.** `useComboBox` labels it by the field
  through `aria-labelledby`, which wins over `aria-label` — so an `aria-label` would sit in the
  markup doing nothing.
- **Escape in a multiple-selection listbox clears the selection by default**, and stops there.
  It never reaches the popover, so the list cannot be closed with it and everything chosen is
  thrown away instead. `escapeKeyBehavior: 'none'` puts Escape back to meaning "close".
- **`useTagGroup` given a `label` expects its `labelProps` to be rendered somewhere.** The
  field's own label is not that element, so the grid ends up named by an id that exists nowhere.
  A string `aria-label` needs no element, which is what it gets.
- **A listbox in a popover has to be given `autoFocus`.** `useOverlay` listens for Escape on the
  overlay element, and unlike a select nothing else moves focus in, so without it neither Escape
  nor the arrow keys do anything. The same applies to a menu opened at a pointer, which is why
  `Menu` gained an `autoFocus` prop.
- **Hiding an option's cells takes its name with them.** The columned rows are `aria-hidden` so
  the row is not read twice, which left the option with no accessible name at all until the label
  went back in visually hidden. Worse than having no columns.

Twice now the answer has been that React Aria already names something and `aria-label` loses to
it: the combo box's chevron, and a menu opened from a button. Both would have shipped as props
that sat in the API looking like they worked.

| Component | Behaviour | Notes |
| --- | --- | --- |
| ~~`Popover`~~ ✅ (Popup) | `usePopover` | Done. The low-level `Popover` was already there behind `Menu` and `Select`; `PopoverTrigger` is the component: a button and the surface it opens, for content that is not a list. A dialog rather than a tooltip, because the moment there is something to interact with inside, a tooltip is the wrong markup — assistive tech cannot reach into one and it closes on pointer-leave |
| ~~`ComboBox`~~ ✅ | `useComboBox` | Done, and it shares both halves with what was already here: `FieldShell` for the chrome and `OptionList` for the list, which `Select` was moved onto in the same round. Filtering goes through `useFilter`, so it follows the locale — typing "ist" finds Istanbul in English and correctly does not in Turkish, where the dotted and dotless i are different letters |
| ~~`Autocomplete`~~ ✅ | `useComboBox` | Done, as a wrapper over `ComboBox`, because that is honestly all it is: the same hook with the selection taken out, so the text is the value and whatever is typed stands. `useAutocomplete` is a different thing despite the name — it drives a *separate* collection, a searchable menu, from an input — and is deliberately not used |
| ~~`MultiSelect`~~ ✅ | `useListBox` + `useTagGroup` | Done. The options are a multiple-selection `useListBox` in the shared `Popover` and `OptionList`; the chips are a real tag group, so they have their own arrow keys and a live region that announces a removal. Two widgets in one field on purpose: both want the arrow keys, so one tab stop would mean choosing which |
| ~~`MultiColumnComboBox`~~ ✅ | `useComboBox` | Done, as a wrapper: the columns are presentation, so an option stays one option named by its label and the cells are hidden from assistive tech. A real tabular list would want `useGridList` and would make every cell a focus stop, which is the wrong trade for picking one thing |
| ~~`MenuButton`~~ ✅ (DropDownButton) | `useMenuTrigger` | Done, and thin, because `MenuTrigger` already wires a trigger to a menu. It has no label of its own for the menu and there is none to give: `useMenuTrigger` points the menu's `aria-labelledby` at the button, which wins over any `aria-label` |
| ~~`ContextMenu`~~ ✅ | `useContextMenu` | Done. The hook is the part worth having: it recognises a right-click, a long press and the keyboard's context key, none of which are the same event. The menu opens at the pointer, so a one-pixel element is placed there and used as the anchor — which keeps the flipping and the containment instead of reimplementing them against raw coordinates |

### Phase 3 — Finish the date and time set

| Component | Behaviour | Notes |
| --- | --- | --- |
| `DateField` (DateInput) | `useDateField` | The segmented date entry, which is `TimeField`'s sibling |
| `DatePicker` | `useDatePicker` | `DateField` plus the calendar in a popover. The docked picker the M3 spec draws |
| `DateRangePicker` | `useDateRangePicker` | Two fields and `RangeCalendar` |
| `DateTimePicker` | `useDatePicker` | One control for both, which is a granularity on the same hook |
| `MultiViewCalendar` | `useCalendar` | Two or three months side by side, via `visibleDuration` |
| Date Math | utility | `@internationalized/date` is already a dependency and does most of it; this is the thin layer over it the pickers want |

### Phase 4 — Layout and navigation

| Component | Behaviour | Notes |
| --- | --- | --- |
| `Avatar` | — | Image, initials or icon, three sizes. Trivial, and `ListTokens` has the 40px |
| `Skeleton` | — | Shimmer over the shape tokens, held still under reduced motion |
| `Breadcrumbs` | `useBreadcrumbs` | Collapsing to a menu when the trail is too long for the row |
| `ExpansionPanel` | `useDisclosure` | One panel |
| `Accordion` (PanelBar) | `useDisclosureGroupState` | A set of them, single or multiple open |
| `Timeline` | — | Presentational, horizontal or vertical, alternating sides |
| `Grid` / `Stack` | — | CSS-only layout primitives. They need a spacing scale, and there is not one: the token file has colour, shape, type, elevation, motion and state-layer opacity, and no spacing at all. So this is also where a scale gets chosen — M3 lays out on a 4dp grid, which is the obvious basis — and it has to be a named, overridable set rather than numbers inlined per component |
| `Stepper` | ours | No hook. Linear and non-linear, horizontal and vertical, per-step validity |
| `Splitter` | ours | `role="separator"` with `aria-valuenow`, drag and arrow keys — the same pattern `SideSheet`'s resize handle already uses |
| `Window` | `useDialog` | A non-modal dialog that can be dragged, resized, minimised and maximised |
| `TileLayout` | `useDrag`/`useDrop` | A reorderable, resizable grid of cards. The largest thing in this phase |

### Phase 5 — Collections and data tools

| Component | Behaviour | Notes |
| --- | --- | --- |
| `TreeView` | `useTree`, `useTreeState` | Expand and collapse, selection, typeahead. `useTreeData` handles the mutable case |
| `DropDownTree` / `MultiSelectTree` | `useComboBox` + `useTree` | A tree in a popover, single or multiple |
| `Sortable` | `useDraggableCollection`, `useDroppableCollection` | Reordering with a keyboard path, which drag-and-drop usually lacks |
| `TransferList` (ListBox) | `useListBox` | Kendo's ListBox is two lists and the buttons that move items between them. `SelectableList` already covers a plain one, so this is the transfer part |
| `Pager` | `useButton`, `Select` | Page size, jump to page, and the "1–10 of 240" summary |
| `FilterBuilder` (Filter) | ours | Nested and/or groups over field, operator and value. Pairs with the Data Query utility |
| Data Query | utility | Typed sort, filter, group and aggregate over arrays, plus the operator set `FilterBuilder` edits |
| Drag & drop utilities | re-export | `useDrag`, `useDrop`, the collection hooks and the drop-item helpers, documented rather than reinvented |

### Phase 6 — Colour

One engine, four faces, all on React Aria's colour hooks and `parseColor`.

| Component | Behaviour |
| --- | --- |
| `ColorArea` (ColorGradient) | `useColorArea`, `useColorAreaState` |
| `ColorSlider`, `ColorWheel`, `ColorField` | `useColorSlider`, `useColorWheel`, `useColorField` |
| `ColorSwatchPicker` (ColorPalette) | `useColorSwatch` |
| `ColorPicker` / `FlatColorPicker` | `useColorPickerState`, in a popover or inline |

### Phase 7 — Visual and I/O

| Component | Behaviour | Notes |
| --- | --- | --- |
| `ArcGauge`, `CircularGauge`, `LinearGauge`, `RadialGauge` | `useMeter` | One SVG engine, four presentations. `useMeter` gives them the right role and value text |
| `Sparkline` | — | A line or bar in a line of text, no axes |
| `ChunkProgress` (ChunkProgressBar) | `useProgressBar` | The progress bar in discrete segments |
| `Barcode`, `QRCode` | ours | Encoders, not geometry: Code 128 and QR with its Reed–Solomon error correction. Self-contained, no dependency |
| `Upload`, `DropZone` | `useDrop` | File selection, the drop target, per-file progress and retry. The network side stays the app's |

## Out of scope

Recorded rather than dropped, each with what it would take.

### The ten products, plus the chart wizard

| | Why it is out |
| --- | --- |
| Data Grid | The one most worth revisiting. React Aria covers a lot of it — `useTable`, `useTableColumnResize`, `useTableState`, `useAsyncList` for paging — but editing, grouping, frozen columns and virtualisation are weeks on top, and virtualisation would mean a new dependency since the `Virtualizer` lives in `react-aria-components` |
| TreeList, PivotGrid | Both are the Data Grid plus a dimension. Neither is worth starting before it exists |
| Spreadsheet | A formula engine, a cell grid and a toolbar. A product |
| Scheduler, Gantt Chart, TaskBoard | Each is a calendar or timeline engine with its own drag model, recurrence or dependency graph |
| Editor | Needs a rich-text engine. Wrapping one is the only sane route and it is a dependency decision, not a component |
| PDF Viewer | A PDF renderer |
| Map | Tile loading, projections and a vector layer |
| Chart Wizard | A chart builder, which presupposes the charts |

### Charting

Twenty-three types — area, bar, box plot, bubble, bullet, donut, drilldown, funnel, heatmap,
line, org chart, pie, polar, pyramid, radar, range area, range bar, sankey, scatter, stock,
waterfall and the generic `Charts` and `Drilldown` entries. Scales, axes, legends, stacking,
panning and crosshairs are a library in their own right; the gauges and the sparkline are in
because they need none of that. An app that needs charts should bring a charting library and
theme it with Grange's tokens, which are plain CSS custom properties.

### Not user interface

| | Why it is out |
| --- | --- |
| Excel Export | A spreadsheet writer. Needs a dependency and has nothing to do with rendering |
| PDF Generator, File Saver | Document generation and a download shim |
| Drawing Library | A canvas and SVG abstraction, which the shape library and the gauges already cover for our own needs |

### AI Interface

AI Prompt, Inline AI Prompt, PromptBox, Chat, SmartPasteButton and the Speech-To-Text Button.
The presentational halves — a transcript, a prompt box, a microphone button — are ordinary
components, but each one's value is the model call, the streaming protocol and the Web Speech
API behind it, none of which belongs in a component library. Out until there is a reason to
revisit, and then as presentation only.

## How a round works

Unchanged from the Material catalog, and the reason each of those 36 landed with tests and a
baseline:

1. Read the component's M3 spec section if it has one. Where it does not, choose from the
   captured primitives and label every number in `specs.ts` with where it came from.
2. `pnpm capture-tokens <Name>` when androidx has a token object for it. Most of these will not,
   which is the point of step 1.
3. Build on `ButtonBase` or the primitives where it is interactive, so it inherits press, hover,
   focus, ripple and the state layer. Remember that `ButtonBase` filters its props through
   `useButton`: anything unusual goes through `domProps`.
4. Colours only through `grange.color()`, corners through `grange.corner()`, springs through
   `useSpring`. Never a hex value.
5. Register the component in `src/config/config.ts` — slots, defaults and the `COMPONENTS` list.
   A guard test fails if a `classNames` key is missing from that list.
6. Tests that assert the token values and the behaviour, not the implementation.
7. A story covering every variant, size, state and both colour schemes.
8. Update this file and the README's counts.
9. Two or three commits on a branch, merged `--ff-only`.
10. `pnpm visual:docker --update-snapshots` for the new stories, then the four scripts from a
    fresh clone.

## Verification

Per round, the same bar the Material catalog was held to:

```bash
pnpm typecheck
pnpm test                  # the new component's tests, plus no regressions
pnpm build                 # dist/index.js, index.d.ts, index.css
pnpm build-storybook
pnpm visual:docker         # 292 baselines and rising, in the image CI uses
```

One thing the visual suite caught that no other check would: four calendar stories were pinned to
`today()`, and the container runs on UTC while a developer's machine does not — so for part of
every day the two disagree about what day it is and the screenshots drift. Those stories are
pinned to a fixed past date now. A story that renders the current date cannot be a baseline.

Then from a fresh clone of the merged branch, all four scripts plus the container visual run,
which is what has caught every problem that only shows up outside the working tree: the
Playwright spec vitest was collecting, the test racing its own clock, the CI step order.
