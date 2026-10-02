import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Divider,
  Icon,
  IconButton,
  List,
  ListItem,
  LoadingIndicator,
  Search,
  defaultShapes,
  useSearchFilter,
} from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * Search, and M3 Expressive's loading indicator.
 *
 * The loading indicator morphs through shapes while you wait. The mechanism here is the real one,
 * interpolating corresponding points between two polygons, but over regular shapes only: the
 * full 35-shape library lives in `androidx.graphics.shapes` as rounded polygons with per-corner
 * rounding, and reproducing those means porting that library rather than a component.
 */
const meta: Meta = {
  title: 'Components/Search and Loading',
  parameters: { layout: 'padded' },
};
export default meta;

const people = [
  'Ada Lovelace',
  'Alan Turing',
  'Grace Hopper',
  'Katherine Johnson',
  'Edsger Dijkstra',
  'Barbara Liskov',
];

/** Type to filter. The matching is `useSearchFilter`, so it is locale aware rather than naive. */
export const SearchWithResults: StoryObj = {
  render: function Render() {
    const [query, setQuery] = useState('');
    const { contains } = useSearchFilter({ sensitivity: 'base' });
    const results = useMemo(
      () => (query === '' ? [] : people.filter((p) => contains(p, query))),
      [query, contains],
    );

    return (
      <div style={{ maxWidth: 420 }}>
        <Search
          aria-label="Search people"
          placeholder="Search people"
          value={query}
          onChange={setQuery}
          open={query !== ''}
          leading={<Icon><AddIcon /></Icon>}
          trailing={
            <IconButton aria-label="Filters">
              <Icon>
                <CheckIcon />
              </Icon>
            </IconButton>
          }
        >
          {results.length > 0 ? (
            <List aria-label="Results">
              {results.map((person) => (
                <ListItem key={person} leading={<Icon><HeartIcon /></Icon>} onClick={() => setQuery(person)}>
                  {person}
                </ListItem>
              ))}
            </List>
          ) : (
            <p className="sb-label" style={{ padding: 16 }}>
              Nothing matches {query}
            </p>
          )}
        </Search>
        <p className="sb-label" style={{ marginTop: 16 }}>
          Try a lowercase or accented query: the filter ignores case and accents
        </p>
      </div>
    );
  },
};

/** Escape clears the field and the clear button appears only once there is something to clear. */
export const SearchBehaviour: StoryObj = {
  render: function Render() {
    const [log, setLog] = useState<string[]>([]);
    return (
      <div className="sb-col" style={{ maxWidth: 420 }}>
        <Search
          aria-label="Search"
          placeholder="Type, then press Escape"
          onSubmit={(v) => setLog((l) => [...l, `submitted: ${v}`])}
          onClear={() => setLog((l) => [...l, 'cleared'])}
          leading={<Icon><AddIcon /></Icon>}
        />
        <p className="sb-label">{log.length ? log.join(' | ') : 'Enter to submit, Escape to clear'}</p>
      </div>
    );
  },
};

/** Full screen squares the corners off and takes a taller header. */
export const FullScreenSearch: StoryObj = {
  render: function Render() {
    const [query, setQuery] = useState('a');
    const { contains } = useSearchFilter({ sensitivity: 'base' });
    return (
      <div
        style={{
          height: 420,
          display: 'flex',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Search
          aria-label="Search people"
          placeholder="Search"
          value={query}
          onChange={setQuery}
          open
          fullScreen
          leading={
            <IconButton aria-label="Back">
              <Icon>
                <ArrowIcon />
              </Icon>
            </IconButton>
          }
        >
          <List aria-label="Results">
            {people
              .filter((p) => query === '' || contains(p, query))
              .map((person) => (
                <ListItem key={person} leading={<Icon><HeartIcon /></Icon>} onClick={() => {}}>
                  {person}
                </ListItem>
              ))}
          </List>
        </Search>
      </div>
    );
  },
};

/** The default cycle, the contained variant, and a few sizes. */
export const Loading: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 32 }}>
      <div className="sb-row" style={{ alignItems: 'center', gap: 24 }}>
        <span className="sb-label">Default</span>
        <LoadingIndicator aria-label="Loading" />
        <LoadingIndicator aria-label="Loading" contained />
      </div>
      <div className="sb-row" style={{ alignItems: 'center', gap: 24 }}>
        <span className="sb-label">Sizes</span>
        {[32, 48, 72, 96].map((size) => (
          <LoadingIndicator key={size} aria-label="Loading" size={size} />
        ))}
      </div>
      <Divider />
      <div className="sb-col">
        <p className="sb-label">
          Cycling {defaultShapes.join(', ')} sides. Reduced motion holds the first shape instead.
        </p>
        <div className="sb-row" style={{ alignItems: 'center', gap: 24 }}>
          {defaultShapes.map((sides) => (
            <div key={sides} className="sb-col" style={{ alignItems: 'center', gap: 4 }}>
              <LoadingIndicator aria-label={`${sides} sides`} shapes={[sides]} contained size={64} />
              <span className="sb-label">{sides}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/** Reserved for a wait under about five seconds; anything longer wants a progress indicator. */
export const WhileLoading: StoryObj = {
  render: function Render() {
    const [loading, setLoading] = useState(false);
    return (
      <div className="sb-col" style={{ minHeight: 160 }}>
        <button type="button" onClick={() => { setLoading(true); window.setTimeout(() => setLoading(false), 3000); }}>
          Load for three seconds
        </button>
        {loading ? (
          <div className="sb-row" style={{ alignItems: 'center', gap: 16 }}>
            <LoadingIndicator aria-label="Loading results" contained />
            <span className="sb-label">Fetching…</span>
          </div>
        ) : (
          <p className="sb-label">Idle</p>
        )}
      </div>
    );
  },
};
