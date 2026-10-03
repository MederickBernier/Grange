import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Grid, GridItem, GrangeProvider, Stack, list, space, spaceValue } from '../index';

describe('the spacing scale', () => {
  it('is ours, and says so in its own namespace', () => {
    const css = readFileSync('src/tokens/generated/tokens.css', 'utf8');
    // Not --md-sys-*: Material publishes no spacing tokens, and borrowing Google's namespace
    // for a value this project chose would claim a provenance it does not have.
    expect(css).toContain('--grange-space-lg: 16px;');
    expect(css).not.toMatch(/--md-sys-spac/);
  });

  it('sits on the 4dp grid, with nothing off it', () => {
    for (const [name, px] of Object.entries(space)) {
      expect(`${name}=${px % 4}`).toBe(`${name}=0`);
    }
  });

  it('agrees with ListTokens where the components already have a value', () => {
    // md is ItemBetweenSpace and lg is ItemLeadingSpace, so a layout and a list row line up
    // instead of disagreeing by a few pixels.
    expect(space.md).toBe(list.betweenSpace);
    expect(space.lg).toBe(list.leadingSpace);
  });

  it('rises, and stops where a layout should ask for a measurement instead', () => {
    const steps = Object.values(space);
    expect([...steps].sort((a, b) => a - b)).toEqual(steps);
    expect(Math.max(...steps)).toBe(48);
  });
});

describe('spaceValue', () => {
  it('turns a step into the custom property, so a theme can still move it', () => {
    // The property rather than the number: 16px would stop following theme().
    expect(spaceValue('lg')).toBe('var(--grange-space-lg)');
  });

  it('takes a number as px and anything else as it is', () => {
    expect(spaceValue(14)).toBe('14px');
    expect(spaceValue('2rem')).toBe('2rem');
    expect(spaceValue(undefined)).toBeUndefined();
  });
});

describe('Stack', () => {
  const el = (c: HTMLElement) => c.querySelector('.grange-stack') as HTMLElement;

  it('is a column by default, which is what most stacks are', () => {
    const { container } = render(<Stack>content</Stack>);
    expect(el(container).style.flexDirection).toBe('column');
  });

  it('takes its gap off the scale', () => {
    const { container } = render(<Stack gap="lg">content</Stack>);
    expect(el(container).style.gap).toBe('var(--grange-space-lg)');
  });

  it('maps alignment onto the flexbox words', () => {
    const { container } = render(
      <Stack direction="row" align="center" justify="between" wrap>
        content
      </Stack>,
    );
    const style = el(container).style;
    expect(style.alignItems).toBe('center');
    expect(style.justifyContent).toBe('space-between');
    expect(style.flexWrap).toBe('wrap');
  });

  it('reverses the pixels only, which is the whole warning on the prop', () => {
    const { container } = render(
      <Stack direction="row" reverse>
        <span>first</span>
        <span>second</span>
      </Stack>,
    );
    expect(el(container).style.flexDirection).toBe('row-reverse');
    // The DOM order is untouched, so Tab and a screen reader still read first then second.
    expect(el(container).textContent).toBe('firstsecond');
  });

  it('renders the element it is told to, because layout does not decide semantics', () => {
    render(
      <Stack as="ul">
        <li>one</li>
      </Stack>,
    );
    expect(screen.getByRole('list').tagName).toBe('UL');
  });

  it('lets a caller style win over the computed layout', () => {
    const { container } = render(<Stack gap="lg" style={{ gap: '3px' }} />);
    expect(el(container).style.gap).toBe('3px');
  });

  it('takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Stack: { direction: 'row', gap: 'sm' } }}>
        <Stack />
      </GrangeProvider>,
    );
    expect(el(container).style.flexDirection).toBe('row');
    expect(el(container).style.gap).toBe('var(--grange-space-sm)');
  });
});

describe('Grid', () => {
  const el = (c: HTMLElement) => c.querySelector('.grange-grid') as HTMLElement;

  it('makes a column count into tracks that are actually equal', () => {
    const { container } = render(<Grid columns={3} />);
    // minmax(0, 1fr), not 1fr: a 1fr track has an automatic minimum of its content, so one long
    // word would make its column wider than its share.
    expect(el(container).style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
  });

  it('passes a template through for the cases a count cannot express', () => {
    const { container } = render(<Grid columns="repeat(auto-fit, minmax(200px, 1fr))" />);
    expect(el(container).style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(200px, 1fr))');
  });

  it('takes its gaps off the scale, separately when asked', () => {
    const { container } = render(<Grid columns={2} columnGap="xl" rowGap={6} />);
    expect(el(container).style.columnGap).toBe('var(--grange-space-xl)');
    expect(el(container).style.rowGap).toBe('6px');
  });

  it('writes both gap longhands rather than the shorthand, which React would then wipe', () => {
    const { container } = render(<Grid columns={2} gap="md" />);
    const style = el(container).style;
    /*
     * React applies a style object key by key, and an undefined value clears that property. A
     * `{ gap, columnGap: undefined, rowGap: undefined }` object therefore set the shorthand and
     * immediately cleared both halves of it: the grid rendered with no gaps and the inline
     * style said nothing about why.
     */
    expect(style.rowGap).toBe('var(--grange-space-md)');
    expect(style.columnGap).toBe('var(--grange-space-md)');
  });

  it('lets one side override the shared gap', () => {
    const { container } = render(<Grid columns={2} gap="md" rowGap="xl" />);
    expect(el(container).getAttribute('style')).toContain('row-gap: var(--grange-space-xl)');
    expect(el(container).getAttribute('style')).toContain('column-gap: var(--grange-space-md)');
  });

  it('takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Grid: { columns: 4, gap: 'md' } }}>
        <Grid />
      </GrangeProvider>,
    );
    expect(el(container).style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    // Both longhands, never the shorthand — see the test above for why.
    expect(el(container).style.rowGap).toBe('var(--grange-space-md)');
  });
});

describe('GridItem', () => {
  const el = (c: HTMLElement) => c.querySelector('.grange-grid-item') as HTMLElement;

  it('spans the columns it is given', () => {
    const { container } = render(<GridItem colSpan={2} rowSpan={3} />);
    // Longhands, not the grid-column shorthand: React does not reliably set both halves of it,
    // and the browser was left with only the end line while the span did nothing.
    expect(el(container).style.gridColumnEnd).toBe('span 2');
    expect(el(container).style.gridRowEnd).toBe('span 3');
  });

  it("takes the whole row with 'all', whatever the column count is", () => {
    const { container } = render(<GridItem colSpan="all" />);
    /*
     * Only the start line is asserted here, and that is a limitation worth writing down:
     * jsdom's CSS parser rejects a negative grid line outright, so `grid-column-end: -1`
     * never reaches the style object no matter how it is written. Chrome accepts it, and the
     * visual baseline for the Grids story is what actually proves the cell spans the row.
     */
    expect(el(container).style.gridColumnStart).toBe('1');
  });

  it('places itself when given a start line', () => {
    const { container } = render(<GridItem colStart={2} rowStart={3} />);
    expect(el(container).style.gridColumnStart).toBe('2');
    expect(el(container).style.gridRowStart).toBe('3');
  });

  it('adds nothing when it is asked for nothing', () => {
    const { container } = render(<GridItem>plain</GridItem>);
    expect(el(container).getAttribute('style')).toBeNull();
  });
});
