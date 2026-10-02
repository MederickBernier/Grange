import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DockedToolbar,
  FloatingToolbar,
  Icon,
  IconButton,
  ToggleButton,
  floatingToolbar,
} from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * Toolbars, new in M3 Expressive. Geometry from Compose FloatingToolbarTokens and
 * DockedToolbarTokens.
 *
 * Keyboard handling is React Aria's `useToolbar`: the arrows move between items and reverse in a
 * right-to-left locale, Tab leaves the toolbar instead of walking through every item, and coming
 * back lands on the item you left. Try it: Tab in, then arrow around.
 */
const meta: Meta = {
  title: 'Components/Toolbar',
  parameters: { layout: 'padded' },
};
export default meta;

const actions = (
  <>
    <IconButton aria-label="Add">
      <Icon>
        <AddIcon />
      </Icon>
    </IconButton>
    <IconButton aria-label="Confirm">
      <Icon>
        <CheckIcon />
      </Icon>
    </IconButton>
    <IconButton aria-label="Favourite">
      <Icon>
        <HeartIcon />
      </Icon>
    </IconButton>
    <IconButton aria-label="Forward">
      <Icon>
        <ArrowIcon />
      </Icon>
    </IconButton>
  </>
);

/**
 * Standard sits on a surface colour. Vibrant fills with the primary container and restyles the
 * buttons inside it, which the toolbar does by targeting their stable hook classes.
 */
export const Floating: StoryObj = {
  render: () => (
    <div className="sb-col">
      <div className="sb-row">
        <span className="sb-label">Standard</span>
        <FloatingToolbar aria-label="Standard actions">{actions}</FloatingToolbar>
      </div>
      <div className="sb-row">
        <span className="sb-label">Vibrant</span>
        <FloatingToolbar variant="vibrant" aria-label="Vibrant actions">
          {actions}
        </FloatingToolbar>
      </div>
    </div>
  ),
};

/** A selected toggle inside a vibrant bar takes the surface colour, so it reads as lifted out. */
export const VibrantSelection: StoryObj = {
  render: function Render() {
    const [bold, setBold] = useState(true);
    const [italic, setItalic] = useState(false);
    return (
      <FloatingToolbar variant="vibrant" aria-label="Formatting">
        <ToggleButton selected={bold} onChange={setBold}>
          Bold
        </ToggleButton>
        <ToggleButton selected={italic} onChange={setItalic}>
          Italic
        </ToggleButton>
      </FloatingToolbar>
    );
  },
};

export const Vertical: StoryObj = {
  render: () => (
    <FloatingToolbar orientation="vertical" aria-label="Vertical actions">
      {actions}
    </FloatingToolbar>
  ),
};

/**
 * The docked bar spans its container with square corners. Items spread to fill it, but never
 * closer than 4px or further than 32px apart, which the tokens set. Resize the panel and watch
 * the spacing stop growing once it hits the cap.
 */
export const Docked: StoryObj = {
  render: () => (
    <div className="sb-col">
      {[320, 520, 900].map((width) => (
        <div key={width} style={{ width, maxWidth: '100%' }}>
          <p className="sb-label">{width}px</p>
          <DockedToolbar aria-label={`Actions at ${width}`}>{actions}</DockedToolbar>
        </div>
      ))}
    </div>
  ),
};

/**
 * Where a floating toolbar floats is the app's layout decision, so the component does not fix
 * itself to the viewport. The spec's gap from the screen edge is published as
 * `--grange-floating-toolbar-inset` to position it with.
 */
export const Positioning: StoryObj = {
  render: () => (
    <div
      style={{
        position: 'relative',
        height: 260,
        borderRadius: 16,
        background: 'var(--md-sys-color-surface-container-low)',
        overflow: 'hidden',
      }}
    >
      <p className="sb-label" style={{ padding: 16 }}>
        Content it floats over ({floatingToolbar.externalPadding}px inset)
      </p>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          translate: '-50% 0',
          bottom: 'var(--grange-floating-toolbar-inset, 16px)',
        }}
      >
        <FloatingToolbar aria-label="Floating over content">{actions}</FloatingToolbar>
      </div>
    </div>
  ),
};
