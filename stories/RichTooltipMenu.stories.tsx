import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FilledButton,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  OutlinedButton,
  RichTooltip,
  TextButton,
  Tooltip,
} from '../src';
import { HeartIcon } from './icons';

/**
 * Two more recorded gaps closed: the rich tooltip, and the two M3 Expressive menu restyles.
 *
 * The rich tooltip is not the plain tooltip with more in it. A tooltip is a label — nothing
 * inside it is reachable, and it goes away when the pointer leaves the trigger — so the moment
 * there is a button in it, that markup is wrong. This is a non-modal popover with
 * `role="dialog"`, named by its subhead.
 */
const meta: Meta = {
  title: 'Components/Rich tooltip and Menu styles',
  parameters: { layout: 'padded' },
};
export default meta;

/**
 * Hover the trigger, then move the pointer onto the panel: it stays open across the gap, which
 * is what makes the action pressable. Tab to the trigger and it appears at once, and Tab again
 * walks into the panel.
 */
export const Hover: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 48, flexWrap: 'wrap' }}>
      <RichTooltip
        subhead="Rich tooltip"
        actions={<TextButton>Learn more</TextButton>}
        trigger={<OutlinedButton>Hover or focus me</OutlinedButton>}
      >
        Rich tooltips bring attention to a particular element or feature that warrants the user&apos;s
        attention.
      </RichTooltip>

      <RichTooltip trigger={<OutlinedButton>No subhead</OutlinedButton>} aria-label="About this">
        A rich tooltip without a heading. Give it an aria-label so the panel still has a name.
      </RichTooltip>

      <Tooltip content="A plain tooltip is a label">
        <IconButton aria-label="Favourite">
          <HeartIcon />
        </IconButton>
      </Tooltip>
    </div>
  ),
};

/**
 * The persistent variant opens on a press and stays until it is dismissed. Its trigger really
 * does expand something, so it keeps `aria-expanded`; the hover variant drops it, because there
 * the panel is a comment on the trigger rather than a thing the trigger opens.
 */
export const Persistent: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="sb-col">
        <RichTooltip
          persistent
          open={open}
          onOpenChange={setOpen}
          subhead="Persistent"
          placement="end"
          actions={
            <>
              <TextButton onClick={() => setOpen(false)}>Got it</TextButton>
              <TextButton onClick={() => setOpen(false)}>Dismiss</TextButton>
            </>
          }
          trigger={<FilledButton>Show me how</FilledButton>}
        >
          It stays until you dismiss it, so there is time to read it and press something. Escape and a click
          outside both close it.
        </RichTooltip>
        <p className="sb-label">{open ? 'open' : 'closed'}</p>
      </div>
    );
  },
};

const items = (
  <>
    <MenuSection title="Clipboard">
      <MenuItem key="cut" icon={<HeartIcon />} trailingText="⌘X">
        Cut
      </MenuItem>
      <MenuItem key="copy" trailingText="⌘C">
        Copy
      </MenuItem>
      <MenuItem key="paste" trailingText="⌘V" isDisabled>
        Paste
      </MenuItem>
    </MenuSection>
    <MenuSection title="View">
      <MenuItem key="zoom" supportingText="Fit the window">
        Zoom
      </MenuItem>
    </MenuSection>
  </>
);

/**
 * The three menu styles. All colour: neither StandardMenuTokens nor VibrantMenuTokens publishes
 * a size or a shape, so the geometry is the same menu in each. Standard moves selection onto the
 * tertiary container; vibrant makes the whole surface the tertiary container and lifts an item's
 * icons to the plain tertiary colour while it is pointed at.
 */
export const MenuStyles: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {(['default', 'standard', 'vibrant'] as const).map((variant) => (
        <div key={variant} className="sb-col">
          <p className="sb-label">{variant}</p>
          <Menu
            aria-label={`Edit, ${variant}`}
            variant={variant}
            selectionMode="single"
            defaultSelectedKeys={['copy']}
            style={{ width: 260 }}
          >
            {items}
          </Menu>
        </div>
      ))}
    </div>
  ),
};

/** The same restyles behind a trigger, where a menu usually lives. */
export const InATrigger: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 16, flexWrap: 'wrap' }}>
      {(['standard', 'vibrant'] as const).map((variant) => (
        <MenuTrigger key={variant}>
          <FilledButton>{variant}</FilledButton>
          <Menu
            aria-label={`Edit, ${variant}`}
            variant={variant}
            selectionMode="single"
            defaultSelectedKeys={['copy']}
          >
            {items}
          </Menu>
        </MenuTrigger>
      ))}
    </div>
  ),
};
