import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilledButton, List, ListItem, Splitter, SplitterPane, Stack, Window } from '../src';

/**
 * A splitter and a window: the two components in this library you cannot use without being able
 * to move something.
 *
 * Material names neither, so the chrome is borrowed — the splitter's bar is the divider's one
 * pixel inside a `ListTokens` gutter, and the window takes `DialogTokens`' container
 * (SurfaceContainerHigh, CornerExtraLarge, Level3) with a list row for its title bar.
 *
 * **Both are fully operable from the keyboard, and that is the point of building them rather
 * than reaching for a drag library.** Tab to a splitter bar and the arrows move it, Home and End
 * take it to its limits, and the position is announced as a percentage. Tab into the window's
 * title bar and the arrows move the window; focus the corner grip and they resize it.
 */
const meta: Meta = {
  title: 'Components/Splitter and Window',
  parameters: { layout: 'padded' },
};
export default meta;

const Filler = ({ title, lines = 3 }: { title: string; lines?: number }) => (
  <div style={{ padding: 'var(--grange-space-lg)' }}>
    <strong>{title}</strong>
    <p style={{ margin: '8px 0 0', color: 'var(--md-sys-color-on-surface-variant)' }}>
      {Array.from({ length: lines }, () => 'Content that is long enough to need the room. ').join('')}
    </p>
  </div>
);

/** Two panes. Drag the bar, or focus it and use the arrows. */
export const TwoPanes: StoryObj = {
  render: () => (
    <div style={{ height: 240, border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
      <Splitter defaultSizes={[35, 65]} style={{ height: '100%' }}>
        <SplitterPane min={120}>
          <List aria-label="Folders">
            <ListItem>Inbox</ListItem>
            <ListItem>Drafts</ListItem>
            <ListItem>Sent</ListItem>
          </List>
        </SplitterPane>
        <SplitterPane min={200}>
          <Filler title="Message" />
        </SplitterPane>
      </Splitter>
    </div>
  ),
};

/** Three panes, with limits. A move is only as large as the tighter of its two neighbours allows. */
export const ThreePanes: StoryObj = {
  render: () => (
    <div style={{ height: 240, border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
      <Splitter defaultSizes={[25, 50, 25]} style={{ height: '100%' }}>
        <SplitterPane min={120} max={300}>
          <Filler title="Navigation" lines={1} />
        </SplitterPane>
        <SplitterPane min={200}>
          <Filler title="Document" lines={4} />
        </SplitterPane>
        <SplitterPane min={120}>
          <Filler title="Details" lines={1} />
        </SplitterPane>
      </Splitter>
    </div>
  ),
};

/** Stacked, where the bar runs across instead of down. */
export const Stacked: StoryObj = {
  render: () => (
    <div style={{ height: 300, border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
      <Splitter orientation="vertical" defaultSizes={[60, 40]} style={{ height: '100%' }}>
        <SplitterPane min={80}>
          <Filler title="Editor" lines={3} />
        </SplitterPane>
        <SplitterPane min={60}>
          <Filler title="Output" lines={1} />
        </SplitterPane>
      </Splitter>
    </div>
  ),
};

/**
 * A window. Non-modal on purpose: there is no scrim and no focus trap, because the page behind
 * it has to stay usable — that is the difference between a window and a dialog.
 */
export const AWindow: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <Stack gap="lg">
        <p className="sb-label">
          The page behind stays usable, which is the whole difference from a dialog
        </p>
        <div>
          <FilledButton onClick={() => setOpen(true)} disabled={open}>
            Open the window
          </FilledButton>
        </div>
        <Window
          open={open}
          onOpenChange={setOpen}
          title="Notes"
          defaultPosition={{ x: 320, y: 140 }}
          defaultSize={{ width: 420, height: 240 }}
        >
          <p style={{ marginTop: 0 }}>
            Tab into the title bar and the arrow keys move this window. Focus the corner grip and
            they resize it. Both are on React Aria&rsquo;s <code>useMove</code>, so a pointer and a
            keyboard take the same path.
          </p>
          <p style={{ marginBottom: 0 }}>
            Neither has an ARIA role that fits, so each handle carries a label saying what the
            keys do rather than a role that would describe it wrongly.
          </p>
        </Window>
      </Stack>
    );
  },
};

/** The controls can be taken away one at a time, for a window the app manages itself. */
export const Plain: StoryObj = {
  render: () => (
    <Window
      open
      title="Fixed in place"
      minimizable={false}
      maximizable={false}
      closable={false}
      resizable={false}
      defaultPosition={{ x: 120, y: 120 }}
      defaultSize={{ width: 360, height: 160 }}
    >
      No controls, nothing to drag — just a labelled, non-modal panel.
    </Window>
  ),
};
