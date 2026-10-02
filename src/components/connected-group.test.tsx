import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import { ConnectedButtonGroup, ConnectedButtonGroupItem } from '../index';

const segments = (
  <>
    <ConnectedButtonGroupItem id="day">Day</ConnectedButtonGroupItem>
    <ConnectedButtonGroupItem id="week">Week</ConnectedButtonGroupItem>
    <ConnectedButtonGroupItem id="month">Month</ConnectedButtonGroupItem>
  </>
);

const radios = () => screen.getAllByRole('radio');
const focused = () => document.activeElement?.textContent;

describe('single select is a radiogroup', () => {
  it('says what it is, rather than calling a segmented control a row of toggles', () => {
    render(
      <ConnectedButtonGroup aria-label="Range" defaultSelectedKeys={['week']}>
        {segments}
      </ConnectedButtonGroup>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Range' })).toBeTruthy();
    expect(radios()).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Week' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Day' }).getAttribute('aria-checked')).toBe('false');
    // aria-pressed would be saying it is a toggle button, which it is not.
    expect(screen.getByRole('radio', { name: 'Week' }).hasAttribute('aria-pressed')).toBe(false);
  });

  it('is one tab stop, landing on the selected item', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <ConnectedButtonGroup aria-label="Range" defaultSelectedKeys={['month']}>
          {segments}
        </ConnectedButtonGroup>
        <button type="button">After</button>
      </>,
    );
    expect(radios().map((radio) => radio.tabIndex)).toEqual([-1, -1, 0]);

    await user.tab();
    await user.tab();
    expect(focused()).toBe('Month');
    // One more Tab leaves the group entirely rather than stepping through the rest of it.
    await user.tab();
    expect(focused()).toBe('After');
  });

  it('takes the first item as the tab stop when nothing is selected', () => {
    render(
      <ConnectedButtonGroup aria-label="Range">
        <ConnectedButtonGroupItem id="day">Day</ConnectedButtonGroupItem>
        <ConnectedButtonGroupItem id="week">Week</ConnectedButtonGroupItem>
      </ConnectedButtonGroup>,
    );
    expect(radios().map((radio) => radio.tabIndex)).toEqual([0, -1]);
  });

  it('moves and selects together on the arrows, which is what one tab stop buys', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <ConnectedButtonGroup aria-label="Range" defaultSelectedKeys={['day']} onSelectionChange={onSelectionChange}>
        {segments}
      </ConnectedButtonGroup>,
    );
    await user.tab();
    expect(focused()).toBe('Day');

    await user.keyboard('{ArrowRight}');
    expect(focused()).toBe('Week');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['week']));
    expect(screen.getByRole('radio', { name: 'Week' }).getAttribute('aria-checked')).toBe('true');

    await user.keyboard('{ArrowLeft}');
    expect(focused()).toBe('Day');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['day']));
  });

  it('wraps round the ends, and Home and End jump to them', async () => {
    const user = userEvent.setup();
    render(
      <ConnectedButtonGroup aria-label="Range" defaultSelectedKeys={['day']}>
        {segments}
      </ConnectedButtonGroup>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(focused()).toBe('Month');
    await user.keyboard('{ArrowRight}');
    expect(focused()).toBe('Day');
    await user.keyboard('{End}');
    expect(focused()).toBe('Month');
    await user.keyboard('{Home}');
    expect(focused()).toBe('Day');
  });

  it('follows the text direction, since the row is mirrored in RTL', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-EG">
        <ConnectedButtonGroup aria-label="Range" defaultSelectedKeys={['day']}>
          {segments}
        </ConnectedButtonGroup>
      </I18nProvider>,
    );
    await user.tab();
    // The first item sits on the right, so the next one along is to its left.
    await user.keyboard('{ArrowLeft}');
    expect(focused()).toBe('Week');
    await user.keyboard('{ArrowRight}');
    expect(focused()).toBe('Day');
  });

  it('steps over a disabled segment rather than stopping on it', async () => {
    const user = userEvent.setup();
    render(
      <ConnectedButtonGroup aria-label="Range" defaultSelectedKeys={['day']}>
        <ConnectedButtonGroupItem id="day">Day</ConnectedButtonGroupItem>
        <ConnectedButtonGroupItem id="week" disabled>
          Week
        </ConnectedButtonGroupItem>
        <ConnectedButtonGroupItem id="month">Month</ConnectedButtonGroupItem>
      </ConnectedButtonGroup>,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(focused()).toBe('Month');
  });

  it('keeps one selected by default, and lets that be turned off', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ConnectedButtonGroup aria-label="Range" defaultSelectedKeys={['week']}>
        {segments}
      </ConnectedButtonGroup>,
    );
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect(screen.getByRole('radio', { name: 'Week' }).getAttribute('aria-checked')).toBe('true');
    unmount();

    render(
      <ConnectedButtonGroup aria-label="Range" defaultSelectedKeys={['week']} disallowEmptySelection={false}>
        {segments}
      </ConnectedButtonGroup>,
    );
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect(screen.getByRole('radio', { name: 'Week' }).getAttribute('aria-checked')).toBe('false');
  });

  it('is controlled when it is given selectedKeys', async () => {
    const user = userEvent.setup();
    function Host() {
      const [keys, setKeys] = useState(new Set(['day']));
      return (
        <>
          <p>chosen: {[...keys].join(',')}</p>
          <ConnectedButtonGroup aria-label="Range" selectedKeys={keys} onSelectionChange={setKeys}>
            {segments}
          </ConnectedButtonGroup>
        </>
      );
    }
    render(<Host />);
    await user.keyboard('{Tab}{ArrowRight}');
    expect(screen.getByText('chosen: week')).toBeTruthy();
  });
});

describe('children in a fragment', () => {
  /*
   * Children.toArray flattens arrays but not fragments, so a group given <>{a}{b}{c}</> used to
   * see one child. Every item was then both the first and the last, which rounded all four
   * corners of all of them, and the tab stop could not be worked out at all. Nothing about it
   * threw; the group just looked wrong.
   */
  const corners = (el: HTMLElement) => {
    const s = getComputedStyle(el);
    return [s.borderTopLeftRadius, s.borderTopRightRadius];
  };

  it('counts them, so the first item keeps one full corner and one inner one', () => {
    render(
      <ConnectedButtonGroup aria-label="Range" size="s" defaultSelectedKeys={['week']}>
        {segments}
      </ConnectedButtonGroup>,
    );
    const items = radios();
    expect(items).toHaveLength(3);
    // Size s is 40px tall, so full is 20px and the inner corner is the 8px token.
    expect(corners(items[0]!)).toEqual(['20px', '8px']);
    // The selected item rounds fully, which is the M3E selection shape rather than a miscount.
    expect(corners(items[1]!)).toEqual(['20px', '20px']);
    expect(corners(items[2]!)).toEqual(['8px', '20px']);
  });

  it('works out the tab stop across them', () => {
    render(<ConnectedButtonGroup aria-label="Range">{segments}</ConnectedButtonGroup>);
    expect(radios().map((radio) => radio.tabIndex)).toEqual([0, -1, -1]);
  });
});

describe('multiple select stays a row of toggles', () => {
  it('says that instead, because that is what it is', async () => {
    const user = userEvent.setup();
    render(
      <ConnectedButtonGroup aria-label="Filters" selectionMode="multiple" defaultSelectedKeys={['a']}>
        <ConnectedButtonGroupItem id="a">Unread</ConnectedButtonGroupItem>
        <ConnectedButtonGroupItem id="b">Starred</ConnectedButtonGroupItem>
      </ConnectedButtonGroup>,
    );
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByRole('group', { name: 'Filters' })).toBeTruthy();

    const unread = screen.getByRole('button', { name: 'Unread' });
    expect(unread.getAttribute('aria-pressed')).toBe('true');
    expect(unread.hasAttribute('aria-checked')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Starred' }));
    expect(screen.getByRole('button', { name: 'Starred' }).getAttribute('aria-pressed')).toBe('true');
    // Both at once, which is the whole point of the mode.
    expect(unread.getAttribute('aria-pressed')).toBe('true');
  });

  it('is a tab stop per item, and the arrows are left to the browser', async () => {
    const user = userEvent.setup();
    render(
      <ConnectedButtonGroup aria-label="Filters" selectionMode="multiple">
        <ConnectedButtonGroupItem id="a">Unread</ConnectedButtonGroupItem>
        <ConnectedButtonGroupItem id="b">Starred</ConnectedButtonGroupItem>
      </ConnectedButtonGroup>,
    );
    await user.tab();
    expect(focused()).toBe('Unread');
    await user.tab();
    expect(focused()).toBe('Starred');

    await user.keyboard('{ArrowLeft}');
    // Nothing moved: in a toggle group the arrows are not a selection gesture.
    expect(focused()).toBe('Starred');
  });
});
