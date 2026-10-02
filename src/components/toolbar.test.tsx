import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import {
  DockedToolbar,
  FloatingToolbar,
  GrangeProvider,
  IconButton,
  ToggleButton,
  dockedToolbar,
  floatingToolbar,
} from '../index';

const items = () => screen.getAllByRole('button');

function Floating(props: { orientation?: 'horizontal' | 'vertical'; variant?: 'standard' | 'vibrant' }) {
  return (
    <FloatingToolbar aria-label="Formatting" {...props}>
      <IconButton aria-label="Bold">
        <svg />
      </IconButton>
      <IconButton aria-label="Italic">
        <svg />
      </IconButton>
      <IconButton aria-label="Underline">
        <svg />
      </IconButton>
    </FloatingToolbar>
  );
}

describe('tokens', () => {
  it('match FloatingToolbarTokens', () => {
    expect(floatingToolbar).toMatchObject({ height: 64, padding: 8, gap: 4, externalPadding: 16 });
  });

  it('match DockedToolbarTokens', () => {
    expect(dockedToolbar).toMatchObject({ height: 64, padding: 16, minSpacing: 4, maxSpacing: 32 });
  });
});

describe('FloatingToolbar', () => {
  it('is announced as a named toolbar', () => {
    render(<Floating />);
    const bar = screen.getByRole('toolbar', { name: 'Formatting' });
    expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('carries its orientation through to assistive tech', () => {
    render(<Floating orientation="vertical" />);
    expect(screen.getByRole('toolbar').getAttribute('aria-orientation')).toBe('vertical');
    expect(screen.getByRole('toolbar').dataset.orientation).toBe('vertical');
  });

  it('moves between items with the arrow keys', async () => {
    render(<Floating />);
    const [bold, italic, underline] = items();
    bold!.focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(italic);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(underline);
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(italic);
  });

  it('uses the vertical arrows when vertical', async () => {
    render(<Floating orientation="vertical" />);
    const [bold, italic] = items();
    bold!.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(italic);
  });

  it('reverses the arrows in a right-to-left locale', async () => {
    render(
      <I18nProvider locale="ar-EG">
        <Floating />
      </I18nProvider>,
    );
    const [bold, italic, underline] = items();
    // In RTL the row runs the other way, so ArrowLeft advances and ArrowRight goes back.
    bold!.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(italic);

    underline!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(italic);
  });

  it('stops at the ends rather than wrapping, as React Aria toolbars do', async () => {
    render(<Floating />);
    const [bold, , underline] = items();

    bold!.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(bold);

    underline!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(underline);
  });

  it('is one tab stop, not one per item', async () => {
    render(
      <>
        <button type="button">before</button>
        <Floating />
        <button type="button">after</button>
      </>,
    );
    screen.getByRole('button', { name: 'before' }).focus();
    await userEvent.tab();
    expect(screen.getByRole('toolbar').contains(document.activeElement)).toBe(true);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'after' }));
  });

  it('marks the vibrant variant, which restyles the buttons inside it', () => {
    render(<Floating variant="vibrant" />);
    expect(screen.getByRole('toolbar').dataset.variant).toBe('vibrant');
  });

  it('defaults to standard and horizontal', () => {
    render(<Floating />);
    expect(screen.getByRole('toolbar').dataset).toMatchObject({
      variant: 'standard',
      orientation: 'horizontal',
    });
  });

  it('takes app-wide defaults', () => {
    render(
      <GrangeProvider defaultProps={{ FloatingToolbar: { variant: 'vibrant', orientation: 'vertical' } }}>
        <Floating />
      </GrangeProvider>,
    );
    expect(screen.getByRole('toolbar').dataset).toMatchObject({
      variant: 'vibrant',
      orientation: 'vertical',
    });
  });

  it('becomes a group when nested in another toolbar, so there is one toolbar role', () => {
    render(
      <FloatingToolbar aria-label="Outer">
        <IconButton aria-label="A">
          <svg />
        </IconButton>
        <FloatingToolbar aria-label="Inner">
          <IconButton aria-label="B">
            <svg />
          </IconButton>
        </FloatingToolbar>
      </FloatingToolbar>,
    );
    expect(screen.getAllByRole('toolbar')).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Inner' })).toBeTruthy();
  });

  it('keeps a selected toggle inside a vibrant bar marked, so the CSS can lift it out', () => {
    render(
      <FloatingToolbar aria-label="Formatting" variant="vibrant">
        <ToggleButton defaultSelected>Bold</ToggleButton>
      </FloatingToolbar>,
    );
    expect(screen.getByRole('button').dataset.selected).toBe('true');
  });
});

describe('DockedToolbar', () => {
  function Docked() {
    return (
      <DockedToolbar aria-label="Actions">
        <IconButton aria-label="One">
          <svg />
        </IconButton>
        <IconButton aria-label="Two">
          <svg />
        </IconButton>
        <IconButton aria-label="Three">
          <svg />
        </IconButton>
      </DockedToolbar>
    );
  }

  it('is announced as a named toolbar', () => {
    render(<Docked />);
    expect(screen.getByRole('toolbar', { name: 'Actions' })).toBeTruthy();
  });

  it('puts a spacer between items, and never before the first or after the last', () => {
    render(<Docked />);
    const bar = screen.getByRole('toolbar');
    // Queried by the stable hook, not by aria-hidden: every ButtonBase renders hidden spans of
    // its own for the state layer, ripple and elevation.
    expect(bar.querySelectorAll('.grange-toolbar-spacer').length).toBe(2);
    expect(bar.firstElementChild?.classList.contains('grange-toolbar-spacer')).toBe(false);
    expect(bar.lastElementChild?.classList.contains('grange-toolbar-spacer')).toBe(false);
  });

  it('needs no spacer for a single item', () => {
    render(
      <DockedToolbar aria-label="Actions">
        <IconButton aria-label="Only">
          <svg />
        </IconButton>
      </DockedToolbar>,
    );
    expect(screen.getByRole('toolbar').querySelectorAll('.grange-toolbar-spacer').length).toBe(0);
  });

  it('keeps the spacers out of the keyboard path', async () => {
    render(<Docked />);
    const [one, two] = items();
    one!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(two);
  });
});
