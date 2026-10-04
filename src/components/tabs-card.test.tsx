import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, GrangeProvider, Tab, Tabs, card, cardVariants, tabs } from '../index';

describe('tokens', () => {
  it('matches the navigation tab tokens', () => {
    expect(tabs).toMatchObject({
      height: 48,
      heightWithIcon: 64,
      icon: 24,
      indicatorHeight: 3,
      indicatorCorner: 3,
      dividerHeight: 1,
    });
  });

  it('matches the three card token sets, which differ only in elevation', () => {
    expect(card).toMatchObject({ corner: 12, outlineWidth: 1, icon: 24 });
    expect(cardVariants).toEqual({
      elevated: { elevation: 1, hoverElevation: 2 },
      filled: { elevation: 0, hoverElevation: 1 },
      outlined: { elevation: 0, hoverElevation: 1 },
    });
  });
});

function Basic(props: { variant?: 'primary' | 'secondary'; disabledKeys?: string[] }) {
  return (
    <Tabs aria-label="Sections" {...props}>
      <Tab key="rome" title="Rome">
        Founded on seven hills.
      </Tab>
      <Tab key="athens" title="Athens">
        Older than Rome.
      </Tab>
      <Tab key="cairo" title="Cairo">
        Older than both.
      </Tab>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('is a named tablist of tabs with one panel', () => {
    render(<Basic />);
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    // Only the selected panel is rendered, which is what the collection buys.
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('selects the first tab by default and shows its panel', () => {
    render(<Basic />);
    expect(screen.getByRole('tab', { name: 'Rome' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Founded on seven hills.')).toBeTruthy();
  });

  it('swaps the panel when another tab is chosen', async () => {
    render(<Basic />);
    await userEvent.click(screen.getByRole('tab', { name: 'Athens' }));
    expect(screen.getByText('Older than Rome.')).toBeTruthy();
    expect(screen.queryByText('Founded on seven hills.')).toBeNull();
  });

  it('ties each tab to the panel it controls', () => {
    render(<Basic />);
    const tab = screen.getByRole('tab', { name: 'Rome' });
    const panel = screen.getByRole('tabpanel');
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });

  it('moves between tabs with the arrows', async () => {
    render(<Basic />);
    const rome = screen.getByRole('tab', { name: 'Rome' });
    rome.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Athens' }).getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Cairo' }).getAttribute('aria-selected')).toBe('true');
  });

  it('is one tab stop, so Tab reaches the panel rather than the next tab', async () => {
    render(
      <>
        <button type="button">before</button>
        <Basic />
      </>,
    );
    screen.getByRole('button', { name: 'before' }).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Rome' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('tabpanel'));
  });

  it('can be controlled', async () => {
    function Controlled() {
      const [key, setKey] = useState('rome');
      return (
        <>
          <output>{key}</output>
          <Tabs aria-label="Sections" selectedKey={key} onSelectionChange={(k) => setKey(String(k))}>
            <Tab key="rome" title="Rome">
              A
            </Tab>
            <Tab key="athens" title="Athens">
              B
            </Tab>
          </Tabs>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('tab', { name: 'Athens' }));
    expect(screen.getByText('athens')).toBeTruthy();
  });

  it('skips a disabled tab', async () => {
    render(<Basic disabledKeys={['athens']} />);
    const athens = screen.getByRole('tab', { name: 'Athens' });
    expect(athens.getAttribute('aria-disabled')).toBe('true');

    await userEvent.click(athens);
    expect(screen.getByRole('tab', { name: 'Rome' }).getAttribute('aria-selected')).toBe('true');
  });

  it('marks the variant, which decides the indicator and the active colour', () => {
    const { container, unmount } = render(<Basic />);
    expect((container.querySelector('.grange-tabs') as HTMLElement).dataset.variant).toBe('primary');
    unmount();

    render(<Basic variant="secondary" />);
    expect((document.querySelector('.grange-tabs') as HTMLElement).dataset.variant).toBe('secondary');
  });

  it('takes the taller strip only when a tab carries an icon', () => {
    const { container, unmount } = render(<Basic />);
    expect((container.querySelector('.grange-tabs') as HTMLElement).dataset.withIcon).toBeUndefined();
    unmount();

    render(
      <Tabs aria-label="Sections">
        <Tab key="a" title="With icon" icon={<svg />}>
          A
        </Tab>
        <Tab key="b" title="Without">
          B
        </Tab>
      </Tabs>,
    );
    expect((document.querySelector('.grange-tabs') as HTMLElement).dataset.withIcon).toBe('true');
  });

  it('reaches the list, tab and panel slots', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Tabs: { list: 'my-list', tab: 'my-tab', panel: 'my-panel' } }}>
        <Basic />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-tabs-list')?.className).toContain('my-list');
    expect(container.querySelector('.grange-tab')?.className).toContain('my-tab');
    expect(container.querySelector('.grange-tab-panel')?.className).toContain('my-panel');
  });
});

describe('Card', () => {
  const root = (c: HTMLElement) => c.querySelector('.grange-card') as HTMLElement;

  it('is a plain container by default, with no button semantics', () => {
    const { container } = render(<Card>Content</Card>);
    expect(root(container).tagName).toBe('DIV');
    expect(screen.queryByRole('button')).toBeNull();
    expect(root(container).dataset.interactive).toBeUndefined();
  });

  it.each(['elevated', 'filled', 'outlined'] as const)('marks the %s variant', (variant) => {
    const { container } = render(<Card variant={variant}>Content</Card>);
    expect(root(container).dataset.variant).toBe(variant);
  });

  it('defaults to elevated', () => {
    const { container } = render(<Card>Content</Card>);
    expect(root(container).dataset.variant).toBe('elevated');
  });

  it('becomes a button once given an onClick, and ripples like one', async () => {
    const onClick = vi.fn();
    const { container } = render(<Card onClick={onClick}>Content</Card>);
    const el = screen.getByRole('button');
    expect(el.tagName).toBe('BUTTON');
    expect(root(container).dataset.interactive).toBe('true');
    expect(container.querySelector('.grange-ripple')).not.toBeNull();

    await userEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('becomes an anchor once given an href', () => {
    render(<Card href="/somewhere">Content</Card>);
    expect(screen.getByRole('button').tagName).toBe('A');
  });

  it('does not fire while disabled', async () => {
    const onClick = vi.fn();
    render(
      <Card onClick={onClick} disabled>
        Content
      </Card>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('takes the variant from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Card: { variant: 'outlined' } }}>
        <Card>Content</Card>
      </GrangeProvider>,
    );
    expect(root(container).dataset.variant).toBe('outlined');
  });

  it('reaches the root slot whether interactive or not', () => {
    const { container, unmount } = render(
      <GrangeProvider classNames={{ Card: { root: 'my-card' } }}>
        <Card>Content</Card>
      </GrangeProvider>,
    );
    expect(root(container).className).toContain('my-card');
    unmount();

    render(
      <GrangeProvider classNames={{ Card: { root: 'my-card' } }}>
        <Card onClick={() => {}}>Content</Card>
      </GrangeProvider>,
    );
    expect((document.querySelector('.grange-card') as HTMLElement).className).toContain('my-card');
  });
});
