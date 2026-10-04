import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, GrangeProvider, Switch, checkbox, handlePosition, handleSize, switchSpec } from '../index';

describe('token geometry', () => {
  it('matches CheckboxTokens', () => {
    expect(checkbox).toMatchObject({ size: 18, corner: 2, icon: 18, outlineWidth: 2, stateLayerSize: 40 });
  });

  it('matches SwitchTokens', () => {
    expect(switchSpec).toMatchObject({
      trackWidth: 52,
      trackHeight: 32,
      trackOutlineWidth: 2,
      handleOff: 16,
      handleOn: 24,
      handlePressed: 28,
      iconSize: 16,
      stateLayerSize: 40,
    });
  });
});

describe('Checkbox', () => {
  it('is a real checkbox input, so it works in a form', () => {
    render(
      <Checkbox name="terms" value="yes" defaultChecked>
        Accept
      </Checkbox>,
    );
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('checkbox');
    expect(input.name).toBe('terms');
    expect(input.value).toBe('yes');
    expect(input.checked).toBe(true);
  });

  it('is labelled by its own children', () => {
    render(<Checkbox>Accept terms</Checkbox>);
    expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toBeTruthy();
  });

  it('toggles on click and reports the new state', async () => {
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange}>Accept</Checkbox>);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('toggles on Space, as a checkbox must', async () => {
    render(<Checkbox>Accept</Checkbox>);
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    input.focus();
    await userEvent.keyboard(' ');
    expect(input.checked).toBe(true);
  });

  it('can be controlled', async () => {
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <>
          <Checkbox checked={checked} onChange={setChecked}>
            Accept
          </Checkbox>
          <output>{String(checked)}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('true')).toBeTruthy();
  });

  it('reports indeterminate to assistive tech, not just visually', () => {
    render(<Checkbox indeterminate>Some</Checkbox>);
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    // The native indeterminate property is the mechanism screen readers read "mixed" from. An
    // aria-checked attribute alongside it would be redundant, so there deliberately is none.
    expect(input.indeterminate).toBe(true);
    expect(input.getAttribute('aria-checked')).toBeNull();
  });

  it('marks indeterminate separately from checked for the stylesheet', () => {
    const { container } = render(<Checkbox indeterminate>Some</Checkbox>);
    expect((container.querySelector('.grange-checkbox') as HTMLElement).dataset.selected).toBe('mixed');
  });

  it('draws a dash when indeterminate and a tick when checked', () => {
    const { container, unmount } = render(<Checkbox indeterminate>Some</Checkbox>);
    const dash = container.querySelector('svg path')!.getAttribute('d')!;
    unmount();

    const { container: checkedBox } = render(<Checkbox defaultChecked>All</Checkbox>);
    expect(checkedBox.querySelector('svg path')!.getAttribute('d')).not.toBe(dash);
  });

  it('marks the error state', () => {
    const { container } = render(<Checkbox error>Accept</Checkbox>);
    const root = container.querySelector('.grange-checkbox') as HTMLElement;
    expect(root.dataset.error).toBe('true');
    expect(screen.getByRole('checkbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('does not toggle while disabled', async () => {
    const onChange = vi.fn();
    render(
      <Checkbox disabled onChange={onChange}>
        Accept
      </Checkbox>,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('reaches the box and label slots', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Checkbox: { box: 'my-box', label: 'my-label' } }}>
        <Checkbox>Accept</Checkbox>
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-checkbox-box')?.className).toContain('my-box');
    expect(container.querySelector('.grange-checkbox-label')?.className).toContain('my-label');
  });
});

describe('Switch handle geometry', () => {
  // The tokens give three sizes and no insets; the rule is equal padding all round.
  it.each([
    [16, 8],
    [24, 4],
    [28, 2],
  ])('a %spx handle sits %spx in', (size, inset) => {
    expect(handlePosition(size, false).inset).toBe(inset);
    expect(handlePosition(size, false).x).toBe(inset);
  });

  it('puts the handle at the far end when on, with the same padding', () => {
    // 52 - 24 - 4 = 24
    expect(handlePosition(24, true).x).toBe(24);
    // 52 - 16 - 8 = 28
    expect(handlePosition(16, true).x).toBe(28);
  });

  it('grows 16 to 24 to 28 as it is selected and pressed', () => {
    expect(handleSize({ selected: false, pressed: false, hasIcon: false })).toBe(16);
    expect(handleSize({ selected: true, pressed: false, hasIcon: false })).toBe(24);
    expect(handleSize({ selected: false, pressed: true, hasIcon: false })).toBe(28);
    expect(handleSize({ selected: true, pressed: true, hasIcon: false })).toBe(28);
  });

  it('uses the larger off handle when there is an icon, since 16 cannot hold a 16px icon', () => {
    expect(handleSize({ selected: false, pressed: false, hasIcon: true })).toBe(24);
  });

  it('never lets the handle overflow the track', () => {
    for (const size of [16, 24, 28]) {
      for (const selected of [false, true]) {
        const { inset, x } = handlePosition(size, selected);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x + size).toBeLessThanOrEqual(switchSpec.trackWidth);
        expect(inset * 2 + size).toBe(switchSpec.trackHeight);
      }
    }
  });
});

describe('Switch', () => {
  it('has the switch role, over a real input', () => {
    render(<Switch>Wi-Fi</Switch>);
    const input = screen.getByRole('switch') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('checkbox');
  });

  it('is labelled by its own children', () => {
    render(<Switch>Wi-Fi</Switch>);
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeTruthy();
  });

  it('toggles on click and on Space', async () => {
    const onChange = vi.fn();
    render(<Switch onChange={onChange}>Wi-Fi</Switch>);
    const input = screen.getByRole('switch') as HTMLInputElement;

    await userEvent.click(input);
    expect(onChange).toHaveBeenLastCalledWith(true);

    input.focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('participates in a form', () => {
    render(
      <Switch name="wifi" value="on" defaultSelected>
        Wi-Fi
      </Switch>,
    );
    const input = screen.getByRole('switch') as HTMLInputElement;
    expect(input.name).toBe('wifi');
    expect(input.checked).toBe(true);
  });

  it('marks its state for the stylesheet', () => {
    const { container } = render(<Switch defaultSelected>Wi-Fi</Switch>);
    expect((container.querySelector('.grange-switch') as HTMLElement).dataset.selected).toBe('true');
  });

  it('shows the icon for the current side only', () => {
    const { unmount } = render(
      <Switch icon={<svg data-testid="off" />} selectedIcon={<svg data-testid="on" />}>
        Wi-Fi
      </Switch>,
    );
    expect(screen.queryByTestId('off')).not.toBeNull();
    expect(screen.queryByTestId('on')).toBeNull();
    unmount();

    render(
      <Switch defaultSelected icon={<svg data-testid="off" />} selectedIcon={<svg data-testid="on" />}>
        Wi-Fi
      </Switch>,
    );
    expect(screen.queryByTestId('on')).not.toBeNull();
    expect(screen.queryByTestId('off')).toBeNull();
  });

  it('does not toggle while disabled', async () => {
    const onChange = vi.fn();
    render(
      <Switch disabled onChange={onChange}>
        Wi-Fi
      </Switch>,
    );
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reaches the track and handle slots', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Switch: { track: 'my-track', handle: 'my-handle' } }}>
        <Switch>Wi-Fi</Switch>
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-switch-track')?.className).toContain('my-track');
    expect(container.querySelector('.grange-switch-handle')?.className).toContain('my-handle');
  });
});
