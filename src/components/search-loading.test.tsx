import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GrangeProvider,
  List,
  ListItem,
  LoadingIndicator,
  Search,
  defaultShapes,
  shapeNames,
  loadingIndicator,
  searchBar,
  searchView,
} from '../index';

describe('tokens', () => {
  it('matches SearchBarTokens', () => {
    expect(searchBar).toMatchObject({ height: 56, corner: 9999, elevation: 3, avatar: 30, icon: 24 });
  });

  it('matches SearchViewTokens, whose two forms differ in shape and header height', () => {
    expect(searchView).toMatchObject({
      dockedCorner: 28,
      fullScreenCorner: 0,
      dockedHeaderHeight: 56,
      fullScreenHeaderHeight: 72,
    });
  });

  it('matches LoadingIndicatorTokens', () => {
    expect(loadingIndicator).toMatchObject({ size: 48, activeSize: 38 });
  });

  it('cycles regular polygons only, which is the subset that can be derived exactly', () => {
    expect(defaultShapes.length).toBeGreaterThan(1);
    // Every one is a real name from the captured library, not a shape invented here.
    for (const name of defaultShapes) expect(shapeNames).toContain(name);
  });
});

describe('Search', () => {
  const field = () => screen.getByRole('searchbox');

  it('is a searchbox, not a textbox, so it is described properly', () => {
    render(<Search aria-label="Search mail" />);
    expect(field()).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('defaults its label, since a search bar with no name is unusable', () => {
    render(<Search />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeTruthy();
  });

  it('reports typing', async () => {
    const onChange = vi.fn();
    render(<Search onChange={onChange} />);
    await userEvent.type(field(), 'ada');
    expect(onChange).toHaveBeenLastCalledWith('ada');
  });

  it('submits on Enter', async () => {
    const onSubmit = vi.fn();
    render(<Search onSubmit={onSubmit} defaultValue="ada" />);
    field().focus();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('ada');
  });

  it('shows a clear button only once there is something to clear', async () => {
    render(<Search />);
    expect(screen.queryByRole('button')).toBeNull();
    await userEvent.type(field(), 'a');
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('clears from the button and from Escape, which a bare input would not do', async () => {
    const onClear = vi.fn();
    render(<Search onClear={onClear} defaultValue="ada" />);
    await userEvent.click(screen.getByRole('button'));
    expect((field() as HTMLInputElement).value).toBe('');
    expect(onClear).toHaveBeenCalled();

    await userEvent.type(field(), 'grace');
    field().focus();
    await userEvent.keyboard('{Escape}');
    expect((field() as HTMLInputElement).value).toBe('');
  });

  it('renders the leading and trailing slots', () => {
    render(<Search leading={<svg data-testid="lead" />} trailing={<svg data-testid="trail" />} />);
    expect(screen.getByTestId('lead')).toBeTruthy();
    expect(screen.getByTestId('trail')).toBeTruthy();
  });

  it('keeps the view closed until it is told to open', () => {
    const { container, unmount } = render(
      <Search>
        <List aria-label="Results">
          <ListItem>Ada</ListItem>
        </List>
      </Search>,
    );
    expect(container.querySelector('.grange-search-view')).toBeNull();
    unmount();

    render(
      <Search open>
        <List aria-label="Results">
          <ListItem>Ada</ListItem>
        </List>
      </Search>,
    );
    expect(document.querySelector('.grange-search-view')).not.toBeNull();
    expect(screen.getByRole('list', { name: 'Results' })).toBeTruthy();
  });

  it('needs results to show a view, not just an open flag', () => {
    const { container } = render(<Search open />);
    expect(container.querySelector('.grange-search-view')).toBeNull();
  });

  it('marks the full screen form, which squares its corners', () => {
    const { container } = render(
      <Search open fullScreen>
        <p>Results</p>
      </Search>,
    );
    expect((container.querySelector('.grange-search') as HTMLElement).dataset.fullScreen).toBe('true');
  });

  it('can be controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <>
          <Search value={value} onChange={setValue} />
          <output data-testid="value">{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.type(screen.getByRole('searchbox'), 'ab');
    expect(screen.getByTestId('value').textContent).toBe('ab');
  });

  it('reaches the bar and input slots', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Search: { bar: 'my-bar', input: 'my-input' } }}>
        <Search />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-search-bar')?.className).toContain('my-bar');
    expect(container.querySelector('.grange-search-input')?.className).toContain('my-input');
  });
});

describe('LoadingIndicator', () => {
  const el = (c: HTMLElement) => c.querySelector('.grange-loading-indicator') as HTMLElement;

  it('is an indeterminate progress bar, since it cannot say how far along it is', () => {
    render(<LoadingIndicator aria-label="Loading" />);
    const bar = screen.getByRole('progressbar', { name: 'Loading' });
    expect(bar.getAttribute('aria-valuenow')).toBeNull();
  });

  it('draws a closed shape path', () => {
    const { container } = render(<LoadingIndicator aria-label="Loading" />);
    const d = container.querySelector('path')!.getAttribute('d')!;
    expect(d).toMatch(/^M /);
    expect(d).toMatch(/Z$/);
  });

  it('takes the token size by default and an explicit one when given', () => {
    const { container, unmount } = render(<LoadingIndicator aria-label="Loading" />);
    expect(el(container).style.getPropertyValue('--_size')).toBe('48px');
    unmount();

    render(<LoadingIndicator aria-label="Loading" size={72} />);
    expect(el(document.body).style.getPropertyValue('--_size')).toBe('72px');
  });

  it('marks the contained variant, which fills the container behind the shape', () => {
    const { container } = render(<LoadingIndicator aria-label="Loading" contained />);
    expect(el(container).dataset.contained).toBe('true');
  });

  it('keeps the shape inside the box it is given', () => {
    const { container } = render(<LoadingIndicator aria-label="Loading" size={48} />);
    const d = container.querySelector('path')!.getAttribute('d')!;
    const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...numbers)).toBeLessThanOrEqual(48);
  });

  it('accepts its own shape sequence', () => {
    const { container } = render(<LoadingIndicator aria-label="Loading" shapes={['Heart']} />);
    expect(container.querySelector('path')?.getAttribute('d')).toBeTruthy();
  });

  it('reaches the root slot', () => {
    const { container } = render(
      <GrangeProvider classNames={{ LoadingIndicator: { root: 'my-indicator' } }}>
        <LoadingIndicator aria-label="Loading" />
      </GrangeProvider>,
    );
    expect(el(container).className).toContain('my-indicator');
  });
});
