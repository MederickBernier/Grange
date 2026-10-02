import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  OutlinedButton,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
} from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * Menus, from Compose MenuTokens for the surface and ListTokens for the rows.
 *
 * Items are a collection: `Menu` reads them rather than rendering them directly, which is what
 * pays for typeahead. Open one and type the first letters of an item to jump to it.
 *
 * An item is identified by its React `key`, not an `id` prop, which is this collection API's
 * convention.
 */
const meta: Meta = {
  title: 'Components/Menu',
  parameters: { layout: 'padded' },
};
export default meta;

export const Basic: StoryObj = {
  render: function Render() {
    const [last, setLast] = useState<string | null>(null);
    return (
      <div className="sb-col">
        <MenuTrigger>
          <OutlinedButton>Actions</OutlinedButton>
          <Menu aria-label="Actions" onAction={(key) => setLast(String(key))}>
            <MenuItem key="edit" icon={<Icon><AddIcon /></Icon>}>
              Edit
            </MenuItem>
            <MenuItem key="duplicate" trailingText="⌘D">
              Duplicate
            </MenuItem>
            <MenuItem key="share" icon={<Icon><ArrowIcon /></Icon>} trailingText="⌘⇧S">
              Share
            </MenuItem>
            <MenuItem key="delete" supportingText="This cannot be undone">
              Delete
            </MenuItem>
          </Menu>
        </MenuTrigger>
        <p className="sb-label">{last ? `Chose: ${last}` : 'Nothing chosen yet'}</p>
      </div>
    );
  },
};

/** Try typing "sh" with the menu open: typeahead comes from the collection, not from us. */
export const Typeahead: StoryObj = {
  render: () => (
    <MenuTrigger>
      <OutlinedButton>Countries</OutlinedButton>
      <Menu aria-label="Countries">
        {['Argentina', 'Brazil', 'Canada', 'Denmark', 'Estonia', 'Finland', 'Shetland', 'Spain'].map(
          (name) => (
            <MenuItem key={name}>{name}</MenuItem>
          ),
        )}
      </Menu>
    </MenuTrigger>
  ),
};

export const Sections: StoryObj = {
  render: () => (
    <MenuTrigger>
      <IconButton aria-label="More options">
        <Icon>
          <HeartIcon />
        </Icon>
      </IconButton>
      <Menu aria-label="More options">
        <MenuSection title="Edit">
          <MenuItem key="cut" trailingText="⌘X">
            Cut
          </MenuItem>
          <MenuItem key="copy" trailingText="⌘C">
            Copy
          </MenuItem>
          <MenuItem key="paste" trailingText="⌘V">
            Paste
          </MenuItem>
        </MenuSection>
        <MenuSection title="Danger">
          <MenuItem key="delete">Delete everything</MenuItem>
        </MenuSection>
      </Menu>
    </MenuTrigger>
  ),
};

/** Selection turns the rows into radios or checkboxes, and tints the chosen ones. */
export const Selection: StoryObj = {
  render: function Render() {
    const [size, setSize] = useState<Set<string>>(new Set(['medium']));
    const [toppings, setToppings] = useState<Set<string>>(new Set(['cheese']));
    return (
      <div className="sb-row">
        <MenuTrigger>
          <OutlinedButton>Size: {[...size][0]}</OutlinedButton>
          <Menu
            aria-label="Size"
            selectionMode="single"
            selectedKeys={size}
            onSelectionChange={(keys) => setSize(keys as Set<string>)}
          >
            <MenuItem key="small">Small</MenuItem>
            <MenuItem key="medium">Medium</MenuItem>
            <MenuItem key="large">Large</MenuItem>
          </Menu>
        </MenuTrigger>

        <MenuTrigger>
          <OutlinedButton>Toppings ({toppings.size})</OutlinedButton>
          <Menu
            aria-label="Toppings"
            selectionMode="multiple"
            selectedKeys={toppings}
            onSelectionChange={(keys) => setToppings(keys as Set<string>)}
          >
            <MenuItem key="cheese" icon={<Icon><CheckIcon /></Icon>}>
              Cheese
            </MenuItem>
            <MenuItem key="olives">Olives</MenuItem>
            <MenuItem key="chilli">Chilli</MenuItem>
          </Menu>
        </MenuTrigger>
      </div>
    );
  },
};

export const Disabled: StoryObj = {
  render: () => (
    <MenuTrigger>
      <OutlinedButton>Actions</OutlinedButton>
      <Menu aria-label="Actions" disabledKeys={['paste', 'delete']}>
        <MenuItem key="copy">Copy</MenuItem>
        <MenuItem key="paste">Paste, nothing on the clipboard</MenuItem>
        <MenuItem key="delete">Delete, not yours to delete</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
};

/**
 * What a split button's trailing half is for. The menu anchors to the half that opened it, and
 * that half keeps its expanded shape while the menu is up.
 */
export const OnASplitButton: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <SplitButton size="m" aria-label="Save options">
        <SplitButtonLeading icon={<Icon><CheckIcon /></Icon>}>Save</SplitButtonLeading>
        <MenuTrigger open={open} onOpenChange={setOpen}>
          <SplitButtonTrailing aria-label="More save options" expanded={open}>
            <Icon>
              <ArrowIcon />
            </Icon>
          </SplitButtonTrailing>
          <Menu aria-label="Save options">
            <MenuItem key="draft">Save as draft</MenuItem>
            <MenuItem key="copy">Save a copy</MenuItem>
            <MenuItem key="template">Save as template</MenuItem>
          </Menu>
        </MenuTrigger>
      </SplitButton>
    );
  },
};
