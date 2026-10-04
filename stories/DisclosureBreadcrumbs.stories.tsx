import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionItem, Breadcrumb, Breadcrumbs, ExpansionPanel, Icon } from '../src';
import { HeartIcon, PersonIcon } from './icons';

/**
 * Expansion panels, accordions and breadcrumbs — three things every catalog has and Material
 * names none of.
 *
 * `ExpansionPanelTokens`, `AccordionTokens` and `BreadcrumbTokens` are all 404 in androidx, so
 * none of the geometry here is captured. It is borrowed instead: a panel's header *is* a list
 * row, so it uses `ListTokens` verbatim — the 56px height, the 16px gutters, the 12px
 * between-space, the body-large label and the `CornerLarge` container.
 *
 * The part worth knowing is behavioural. A collapsed panel is still in the DOM, hidden with
 * `hidden="until-found"`, so **find-in-page can reach the text inside it and the browser opens
 * the section to show you**. Try it: collapse everything, then search the page for a word that
 * only appears inside a panel.
 */
const meta: Meta = {
  title: 'Components/Disclosure and Breadcrumbs',
  parameters: { layout: 'padded' },
};
export default meta;

/** One panel, open and closed, in the three variants. */
export const Panels: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 24, maxWidth: 520 }}>
      <div>
        <p className="sb-label">Plain, open to start</p>
        <ExpansionPanel title="Shipping" supportingText="Arrives Thursday" defaultExpanded>
          Sent from the warehouse nearest you. Nothing here is removed when the panel closes.
        </ExpansionPanel>
      </div>

      <div>
        <p className="sb-label">Outlined, with a leading icon</p>
        <ExpansionPanel
          variant="outlined"
          title="Account"
          leadingIcon={
            <Icon size={24}>
              <PersonIcon />
            </Icon>
          }
        >
          The header is a list row: 56px tall, 16px gutters, body-large label.
        </ExpansionPanel>
      </div>

      <div>
        <p className="sb-label">Filled, and disabled</p>
        <ExpansionPanel variant="filled" title="Archived" disabled>
          Unreachable.
        </ExpansionPanel>
      </div>
    </div>
  ),
};

/** A set. One open at a time, because the group owns the open keys. */
export const SingleOpen: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Accordion variant="outlined" defaultExpandedKeys={['what']}>
        <AccordionItem id="what" title="What is in the box">
          A disclosure, a group of them, and a trail.
        </AccordionItem>
        <AccordionItem id="how" title="How the group works">
          `useDisclosureGroupState` holds the open keys, so opening one closes the other without either panel
          knowing the other exists.
        </AccordionItem>
        <AccordionItem id="keys" title="Why the arrows do nothing">
          A header is an ordinary button and Tab already reaches it. The ARIA pattern makes arrow keys
          optional, and wiring them would take a Tab stop away to buy nothing.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

/** Several open at once, filled. */
export const MultipleOpen: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Accordion variant="filled" allowsMultipleExpanded defaultExpandedKeys={['a', 'b']}>
        <AccordionItem id="a" title="First" supportingText="Open">
          Both of these are open.
        </AccordionItem>
        <AccordionItem id="b" title="Second" supportingText="Also open">
          And they stay that way.
        </AccordionItem>
        <AccordionItem id="c" title="Third" supportingText="Closed">
          Still in the DOM.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

/** A short trail stays whole. The last crumb is the page you are on, and is not a link. */
export const Trail: StoryObj = {
  render: () => (
    <Breadcrumbs>
      <Breadcrumb id="home" href="#home">
        Home
      </Breadcrumb>
      <Breadcrumb id="library" href="#library">
        Library
      </Breadcrumb>
      <Breadcrumb id="data" href="#data">
        Data
      </Breadcrumb>
    </Breadcrumbs>
  ),
};

/**
 * A long trail folds its middle into a menu, keeping the first crumb and the last two — where
 * this sits, and what it is inside. The menu is the library's own `MenuButton`, so the folded
 * crumbs keep typeahead and arrow keys.
 */
export const Folded: StoryObj = {
  render: function Render() {
    const [at, setAt] = useState('final');
    return (
      <div className="sb-col" style={{ gap: 16 }}>
        <Breadcrumbs onAction={(id) => setAt(String(id))}>
          {['Home', 'Projects', 'Grange', 'Source', 'Components', 'Disclosure', 'Panel'].map((name) => (
            <Breadcrumb key={name} id={name.toLowerCase()}>
              {name}
            </Breadcrumb>
          ))}
        </Breadcrumbs>
        <p className="sb-label">Last pressed: {at}</p>
      </div>
    );
  },
};

/** A trail over a panel, which is how both usually show up. */
export const Together: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 16, maxWidth: 520 }}>
      <Breadcrumbs>
        <Breadcrumb id="home" href="#home">
          Home
        </Breadcrumb>
        <Breadcrumb id="saved" href="#saved">
          Saved
        </Breadcrumb>
        <Breadcrumb id="item">Favourites</Breadcrumb>
      </Breadcrumbs>
      <Accordion variant="outlined" defaultExpandedKeys={['one']}>
        <AccordionItem
          id="one"
          title="Favourites"
          leadingIcon={
            <Icon size={24}>
              <HeartIcon />
            </Icon>
          }
        >
          Three things, none of which Material names.
        </AccordionItem>
        <AccordionItem id="two" title="Recently viewed">
          Nothing yet.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
