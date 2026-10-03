import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Accordion,
  AccordionItem,
  Breadcrumb,
  Breadcrumbs,
  ExpansionPanel,
  GrangeProvider,
  breadcrumbs as crumbSpec,
  disclosure,
  list,
} from '../index';

describe('tokens', () => {
  it("takes the panel header's geometry from ListTokens, because a header is a list row", () => {
    expect(disclosure.headerHeight).toBe(list.oneLine); // 56
    expect(disclosure.leadingSpace).toBe(list.leadingSpace); // 16
    expect(disclosure.betweenSpace).toBe(list.betweenSpace); // 12
    expect(disclosure.corner).toBe(list.containerCorner); // CornerLarge
  });

  it("builds the trail's chosen metrics out of the same file", () => {
    expect(crumbSpec.separator).toBe(list.leadingIcon);
    expect(crumbSpec.gap).toBe(list.betweenSpace / 2);
  });
});

describe('ExpansionPanel', () => {
  const header = (name: string) => screen.getByRole('button', { name });

  it('starts collapsed, with the panel hidden rather than removed', () => {
    const { container } = render(
      <ExpansionPanel title="Details">
        <p>Inside</p>
      </ExpansionPanel>,
    );
    expect(header('Details').getAttribute('aria-expanded')).toBe('false');
    // Still in the DOM, which is what lets find-in-page reach it.
    const panel = container.querySelector('.grange-expansion-panel-content') as HTMLElement;
    expect(panel).not.toBeNull();
    // hidden="until-found", not display:none and not unmounted.
    expect(panel.getAttribute('hidden')).toBe('until-found');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });

  it('opens and closes on a press', async () => {
    const user = userEvent.setup();
    render(
      <ExpansionPanel title="Details">
        <p>Inside</p>
      </ExpansionPanel>,
    );

    await user.click(header('Details'));
    expect(header('Details').getAttribute('aria-expanded')).toBe('true');
    const open = screen.getByText('Inside').closest('[aria-hidden]') as HTMLElement;
    expect(open.getAttribute('aria-hidden')).toBe('false');
    expect(open.hasAttribute('hidden')).toBe(false);

    await user.click(header('Details'));
    expect(header('Details').getAttribute('aria-expanded')).toBe('false');
  });

  it('opens on Enter and on Space, as a disclosure button must', async () => {
    const user = userEvent.setup();
    render(<ExpansionPanel title="Details">Inside</ExpansionPanel>);

    await user.tab();
    await user.keyboard('{Enter}');
    expect(header('Details').getAttribute('aria-expanded')).toBe('true');

    await user.keyboard(' ');
    expect(header('Details').getAttribute('aria-expanded')).toBe('false');
  });

  it('points the header at the panel and the panel back at the header', () => {
    const { container } = render(<ExpansionPanel title="Details">Inside</ExpansionPanel>);
    const button = header('Details');
    const panel = container.querySelector('.grange-expansion-panel-content')!;
    expect(button.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(button.id);
  });

  it('honours a controlled expanded prop', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <ExpansionPanel title="Details" expanded={false} onExpandedChange={onExpandedChange}>
        Inside
      </ExpansionPanel>,
    );

    await user.click(header('Details'));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    // The caller said closed, so it stays closed.
    expect(header('Details').getAttribute('aria-expanded')).toBe('false');
  });

  it('does not open while disabled', async () => {
    const user = userEvent.setup();
    render(
      <ExpansionPanel title="Details" disabled>
        Inside
      </ExpansionPanel>,
    );
    await user.click(header('Details'));
    expect(header('Details').getAttribute('aria-expanded')).toBe('false');
  });

  it('takes its variant from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ ExpansionPanel: { variant: 'outlined' } }}>
        <ExpansionPanel title="Details">Inside</ExpansionPanel>
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-expansion-panel') as HTMLElement).dataset.variant).toBe('outlined');
  });
});

describe('Accordion', () => {
  const panels = (
    <>
      <AccordionItem id="one" title="One">
        First
      </AccordionItem>
      <AccordionItem id="two" title="Two">
        Second
      </AccordionItem>
    </>
  );
  const header = (name: string) => screen.getByRole('button', { name });

  it('opens one section at a time by default', async () => {
    const user = userEvent.setup();
    render(<Accordion>{panels}</Accordion>);

    await user.click(header('One'));
    expect(header('One').getAttribute('aria-expanded')).toBe('true');

    await user.click(header('Two'));
    expect(header('Two').getAttribute('aria-expanded')).toBe('true');
    // The group owns the open set, so the first closed itself without knowing about the second.
    expect(header('One').getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps several open when allowed to', async () => {
    const user = userEvent.setup();
    render(<Accordion allowsMultipleExpanded>{panels}</Accordion>);

    await user.click(header('One'));
    await user.click(header('Two'));
    expect(header('One').getAttribute('aria-expanded')).toBe('true');
    expect(header('Two').getAttribute('aria-expanded')).toBe('true');
  });

  it('opens what defaultExpandedKeys names', () => {
    render(<Accordion defaultExpandedKeys={['two']}>{panels}</Accordion>);
    expect(header('Two').getAttribute('aria-expanded')).toBe('true');
    expect(header('One').getAttribute('aria-expanded')).toBe('false');
  });

  it('reports the open set by key', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Accordion onExpandedChange={onExpandedChange}>{panels}</Accordion>);

    await user.click(header('Two'));
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['two']));
  });

  it('disables every section at once', async () => {
    const user = userEvent.setup();
    render(<Accordion disabled>{panels}</Accordion>);
    await user.click(header('One'));
    expect(header('One').getAttribute('aria-expanded')).toBe('false');
  });

  it('refuses an item outside a group, whose id would mean nothing', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <AccordionItem id="lonely" title="Lonely">
          Nothing
        </AccordionItem>,
      ),
    ).toThrow(/must be inside an Accordion/);
    quiet.mockRestore();
  });
});

describe('Breadcrumbs', () => {
  const trail = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <Breadcrumb key={i} id={`c${i}`} href={`/c${i}`}>
        {`Level ${i}`}
      </Breadcrumb>
    ));

  it('is a navigation landmark with a name', () => {
    render(<Breadcrumbs>{trail(3)}</Breadcrumbs>);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).not.toBeNull();
  });

  it('marks the last crumb as the current page, and does not make it a link', () => {
    render(<Breadcrumbs>{trail(3)}</Breadcrumbs>);
    const current = screen.getByText('Level 2');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.tagName).toBe('SPAN');
    // Every other crumb is a real link.
    expect(screen.getByText('Level 0').tagName).toBe('A');
  });

  it('reports which crumb was pressed', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Breadcrumbs onAction={onAction}>{trail(3)}</Breadcrumbs>);

    await user.click(screen.getByText('Level 0'));
    expect(onAction).toHaveBeenCalledWith('c0');
  });

  it('leaves a short trail whole', () => {
    render(<Breadcrumbs>{trail(4)}</Breadcrumbs>);
    expect(screen.queryByRole('button', { name: /more/ })).toBeNull();
    expect(screen.getByText('Level 1')).not.toBeNull();
  });

  it('folds the middle of a long trail into a menu, keeping the first and the last two', async () => {
    const user = userEvent.setup();
    render(<Breadcrumbs>{trail(7)}</Breadcrumbs>);

    expect(screen.getByText('Level 0')).not.toBeNull();
    expect(screen.getByText('Level 5')).not.toBeNull();
    expect(screen.getByText('Level 6')).not.toBeNull();
    expect(screen.queryByText('Level 2')).toBeNull();

    const more = screen.getByRole('button', { name: '4 more' });
    await user.click(more);
    const menu = screen.getByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(4);
  });

  it('reports a folded crumb by the same id as a visible one', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Breadcrumbs onAction={onAction}>{trail(7)}</Breadcrumbs>);

    await user.click(screen.getByRole('button', { name: '4 more' }));
    await user.click(screen.getByRole('menuitem', { name: 'Level 3' }));
    expect(onAction).toHaveBeenCalledWith('c3');
  });

  it('counts crumbs written as a fragment, which Children.toArray would see as one', () => {
    render(
      <Breadcrumbs>
        <>
          <Breadcrumb id="a" href="/a">
            A
          </Breadcrumb>
          <Breadcrumb id="b" href="/b">
            B
          </Breadcrumb>
        </>
      </Breadcrumbs>,
    );
    expect(screen.getByText('B').getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('A').tagName).toBe('A');
  });

  it('takes the fold threshold from the provider', () => {
    render(
      <GrangeProvider defaultProps={{ Breadcrumbs: { maxVisible: 3 } }}>
        <Breadcrumbs>{trail(4)}</Breadcrumbs>
      </GrangeProvider>,
    );
    expect(screen.getByRole('button', { name: '1 more' })).not.toBeNull();
  });

  it('works as a router trail, with no href at all', async () => {
    const user = userEvent.setup();
    function Router() {
      const [at, setAt] = useState('c0');
      return (
        <>
          <Breadcrumbs onAction={(id) => setAt(String(id))}>
            <Breadcrumb id="c0">Home</Breadcrumb>
            <Breadcrumb id="c1">Library</Breadcrumb>
            <Breadcrumb id="c2">Book</Breadcrumb>
          </Breadcrumbs>
          <p>at: {at}</p>
        </>
      );
    }
    render(<Router />);

    await user.click(screen.getByText('Library'));
    expect(screen.getByText('at: c1')).not.toBeNull();
  });
});
