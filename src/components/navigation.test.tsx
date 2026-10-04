import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GrangeProvider,
  NavigationBar,
  NavigationItem,
  NavigationRail,
  navigationBar,
  navigationItem,
  navigationRail,
} from '../index';

describe('tokens', () => {
  it('matches NavigationBarTokens', () => {
    expect(navigationBar).toMatchObject({ height: 64, tallHeight: 80, betweenSpace: 0 });
  });

  it('matches the rail tokens, whose expanded width is a range', () => {
    expect(navigationRail).toMatchObject({
      width: 96,
      narrowWidth: 80,
      expandedMinWidth: 220,
      expandedMaxWidth: 360,
      topSpace: 44,
      itemVerticalSpace: 4,
    });
  });

  it('matches the item tokens, which differ by arrangement', () => {
    expect(navigationItem).toMatchObject({
      icon: 24,
      verticalIndicatorWidth: 56,
      verticalIndicatorHeight: 32,
      horizontalIndicatorHeight: 40,
      horizontalIndicatorPadding: 16,
      iconLabelSpace: 4,
    });
  });
});

function Bar(props: { arrangement?: 'vertical' | 'horizontal'; tall?: boolean; current?: string }) {
  const current = props.current ?? 'home';
  return (
    <NavigationBar aria-label="Main" arrangement={props.arrangement} tall={props.tall}>
      {['home', 'search', 'saved'].map((id) => (
        <NavigationItem key={id} icon={<svg />} selected={current === id}>
          {id}
        </NavigationItem>
      ))}
    </NavigationBar>
  );
}

describe('NavigationBar', () => {
  it('is a named navigation landmark', () => {
    render(<Bar />);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
  });

  it('marks the current destination with aria-current, not aria-selected', () => {
    render(<Bar current="search" />);
    const search = screen.getByRole('button', { name: 'search' });
    expect(search.getAttribute('aria-current')).toBe('page');
    expect(search.getAttribute('aria-selected')).toBeNull();
    // These lead somewhere, so they are not tabs.
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('leaves the other destinations unmarked', () => {
    render(<Bar current="home" />);
    expect(screen.getByRole('button', { name: 'search' }).getAttribute('aria-current')).toBeNull();
  });

  it('reports a press', async () => {
    const onClick = vi.fn();
    render(
      <NavigationBar aria-label="Main">
        <NavigationItem icon={<svg />} onClick={onClick}>
          Home
        </NavigationItem>
      </NavigationBar>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be driven as a controlled set', async () => {
    function Controlled() {
      const [current, setCurrent] = useState('home');
      return (
        <>
          <output data-testid="current">{current}</output>
          <NavigationBar aria-label="Main">
            {['home', 'search'].map((id) => (
              <NavigationItem
                key={id}
                icon={<svg />}
                selected={current === id}
                onClick={() => setCurrent(id)}
              >
                {id}
              </NavigationItem>
            ))}
          </NavigationBar>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'search' }));
    // Read from the output by testid: the item's own label is also the text "search".
    expect(screen.getByTestId('current').textContent).toBe('search');
  });

  it('renders a link when given an href, which real navigation wants', () => {
    render(
      <NavigationBar aria-label="Main">
        <NavigationItem icon={<svg />} href="/home" selected>
          Home
        </NavigationItem>
      </NavigationBar>,
    );
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('swaps in the selected icon only while current', () => {
    const { unmount } = render(
      <NavigationBar aria-label="Main">
        <NavigationItem icon={<svg data-testid="off" />} selectedIcon={<svg data-testid="on" />} selected>
          Home
        </NavigationItem>
      </NavigationBar>,
    );
    expect(screen.queryByTestId('on')).not.toBeNull();
    expect(screen.queryByTestId('off')).toBeNull();
    unmount();

    render(
      <NavigationBar aria-label="Main">
        <NavigationItem icon={<svg data-testid="off" />} selectedIcon={<svg data-testid="on" />}>
          Home
        </NavigationItem>
      </NavigationBar>,
    );
    expect(screen.queryByTestId('off')).not.toBeNull();
  });

  it('renders a badge on the icon', () => {
    render(
      <NavigationBar aria-label="Main">
        <NavigationItem icon={<svg />} badge="9">
          Inbox
        </NavigationItem>
      </NavigationBar>,
    );
    expect(screen.getByText('9')).toBeTruthy();
  });

  it('does not fire while disabled', async () => {
    const onClick = vi.fn();
    render(
      <NavigationBar aria-label="Main">
        <NavigationItem icon={<svg />} onClick={onClick} disabled>
          Home
        </NavigationItem>
      </NavigationBar>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Home' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('marks the arrangement and the tall bar', () => {
    const { container, unmount } = render(<Bar />);
    const bar = container.querySelector('.grange-navigation-bar') as HTMLElement;
    expect(bar.dataset.arrangement).toBe('vertical');
    expect(bar.dataset.tall).toBeUndefined();
    unmount();

    render(<Bar arrangement="horizontal" tall />);
    const tall = document.querySelector('.grange-navigation-bar') as HTMLElement;
    expect(tall.dataset.arrangement).toBe('horizontal');
    expect(tall.dataset.tall).toBe('true');
  });

  it('puts the ripple and state layer on the indicator, not the whole item', () => {
    const { container } = render(<Bar />);
    const indicator = container.querySelector('.grange-navigation-item > span') as HTMLElement;
    expect(indicator.querySelector('.grange-state-layer')).not.toBeNull();
    expect(indicator.querySelector('.grange-ripple')).not.toBeNull();
  });

  it('drops the ripple when the config turns it off', () => {
    const { container } = render(
      <GrangeProvider behavior={{ ripple: { enabled: false } }}>
        <Bar />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-ripple')).toBeNull();
  });
});

describe('NavigationRail', () => {
  const rail = (c: HTMLElement) => c.querySelector('.grange-navigation-rail') as HTMLElement;

  it('is a named navigation landmark', () => {
    render(
      <NavigationRail aria-label="Sections">
        <NavigationItem icon={<svg />}>Home</NavigationItem>
      </NavigationRail>,
    );
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy();
  });

  it('stacks its items collapsed and lays them inline expanded', () => {
    const { container, unmount } = render(
      <NavigationRail aria-label="Sections">
        <NavigationItem icon={<svg />}>Home</NavigationItem>
      </NavigationRail>,
    );
    expect(rail(container).dataset.expanded).toBeUndefined();
    expect(
      (container.querySelector('.grange-navigation-rail > div') as HTMLElement).dataset.arrangement,
    ).toBe('vertical');
    unmount();

    render(
      <NavigationRail aria-label="Sections" expanded>
        <NavigationItem icon={<svg />}>Home</NavigationItem>
      </NavigationRail>,
    );
    expect((document.querySelector('.grange-navigation-rail') as HTMLElement).dataset.expanded).toBe('true');
    expect((document.querySelector('.grange-navigation-rail > div') as HTMLElement).dataset.arrangement).toBe(
      'horizontal',
    );
  });

  it('takes the narrow width only while collapsed', () => {
    const { container, unmount } = render(
      <NavigationRail aria-label="Sections" narrow>
        <NavigationItem icon={<svg />}>Home</NavigationItem>
      </NavigationRail>,
    );
    expect(rail(container).dataset.narrow).toBe('true');
    unmount();

    // Expanded has its own width range, so narrow no longer applies.
    render(
      <NavigationRail aria-label="Sections" narrow expanded>
        <NavigationItem icon={<svg />}>Home</NavigationItem>
      </NavigationRail>,
    );
    expect((document.querySelector('.grange-navigation-rail') as HTMLElement).dataset.narrow).toBeUndefined();
  });

  it('renders a header above the items', () => {
    render(
      <NavigationRail aria-label="Sections" header={<button type="button">Compose</button>}>
        <NavigationItem icon={<svg />}>Home</NavigationItem>
      </NavigationRail>,
    );
    expect(screen.getByRole('button', { name: 'Compose' })).toBeTruthy();
  });

  it('takes app-wide defaults', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ NavigationRail: { expanded: true } }}>
        <NavigationRail aria-label="Sections">
          <NavigationItem icon={<svg />}>Home</NavigationItem>
        </NavigationRail>
      </GrangeProvider>,
    );
    expect(rail(container).dataset.expanded).toBe('true');
  });

  it('hides the label when asked, leaving the icon', () => {
    render(
      <NavigationRail aria-label="Sections">
        <NavigationItem icon={<svg />} hideLabel>
          Home
        </NavigationItem>
      </NavigationRail>,
    );
    expect(screen.queryByText('Home')).toBeNull();
  });
});
