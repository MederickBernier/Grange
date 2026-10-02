import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import {
  ComboBox,
  ComboBoxItem,
  FilledButton,
  FilledTextField,
  Form,
  GrangeProvider,
  OutlinedComboBox,
  PopoverTrigger,
  Select,
  SelectItem,
} from '../index';

const cities = (
  <>
    <ComboBoxItem key="par">Paris</ComboBoxItem>
    <ComboBoxItem key="rom">Rome</ComboBoxItem>
    <ComboBoxItem key="osl">Oslo</ComboBoxItem>
    <ComboBoxItem key="por" isDisabled>
      Porto
    </ComboBoxItem>
  </>
);

const input = (name = 'City') => screen.getByRole('combobox', { name }) as HTMLInputElement;
const options = () => screen.getAllByRole('option');
/**
 * The open button carries no label of its own: useComboBox labels it by the field, so its
 * accessible name is the field's. An aria-label would be ignored, since labelledby wins.
 */
const openButton = () => screen.getByRole('button', { name: /City/ });

describe('ComboBox', () => {
  it('is a combobox with a button that opens its listbox', async () => {
    const user = userEvent.setup();
    render(<ComboBox label="City">{cities}</ComboBox>);
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('listbox')).toBeNull();

    await user.click(openButton());
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(options()).toHaveLength(4);
    expect(input().getAttribute('aria-expanded')).toBe('true');
  });

  it('filters as it is typed, and matches without regard to case or accents', async () => {
    const user = userEvent.setup();
    render(
      <ComboBox label="City">
        <ComboBoxItem key="a">Zürich</ComboBoxItem>
        <ComboBoxItem key="b">Rome</ComboBoxItem>
      </ComboBox>,
    );
    await user.type(input(), 'zur');
    // useFilter with base sensitivity: "zur" finds "Zürich", which a lowercase includes() misses.
    await waitFor(() => expect(options()).toHaveLength(1));
    expect(options()[0]!.textContent).toBe('Zürich');
  });

  it('keeps focus in the input and points at the focused option instead', async () => {
    const user = userEvent.setup();
    render(<ComboBox label="City">{cities}</ComboBox>);
    await user.click(openButton());
    await user.keyboard('{ArrowDown}');

    // Focus never leaves the field: the list is read through aria-activedescendant, which is
    // what lets a screen reader announce options while typing still works.
    expect(document.activeElement).toBe(input());
    const active = input().getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)?.textContent).toContain('Paris');
  });

  it('chooses with Enter and reports the key', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <ComboBox label="City" onSelectionChange={onSelectionChange}>
        {cities}
      </ComboBox>,
    );
    await user.type(input(), 'rom');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectionChange).toHaveBeenLastCalledWith('rom');
    expect(input().value).toBe('Rome');
  });

  it('does not keep text that matches nothing, unless custom values are allowed', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ComboBox label="City" defaultSelectedKey="par">
        {cities}
      </ComboBox>,
    );
    expect(input().value).toBe('Paris');
    await user.clear(input());
    await user.type(input(), 'nowhere');
    await user.tab();
    /*
     * The text is gone on blur. Not reverted to "Paris": clearing the field cleared the
     * selection with it, so there is nothing left to revert to — which is React Aria's
     * behaviour and worth stating, since "reverts to the chosen option" is the obvious guess.
     */
    expect(input().value).toBe('');
    unmount();

    render(
      <ComboBox label="City" allowsCustomValue defaultSelectedKey="par">
        {cities}
      </ComboBox>,
    );
    await user.clear(input());
    await user.type(input(), 'nowhere');
    await user.tab();
    expect(input().value).toBe('nowhere');
  });

  it('says so when nothing matches, rather than showing an empty list', async () => {
    const user = userEvent.setup();
    render(
      <ComboBox label="City" emptyState="No city by that name">
        {cities}
      </ComboBox>,
    );
    await user.type(input(), 'zzz');
    await waitFor(() => expect(screen.getByText('No city by that name')).toBeTruthy());
    // Not announced as an option, because there is nothing to choose.
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('will not choose a disabled option', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <ComboBox label="City" onSelectionChange={onSelectionChange}>
        {cities}
      </ComboBox>,
    );
    await user.type(input(), 'por');
    await waitFor(() => expect(options()).toHaveLength(1));
    await user.click(options()[0]!);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('opens on focus or only on the button, when told to', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ComboBox label="City" menuTrigger="focus">
        {cities}
      </ComboBox>,
    );
    await user.tab();
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    unmount();

    render(
      <ComboBox label="City" menuTrigger="manual">
        {cities}
      </ComboBox>,
    );
    await user.type(input(), 'ro');
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.click(openButton());
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('wears the field chrome, so it matches a text field and a select exactly', () => {
    const { container } = render(
      <OutlinedComboBox label="City" supportingText="Where to?">
        {cities}
      </OutlinedComboBox>,
    );
    const root = container.querySelector('.grange-combo-box')!;
    expect(root.getAttribute('data-variant')).toBe('outlined');
    // The same shell as TextField: a real fieldset and legend for the notch.
    expect(root.querySelector('fieldset legend')).toBeTruthy();
    expect(container.querySelector('.grange-combo-box-supporting')?.textContent).toBe('Where to?');
  });

  it('takes a form error by name, like every other field', async () => {
    const user = userEvent.setup();
    render(
      <Form
        aria-label="Trip"
        validate={() => ({ city: 'Pick a city' })}
        actions={<FilledButton type="submit">Go</FilledButton>}
      >
        <ComboBox label="City" name="city">
          {cities}
        </ComboBox>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(screen.getByText('Pick a city')).toBeTruthy();
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('is controlled when it is given a value', async () => {
    const user = userEvent.setup();
    function Host() {
      const [key, setKey] = useState<string | null>('par');
      return (
        <>
          <ComboBox label="City" selectedKey={key} onSelectionChange={(next) => setKey(next as string | null)}>
            {cities}
          </ComboBox>
          <p>chosen: {key ?? 'none'}</p>
        </>
      );
    }
    render(<Host />);
    expect(input().value).toBe('Paris');
    await user.click(openButton());
    await user.click(screen.getByRole('option', { name: 'Oslo' }));
    expect(screen.getByText('chosen: osl')).toBeTruthy();
  });

  it('reaches its slots and takes its defaults from the provider', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GrangeProvider
        defaultProps={{ ComboBox: { variant: 'outlined', menuTrigger: 'manual' } }}
        classNames={{ ComboBox: { root: 'x-root', input: 'x-input', item: 'x-item' } }}
      >
        <ComboBox label="City">{cities}</ComboBox>
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-combo-box')?.getAttribute('data-variant')).toBe('outlined');
    expect(container.querySelector('.x-root')).toBeTruthy();
    expect(container.querySelector('.x-input')).toBeTruthy();

    await user.click(openButton());
    expect(document.querySelector('.x-item')).toBeTruthy();
  });

  it('leaves Select working, which now shares its option list', async () => {
    const user = userEvent.setup();
    render(
      <Select label="Size" defaultSelectedKey="m">
        <SelectItem key="s">Small</SelectItem>
        <SelectItem key="m">Medium</SelectItem>
      </Select>,
    );
    await user.click(screen.getByRole('button', { name: /Size/ }));
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await user.click(screen.getByRole('option', { name: 'Small' }));
    expect(screen.getByRole('button', { name: /Size/ }).textContent).toContain('Small');
  });
});

describe('PopoverTrigger', () => {
  const panel = (
    <PopoverTrigger aria-label="Filters">
      <FilledButton>Filters</FilledButton>
      <FilledTextField label="Contains" />
    </PopoverTrigger>
  );

  it('opens a dialog on press, not a tooltip', async () => {
    const user = userEvent.setup();
    render(panel);
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const surface = screen.getByRole('dialog', { name: 'Filters' });
    // The whole reason it is not a tooltip: there is something inside to reach.
    expect(screen.getByLabelText('Contains')).toBeTruthy();
    expect(surface.contains(screen.getByLabelText('Contains'))).toBe(true);
  });

  it('says the trigger expands something, and hides the page behind it', async () => {
    const user = userEvent.setup();
    const { container } = render(panel);
    const trigger = container.querySelector('button')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    /*
     * The trigger is no longer findable by role: a modal popover hides the rest of the page from
     * assistive tech, which is what `nonModal` turns off. Queried through the DOM instead.
     */
    expect(screen.queryByRole('button', { name: 'Filters' })).toBeNull();
  });

  it('closes on Escape and on a press outside', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <PopoverTrigger aria-label="Filters" onOpenChange={onOpenChange}>
        <FilledButton>Filters</FilledButton>
        <p>Inside</p>
      </PopoverTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    // Escape reaches the surface because focus moved into it; left on the trigger it would not.
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    unmount();

    onOpenChange.mockClear();
    render(
      <>
        <button type="button">Elsewhere</button>
        <PopoverTrigger aria-label="Filters" onOpenChange={onOpenChange}>
          <FilledButton>Filters</FilledButton>
          <p>Inside</p>
        </PopoverTrigger>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    // Outside is hidden from the role queries while it is open, so this goes through the DOM.
    await user.click(document.querySelectorAll('button')[0]!);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('is controlled when it is given an open prop', () => {
    const { rerender } = render(
      <PopoverTrigger aria-label="Filters" open={false}>
        <FilledButton>Filters</FilledButton>
        <p>Inside</p>
      </PopoverTrigger>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <PopoverTrigger aria-label="Filters" open>
        <FilledButton>Filters</FilledButton>
        <p>Inside</p>
      </PopoverTrigger>,
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('says so rather than failing quietly without a trigger element', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <PopoverTrigger aria-label="Filters">
          {'not an element' as never}
          <p>Inside</p>
        </PopoverTrigger>,
      ),
    ).toThrow(/trigger element/);
    quiet.mockRestore();
  });

  it('reaches its slot and takes its placement from the provider', async () => {
    const user = userEvent.setup();
    render(
      <GrangeProvider
        defaultProps={{ Popover: { placement: 'end' } }}
        classNames={{ Popover: { root: 'x-popover' } }}
      >
        {panel}
      </GrangeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(document.querySelector('.x-popover')).toBeTruthy();
  });
});

describe('locale', () => {
  const turkish = (locale: string) => (
    <I18nProvider locale={locale}>
      <ComboBox label="City">
        <ComboBoxItem key="a">Istanbul</ComboBoxItem>
        <ComboBoxItem key="b">Ankara</ComboBoxItem>
      </ComboBox>
    </I18nProvider>
  );

  it('filters by the locale, which is not the same as lowercasing', async () => {
    const user = userEvent.setup();
    const { unmount } = render(turkish('en-US'));
    await user.type(input(), 'ist');
    await waitFor(() => expect(options()).toHaveLength(1));
    unmount();

    render(turkish('tr-TR'));
    await user.type(input(), 'ist');
    /*
     * No match, and that is correct. Turkish has two distinct letters where English has one — a
     * dotted i and a dotless ı — so a lowercase "i" is not the same letter as the "I" that
     * starts Istanbul. A `toLowerCase().includes()` filter would match here and be wrong, which
     * is the whole reason this goes through useFilter.
     */
    await waitFor(() => expect(screen.getByText('No matches')).toBeTruthy());
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
