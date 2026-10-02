import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, ConnectedButtonGroup, ConnectedButtonGroupItem, GrangeProvider, IconButton } from '../index';

const button = () => screen.getByRole('button');

describe('default props', () => {
  it('apply when the call site says nothing', () => {
    render(
      <GrangeProvider defaultProps={{ Button: { variant: 'tonal', size: 'm', shape: 'square' } }}>
        <Button>Save</Button>
      </GrangeProvider>,
    );
    expect(button().dataset).toMatchObject({ variant: 'tonal', size: 'm', shape: 'square' });
  });

  it('lose to a prop passed at the call site', () => {
    render(
      <GrangeProvider defaultProps={{ Button: { variant: 'tonal' } }}>
        <Button variant="outlined">Save</Button>
      </GrangeProvider>,
    );
    expect(button().dataset.variant).toBe('outlined');
  });

  it('fall back to the built-in defaults with no provider at all', () => {
    render(<Button>Save</Button>);
    expect(button().dataset).toMatchObject({ variant: 'filled', size: 's', shape: 'round' });
  });
});

describe('slot class names', () => {
  it('add the provider and instance layers on top of the stable hook', () => {
    render(
      <GrangeProvider classNames={{ Button: { root: 'from-provider' } }}>
        <Button classNames={{ root: 'from-instance' }} className="from-className">
          Save
        </Button>
      </GrangeProvider>,
    );
    const classes = button().className.split(' ');
    expect(classes).toContain('grange-button');
    expect(classes).toContain('from-provider');
    expect(classes).toContain('from-instance');
    expect(classes).toContain('from-className');
  });

  it('reach the inner slots', () => {
    render(
      <GrangeProvider classNames={{ Button: { label: 'my-label', icon: 'my-icon' } }}>
        <Button icon={<svg />}>Save</Button>
      </GrangeProvider>,
    );
    expect(document.querySelector('.grange-button-label')?.className).toContain('my-label');
    expect(document.querySelector('.grange-button-icon')?.className).toContain('my-icon');
  });

  it('drop the library class on replace but keep the hook', () => {
    render(<Button classNames={{ root: { replace: 'only-mine' } }}>Save</Button>);
    expect(button().className).toBe('grange-button only-mine');
  });

  it('reach ConnectedButtonGroupItem, which previously took no className', () => {
    render(
      <ConnectedButtonGroup>
        <ConnectedButtonGroupItem id="a" className="item-class">
          A
        </ConnectedButtonGroupItem>
      </ConnectedButtonGroup>,
    );
    const item = screen.getByRole('radio');
    expect(item.className).toContain('grange-connected-item');
    expect(item.className).toContain('item-class');
  });
});

describe('behavior', () => {
  it('marks the ripple off so the state layer covers pointer presses', () => {
    render(
      <GrangeProvider behavior={{ ripple: { enabled: false } }}>
        <Button>Save</Button>
      </GrangeProvider>,
    );
    expect(button().dataset.ripple).toBe('off');
    expect(document.querySelector('.grange-ripple')).toBeNull();
  });

  it('renders the ripple by default', () => {
    render(<Button>Save</Button>);
    expect(button().dataset.ripple).toBeUndefined();
    expect(document.querySelector('.grange-ripple')).not.toBeNull();
  });

  it('drops the touch target when the threshold is lowered below the height', () => {
    const { rerender } = render(<Button size="s">Save</Button>);
    expect(document.querySelector('.grange-touch')).not.toBeNull();

    rerender(
      <GrangeProvider behavior={{ touchTargetBelow: 32 }}>
        <Button size="s">Save</Button>
      </GrangeProvider>,
    );
    expect(document.querySelector('.grange-touch')).toBeNull();
  });
});

describe('size geometry', () => {
  // The values the stylesheet used to declare per [data-size], before geometry moved to
  // specs.ts. Locks the migration: these must still reach CSS, now as inline properties.
  const fromTheOldStylesheet = [
    { size: 'xs', height: '32px', gap: '8px', icon: '20px' },
    { size: 's', height: '40px', gap: '8px', icon: '20px' },
    { size: 'm', height: '56px', gap: '8px', icon: '24px' },
    { size: 'l', height: '96px', gap: '12px', icon: '32px' },
    { size: 'xl', height: '136px', gap: '16px', icon: '40px' },
  ] as const;

  it.each(fromTheOldStylesheet)('size $size still resolves to the Compose geometry', (spec) => {
    render(<Button size={spec.size}>Save</Button>);
    const style = button().style;
    expect(style.getPropertyValue('--_height')).toBe(spec.height);
    expect(style.getPropertyValue('--_gap')).toBe(spec.gap);
    expect(style.getPropertyValue('--grange-icon-size')).toBe(spec.icon);
  });

  it('follows an override, so CSS and the JS radii cannot drift', () => {
    render(
      <GrangeProvider sizes={{ button: { m: { height: 60, gap: 10 } } }}>
        <Button size="m">Save</Button>
      </GrangeProvider>,
    );
    expect(button().style.getPropertyValue('--_height')).toBe('60px');
    expect(button().style.getPropertyValue('--_gap')).toBe('10px');
  });

  it('gives icon buttons their own icon box', () => {
    render(
      <IconButton aria-label="Add" size="s">
        <svg />
      </IconButton>,
    );
    expect(button().style.getPropertyValue('--grange-icon-size')).toBe('24px');
  });

  it('lets an inline style prop still win', () => {
    render(
      <Button size="m" style={{ ['--_height' as string]: '99px' }}>
        Save
      </Button>,
    );
    expect(button().style.getPropertyValue('--_height')).toBe('99px');
  });
});
