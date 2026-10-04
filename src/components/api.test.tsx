import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Button,
  ConnectedButtonGroup,
  ConnectedButtonGroupItem,
  ElevatedButton,
  FilledButton,
  FilledIconButton,
  FilledTonalButton,
  FilledTonalIconButton,
  GrangeProvider,
  IconButton,
  OutlinedButton,
  OutlinedIconButton,
  TextButton,
  ToggleButton,
} from '../index';

const button = () => screen.getByRole('button');

describe('variant components', () => {
  it.each([
    [FilledButton, 'filled'],
    [FilledTonalButton, 'tonal'],
    [OutlinedButton, 'outlined'],
    [ElevatedButton, 'elevated'],
    [TextButton, 'text'],
  ])('render their own variant', (Component, variant) => {
    render(<Component>Label</Component>);
    expect(button().dataset.variant).toBe(variant);
  });

  it.each([
    [FilledIconButton, 'filled'],
    [FilledTonalIconButton, 'tonal'],
    [OutlinedIconButton, 'outlined'],
  ])('cover the icon button variants', (Component, variant) => {
    render(
      <Component aria-label="Act">
        <svg />
      </Component>,
    );
    expect(button().dataset.variant).toBe(variant);
  });

  it('leaves plain IconButton as the standard variant, like md-icon-button', () => {
    render(
      <IconButton aria-label="Act">
        <svg />
      </IconButton>,
    );
    expect(button().dataset.variant).toBe('standard');
  });

  it('still accept size and shape, which Material Web has no scale for', () => {
    render(
      <FilledButton size="l" shape="square">
        Label
      </FilledButton>,
    );
    expect(button().dataset).toMatchObject({ size: 'l', shape: 'square' });
  });

  it('ignore a provider default for variant, since the component fixes it', () => {
    render(
      <GrangeProvider defaultProps={{ Button: { variant: 'text', size: 'm' } }}>
        <FilledButton>Label</FilledButton>
      </GrangeProvider>,
    );
    expect(button().dataset.variant).toBe('filled');
    expect(button().dataset.size).toBe('m');
  });

  it('forward refs to the underlying button', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<FilledButton ref={ref}>Label</FilledButton>);
    expect(ref.current).toBe(button());
  });
});

describe('Material Web prop names', () => {
  it('disabled maps onto the React Aria behavior layer', () => {
    render(<Button disabled>Label</Button>);
    expect(button().hasAttribute('disabled')).toBe(true);
    expect(button().dataset.disabled).toBe('true');
  });

  it('onClick fires on a real click', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Label</Button>);
    await userEvent.click(button());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('onPress still works alongside it', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Label</Button>);
    await userEvent.click(button());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a disabled button fires neither', async () => {
    const onClick = vi.fn();
    const onPress = vi.fn();
    render(
      <Button disabled onClick={onClick} onPress={onPress}>
        Label
      </Button>,
    );
    await userEvent.click(button());
    expect(onClick).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('selected drives a controlled toggle', () => {
    const { rerender } = render(<ToggleButton selected={false}>Label</ToggleButton>);
    expect(button().getAttribute('aria-pressed')).toBe('false');
    rerender(<ToggleButton selected>Label</ToggleButton>);
    expect(button().getAttribute('aria-pressed')).toBe('true');
  });

  it('defaultSelected leaves the toggle uncontrolled', async () => {
    const onChange = vi.fn();
    render(
      <ToggleButton defaultSelected onChange={onChange}>
        Label
      </ToggleButton>,
    );
    expect(button().getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(button());
    expect(onChange).toHaveBeenCalledWith(false);
    expect(button().getAttribute('aria-pressed')).toBe('false');
  });

  it('disabled reaches ConnectedButtonGroupItem, which took no such prop before', () => {
    render(
      <ConnectedButtonGroup>
        <ConnectedButtonGroupItem id="a" disabled>
          A
        </ConnectedButtonGroupItem>
      </ConnectedButtonGroup>,
    );
    // A single-select group is a radiogroup, so its items are radios rather than buttons.
    expect(screen.getByRole('radio').hasAttribute('disabled')).toBe(true);
  });
});

describe('icon placement', () => {
  const Icon = () => <svg data-testid="icon" />;

  it('puts the icon before the label by default', () => {
    render(<FilledButton icon={<Icon />}>Send</FilledButton>);
    const spans = [...button().querySelectorAll('.grange-button-icon, .grange-button-label')];
    expect(spans.map((s) => s.className.split(' ')[0])).toEqual([
      'grange-button-icon',
      'grange-button-label',
    ]);
  });

  it('moves it after the label with trailingIcon, like md trailing-icon', () => {
    render(
      <TextButton icon={<Icon />} trailingIcon>
        Open
      </TextButton>,
    );
    const spans = [...button().querySelectorAll('.grange-button-icon, .grange-button-label')];
    expect(spans.map((s) => s.className.split(' ')[0])).toEqual([
      'grange-button-label',
      'grange-button-icon',
    ]);
  });

  it('renders one icon, not two, whichever side it is on', () => {
    render(
      <FilledButton icon={<Icon />} trailingIcon>
        Open
      </FilledButton>,
    );
    expect(screen.getAllByTestId('icon')).toHaveLength(1);
  });

  it('swaps in the selected icon on a toggle', () => {
    render(
      <ToggleButton icon={<svg data-testid="off" />} selectedIcon={<svg data-testid="on" />} defaultSelected>
        Label
      </ToggleButton>,
    );
    expect(screen.queryByTestId('on')).not.toBeNull();
    expect(screen.queryByTestId('off')).toBeNull();
  });
});

describe('toggle icon button labelling', () => {
  it('announces ariaLabelSelected while selected', () => {
    render(
      <IconButton
        toggle
        defaultSelected
        aria-label="Add to favourites"
        ariaLabelSelected="Remove from favourites"
      >
        <svg />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toBeTruthy();
  });

  it('falls back to aria-label when unselected', () => {
    render(
      <IconButton toggle aria-label="Add to favourites" ariaLabelSelected="Remove from favourites">
        <svg />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Add to favourites' })).toBeTruthy();
  });
});
