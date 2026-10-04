import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, TextButton, Tile, TileLayout, type TileSpec } from '../src';

/**
 * A dashboard: a grid of cards that can be reordered and resized.
 *
 * **The layout is an order plus a span per tile, not a position per tile.** Free x/y placement
 * lets a dashboard reach states nobody wants — a hole in the middle, two tiles on one cell, a
 * tile off the end — and every implementation that allows it then spends its life repairing
 * them. An ordered list laid out by CSS grid auto-placement cannot reach those states at all:
 * growing a tile pushes the others along and the result is always a valid grid.
 *
 * **Both handles work from the keyboard**, which is where drag-and-drop components usually
 * stop. Tab to a tile's move handle and the arrows move it — left and right by one place, up
 * and down by a whole row. Tab to the corner grip and the arrows resize it. Neither has an ARIA
 * role that fits, so each carries a label saying what it does and where the tile currently is.
 *
 * The tile itself is a card, and that part *is* captured: `OutlinedCardTokens` gives
 * `CornerMedium`, `Level0` at rest and `Level3` while dragged.
 */
const meta: Meta = {
  title: 'Components/Tile Layout',
  parameters: { layout: 'padded' },
};
export default meta;

const Figure = ({ value, note }: { value: string; note: string }) => (
  <Stack gap="xs">
    <strong style={{ fontSize: 28, lineHeight: 1.1, color: 'var(--md-sys-color-on-surface)' }}>{value}</strong>
    <span>{note}</span>
  </Stack>
);

/** Four tiles, one of them two columns wide. */
export const Dashboard: StoryObj = {
  render: () => (
    <TileLayout columns={4} aria-label="Dashboard">
      <Tile id="visits" title="Visits" colSpan={2}>
        <Figure value="12,480" note="Up 6% on last week" />
      </Tile>
      <Tile id="signups" title="Signups">
        <Figure value="312" note="Down 2%" />
      </Tile>
      <Tile id="revenue" title="Revenue">
        <Figure value="£8,120" note="Flat" />
      </Tile>
      <Tile id="churn" title="Churn" colSpan={2} rowSpan={1}>
        <Figure value="1.4%" note="Best quarter so far" />
      </Tile>
    </TileLayout>
  ),
};

/** A tile that covers two rows as well as two columns. */
export const Spans: StoryObj = {
  render: () => (
    <TileLayout columns={3} aria-label="Spans">
      <Tile id="big" title="Two by two" colSpan={2} rowSpan={2}>
        Growing a tile pushes the others along rather than leaving a hole.
      </Tile>
      <Tile id="one" title="One">
        A
      </Tile>
      <Tile id="two" title="Two">
        B
      </Tile>
      <Tile id="three" title="Three">
        C
      </Tile>
    </TileLayout>
  ),
};

/** The handles can be taken away, for a dashboard the app arranges itself. */
export const Fixed: StoryObj = {
  render: () => (
    <TileLayout columns={3} reorderable={false} resizable={false} aria-label="Fixed">
      <Tile id="a" title="No handles">
        Nothing to move, nothing to resize.
      </Tile>
      <Tile id="b" title="Still a card">
        The chrome is the same.
      </Tile>
      <Tile id="c" title="Read only">
        Only the arrangement is fixed.
      </Tile>
    </TileLayout>
  ),
};

/**
 * Controlled, which is how a dashboard that remembers itself is built: the layout is an array
 * the app can store and hand back.
 */
export const Saved: StoryObj = {
  render: function Render() {
    const initial: TileSpec[] = [
      { id: 'a', colSpan: 2, rowSpan: 1 },
      { id: 'b', colSpan: 1, rowSpan: 1 },
      { id: 'c', colSpan: 1, rowSpan: 1 },
    ];
    const [layout, setLayout] = useState<TileSpec[]>(initial);
    return (
      <Stack gap="lg">
        <TileLayout columns={4} layout={layout} onLayoutChange={setLayout} aria-label="Saved">
          <Tile id="a" title="First">
            Move me and watch the array below.
          </Tile>
          <Tile id="b" title="Second">
            B
          </Tile>
          <Tile id="c" title="Third">
            C
          </Tile>
        </TileLayout>
        <code className="sb-label">{layout.map((t) => `${t.id}:${t.colSpan}x${t.rowSpan}`).join('  ')}</code>
        <div>
          <TextButton onClick={() => setLayout(initial)}>Reset</TextButton>
        </div>
      </Stack>
    );
  },
};
