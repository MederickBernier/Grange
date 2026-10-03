import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Autocomplete,
  ComboBoxItem,
  FilledButton,
  Form,
  GrangeProvider,
  MultiSelect,
  MultiSelectItem,
  OutlinedMultiSelect,
} from '../index';

const colours = (
  <>
    <MultiSelectItem key="red">Red</MultiSelectItem>
    <MultiSelectItem key="green">Green</MultiSelectItem>
    <MultiSelectItem key="blue">Blue</MultiSelectItem>
    <MultiSelectItem key="grey" isDisabled>
      Grey
    </MultiSelectItem>
  </>
);

const open = () => screen.getByRole('button', { name: 'Colours' });
const tags = () => screen.getAllByRole('row');

describe('MultiSelect', () => {
  it('shows the placeholder and no grid until something is chosen', () => {
    render(
      <MultiSelect label="Colours" placeholder="Pick some">
        {colours}
      </MultiSelect>,
    );
    expect(screen.getByText('Pick some')).toBeTruthy();
    // An empty grid is announced as a table with no rows, which is worse than silence.
    expect(screen.queryByRole('grid')).toBeNull();
    expect(screen.queryAllByRole('row')).toHaveLength(0);
  });

  it('chooses several and shows each as a chip', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <MultiSelect label="Colours" onSelectionChange={onSelectionChange}>
        {colours}
      </MultiSelect>,
    );
    await user.click(open());
    await user.click(screen.getByRole('option', { name: 'Red' }));
    await user.click(screen.getByRole('option', { name: 'Blue' }));

    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['red', 'blue']));
    // Closed first: the list is a modal popover, so while it is open everything outside it —
    // the field and its chips included — is hidden from assistive tech and from these queries.
    await user.keyboard('{Escape}');
    expect(tags().map((tag) => tag.textContent)).toEqual(['Red', 'Blue']);

    // Both still chosen, which is the whole point of the mode. Checked by reopening, since the
    // options only exist while the list is open.
    await user.click(open());
    expect(screen.getByRole('option', { name: 'Red' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: 'Blue' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: 'Green' }).getAttribute('aria-selected')).toBe('false');
  });

  it('keeps the chips in the list order rather than the order they were pressed', async () => {
    const user = userEvent.setup();
    render(<MultiSelect label="Colours">{colours}</MultiSelect>);
    await user.click(open());
    await user.click(screen.getByRole('option', { name: 'Blue' }));
    await user.click(screen.getByRole('option', { name: 'Red' }));
    await user.keyboard('{Escape}');
    expect(tags().map((tag) => tag.textContent)).toEqual(['Red', 'Blue']);
  });

  it('makes the chips a real tag group, not a row of buttons', async () => {
    const user = userEvent.setup();
    render(<MultiSelect label="Colours" defaultSelectedKeys={['red', 'green']}>{colours}</MultiSelect>);
    const grid = screen.getByRole('grid', { name: 'Colours' });
    expect(grid).toBeTruthy();
    // A live region, so removing one is announced rather than happening silently.
    expect(grid.getAttribute('aria-live')).toBeTruthy();
    expect(tags()).toHaveLength(2);

    // Its own arrow keys, which a row of chips would not have.
    await user.tab();
    expect(document.activeElement?.textContent).toContain('Red');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent).toContain('Green');
  });

  it('removes a chip with its button and with the keyboard', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <MultiSelect label="Colours" defaultSelectedKeys={['red', 'green']} onSelectionChange={onSelectionChange}>
        {colours}
      </MultiSelect>,
    );
    const remove = screen.getAllByRole('button', { name: /remove/i });
    expect(remove).toHaveLength(2);
    await user.click(remove[0]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['green']));

    await user.tab();
    await user.keyboard('{Delete}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
  });

  it('will not choose a disabled option', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <MultiSelect label="Colours" onSelectionChange={onSelectionChange}>
        {colours}
      </MultiSelect>,
    );
    await user.click(open());
    await user.click(screen.getByRole('option', { name: 'Grey' }));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('posts one value per chosen key, so a form receives a list', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((_values, event: React.FormEvent) => event.preventDefault());
    render(
      <Form aria-label="Paint" onSubmit={onSubmit} actions={<FilledButton type="submit">Save</FilledButton>}>
        <MultiSelect label="Colours" name="colours" defaultSelectedKeys={['red', 'blue']}>
          {colours}
        </MultiSelect>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    // Not a comma-joined string the server has to split.
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ colours: ['red', 'blue'] });
  });

  it('takes its chips away when disabled, and keeps them readable', () => {
    render(
      <MultiSelect label="Colours" defaultSelectedKeys={['red']} disabled>
        {colours}
      </MultiSelect>,
    );
    expect(tags()).toHaveLength(1);
    // The hook has no isDisabled; withholding onRemove is what removes the buttons.
    expect(screen.queryAllByRole('button', { name: /remove/i })).toHaveLength(0);
    expect((open() as HTMLButtonElement).disabled).toBe(true);
  });

  it('wears the field chrome, in both variants', () => {
    const { container } = render(
      <OutlinedMultiSelect label="Colours" supportingText="As many as you like">
        {colours}
      </OutlinedMultiSelect>,
    );
    const root = container.querySelector('.grange-multi-select')!;
    expect(root.getAttribute('data-variant')).toBe('outlined');
    expect(root.querySelector('fieldset legend')).toBeTruthy();
    expect(container.querySelector('.grange-multi-select-supporting')?.textContent).toBe('As many as you like');
  });

  it('is controlled when it is given keys', async () => {
    const user = userEvent.setup();
    function Host() {
      const [keys, setKeys] = useState<Set<string>>(new Set(['red']));
      return (
        <>
          <MultiSelect
            label="Colours"
            selectedKeys={keys}
            onSelectionChange={(next) => setKeys(new Set(next as Set<string>))}
          >
            {colours}
          </MultiSelect>
          <p>chosen: {[...keys].join(',')}</p>
        </>
      );
    }
    render(<Host />);
    await user.click(open());
    await user.click(screen.getByRole('option', { name: 'Green' }));
    expect(screen.getByText('chosen: red,green')).toBeTruthy();
  });

  it('reaches its slots and takes its variant from the provider', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GrangeProvider
        defaultProps={{ MultiSelect: { variant: 'outlined' } }}
        classNames={{ MultiSelect: { root: 'x-root', tag: 'x-tag', item: 'x-item' } }}
      >
        <MultiSelect label="Colours" defaultSelectedKeys={['red']}>
          {colours}
        </MultiSelect>
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-multi-select')?.getAttribute('data-variant')).toBe('outlined');
    expect(container.querySelector('.x-root')).toBeTruthy();
    expect(container.querySelector('.x-tag')).toBeTruthy();
    await user.click(open());
    expect(document.querySelector('.x-item')).toBeTruthy();
  });
});

describe('Autocomplete', () => {
  const suggestions = (
    <>
      <ComboBoxItem key="par">Paris</ComboBoxItem>
      <ComboBoxItem key="rom">Rome</ComboBoxItem>
    </>
  );
  const field = () => screen.getByRole('combobox', { name: 'City' }) as HTMLInputElement;

  it('is text with suggestions: no chevron, and nothing has to win', async () => {
    const user = userEvent.setup();
    render(<Autocomplete label="City">{suggestions}</Autocomplete>);
    // No open button: it suggests as you type rather than offering the whole list.
    expect(screen.queryByRole('button')).toBeNull();

    await user.type(field(), 'ro');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Rome' })).toBeTruthy());
  });

  it('reports the text, which here is the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Autocomplete label="City" onChange={onChange}>
        {suggestions}
      </Autocomplete>,
    );
    await user.type(field(), 'ro');
    expect(onChange).toHaveBeenLastCalledWith('ro');
  });

  it('keeps what was typed, since there is no chosen option to revert to', async () => {
    const user = userEvent.setup();
    render(<Autocomplete label="City">{suggestions}</Autocomplete>);
    await user.type(field(), 'Timbuktu');
    await user.tab();
    expect(field().value).toBe('Timbuktu');
  });

  it('says when a suggestion was taken, and fills the field with it', async () => {
    const user = userEvent.setup();
    const onSuggestionTaken = vi.fn();
    const onChange = vi.fn();
    render(
      <Autocomplete label="City" onChange={onChange} onSuggestionTaken={onSuggestionTaken}>
        {suggestions}
      </Autocomplete>,
    );
    await user.type(field(), 'par');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSuggestionTaken).toHaveBeenCalledWith('par');
    expect(field().value).toBe('Paris');
  });

  it('is controlled when it is given a value', async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState('Ro');
      return (
        <>
          <Autocomplete label="City" value={value} onChange={setValue}>
            {suggestions}
          </Autocomplete>
          <p>typed: {value}</p>
        </>
      );
    }
    render(<Host />);
    expect(field().value).toBe('Ro');
    await user.type(field(), 'm');
    expect(screen.getByText('typed: Rom')).toBeTruthy();
  });
});
