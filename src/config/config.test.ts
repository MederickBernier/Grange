import { describe, expect, it } from 'vitest';
import { defaultConfig, mergeConfig, resolveSlotClass } from './config';
import { defaultSizes, resolveSizes } from '../components/Button/specs';

describe('slot classes', () => {
  it('adds layers in order, after the built-in class', () => {
    expect(resolveSlotClass('grange-button', 'hashed', 'from-provider', 'from-instance')).toBe(
      'grange-button hashed from-provider from-instance',
    );
  });

  it('drops everything before a replace, but keeps the hook', () => {
    expect(resolveSlotClass('grange-button', 'hashed', 'from-provider', { replace: 'mine' })).toBe(
      'grange-button mine',
    );
  });

  it('lets a later layer add onto a replace', () => {
    expect(resolveSlotClass('grange-button', 'hashed', { replace: 'mine' }, 'extra')).toBe(
      'grange-button mine extra',
    );
  });

  it('ignores undefined layers and empty strings', () => {
    expect(resolveSlotClass('grange-button', 'hashed', undefined, '')).toBe('grange-button hashed');
  });

  it('an empty replace clears the slot down to the hook', () => {
    expect(resolveSlotClass('grange-button', 'hashed', { replace: '' })).toBe('grange-button');
  });
});

describe('nested providers', () => {
  it('stack class overrides instead of shadowing them', () => {
    const outer = mergeConfig(defaultConfig, { classNames: { Button: { root: 'a' } } });
    const inner = mergeConfig(outer, { classNames: { Button: { root: 'b' } } });
    expect(inner.classNames.Button?.root).toEqual(['a', 'b']);
    expect(resolveSlotClass('hook', 'built', ...(inner.classNames.Button?.root ?? []))).toBe('hook built a b');
  });

  it('override default props per component, keeping the outer ones', () => {
    const outer = mergeConfig(defaultConfig, { defaultProps: { Button: { variant: 'tonal', size: 'm' } } });
    const inner = mergeConfig(outer, { defaultProps: { Button: { size: 'l' } } });
    expect(inner.defaultProps.Button).toEqual({ variant: 'tonal', size: 'l' });
  });

  it('merge behavior field by field', () => {
    const cfg = mergeConfig(defaultConfig, { behavior: { ripple: { enabled: false } } });
    expect(cfg.behavior.ripple.enabled).toBe(false);
    expect(cfg.behavior.ripple.growMs).toBe(defaultConfig.behavior.ripple.growMs);
    expect(cfg.behavior.springs.press).toBe('defaultEffects');
  });

  it('reassign which spring an interaction uses', () => {
    const cfg = mergeConfig(defaultConfig, { behavior: { springs: { press: 'slowSpatial' } } });
    expect(cfg.behavior.springs.press).toBe('slowSpatial');
    expect(cfg.behavior.springs.selection).toBe('fastSpatial');
  });

  it('fold sizes onto the parent, not back onto the Compose defaults', () => {
    const outer = mergeConfig(defaultConfig, { sizes: { button: { m: { height: 60 } } } });
    const inner = mergeConfig(outer, { sizes: { button: { m: { padding: 30 } } } });
    expect(inner.sizes.button.m.height).toBe(60);
    expect(inner.sizes.button.m.padding).toBe(30);
    expect(inner.sizes.button.s).toEqual(defaultSizes.button.s);
  });

  it('leave the config untouched when a provider passes nothing', () => {
    expect(mergeConfig(defaultConfig, {})).toEqual(defaultConfig);
  });
});

describe('size overrides', () => {
  it('return the shared default object when there is nothing to override', () => {
    expect(resolveSizes(undefined)).toBe(defaultSizes);
  });

  it('keep unlisted fields and sizes', () => {
    const sizes = resolveSizes({ button: { m: { height: 60 } } });
    expect(sizes.button.m).toEqual({ ...defaultSizes.button.m, height: 60 });
    expect(sizes.button.xl).toEqual(defaultSizes.button.xl);
  });

  it('override icon button padding per width', () => {
    const sizes = resolveSizes({ iconButtonPadding: { s: { wide: 20 } } });
    expect(sizes.iconButtonPadding.s).toEqual({ narrow: 4, default: 8, wide: 20 });
  });
});
