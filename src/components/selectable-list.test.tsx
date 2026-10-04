import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import { Checkbox, GrangeProvider, List, ListItem, SelectableList, SelectableListItem } from '../index';

const rows = (
  <>
    <SelectableListItem key="ada" supportingText="Analytical engine">
      Ada
    </SelectableListItem>
    <SelectableListItem key="alan">Alan</SelectableListItem>
    <SelectableListItem key="grace">Grace</SelectableListItem>
    <SelectableListItem key="edsger" isDisabled>
      Edsger
    </SelectableListItem>
  </>
);

const options = () => screen.getAllByRole('option');
const option = (name: string) => screen.getByRole('option', { name: new RegExp(name) });

describe('SelectableList', () => {
  it('is a listbox of options, which is what says how many rows there are', () => {
    render(<SelectableList aria-label="People">{rows}</SelectableList>);
    expect(screen.getByRole('listbox', { name: 'People' })).toBeTruthy();
    expect(options()).toHaveLength(4);
    // The markup List is still a plain list, which is the other kind and the default.
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('selects one row at a time by default, and says which', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <SelectableList aria-label="People" onSelectionChange={onSelectionChange}>
        {rows}
      </SelectableList>,
    );
    await user.click(option('Alan'));
    expect(onSelectionChange).toHaveBeenCalled();
    expect(option('Alan').getAttribute('aria-selected')).toBe('true');

    await user.click(option('Grace'));
    expect(option('Alan').getAttribute('aria-selected')).toBe('false');
    expect(option('Grace').getAttribute('aria-selected')).toBe('true');
  });

  it('holds several at once when asked', async () => {
    const user = userEvent.setup();
    render(
      <SelectableList aria-label="People" selectionMode="multiple">
        {rows}
      </SelectableList>,
    );
    await user.click(option('Alan'));
    await user.click(option('Grace'));
    expect(option('Alan').getAttribute('aria-selected')).toBe('true');
    expect(option('Grace').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true');
  });

  it('is one tab stop with the arrows moving inside it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <SelectableList aria-label="People">{rows}</SelectableList>
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    await user.tab();
    // Tab reaches the list once, not once per row.
    expect(document.activeElement?.textContent).toContain('Ada');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toContain('Alan');
    await user.keyboard('{End}');
    // The disabled row is not a focus stop, so End lands on the one before it.
    expect(document.activeElement?.textContent).toContain('Grace');
    await user.keyboard('{Home}');
    expect(document.activeElement?.textContent).toContain('Ada');

    await user.tab();
    expect(document.activeElement?.textContent).toBe('After');
  });

  it('jumps to a row as its label is typed, which is what the collection pays for', async () => {
    const user = userEvent.setup();
    render(<SelectableList aria-label="People">{rows}</SelectableList>);
    await user.tab();
    await user.keyboard('gr');
    expect(document.activeElement?.textContent).toContain('Grace');
  });

  it('stops at the ends unless it is told to wrap', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SelectableList aria-label="People">{rows}</SelectableList>);
    await user.tab();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement?.textContent).toContain('Ada');
    unmount();

    render(
      <SelectableList aria-label="People" wrapFocus>
        {rows}
      </SelectableList>,
    );
    await user.tab();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement?.textContent).toContain('Grace');
  });

  it('will not select a disabled row, from the pointer or the keyboard', async () => {
    const user = userEvent.setup();
    render(<SelectableList aria-label="People">{rows}</SelectableList>);
    expect(option('Edsger').getAttribute('aria-disabled')).toBe('true');
    await user.click(option('Edsger'));
    expect(option('Edsger').getAttribute('aria-selected')).not.toBe('true');
  });

  it('is controlled when it is given selectedKeys', async () => {
    const user = userEvent.setup();
    render(
      <SelectableList aria-label="People" selectedKeys={['ada']}>
        {rows}
      </SelectableList>,
    );
    expect(option('Ada').getAttribute('aria-selected')).toBe('true');
    await user.click(option('Alan'));
    // No handler, so nothing moves: the selection is the app's.
    expect(option('Alan').getAttribute('aria-selected')).toBe('false');
  });

  it('can act on a row instead of selecting it, for a list that navigates', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <SelectableList aria-label="People" onAction={onAction}>
        {rows}
      </SelectableList>,
    );
    await user.click(option('Grace'));
    expect(onAction).toHaveBeenCalledWith('grace');
  });

  it('renders the same row content as List does, in the same slots', () => {
    const { container } = render(
      <SelectableList aria-label="People">
        <SelectableListItem
          key="ada"
          overline="Mathematician"
          supportingText="Analytical engine"
          leading={<svg data-testid="leading" />}
          trailingText="1843"
        >
          Ada
        </SelectableListItem>
      </SelectableList>,
    );
    const row = container.querySelector('.grange-selectable-list-item')!;
    // Three lines of text, which is what takes a row to its tallest height.
    expect(row.getAttribute('data-lines')).toBe('3');
    expect(row.textContent).toContain('Mathematician');
    expect(row.textContent).toContain('Analytical engine');
    expect(row.textContent).toContain('1843');
    expect(screen.getByTestId('leading')).toBeTruthy();
    expect(row.querySelector('.grange-selectable-list-item-label')?.textContent).toBe('Ada');
  });

  it('matches typeahead against textValue when the label is not plain text', async () => {
    const user = userEvent.setup();
    render(
      <SelectableList aria-label="People">
        <SelectableListItem key="a" textValue="Zebra">
          <strong>Zebra</strong>
        </SelectableListItem>
        <SelectableListItem key="b" textValue="Aardvark">
          <strong>Aardvark</strong>
        </SelectableListItem>
      </SelectableList>,
    );
    await user.tab();
    await user.keyboard('z');
    expect(document.activeElement?.textContent).toBe('Zebra');
  });

  it('turns into a snapping strip when it is horizontal', () => {
    const { container } = render(
      <SelectableList aria-label="People" orientation="horizontal">
        {rows}
      </SelectableList>,
    );
    const list = container.querySelector('.grange-selectable-list')!;
    expect(list.getAttribute('data-orientation')).toBe('horizontal');
    // Still a listbox: the orientation is layout plus which arrows move, not a different role.
    expect(list.getAttribute('role')).toBe('listbox');
  });

  it('moves on the left and right arrows when it is horizontal', async () => {
    const user = userEvent.setup();
    render(
      <SelectableList aria-label="People" orientation="horizontal">
        {rows}
      </SelectableList>,
    );
    await user.tab();
    expect(document.activeElement?.textContent).toContain('Ada');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent).toContain('Alan');
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement?.textContent).toContain('Ada');
  });

  it('follows the text direction when it is horizontal', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-EG">
        <SelectableList aria-label="People" orientation="horizontal">
          {rows}
        </SelectableList>
      </I18nProvider>,
    );
    await user.tab();
    expect(document.activeElement?.textContent).toContain('Ada');
    // In Arabic the next row is to the left, so the right arrow goes nowhere from the first one.
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent).toContain('Ada');
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement?.textContent).toContain('Alan');
  });

  it('disables rows by key, which is the only thing a listbox can disable', () => {
    render(
      <SelectableList aria-label="People" disabledKeys={['ada', 'alan', 'grace', 'edsger']}>
        {rows}
      </SelectableList>,
    );
    for (const row of options()) expect(row.getAttribute('aria-disabled')).toBe('true');
  });

  it('reaches its slots, and takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider
        defaultProps={{ SelectableList: { orientation: 'horizontal', selectionMode: 'multiple' } }}
        classNames={{ SelectableList: { root: 'x-root', item: 'x-item', label: 'x-label' } }}
      >
        <SelectableList aria-label="People">{rows}</SelectableList>
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-selectable-list')?.getAttribute('data-orientation')).toBe(
      'horizontal',
    );
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true');
    for (const name of ['x-root', 'x-item', 'x-label']) {
      expect(container.querySelector(`.${name}`)).toBeTruthy();
    }
  });

  it('leaves the markup List alone, which is still the default kind', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <List aria-label="People">
        <ListItem leading={<Checkbox aria-label="Pick Ada" onChange={onChange} />}>Ada</ListItem>
      </List>,
    );
    // A row that carries its own control is the other pattern, and it still works: the control
    // is reachable, which it would not be inside a listbox option.
    expect(screen.getByRole('list')).toBeTruthy();
    await user.click(screen.getByRole('checkbox', { name: 'Pick Ada' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('a selectable strip', () => {
  it('holds a selection across a controlled round trip, which is what a picker needs', async () => {
    const user = userEvent.setup();
    function Host() {
      const [keys, setKeys] = useState<Set<string>>(new Set(['b']));
      return (
        <>
          <p>chosen: {[...keys].join(',')}</p>
          <SelectableList
            aria-label="Covers"
            orientation="horizontal"
            selectedKeys={keys}
            onSelectionChange={(next) => setKeys(new Set(next as Set<string>))}
          >
            <SelectableListItem key="a">One</SelectableListItem>
            <SelectableListItem key="b">Two</SelectableListItem>
            <SelectableListItem key="c">Three</SelectableListItem>
          </SelectableList>
        </>
      );
    }
    render(<Host />);
    expect(screen.getByText('chosen: b')).toBeTruthy();
    await user.click(option('Three'));
    expect(screen.getByText('chosen: c')).toBeTruthy();
  });
});
