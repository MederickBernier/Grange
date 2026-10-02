import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExtendedFab, FabMenu, FabMenuItem, Icon } from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * The rest of the FAB family. Geometry from Compose ExtendedFabSmall/Medium/Large and
 * FabMenuBaseline.
 */
const meta: Meta = {
  title: 'Components/Extended FAB and FAB menu',
  parameters: { layout: 'padded' },
};
export default meta;

/** 56, 80 and 96px tall. Note an extended `small` is as tall as a plain FAB's `baseline`. */
export const Sizes: StoryObj = {
  render: () => (
    <div className="sb-col">
      {(['small', 'medium', 'large'] as const).map((size) => (
        <div key={size} className="sb-row">
          <span className="sb-label">{size}</span>
          <ExtendedFab size={size} icon={<Icon><AddIcon /></Icon>}>
            Compose
          </ExtendedFab>
        </div>
      ))}
    </div>
  ),
};

export const Colours: StoryObj = {
  render: () => (
    <div className="sb-row">
      {(['primary', 'secondary', 'tertiary', 'surface'] as const).map((variant) => (
        <ExtendedFab key={variant} variant={variant} icon={<Icon><HeartIcon /></Icon>}>
          {variant}
        </ExtendedFab>
      ))}
    </div>
  ),
};

/**
 * Lowered drops the resting elevation from level 3 to level 1, for a FAB sitting on a surface
 * that is already raised. Both levels come from the Lowered* tokens.
 */
export const Lowered: StoryObj = {
  render: () => (
    <div className="sb-row">
      <ExtendedFab icon={<Icon><AddIcon /></Icon>}>Default, level 3</ExtendedFab>
      <ExtendedFab lowered icon={<Icon><AddIcon /></Icon>}>
        Lowered, level 1
      </ExtendedFab>
    </div>
  ),
};

/**
 * Collapsing hides the label and squares the container off, landing on exactly the plain FAB of
 * the same height, since the two token sets agree at 56, 80 and 96. The width change rides the
 * padding spring, so toggle it and watch it animate.
 */
export const Collapsing: StoryObj = {
  render: function Render() {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="sb-col">
        <div className="sb-row">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <ExtendedFab
              key={size}
              size={size}
              collapsed={collapsed}
              icon={<Icon><AddIcon /></Icon>}
              aria-label="Compose"
              onClick={() => setCollapsed(!collapsed)}
            >
              Compose
            </ExtendedFab>
          ))}
        </div>
        <p className="sb-label">Click any of them to toggle</p>
      </div>
    );
  },
};

/**
 * A FAB that opens onto labelled actions, replacing the speed dial. Items reveal nearest-first.
 *
 * Keyboard: Tab to the FAB and press Enter, then Up, Down, Home and End move between items and
 * Escape closes. A click outside closes it too.
 */
export const Menu: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [picked, setPicked] = useState<string | null>(null);

    return (
      <div className="sb-col" style={{ minHeight: 320, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
        <p className="sb-label">{picked ? `Chose: ${picked}` : 'Nothing chosen yet'}</p>
        <FabMenu
          open={open}
          onOpenChange={setOpen}
          icon={<Icon><AddIcon /></Icon>}
          closeIcon={<Icon><AddIcon /></Icon>}
          aria-label="Create"
          closeAriaLabel="Close the create menu"
        >
          <FabMenuItem icon={<Icon><CheckIcon /></Icon>} onPress={() => setPicked('Document')}>
            Document
          </FabMenuItem>
          <FabMenuItem icon={<Icon><ArrowIcon /></Icon>} onPress={() => setPicked('Spreadsheet')}>
            Spreadsheet
          </FabMenuItem>
          <FabMenuItem icon={<Icon><HeartIcon /></Icon>} onPress={() => setPicked('Presentation')}>
            Presentation
          </FabMenuItem>
        </FabMenu>
      </div>
    );
  },
};
