import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fab, Icon, SplitButton, SplitButtonLeading, SplitButtonTrailing } from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * The two M3 Expressive actions built on ButtonBase. Geometry comes from the Compose token
 * files captured in tokens/m3-expressive.json: FabSmall through FabLarge, and SplitButtonXSmall
 * through SplitButtonXLarge.
 */
const meta: Meta = {
  title: 'Components/Fab and Split button',
  parameters: { layout: 'padded' },
};
export default meta;

/** 40, 56, 80 and 96px square, each with its own corner and icon size from the tokens. */
export const FabSizes: StoryObj = {
  render: () => (
    <div className="sb-row">
      {(['small', 'baseline', 'medium', 'large'] as const).map((size) => (
        <Fab key={size} size={size} aria-label={`Add, ${size}`}>
          <Icon>
            <AddIcon />
          </Icon>
        </Fab>
      ))}
    </div>
  ),
};

/**
 * Primary and secondary come from FabPrimaryContainerTokens and FabSecondaryContainerTokens.
 * Tertiary and surface are not tokenised upstream and follow the same container pattern.
 */
export const FabColours: StoryObj = {
  render: () => (
    <div className="sb-row">
      {(['primary', 'secondary', 'tertiary', 'surface'] as const).map((variant) => (
        <Fab key={variant} variant={variant} aria-label={variant}>
          <Icon>
            <HeartIcon />
          </Icon>
        </Fab>
      ))}
    </div>
  ),
};

/** Elevation goes from level 3 to level 4 on hover, and a disabled FAB flattens. */
export const FabStates: StoryObj = {
  render: () => (
    <div className="sb-row">
      <Fab aria-label="Normal">
        <Icon>
          <AddIcon />
        </Icon>
      </Fab>
      <Fab disabled aria-label="Disabled">
        <Icon>
          <AddIcon />
        </Icon>
      </Fab>
      <Fab href="https://m3.material.io" target="_blank" rel="noreferrer" aria-label="As a link">
        <Icon>
          <ArrowIcon />
        </Icon>
      </Fab>
    </div>
  ),
};

/**
 * An action plus a menu button for its alternatives. Press either half and watch the corner
 * where they meet grow rather than shrink, which is the opposite of a plain button.
 */
export const SplitButtons: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState<string | null>(null);
    return (
      <div className="sb-col">
        {(['xs', 's', 'm', 'l', 'xl'] as const).map((size) => (
          <div key={size} className="sb-row">
            <span className="sb-label">{size}</span>
            <SplitButton size={size} aria-label="Save options">
              <SplitButtonLeading icon={<Icon><CheckIcon /></Icon>}>Save</SplitButtonLeading>
              <SplitButtonTrailing
                aria-label="More save options"
                expanded={open === size}
                onClick={() => setOpen(open === size ? null : size)}
              >
                <Icon>
                  <ArrowIcon />
                </Icon>
              </SplitButtonTrailing>
            </SplitButton>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Expanding the trailing half takes its inner corner all the way round and spins the icon a half
 * turn, which is the shape change the spec describes. Click the chevron.
 */
export const SplitButtonExpanded: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <div className="sb-row">
        {(['filled', 'tonal', 'outlined', 'elevated'] as const).map((variant) => (
          <SplitButton key={variant} variant={variant} size="m" aria-label={variant}>
            <SplitButtonLeading>{variant}</SplitButtonLeading>
            <SplitButtonTrailing aria-label="More" expanded={open} onClick={() => setOpen(!open)}>
              <Icon>
                <ArrowIcon />
              </Icon>
            </SplitButtonTrailing>
          </SplitButton>
        ))}
      </div>
    );
  },
};
