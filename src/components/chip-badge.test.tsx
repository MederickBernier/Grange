import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, Chip, ChipGroup, GrangeProvider, badge, chip } from '../index';

describe('tokens', () => {
  it('matches ChipsTokens, whose shape changes with selection', () => {
    expect(chip).toMatchObject({
      height: 32,
      icon: 18,
      avatar: 24,
      corner: 12,
      selectedCorner: 9999,
      outlineWidth: 1,
      elevatedElevation: 1,
    });
    // The detail worth keeping: unselected and selected are different shapes, not just colours.
    expect(chip.corner).not.toBe(chip.selectedCorner);
  });

  it('matches BadgeTokens', () => {
    expect(badge).toMatchObject({ dotSize: 6, labelledSize: 16 });
  });
});

describe('Badge', () => {
  const el = (c: HTMLElement) => c.querySelector('.grange-badge') as HTMLElement;

  it('is a bare dot with nothing in it', () => {
    const { container } = render(<Badge />);
    expect(el(container).dataset.dot).toBe('true');
    expect(el(container).textContent).toBe('');
  });

  it('carries a count when given one', () => {
    const { container } = render(<Badge>9</Badge>);
    expect(el(container).dataset.dot).toBeUndefined();
    expect(el(container).textContent).toBe('9');
  });

  it('is hidden from assistive tech by default, since it usually repeats a label', () => {
    const { container } = render(<Badge>9</Badge>);
    expect(el(container).getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('becomes a labelled status when it is the only thing carrying the information', () => {
    render(<Badge aria-label="9 unread messages">9</Badge>);
    const status = screen.getByRole('status', { name: '9 unread messages' });
    expect(status.getAttribute('aria-hidden')).toBeNull();
  });

  it('reaches the root slot', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Badge: { root: 'my-badge' } }}>
        <Badge>1</Badge>
      </GrangeProvider>,
    );
    expect(el(container).className).toContain('my-badge');
  });
});

describe('Chip', () => {
  const el = (c: HTMLElement) => c.querySelector('.grange-chip') as HTMLElement;

  it('is plain content until given a handler', () => {
    const { container } = render(<Chip>Plain</Chip>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(el(container).dataset.interactive).toBeUndefined();
  });

  it('becomes a button once given an onClick, and ripples', async () => {
    const onClick = vi.fn();
    const { container } = render(<Chip onClick={onClick}>Press</Chip>);
    expect(container.querySelector('.grange-ripple')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Press' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('becomes a link once given an href', () => {
    render(<Chip href="/tag">Tag</Chip>);
    expect(screen.getByRole('link', { name: 'Tag' })).toBeTruthy();
  });

  it.each(['assist', 'filter', 'input', 'suggestion'] as const)('marks the %s variant', (variant) => {
    const { container } = render(<Chip variant={variant}>Chip</Chip>);
    expect(el(container).dataset.variant).toBe(variant);
  });

  it('reports selection through aria-pressed and marks it for the shape change', () => {
    const { container } = render(
      <Chip variant="filter" selected onClick={() => {}}>
        Filter
      </Chip>,
    );
    expect(el(container).dataset.selected).toBe('true');
    expect(screen.getByRole('button', { name: 'Filter' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('leaves aria-pressed off a chip that is not selectable', () => {
    render(
      <Chip variant="assist" onClick={() => {}}>
        Assist
      </Chip>,
    );
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBeNull();
  });

  it('can be toggled as a controlled filter', async () => {
    function Filters() {
      const [on, setOn] = useState(false);
      return (
        <Chip variant="filter" selected={on} onClick={() => setOn(!on)}>
          Unread
        </Chip>
      );
    }
    render(<Filters />);
    const button = screen.getByRole('button', { name: 'Unread' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(button);
    expect(screen.getByRole('button', { name: 'Unread' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('puts the remove button beside the action rather than inside it', async () => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    const { container } = render(
      <Chip variant="input" onClick={onClick} onRemove={onRemove} removeLabel="Remove Ada">
        Ada
      </Chip>,
    );
    const action = screen.getByRole('button', { name: 'Ada' });
    const remove = screen.getByRole('button', { name: 'Remove Ada' });
    // Two siblings, not one inside the other: a nested button is invalid and unreachable.
    expect(action.contains(remove)).toBe(false);
    expect(el(container).dataset.removable).toBe('true');

    await userEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a leading icon or an avatar, not both', () => {
    const { container, unmount } = render(<Chip icon={<svg data-testid="icon" />}>With icon</Chip>);
    expect(screen.getByTestId('icon')).toBeTruthy();
    unmount();

    render(
      <Chip icon={<svg data-testid="icon" />} avatar={<svg data-testid="avatar" />}>
        With both
      </Chip>,
    );
    // The avatar wins, since a chip shows one leading thing.
    expect(screen.queryByTestId('avatar')).not.toBeNull();
    expect(screen.queryByTestId('icon')).toBeNull();
  });

  it('marks the elevated option', () => {
    const { container } = render(<Chip elevated>Elevated</Chip>);
    expect(el(container).dataset.elevated).toBe('true');
  });

  it('does not fire while disabled, including the remove button', async () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(
      <Chip onClick={onClick} onRemove={onRemove} disabled>
        Disabled
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('drops the ripple when the config turns it off', () => {
    const { container } = render(
      <GrangeProvider behavior={{ ripple: { enabled: false } }}>
        <Chip onClick={() => {}}>Press</Chip>
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-ripple')).toBeNull();
    expect(el(container).dataset.ripple).toBe('off');
  });

  it('takes app-wide defaults', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Chip: { variant: 'filter', elevated: true } }}>
        <Chip>Chip</Chip>
      </GrangeProvider>,
    );
    expect(el(container).dataset).toMatchObject({ variant: 'filter', elevated: 'true' });
  });

  it('reaches the label and remove slots', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Chip: { label: 'my-label', remove: 'my-remove' } }}>
        <Chip onRemove={() => {}}>Chip</Chip>
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-chip-label')?.className).toContain('my-label');
    expect(container.querySelector('.grange-chip-remove')?.className).toContain('my-remove');
  });
});

describe('ChipGroup', () => {
  it('groups its chips for assistive tech', () => {
    render(
      <ChipGroup aria-label="Filters">
        <Chip variant="filter" onClick={() => {}}>
          Unread
        </Chip>
        <Chip variant="filter" onClick={() => {}}>
          Flagged
        </Chip>
      </ChipGroup>,
    );
    expect(screen.getByRole('group', { name: 'Filters' })).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
