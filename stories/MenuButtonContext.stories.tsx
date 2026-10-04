import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ComboBoxItem,
  ContextMenu,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuSection,
  MultiColumnComboBox,
} from '../src';
import { ArrowIcon, HeartIcon } from './icons';

/**
 * The last of phase 2. Three small components, and each one turned on a question about who names
 * what.
 */
const meta: Meta = {
  title: 'Components/Menu button, Context menu and Columns',
  parameters: { layout: 'padded' },
};
export default meta;

const actions = (
  <>
    <MenuSection title="Clipboard">
      <MenuItem
        key="cut"
        icon={
          <Icon>
            <ArrowIcon />
          </Icon>
        }
        trailingText="⌘X"
      >
        Cut
      </MenuItem>
      <MenuItem key="copy" trailingText="⌘C">
        Copy
      </MenuItem>
      <MenuItem key="paste" trailingText="⌘V" isDisabled>
        Paste
      </MenuItem>
    </MenuSection>
    <MenuSection title="Other">
      <MenuItem key="duplicate" supportingText="Makes a copy beside it">
        Duplicate
      </MenuItem>
    </MenuSection>
  </>
);

/**
 * `MenuButton` is the catalog's DropDownButton, and deliberately thin: `MenuTrigger` already
 * wires a trigger to a menu, so this is that with one of our buttons in front.
 *
 * It has no label of its own for the menu, and there is none to give: `useMenuTrigger` points
 * the menu's `aria-labelledby` at the button, which wins over any `aria-label`. The button names
 * both.
 */
export const MenuButtons: StoryObj = {
  render: function Render() {
    const [chosen, setChosen] = useState<string | null>(null);
    return (
      <div className="sb-col">
        <div className="sb-row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <MenuButton items={actions} onAction={(key) => setChosen(String(key))}>
            Edit
          </MenuButton>
          <MenuButton items={actions} variant="outlined" onAction={(key) => setChosen(String(key))}>
            Outlined
          </MenuButton>
          <MenuButton items={actions} variant="text" size="l" onAction={(key) => setChosen(String(key))}>
            Large text
          </MenuButton>
          <MenuButton items={actions} icon={<HeartIcon />} onAction={(key) => setChosen(String(key))}>
            With an icon
          </MenuButton>
          <MenuButton items={actions} disabled>
            Disabled
          </MenuButton>
        </div>
        <p className="sb-label">{chosen ? `chose ${chosen}` : 'nothing chosen'}</p>
      </div>
    );
  },
};

/** Selection and the M3E restyles pass straight through to the menu. */
export const Selecting: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 12, flexWrap: 'wrap' }}>
      <MenuButton items={actions} selectionMode="single" defaultSelectedKeys={['copy']}>
        Single select
      </MenuButton>
      <MenuButton
        items={actions}
        selectionMode="multiple"
        defaultSelectedKeys={['cut', 'copy']}
        menuVariant="vibrant"
      >
        Multiple, vibrant
      </MenuButton>
      <MenuButton items={actions} menuVariant="standard" placement="end">
        Standard, to the side
      </MenuButton>
    </div>
  ),
};

/**
 * `ContextMenu` opens on a right-click, a long press, or the keyboard's context key —
 * `useContextMenu` recognises all three plus the screen-reader path, which a bare
 * `onContextMenu` handler does not.
 *
 * The menu opens at the pointer, so there is nothing for the positioning to anchor to. A
 * one-pixel element is placed at the point and used as the anchor, which keeps the flipping and
 * the containment rather than reimplementing them against raw coordinates.
 */
export const ContextMenus: StoryObj = {
  render: function Render() {
    const [chosen, setChosen] = useState<string | null>(null);
    return (
      <div className="sb-col">
        <ContextMenu>
          <div
            // A demo surface you can right-click or press the context key on, so it has to be
            // reachable; there is no role for "the thing a context menu belongs to".
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 320,
              height: 160,
              borderRadius: 12,
              border: '1px dashed var(--md-sys-color-outline)',
              background: 'var(--md-sys-color-surface-container-low)',
            }}
          >
            Right-click, long-press, or press the context key
          </div>
          <Menu aria-label="Canvas actions" onAction={(key) => setChosen(String(key))}>
            {actions}
          </Menu>
        </ContextMenu>
        <p className="sb-label">{chosen ? `chose ${chosen}` : 'nothing chosen'}</p>
      </div>
    );
  },
};

/**
 * `MultiColumnComboBox` is the same combo box with the list in columns. The columns are
 * presentation: an option is still one option named by its label, and the cells are hidden from
 * assistive tech so the row is not read twice. A real tabular list would want `useGridList` and
 * would make every cell a focus stop, which is the wrong trade for picking one thing.
 */
export const Columns: StoryObj = {
  render: function Render() {
    const [key, setKey] = useState<string | null>(null);
    const cities = [
      { key: 'par', name: 'Paris', country: 'France', people: '2.1M' },
      { key: 'rom', name: 'Rome', country: 'Italy', people: '2.8M' },
      { key: 'osl', name: 'Oslo', country: 'Norway', people: '0.7M' },
      { key: 'ath', name: 'Athens', country: 'Greece', people: '0.6M' },
    ];
    return (
      <div className="sb-col" style={{ maxWidth: 420 }}>
        <MultiColumnComboBox
          label="City"
          columns={[
            { key: 'name', title: 'City' },
            { key: 'country', title: 'Country', width: '110px' },
            { key: 'people', title: 'People', width: '70px' },
          ]}
          selectedKey={key}
          onSelectionChange={(next) => setKey(next as string | null)}
          supportingText="Filtering still matches the label"
        >
          {cities.map((city) => (
            <ComboBoxItem key={city.key} cells={[city.name, city.country, city.people]}>
              {city.name}
            </ComboBoxItem>
          ))}
        </MultiColumnComboBox>
        <p className="sb-label">chosen: {key ?? 'nothing'}</p>
      </div>
    );
  },
};
