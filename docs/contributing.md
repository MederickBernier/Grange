# Working on Grange

Everything in this file is about the repository. For using the published package, see the
[README](../README.md) and the [documentation site](https://mederickbernier.github.io/Grange/).

## Getting set up

```sh
git clone https://github.com/MederickBernier/Grange.git
cd Grange
pnpm install
pnpm storybook      # http://localhost:6006
```

Node 20 or newer, and pnpm — the version is pinned in `package.json`'s `packageManager` field,
so `corepack` picks the right one on its own.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm tokens` | Reads `tokens/*.json` and writes `src/tokens/generated/`, `src/shapes/generated/` and `src/scss/_data.scss`. Everything below runs it first, so a stale token file can never be the reason a run passes |
| `pnpm lint` | ESLint, with type-aware rules, `jsx-a11y` and `react-hooks` |
| `pnpm format` / `format:check` | Prettier |
| `pnpm typecheck` | `tsc --noEmit` over `src`, `stories`, `.storybook` and `visual` |
| `pnpm test` | Vitest — 1,339 tests across 61 files |
| `pnpm build` | The library into `dist/`: Vite in library mode, declarations, and the Sass API copied across |
| `pnpm build-storybook` | The documentation site into `storybook-static/` |
| `pnpm visual` | Screenshots every story in both colour schemes and compares against `visual/__screenshots__` |
| `pnpm visual:docker` | The same, inside the image the baselines were taken in. **This is the one that agrees with CI** |
| `pnpm capture-tokens <Name>` | Fetches a Compose token object out of androidx into `tokens/m3-expressive.json`. Needs network; deliberately not part of any build |
| `pnpm capture-shapes` | The same for the 35-shape library in `MaterialShapes.kt` |

## How the tokens work

```
tokens/m3-expressive.json   Google's captured values     ┐
tokens/m3-shapes.json       the 35-shape library         ├─ pnpm tokens ─→ src/tokens/generated/
tokens/theme.json           the seed colour + overrides  │                 src/shapes/generated/
tokens/grange-spacing.json  the one scale that is ours   ┘                 src/scss/_data.scss
```

The generated directories are gitignored. They are rebuilt by every script that needs them,
which is why a fresh clone can run any of them in any order.

`tokens/grange-spacing.json` is the exception worth knowing about: Material publishes no
spacing tokens, so those eight steps were chosen here. They are emitted under `--grange-space-*`
rather than `--md-sys-*` so that nothing in the output claims a provenance it does not have.

## Testing

Three suites, each covering what the others cannot.

**Unit and behaviour tests** (`pnpm test`) — Vitest and Testing Library. They assert what a
component *does*: that Escape reverts a combo box, that a tree row is numbered among its own
siblings, that a pager's last page is short. They also assert token values against the captured
files, so a component cannot drift from the spec silently.

**Pure modules.** Anything that is arithmetic is in its own file and tested as arithmetic: the
QR encoder's Reed–Solomon, the splitter's clamping, the paging, the gauge geometry, the shape
polygons. Several of those exist *because* jsdom has no layout — a rendered splitter can never
be measured there, so the maths is tested where it can be.

**Visual regression** (`pnpm visual:docker`) — 512 screenshots, both colour schemes. This is
the only check that notices a token or a stylesheet quietly redrawing something, and it has
earned its place repeatedly. Run it in Docker: the baselines are Linux screenshots and
Playwright suffixes them per platform, so a bare `pnpm visual` on macOS or Windows writes a new
set rather than comparing against these.

To change a baseline deliberately: **delete it and re-shoot it.** `--update-snapshots` has been
observed leaving a stale picture in place while reporting a pass.

## Adding a component

1. **Look for the tokens first.** `pnpm capture-tokens <Name>Tokens` — if androidx has the file,
   the geometry is not a decision. If it 404s, record that, and label every chosen value in
   `specs.ts` with why it is what it is.
2. **Look for a React Aria hook.** If one exists, use it, and read its source before assuming
   what it returns. A recurring trap in this codebase: several hooks return *button options*
   rather than DOM props, and spreading them onto an element looks right and does nothing.
3. **Build it.** Colours only through `grange.color(<role>)`, corners through `grange.corner()`,
   springs through `useSpring`. Register the component in `src/config/config.ts` — a guard test
   fails on an unregistered `classNames` key.
4. **Test the behaviour, not the markup.** Then add a story per variant and state, run
   `pnpm visual:docker --update-snapshots`, and **look at the pictures**. They have caught
   things no assertion did.
5. **Write down what you decided.** The prose above a component is rendered on the
   documentation site; it is the documentation, not a comment.

## Releasing

The package is ESM-only, published from `dist/`.

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm visual:docker
npm version <patch|minor|major>
npm publish
git push --follow-tags
```

`npm pack --dry-run` shows exactly what goes out: `dist`, `LICENSE`, `NOTICE`, `README.md` and
`package.json`, and nothing else.

To try a build inside another project before publishing:

```sh
pnpm build && npm pack           # writes grange-react-<version>.tgz
cd ../your-app && npm install ../Grange/grange-react-0.1.0.tgz
```

A tarball is better than `npm link` here, because it exercises the `exports` map and the `files`
list the way a real install does.

## CI

| Workflow | Jobs |
| --- | --- |
| `.github/workflows/ci.yml` | **style** (lint, format), **verify** (typecheck, test, both builds, and a check that `dist` exports what `package.json` promises and keeps React external), **visual** (the screenshot suite, in the Playwright image) |
| `.github/workflows/pages.yml` | Builds the documentation site on every push and pull request; publishes it to GitHub Pages from `master` |

Pages has to be switched to "GitHub Actions" once, under **Settings → Pages → Source**, before
the first deployment will go anywhere.

## Layout

```
src/
  components/   one directory per component: the component, its specs.ts, its stylesheet
  primitives/   state layer, ripple, focus ring, elevation, touch target
  overlays/     the shared Popover and ModalPanel
  shapes/       the rounded-polygon port and the 35-shape library
  motion/       GrangeProvider and the spring system
  data/         the query layer and its operator set
  config/       the provider's configuration and slot resolution
  scss/         the public Sass API over the generated data
stories/        one file per component group; the prose here becomes the docs site
visual/         the Playwright suite and its committed baselines
scripts/        the token and shape capture, the build helpers
tokens/         the captured JSON, the theme seed, and the chosen spacing scale
```
