import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FilterBuilder,
  List,
  ListItem,
  Pager,
  Stack,
  query,
  type CompositeFilter,
  type FilterField,
} from '../src';

/**
 * A filter builder and the query it drives.
 *
 * These were built together on purpose. The builder edits exactly the shape `query` runs —
 * the same `CompositeFilter`, the same operator list from one file — because a builder that
 * offers an operator the engine cannot run is worse than no builder at all.
 *
 * The query is a data layer rather than a component: typed filter, sort, group, aggregate and
 * page over plain arrays. Three things it insists on, each of which is easy to get wrong and
 * invisible once right — comparison is locale-aware (`Intl.Collator`, so "Älva" sorts with the
 * As rather than after Z), absent values sort **last in both directions** because they are
 * missing rather than small, and nothing is mutated.
 *
 * **An empty group matches everything.** A filter nobody has finished should not hide the
 * data, and the builder says so in words rather than leaving a blank.
 */
const meta: Meta = {
  title: 'Components/Filter and Query',
  parameters: { layout: 'padded' },
};
export default meta;

interface Person {
  name: string;
  city: string;
  score: number;
}

const people: Person[] = [
  { name: 'Ada', city: 'London', score: 90 },
  { name: 'Älva', city: 'Oslo', score: 70 },
  { name: 'Grace', city: 'London', score: 88 },
  { name: 'alan', city: 'Zurich', score: 85 },
  { name: 'Katherine', city: 'Hampton', score: 95 },
  { name: 'Edsger', city: 'Rotterdam', score: 64 },
  { name: 'Barbara', city: 'New York', score: 91 },
  { name: 'Donald', city: 'Stanford', score: 77 },
];

const fields: FilterField[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'score', label: 'Score', type: 'number' },
];

/** The builder on its own, with one condition and one nested group. */
export const Builder: StoryObj = {
  render: () => (
    <FilterBuilder
      fields={fields}
      defaultValue={{
        logic: 'and',
        filters: [
          { field: 'city', operator: 'contains', value: 'Lon' },
          {
            logic: 'or',
            filters: [
              { field: 'score', operator: 'gte', value: 85 },
              { field: 'name', operator: 'startswith', value: 'G' },
            ],
          },
        ],
      }}
    />
  ),
};

/** Empty, which matches everything — and says so. */
export const Empty: StoryObj = {
  render: () => <FilterBuilder fields={fields} />,
};

/** The two together: edit the filter and watch the rows, the count and the page change. */
export const Live: StoryObj = {
  render: function Render() {
    const [filter, setFilter] = useState<CompositeFilter>({
      logic: 'and',
      filters: [{ field: 'score', operator: 'gte', value: 80 }],
    });
    const [page, setPage] = useState(1);
    const size = 3;

    const result = useMemo(
      () =>
        query(people, {
          filter,
          sort: [{ field: 'name' }],
          skip: (page - 1) * size,
          take: size,
          aggregates: [{ field: 'score', kind: 'average' }],
          locale: 'en',
        }),
      [filter, page],
    );

    return (
      <Stack gap="lg" style={{ maxWidth: 720 }}>
        <FilterBuilder
          fields={fields}
          value={filter}
          onChange={(next) => {
            setFilter(next);
            setPage(1);
          }}
        />

        <List aria-label="People">
          {result.items.map((person) => (
            <ListItem key={person.name} supportingText={`${person.city} · ${person.score}`}>
              {person.name}
            </ListItem>
          ))}
        </List>

        <Pager total={result.total} page={page} onPageChange={setPage} pageSize={size} pageSizes={[]} />

        <span className="sb-label">
          Average score of everything that matched: {Math.round(result.aggregates?.['score:average'] ?? 0)}
        </span>
      </Stack>
    );
  },
};

/** Sorting, where the collation and the null ordering show. */
export const Sorted: StoryObj = {
  render: () => {
    const sorted = query([...people, { name: 'Zoë', city: 'Vienna', score: 0 }], {
      sort: [{ field: 'name' }],
      locale: 'en',
    });
    return (
      <List aria-label="Sorted by name">
        {sorted.items.map((person) => (
          <ListItem key={person.name} supportingText={person.city}>
            {person.name}
          </ListItem>
        ))}
      </List>
    );
  },
};
