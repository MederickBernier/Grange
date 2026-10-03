import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Grid, GridItem, Stack, space } from '../src';

/**
 * Stack, Grid and the spacing scale.
 *
 * **This is the one scale in the library that is not Google's.** Material publishes no spacing
 * tokens — `SpacingTokens`, `SpaceTokens`, `DimensionTokens`, `DensityTokens`, `GridTokens` and
 * `LayoutTokens` are every one of them a 404 in androidx — and a layout component cannot be
 * written without one. So it was chosen: eight steps on the 4dp grid Material lays out on, with
 * the middle taken from `ListTokens`, so a layout agrees with the components it holds rather
 * than disagreeing by two pixels. `md` is `ItemBetweenSpace` ({space.md}px) and `lg` is
 * `ItemLeadingSpace` ({space.lg}px).
 *
 * It is emitted as `--grange-space-*` and not `--md-sys-*`. Putting a chosen value in Google's
 * namespace would claim a provenance it does not have, and being able to tell which is which
 * is most of the point of this library. Override the scale with the `theme()` Sass mixin, the
 * same way colours and corners are overridden.
 */
const meta: Meta = {
  title: 'Foundations/Layout',
  parameters: { layout: 'padded' },
};
export default meta;

const Swatch = ({ name, px }: { name: string; px: number }) => (
  <Stack direction="row" align="center" gap="md">
    <span className="sb-label" style={{ width: 48 }}>
      {name}
    </span>
    <span
      style={{
        width: px,
        height: 16,
        background: 'var(--md-sys-color-primary)',
        borderRadius: 'var(--md-sys-shape-corner-extra-small)',
      }}
    />
    <span className="sb-label">{px}px</span>
  </Stack>
);

/** The eight steps, and what each is for. */
export const Scale: StoryObj = {
  render: () => (
    <Stack gap="sm">
      {Object.entries(space).map(([name, px]) => (
        <Swatch key={name} name={name} px={px} />
      ))}
    </Stack>
  ),
};

/** A stack is flexbox with the scale attached. The gap is a token, so a theme can move it. */
export const Stacks: StoryObj = {
  render: () => (
    <Stack gap="xl">
      <div>
        <p className="sb-label">Column, the default</p>
        <Stack gap="sm">
          <Box>One</Box>
          <Box>Two</Box>
          <Box>Three</Box>
        </Stack>
      </div>

      <div>
        <p className="sb-label">Row, centred, with the gap off the scale</p>
        <Stack direction="row" gap="lg" align="center">
          <Box>One</Box>
          <Box tall>Two</Box>
          <Box>Three</Box>
        </Stack>
      </div>

      <div>
        <p className="sb-label">Row, spread apart</p>
        <Stack direction="row" justify="between">
          <Box>Start</Box>
          <Box>Middle</Box>
          <Box>End</Box>
        </Stack>
      </div>
    </Stack>
  ),
};

/**
 * `columns={3}` is `repeat(3, minmax(0, 1fr))`, not `repeat(3, 1fr)` — the bug everyone writes
 * once. A `1fr` track has an automatic minimum of its content, so one long unbreakable word
 * makes its column wider than its share and squeezes the others.
 */
export const Grids: StoryObj = {
  render: () => (
    <Stack gap="xl">
      <div>
        <p className="sb-label">Three equal columns, with a long word in the first</p>
        <Grid columns={3} gap="md">
          <Box>Pneumonoultramicroscopicsilicovolcanoconiosis</Box>
          <Box>Second</Box>
          <Box>Third</Box>
        </Grid>
      </div>

      <div>
        <p className="sb-label">Spans: a header across the row, then a wide cell</p>
        <Grid columns={4} gap="md">
          <GridItem colSpan="all">
            <Box>Across the whole row, whatever the column count is</Box>
          </GridItem>
          <GridItem colSpan={2}>
            <Box>Two columns</Box>
          </GridItem>
          <Box>One</Box>
          <Box>One</Box>
        </Grid>
      </div>

      <div>
        <p className="sb-label">A template, for what a count cannot say: auto-fit, min 160px</p>
        <Grid columns="repeat(auto-fit, minmax(160px, 1fr))" gap="md">
          <Box>Reflows</Box>
          <Box>With</Box>
          <Box>The</Box>
          <Box>Width</Box>
        </Grid>
      </div>
    </Stack>
  ),
};

/** The two together, which is how a page is usually built. */
export const APage: StoryObj = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: 640 }}>
      <Grid columns={3} gap="lg">
        {['Today', 'This week', 'All time'].map((title) => (
          <Card key={title} variant="outlined" style={{ padding: 'var(--grange-space-lg)' }}>
            <Stack gap="xs">
              <span className="sb-label">{title}</span>
              <strong style={{ fontSize: 24 }}>{title.length * 7}</strong>
            </Stack>
          </Card>
        ))}
      </Grid>
      <Card variant="filled" style={{ padding: 'var(--grange-space-lg)' }}>
        <Stack gap="sm">
          <strong>Everything below uses the same eight numbers</strong>
          <span>Which is the entire argument for having a scale.</span>
        </Stack>
      </Card>
    </Stack>
  ),
};

const Box = ({ children, tall }: { children: React.ReactNode; tall?: boolean }) => (
  <div
    style={{
      padding: 'var(--grange-space-sm) var(--grange-space-md)',
      paddingBlock: tall ? 'var(--grange-space-xl)' : undefined,
      background: 'var(--md-sys-color-surface-container-high)',
      borderRadius: 'var(--md-sys-shape-corner-small)',
      minWidth: 0,
      overflowWrap: 'anywhere',
    }}
  >
    {children}
  </div>
);
