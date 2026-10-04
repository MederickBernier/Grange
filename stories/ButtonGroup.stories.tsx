import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Button,
  ButtonGroup,
  ConnectedButtonGroup,
  ConnectedButtonGroupItem,
  IconButton,
  ToggleButton,
} from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartFilledIcon, HeartIcon } from './icons';

const meta: Meta = { title: 'Components/Button group' };
export default meta;

/** Press and hold any button: it widens by 15% and its neighbours make room. */
export const Standard: StoryObj = {
  render: () => (
    <div className="sb-col">
      <ButtonGroup aria-label="Text formatting">
        <Button variant="tonal">Bold</Button>
        <Button variant="tonal">Italic</Button>
        <Button variant="tonal">Underline</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Actions">
        <IconButton variant="filled" size="m" aria-label="Add">
          <AddIcon />
        </IconButton>
        <IconButton variant="tonal" size="m" aria-label="Next">
          <ArrowIcon />
        </IconButton>
        <ToggleButton size="m" icon={<HeartIcon />} selectedIcon={<HeartFilledIcon />}>
          Favorite
        </ToggleButton>
        <IconButton variant="outlined" size="m" aria-label="Done">
          <CheckIcon />
        </IconButton>
      </ButtonGroup>
    </div>
  ),
};

/**
 * Single select: the selected item becomes fully round.
 *
 * It is a `radiogroup` of `radio`s, which is what a segmented control is — picking one of a set,
 * not pressing buttons. So it is one tab stop: Tab reaches the selected segment, then the arrows
 * move between segments and select as they go, and Home and End jump to the ends. Try it in the
 * RTL story under Foundations too; the arrows follow the row, which is mirrored there.
 */
export const ConnectedSingle: StoryObj = {
  render: function Render() {
    const [keys, setKeys] = useState<Set<string>>(new Set(['week']));
    return (
      <div className="sb-col">
        <ConnectedButtonGroup aria-label="Range" selectedKeys={keys} onSelectionChange={setKeys}>
          <ConnectedButtonGroupItem id="day">Day</ConnectedButtonGroupItem>
          <ConnectedButtonGroupItem id="week">Week</ConnectedButtonGroupItem>
          <ConnectedButtonGroupItem id="month">Month</ConnectedButtonGroupItem>
          <ConnectedButtonGroupItem id="year">Year</ConnectedButtonGroupItem>
        </ConnectedButtonGroup>
        <span className="sb-label">Selected: {[...keys].join(', ')}</span>
        <div style={{ width: 420 }}>
          <ConnectedButtonGroup
            aria-label="View"
            fullWidth
            size="m"
            variant="tonal"
            defaultSelectedKeys={['list']}
          >
            <ConnectedButtonGroupItem id="list">List</ConnectedButtonGroupItem>
            <ConnectedButtonGroupItem id="grid">Grid</ConnectedButtonGroupItem>
            <ConnectedButtonGroupItem id="map">Map</ConnectedButtonGroupItem>
          </ConnectedButtonGroup>
        </div>
      </div>
    );
  },
};

/**
 * Multi select stays a `group` of `aria-pressed` toggle buttons, each its own tab stop, because
 * that is what it is: several independent toggles that happen to sit together. The arrows are
 * left to the browser here — in a toggle group they are not a selection gesture.
 */
export const ConnectedMultiple: StoryObj = {
  render: () => (
    <ConnectedButtonGroup aria-label="Filters" selectionMode="multiple" defaultSelectedKeys={['sows']}>
      <ConnectedButtonGroupItem id="sows" icon={<CheckIcon />}>
        Sows
      </ConnectedButtonGroupItem>
      <ConnectedButtonGroupItem id="gilts">Gilts</ConnectedButtonGroupItem>
      <ConnectedButtonGroupItem id="boars">Boars</ConnectedButtonGroupItem>
    </ConnectedButtonGroup>
  ),
};
