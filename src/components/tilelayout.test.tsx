import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GrangeProvider,
  Tile,
  TileLayout,
  list,
  moveTile,
  reconcile,
  resizeTile,
  tileAt,
  tileLayout,
  type TileSpec,
} from '../index';

const spec = (id: string, colSpan = 1, rowSpan = 1): TileSpec => ({ id, colSpan, rowSpan });

describe('tokens', () => {
  it('takes the tile from OutlinedCardTokens, including the dragged state', () => {
    expect(tileLayout.corner).toBe(12); // ContainerShape: CornerMedium
    expect(tileLayout.elevation).toBe(0); // ContainerElevation: Level0
    // The one genuinely useful capture here: Compose publishes a dragged elevation for a card.
    expect(tileLayout.draggedElevation).toBe(3); // DraggedContainerElevation: Level3
  });

  it("uses the list row for the tile's header", () => {
    expect(tileLayout.headerHeight).toBe(list.oneLine);
    expect(tileLayout.gutter).toBe(list.leadingSpace);
  });
});

/*
 * The layout arithmetic is tested here rather than through a rendered grid, for the reason the
 * module exists: jsdom reports every element as 0 by 0, so a grid can never be measured in it.
 */
describe('moveTile', () => {
  const tiles = [spec('a'), spec('b'), spec('c'), spec('d')];
  const ids = (list_: TileSpec[]) => list_.map((t) => t.id);

  it('slides the tiles between, rather than swapping', () => {
    // A swap would leave 'b' where 'a' started, which is not what moving a tile means.
    expect(ids(moveTile(tiles, 0, 2))).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves backwards the same way', () => {
    expect(ids(moveTile(tiles, 3, 1))).toEqual(['a', 'd', 'b', 'c']);
  });

  it('clamps a target past either end instead of dropping the tile', () => {
    expect(ids(moveTile(tiles, 0, -5))).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(moveTile(tiles, 0, 99))).toEqual(['b', 'c', 'd', 'a']);
  });

  it('ignores an index that is not there', () => {
    expect(ids(moveTile(tiles, 9, 0))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('never loses or duplicates a tile', () => {
    for (const from of [0, 1, 2, 3]) {
      for (const to of [-1, 0, 2, 7]) {
        expect(ids(moveTile(tiles, from, to)).sort()).toEqual(['a', 'b', 'c', 'd']);
      }
    }
  });
});

describe('resizeTile', () => {
  const tiles = [spec('a', 2, 1), spec('b')];

  it('changes only the tile it names', () => {
    const out = resizeTile(tiles, 'a', 1, 1, 4);
    expect(out[0]).toEqual({ id: 'a', colSpan: 3, rowSpan: 2 });
    expect(out[1]).toEqual(spec('b'));
  });

  it('never goes below one track', () => {
    expect(resizeTile(tiles, 'a', -9, -9, 4)[0]).toEqual({ id: 'a', colSpan: 1, rowSpan: 1 });
  });

  it('never grows wider than the grid, which would overflow its own row', () => {
    expect(resizeTile(tiles, 'a', 9, 0, 4)[0]!.colSpan).toBe(4);
  });

  it('leaves rows unbounded, because a grid has as many as it needs', () => {
    expect(resizeTile(tiles, 'a', 0, 9, 4)[0]!.rowSpan).toBe(10);
  });
});

describe('reconcile', () => {
  it('keeps a saved order and drops tiles that have gone', () => {
    const saved = [spec('c'), spec('a'), spec('b')];
    const out = reconcile(saved, [spec('a'), spec('c')]);
    expect(out.map((t) => t.id)).toEqual(['c', 'a']);
  });

  it('adds new tiles at the end rather than rearranging', () => {
    // A saved dashboard that gains a tile should not shuffle itself.
    const saved = [spec('c'), spec('a')];
    const out = reconcile(saved, [spec('a'), spec('b'), spec('c')]);
    expect(out.map((t) => t.id)).toEqual(['c', 'a', 'b']);
  });

  it('starts from the declared tiles when nothing was saved', () => {
    expect(reconcile([], [spec('a'), spec('b')]).map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('tileAt', () => {
  const rects = [
    { left: 0, right: 100, top: 0, bottom: 100 },
    { left: 100, right: 200, top: 0, bottom: 100 },
  ];

  it('finds the rectangle a point is inside', () => {
    expect(tileAt(rects, 50, 50)).toBe(0);
    expect(tileAt(rects, 150, 50)).toBe(1);
  });

  it('reports nothing for a point outside them all', () => {
    expect(tileAt(rects, 500, 500)).toBe(-1);
  });
});

describe('TileLayout', () => {
  const tiles = (
    <>
      <Tile id="a" title="Visits" colSpan={2}>
        A
      </Tile>
      <Tile id="b" title="Signups">
        B
      </Tile>
      <Tile id="c" title="Revenue">
        C
      </Tile>
    </>
  );
  const order = () => screen.getAllByRole('listitem').map((el) => el.getAttribute('aria-label'));

  it('is a labelled list of tiles in the declared order', () => {
    render(<TileLayout>{tiles}</TileLayout>);
    expect(screen.getByRole('list', { name: 'Tiles' })).not.toBeNull();
    expect(order()).toEqual(['Visits', 'Signups', 'Revenue']);
  });

  it('spans the tracks a tile asked for', () => {
    render(<TileLayout>{tiles}</TileLayout>);
    const first = screen.getAllByRole('listitem')[0]!;
    // Longhands, not the grid-column shorthand: React does not reliably write both halves.
    expect(first.style.gridColumnEnd).toBe('span 2');
  });

  it('says where each tile is, not only that it can be moved', () => {
    render(<TileLayout>{tiles}</TileLayout>);
    expect(screen.getByLabelText('Move Signups, position 2 of 3, use the arrow keys')).not.toBeNull();
  });

  it('moves a tile one place with an arrow key', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<TileLayout onLayoutChange={onLayoutChange}>{tiles}</TileLayout>);

    screen.getByLabelText(/^Move Visits/).focus();
    await user.keyboard('{ArrowRight}');
    expect(onLayoutChange.mock.calls[0]![0].map((t: TileSpec) => t.id)).toEqual(['b', 'a', 'c']);
  });

  it('moves a tile a whole row with the vertical arrows', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(
      <TileLayout columns={2} onLayoutChange={onLayoutChange}>
        {tiles}
      </TileLayout>,
    );

    screen.getByLabelText(/^Move Visits/).focus();
    await user.keyboard('{ArrowDown}');
    // Down is one row, which in a two-column grid is two places along the order.
    expect(onLayoutChange.mock.calls[0]![0].map((t: TileSpec) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('resizes from the keyboard, and says how big the tile is', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<TileLayout onLayoutChange={onLayoutChange}>{tiles}</TileLayout>);

    screen.getByLabelText('Resize Signups, 1 by 1').focus();
    await user.keyboard('{ArrowRight}');
    const next = onLayoutChange.mock.calls[0]![0] as TileSpec[];
    expect(next.find((t) => t.id === 'b')).toEqual({ id: 'b', colSpan: 2, rowSpan: 1 });
  });

  it('drops the handles it is told not to offer', () => {
    render(
      <TileLayout reorderable={false} resizable={false}>
        {tiles}
      </TileLayout>,
    );
    expect(screen.queryByLabelText(/^Move /)).toBeNull();
    expect(screen.queryByLabelText(/^Resize /)).toBeNull();
  });

  it('survives its children changing under a saved layout', () => {
    const { rerender } = render(
      <TileLayout layout={[spec('c'), spec('a'), spec('b')]}>{tiles}</TileLayout>,
    );
    expect(order()).toEqual(['Revenue', 'Visits', 'Signups']);

    rerender(
      <TileLayout layout={[spec('c'), spec('a'), spec('b')]}>
        <Tile id="c" title="Revenue">
          C
        </Tile>
        <Tile id="d" title="Churn">
          D
        </Tile>
      </TileLayout>,
    );
    // 'a' and 'b' are gone, 'd' joins the end, and 'c' keeps its place.
    expect(order()).toEqual(['Revenue', 'Churn']);
  });

  it('counts tiles written as a fragment', () => {
    render(
      <TileLayout>
        <>
          <Tile id="a" title="One" />
          <Tile id="b" title="Two" />
        </>
      </TileLayout>,
    );
    expect(order()).toEqual(['One', 'Two']);
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [at, setAt] = useState<TileSpec[]>([spec('a', 2), spec('b'), spec('c')]);
      return (
        <TileLayout layout={at} onLayoutChange={setAt}>
          {tiles}
        </TileLayout>
      );
    }
    render(<Controlled />);
    screen.getByLabelText(/^Move Visits/).focus();
    await user.keyboard('{ArrowRight}');
    expect(order()).toEqual(['Signups', 'Visits', 'Revenue']);
  });

  it('takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ TileLayout: { columns: 6, gap: 'sm', rowHeight: 100 } }}>
        <TileLayout>{tiles}</TileLayout>
      </GrangeProvider>,
    );
    const grid = container.querySelector('.grange-tile-layout') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(6, minmax(0, 1fr))');
    expect(grid.style.gridAutoRows).toBe('100px');
    expect(grid.style.rowGap).toBe('var(--grange-space-sm)');
  });
});
