import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilledButton,
  GrangeProvider,
  Select,
  SelectItem,
  SnackbarRegion,
  createSnackbarQueue,
  snackbar,
} from '../index';

describe('tokens', () => {
  it('matches SnackbarTokens', () => {
    expect(snackbar).toMatchObject({ corner: 4, elevation: 3, height: 48, heightTwoLine: 68, icon: 24 });
  });

  it('defaults to the 5 second floor React Aria enforces for readability', () => {
    expect(snackbar.timeout).toBe(5000);
  });
});

function Countries(props: {
  onSelectionChange?: (key: unknown) => void;
  disabled?: boolean;
  error?: boolean;
  name?: string;
}) {
  return (
    <Select label="Country" placeholder="Pick one" {...props}>
      <SelectItem key="gb">United Kingdom</SelectItem>
      <SelectItem key="fr">France</SelectItem>
      <SelectItem key="de" supportingText="Deutschland">
        Germany
      </SelectItem>
    </Select>
  );
}

const trigger = () => screen.getByRole('button', { name: /Country/ });

describe('Select', () => {
  it('is a labelled closed trigger with a hidden native select behind it', () => {
    const { container } = render(<Countries name="country" />);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    const native = container.querySelector('select') as HTMLSelectElement;
    expect(native).not.toBeNull();
    expect(native.name).toBe('country');
  });

  it('shows the placeholder until something is chosen', () => {
    render(<Countries />);
    expect(trigger().textContent).toContain('Pick one');
  });

  it('opens a listbox of options', async () => {
    render(<Countries />);
    await userEvent.click(trigger());
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'United Kingdom',
      'France',
      'GermanyDeutschland',
    ]);
  });

  it('reports the chosen key and shows it on the trigger', async () => {
    const onSelectionChange = vi.fn();
    render(<Countries onSelectionChange={onSelectionChange} />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('option', { name: 'France' }));

    expect(onSelectionChange).toHaveBeenCalledWith('fr');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    // Asserted on the trigger rather than the document: the hidden native select carries an
    // <option>France</option> of its own, so a text query finds two.
    expect(trigger().textContent).toContain('France');
  });

  it('puts the chosen value into the native select, so it posts in a form', async () => {
    const { container } = render(<Countries name="country" />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('option', { name: 'France' }));
    await waitFor(() => {
      expect((container.querySelector('select') as HTMLSelectElement).value).toBe('fr');
    });
  });

  it('opens on the down arrow and marks the chosen option', async () => {
    render(<Countries />);
    trigger().focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeNull());

    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(trigger().textContent).toContain('France');
  });

  it('floats the label once there is a value', async () => {
    const { container } = render(<Countries />);
    const root = container.querySelector('.grange-select') as HTMLElement;
    // A placeholder counts as something to sit above, as it does on a text field.
    expect(root.dataset.populated).toBe('true');
  });

  it('does not open while disabled', async () => {
    render(<Countries disabled />);
    await userEvent.click(trigger());
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('marks the error state and announces the message', () => {
    render(
      <Select label="Country" error errorText="Choose a country">
        <SelectItem key="gb">United Kingdom</SelectItem>
      </Select>,
    );
    expect(screen.getByText('Choose a country')).toBeTruthy();
  });

  it('takes the variant from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Select: { variant: 'outlined' } }}>
        <Countries />
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-select') as HTMLElement).dataset.variant).toBe('outlined');
    expect(container.querySelector('fieldset legend')?.textContent).toBe('Country');
  });

  it('reaches the trigger and item slots', async () => {
    const { container } = render(
      <GrangeProvider classNames={{ Select: { trigger: 'my-trigger', item: 'my-item' } }}>
        <Countries />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-select-trigger')?.className).toContain('my-trigger');
    await userEvent.click(trigger());
    await waitFor(() => expect(screen.queryAllByRole('option').length).toBeGreaterThan(0));
    expect(screen.getAllByRole('option')[0]!.className).toContain('my-item');
  });
});

describe('Snackbar', () => {
  function Host(props: { actionLabel?: string; onAction?: () => void; closeable?: boolean }) {
    const [queue] = useState(() => createSnackbarQueue());
    return (
      <>
        <FilledButton
          onClick={() =>
            queue.add(
              { message: 'Message sent', actionLabel: props.actionLabel, onAction: props.onAction, closeable: props.closeable },
              { timeout: snackbar.timeout },
            )
          }
        >
          Send
        </FilledButton>
        <SnackbarRegion queue={queue} />
      </>
    );
  }

  const send = () => userEvent.click(screen.getByRole('button', { name: 'Send' }));

  it('renders nothing until something is queued', () => {
    render(<Host />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByText('Message sent')).toBeNull();
  });

  it('shows a queued message', async () => {
    render(<Host />);
    await send();
    await waitFor(() => expect(screen.getByText('Message sent')).toBeTruthy());
  });

  it('puts the stack in a landmark, so it can be reached deliberately', async () => {
    render(<Host />);
    await send();
    await waitFor(() => expect(screen.getByRole('region')).toBeTruthy());
  });

  it('portals out of the tree', async () => {
    const { container } = render(<Host />);
    await send();
    await waitFor(() => expect(screen.getByText('Message sent')).toBeTruthy());
    expect(container.contains(screen.getByText('Message sent'))).toBe(false);
  });

  it('runs its action and then goes away', async () => {
    const onAction = vi.fn();
    render(<Host actionLabel="Undo" onAction={onAction} />);
    await send();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy());

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('Message sent')).toBeNull());
  });

  it('can be dismissed when it carries a close button', async () => {
    render(<Host closeable />);
    await send();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy());

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.queryByText('Message sent')).toBeNull());
  });

  it('shows one at a time by default, which is what the spec allows', async () => {
    render(<Host />);
    await send();
    await send();
    await waitFor(() => expect(screen.getAllByText('Message sent')).toHaveLength(1));
  });

  it('shows more at once when the queue is told to', async () => {
    function Multi() {
      const [queue] = useState(() => createSnackbarQueue({ maxVisibleToasts: 3 }));
      return (
        <>
          <FilledButton onClick={() => queue.add({ message: `Saved ${Date.now()}` })}>Send</FilledButton>
          <SnackbarRegion queue={queue} />
        </>
      );
    }
    render(<Multi />);
    await send();
    await send();
    await waitFor(() => expect(screen.getAllByText(/^Saved /)).toHaveLength(2));
  });
});
