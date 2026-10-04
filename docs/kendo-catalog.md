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
| Already covered by Grange | 85 |
| In scope, to build | 16 (across 7 phases) |
| Out of scope, recorded with a reason | 43 |

At the project's established pace — two components a round, each round ending in a fresh-clone
verification — the remainder is roughly 12 rounds. The three buckets are exhaustive and do not overlap
and always add to 144.

**Phases 1 to 6 are done.** Phase 7 — visual and I/O, ten items — is the last of it.

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

Three times now the answer has been that React Aria already names something and `aria-label`
loses to it: the combo box's chevron, a menu opened from a button, and the date picker's calendar
button. All three would have shipped as props that sat in the API looking like they worked. The
rule, written down so the next one is cheaper: a trigger that belongs to a field is named by that
field, and the only way to change what it says is to change the field's label.

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

Two things the first round of this phase established, both worth knowing before building the
rest of it:

- **`minValue` and `maxValue` are validation, not a clamp.** The arrows will take the value
  outside the range; the hook reports it and marks the field invalid, and it is the app that
  decides. A controlled field that ignores the change keeps showing the old value, which looks
  like clamping and is not.
- **A calendar in a popover has to be given `autoFocus`**, like the combo box's list and the
  context menu before it, or neither the arrows nor Escape do anything.
- **Several months are several grids, not one wide one.** A `role="grid"` is navigated as a
  grid: the arrows move within it and a screen reader reads its caption. Two months in one grid
  would mean arrowing off the end of July into August's first week as if they were one month, and
  one caption for both. So `MultiViewCalendar` renders one `useCalendarGrid` per month, and each
  grid is given an explicit `startDate`/`endDate` so a day belonging to a neighbouring month is
  left blank rather than drawn twice.
- **A pinned story's baseline has to be re-shot when it is pinned.** One calendar baseline still
  held the month that `today()` happened to be on the day it was taken, so it disagreed with the
  pinned story for a reason that had nothing to do with this round's code. Checked by looking at
  the two images rather than at the pixel count, which is what finally said so.

| Component | Behaviour | Notes |
| --- | --- | --- |
| ~~`DateField`~~ ✅ (DateInput) | `useDateField` | Done. Each part its own target, with the order of the parts and the separators coming from the locale: a British user types the day first and an American the month first, into the same component. `Segment` came out of `TimeField` so the behaviour is shared, while the geometry is not — the time picker's input mode draws 96 by 72 boxes from TimeInputTokens, which belongs to the picker rather than to a field |
| ~~`DatePicker`~~ ✅ | `useDatePicker` | Done, the docked one: the field and a calendar in a popover over one value, opening on the month the value is in. The modal variant is not a separate component — a `Calendar` in a `Dialog`, which the calendar's own story shows |
| ~~`DateRangePicker`~~ ✅ | `useDateRangePicker` | Done. Two sets of segments in one field over one `RangeCalendar`, because a range is one value: the hook keeps the two ends in order and reports an invalid range rather than silently swapping it |
| ~~`DateTimePicker`~~ ✅ | `useDatePicker` | Done, and it is a granularity rather than a component: the same hook with `granularity="minute"` grows the time segments and puts a `TimeField` under the calendar. `DatePicker` and `DateTimePicker` share one `PickerBase` so the two cannot drift |
| ~~`MultiViewCalendar`~~ ✅ | `useCalendar` | Done, as `visibleMonths` on the calendars that already exist rather than a fourth component — with `pageBehavior` for whether the arrows move a month or a page, and `selectionAlignment` for where the value sits among the visible months |
| ~~Date Math~~ ✅ | utility | Done, in `src/dates`: clamping, ordering and overlap for ranges, the day/week/month spans, and range formatting. Thin on purpose — everything `@internationalized/date` already does is re-exported rather than reimplemented, and `isWeekend` takes no locale because the one in that library does, which is the difference worth documenting |

### Phase 4 — Layout and navigation

Three things the first round of this phase established:

- **None of this phase has a token file, and that does not mean the values are free.** `Avatar`,
  `Skeleton`, `Placeholder`, `Shimmer`, `Breadcrumb`, `ExpansionPanel`, `Accordion`, `Timeline`,
  `Stepper` and `Splitter` are all 404 in androidx, every one of them checked. But Compose does
  draw an avatar — inside `ListTokens`, as a list item's leading element — so the avatar's size,
  shape, colours and label font are captured values rather than taste. Where nothing is captured,
  as with the skeleton, the value is built out of tokens that are: a duration, an easing, a state
  layer opacity.
- **`width: 100%` on a component root is a bug waiting for a flex row.** The skeleton had it, and
  a skeleton beside anything else took the whole line and pushed its neighbour onto the next one
  while looking as though it had not. A block box already fills the row it is in; the width only
  stops it ever sharing one.
- **`useDisclosure`'s `buttonProps` are button options, not DOM props.** Sixth component where
  spreading a hook's `buttonProps` straight onto a `<button>` would have looked right and done
  nothing; it has to go through `useButton`.
- **React 19's `Key` includes `bigint` and React Aria's does not.** Any component with keys
  reads the key type off a hook's own props rather than importing React's.
- **`Children.toArray` does not flatten fragments**, so anything that counts its children sees
  one. The repo already had `flattenChildren` and a comment explaining exactly this; it was
  still written wrong three times in a row before a test caught it. `Breadcrumbs` shipped with
  the bug last round and is fixed here.
- **Never put a CSS shorthand and its longhands in one React style object.** React writes the
  object key by key and an `undefined` clears that property, so `{ gap, columnGap: undefined }`
  set the shorthand and then wiped both halves of it. The grid rendered with no gaps at all and
  nothing in the markup said why. `Grid` now writes only `rowGap` and `columnGap`.
- **React's `grid-column` shorthand did not survive either**: `1 / -1` reached the browser as
  `grid-column-end: -1` with the start line lost, so a full-row cell silently sat in the last
  column. Longhands again.
- **jsdom's CSS parser rejects a negative grid line**, so `grid-column-end: -1` cannot be
  asserted in a unit test at all. That one is covered by a visual baseline instead, and the test
  says so rather than pretending.
- **A story whose whole output is portalled had no way to be shot.** The visual spec waited on
  `#storybook-root > *`, and React Aria's `Overlay` portals straight into `body` with no
  wrapper, so a window-only story timed out. The spec now waits on either, which is a gap in
  the harness rather than in the story.
- **A changed baseline is only reliably re-shot by deleting it first.** `--update-snapshots`
  reported ten passes and left a stale picture in place while the live page had plainly changed;
  the run after deleting the file produced the right one. What caught it was looking at the
  picture, not the pass count — the second time this phase that has been the thing that worked.

| Component | Behaviour | Notes |
| --- | --- | --- |
| ~~`Avatar`~~ ✅ | — | Done. Image, initials or icon, three sizes, three shapes, four colour pairs. Every number is a `ListTokens` value: 40 is `ItemLeadingAvatarSize`, 24 is `ItemLeadingIconSize`, 56 is `ItemLeadingImageWidth`. Initials are passed in rather than split out of a name, because `split(' ')` is wrong for most of the world's names, and a broken image falls back to them rather than leaving a torn page |
| ~~`Skeleton`~~ ✅ | — | Done. Text, block or disc, shimmer or pulse, held still under reduced motion because a loop with no end state is the clearest case that setting is about. Hidden from assistive tech with no way to label it: what a screen reader needs is the loading region's own `aria-busy`, not the shape of absent text |
| ~~`Breadcrumbs`~~ ✅ | `useBreadcrumbs` | Done. The last crumb is the current page and is deliberately not a link — `aria-current="page"` on a plain element, so a screen reader says where you are rather than offering to take you where you already are. A long trail folds its middle into the library's own `MenuButton`, keeping the first crumb and the last two, so the folded crumbs keep typeahead and arrow keys instead of becoming a second, lesser list |
| ~~`ExpansionPanel`~~ ✅ | `useDisclosure` | Done. The collapsed panel stays in the DOM under `hidden="until-found"`, so find-in-page reaches the text and the browser opens the section; the hook also measures the panel and writes `--disclosure-panel-height`, which is the only way to animate to a height nobody knows in advance |
| ~~`Accordion`~~ ✅ (PanelBar) | `useDisclosureGroupState` | Done. The group owns the open keys, so single-open falls out of the state rather than out of each panel watching the others. Arrow keys between headers are deliberately absent: the ARIA pattern makes them optional and a header is an ordinary button Tab already reaches, so wiring them would take a Tab stop away to buy nothing |
| ~~`Timeline`~~ ✅ | — | Done. An ordered list, because in a timeline the order *is* the content; the rail, the dots and the connectors are `aria-hidden`, since they draw an order the markup already carries. A timestamp given a `dateTime` becomes a real `<time>`, which is the one piece of machine-readable semantics a timeline can honestly offer |
| ~~`Grid` / `Stack`~~ ✅ | — | Done, and so is the scale they were waiting on. Eight steps on the 4dp grid, in `tokens/grange-spacing.json` — **the only values in this library that are not Google's**, because Material publishes no spacing tokens. They are emitted as `--grange-space-*` rather than `--md-sys-*`: a chosen value in Google's namespace would claim a provenance it does not have. The middle of the scale is `ListTokens` (`md` is `ItemBetweenSpace`, `lg` is `ItemLeadingSpace`), so a layout agrees with the components inside it, and `theme()` overrides it like any other token |
| ~~`Stepper`~~ ✅ | ours | Done, and the markup was a decision rather than a lookup: no React Aria hook and no ARIA pattern. An ordered list of buttons with `aria-current="step"` — not a tablist, since tabs are views of one thing and steps are stages of one thing. Unreachable steps are `aria-disabled` rather than `disabled`, because the path ahead is most of what a stepper shows, and each step's state is **said** — "Step 2 of 4, completed" — not only drawn |
| ~~`Splitter`~~ ✅ | ours | Done, on `useMove`, so the arrows move a boundary exactly as a pointer does and Home and End take it to its limits. Sizes are percentages, not pixels: a splitter holding pixel widths is correct exactly once, and then the window is resized. The clamping is a pure module, because jsdom reports every element as 0 by 0 and a rendered splitter can never be measured there |
| ~~`Window`~~ ✅ | `useDialog` | Done. Non-modal is the substance: no scrim, no focus trap, because the page behind has to stay usable — that is the whole difference from a dialog. Moving and resizing have **no ARIA role that fits**, so each handle is a labelled focusable control on `useMove` rather than a `separator` that would describe it wrongly. Position and size are clamped to the viewport, since a window dragged off the top takes every one of its own controls with it |
| ~~`TileLayout`~~ ✅ | ours | Done, and **not** on `useDrag`/`useDrop`: those place an item between two others in a list, and a dashboard is a grid. The layout is an order plus a span per tile rather than a position per tile, so CSS grid auto-placement keeps it valid — free x/y lets a dashboard reach states nobody wants (a hole in the middle, two tiles on one cell) and every implementation that allows it spends its life repairing them. Both handles work from the keyboard, and the arithmetic is a pure module because jsdom cannot measure a grid |

### Phase 5 — Collections and data tools

Three things the first round of this phase established, all of them about the seam between
`react-stately`'s collections and the hooks that read them:

- **A `TreeCollection`'s iterator yields only its root nodes.** The flattened, visible rows are
  what it keyed, so they come from `getKeys`. Iterating the collection renders a tree that
  never opens, with nothing anywhere to say why.
- **`useTreeItem` needs `collection.getChildren`, which `useTreeState`'s collection does not
  have.** The hook was written against react-aria-components' collection. Without it a row's
  siblings come back empty and the hook throws on `siblings[0].type` the moment anything below
  the first level renders — so a tree works until it is expanded.
- **A listbox option cannot hold a focusable control**, which is the same finding the tree
  produced from the other direction. `Sortable` started as a listbox and its drag handles were
  unreachable: Tab stops at the option and never enters it. A grid list fixed it, and the rule
  is now written twice because it decided two components.
- **A loose wait in the visual harness shot the loading spinner.** Last round's fix for
  portal-only stories matched "any div in `body`", which Storybook's own loader is: the wait
  passed instantly and four baselines were pictures of a spinner. It now matches one of this
  library's hook classes. Caught by looking at the pictures; the suite was green.
- **`aria-posinset` comes out global rather than per parent.** The hook derives it from
  `node.index`, which `TreeCollection` numbers across every visible row, so the second branch's
  first child announces itself as "item 4 of 1". Computed from the siblings here instead.


| Component | Behaviour | Notes |
| --- | --- | --- |
| ~~`TreeView`~~ ✅ | `useTree`, `useTreeState` | Done, and it is a **treegrid** rather than a tree — React Aria's choice, because a `treeitem`'s children must be treeitems, so nothing interactive can live in a tree row. Two of `useTreeItem`'s assumptions do not hold against `useTreeState`'s collection and had to be repaired here; both are written up below |
| ~~`DropDownTree` / `MultiSelectTree`~~ ✅ | `useTree` + `Popover` | Done, and **not** on `useComboBox`: a combo box is a text field that filters a list, and this is a button that opens a tree. The trigger says `aria-haspopup="dialog"` rather than `listbox`, because what opens is a tree and promising a screen reader a list of options it will not find is worse than saying nothing. Naming the choice needed a pure walk of the children, since a tree's labels live in a nested React structure rather than a flat list |
| ~~`Sortable`~~ ✅ | `useDraggableCollection`, `useDroppableCollection` | Done, and this is the one component where these hooks are the right answer rather than a near miss. It is a **grid**, not a listbox, for the same reason the tree is a treegrid: a listbox option cannot hold a focusable control, so a drag handle inside one is unreachable. Tab to a row, ArrowRight into the handle, Enter to pick it up — the arrows then move between drop positions and every step is announced |
| ~~`TransferList`~~ ✅ (ListBox) | `useListBox` | Done, as the transfer part only: the two sides are `SelectableList`s. Both keep the order of `items` rather than appending, because a transfer list is usually options in a meaningful order and moving one back should return it to its place. Every move is announced — the press changes two lists at once and leaves focus where it was, so without a live region it is silent |
| ~~`Pager`~~ ✅ | `useButton`, `Select` | Done. The summary is a live region, which most pagers miss: pressing "next" changes a table elsewhere on the page and a silent press tells a screen reader user nothing. The arithmetic is a pure module, because paging is almost entirely off-by-one cases |
| ~~`FilterBuilder`~~ ✅ (Filter) | ours | Done, and built against the query rather than beside it: the same `CompositeFilter` shape and the same operator list from one file, because a builder that offers an operator the engine cannot run is worse than no builder. Each group is a labelled `group` saying how deep it is, since a filter builder drawn as a flat pile of selects is unusable without sight. The tree edits are pure — every change is "replace the node at this path", copying the groups on the way down, because a nested mutation gives back the same object and React re-renders nothing |
| ~~Data Query~~ ✅ | utility | Done, as pure functions. Three things it insists on: comparison is locale-aware through `Intl.Collator`, absent values sort **last in both directions** because they are missing rather than small, and nothing is mutated. An empty filter group matches everything, so an unfinished filter does not hide the data, and `total` is counted after filtering and before paging because that is what a pager reads |
| ~~Drag & drop utilities~~ ✅ | re-export | Done, unwrapped. `Sortable` uses exactly these, so an app building its own draggable collection gets the versions this library was built and tested against without adding react-aria as a second direct dependency. A wrapper around a hook this large would only be a worse copy of its documentation |

### Phase 6 — Colour

One engine, four faces, all on React Aria's colour hooks and `parseColor`.

Two things the first round of this phase established:

- **None of these is a canvas, and that is the point.** Every control is a range input under
  the paint, so it is reachable by keyboard and described in words. The square exposes a
  *single* slider with `aria-roledescription="2D slider"` and a value text reading
  "Saturation: 50%, Brightness: 60%, Hue: 220°, dark grayish cyan blue" — the colour named
  rather than numbered, which a canvas picker can never offer. The second axis input carries
  `aria-hidden`, because the square is one control and not two.
- **A colour area's axes must follow the value's own colour space.** Defaulting them to
  saturation and brightness throws on an `rgb()` or hex value, which has no saturation channel
  at all: `Unknown color channel: saturation`. Found by a test using a hex default.

| Component | Behaviour |
| --- | --- |
| ~~`ColorArea`~~ ✅ (ColorGradient) | Done. `useColorArea`, `useColorAreaState` |
| ~~`ColorSlider`, `ColorWheel`, `ColorField`~~ ✅ | Done. `useColorSlider`, `useColorWheel`, `useColorField`. A track's gradient is lifted onto a layer over a chequerboard, or a half-transparent alpha track reads as a pale colour rather than as transparency |
| ~~`ColorSwatchPicker`~~ ✅ (ColorPalette) | `useColorSwatch`. Each swatch is **named** — "vivid red", not "#f44336" — because a grid that reads out hex codes cannot be used by ear. The arrows move across the rows, which needed a keyboard delegate of its own: a listbox's default treats "above" as "the previous item", so up and down would step one swatch instead of one row |
| ~~`ColorPicker` / `FlatColorPicker`~~ ✅ | `useColorPickerState`, in a popover or inline. Nothing new is drawn: it is the four controls wired to one state, which is why they were built first. The panel works in **HSB** whatever the caller's format — in RGB the hue is lost the moment a colour reaches black, so dragging brightness down and back up would land on red |

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
