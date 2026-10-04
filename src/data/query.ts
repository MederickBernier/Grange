/**
 * Typed sort, filter, group and aggregate over arrays.
 *
 * A data layer rather than a component, and the thing `FilterBuilder` edits. It is pure, which
 * is the whole point: the awkward parts of querying in a browser — collation, null ordering,
 * dates that are objects — are arithmetic and string handling, and they are far easier to be
 * sure of as functions than as a table that looks about right.
 *
 * Three decisions worth stating:
 *
 * **Comparison is locale-aware.** Sorting names with `<` puts "Äpfel" after "Zebra" in German
 * and gets Swedish wrong in a different way. `Intl.Collator` is used for every string compare,
 * and the locale is a parameter rather than the machine's.
 *
 * **Null and undefined sort last, in both directions.** They are absent values, not small
 * ones, and a descending sort that leads with a column of blanks is a report nobody wanted.
 *
 * **Nothing is mutated.** Every function returns a new array, because a grid that sorts its
 * own source array is a grid that has quietly changed the caller's data.
 */
import type { FieldType, Operator } from './operators';

export interface FilterDescriptor {
  field: string;
  operator: Operator;
  value?: unknown;
  /** Defaults to true for text, which is what a person filtering a table expects. */
  ignoreCase?: boolean;
}

export interface CompositeFilter {
  logic: 'and' | 'or';
  filters: Array<FilterDescriptor | CompositeFilter>;
}

export type Filter = FilterDescriptor | CompositeFilter;

export interface SortDescriptor {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface AggregateDescriptor {
  field: string;
  kind: 'count' | 'sum' | 'min' | 'max' | 'average';
}

export interface Group<T> {
  field: string;
  value: unknown;
  items: T[];
  aggregates?: Record<string, number>;
}

export interface QueryOptions {
  filter?: Filter;
  sort?: SortDescriptor[];
  group?: string;
  aggregates?: AggregateDescriptor[];
  /** How many to skip, for paging. Applied after everything else, as it must be. */
  skip?: number;
  take?: number;
  locale?: string;
}

export const isComposite = (filter: Filter): filter is CompositeFilter =>
  (filter as CompositeFilter).filters !== undefined;

/** Reads `a.b.c` as well as `a`, because a row's field is often a path. */
export function getField(item: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value == null || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, item);
}

const text = (value: unknown, ignoreCase: boolean) => {
  const string = value == null ? '' : String(value);
  return ignoreCase ? string.toLocaleLowerCase() : string;
};

/** A date, a number or a string, reduced to something two of the same kind can be compared by. */
const comparable = (value: unknown): number | string | null => {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' || typeof value === 'boolean') return Number(value);
  // An object with its own compare, such as @internationalized/date's CalendarDate.
  if (typeof value === 'object' && 'toString' in value) return String(value);
  return String(value);
};

/** Whether one row passes one condition. */
export function matches(item: unknown, filter: FilterDescriptor, locale?: string): boolean {
  const actual = getField(item, filter.field);
  const ignoreCase = filter.ignoreCase ?? true;

  switch (filter.operator) {
    case 'isempty':
      return actual == null || actual === '';
    case 'isnotempty':
      return !(actual == null || actual === '');
    case 'contains':
      return text(actual, ignoreCase).includes(text(filter.value, ignoreCase));
    case 'doesnotcontain':
      return !text(actual, ignoreCase).includes(text(filter.value, ignoreCase));
    case 'startswith':
      return text(actual, ignoreCase).startsWith(text(filter.value, ignoreCase));
    case 'endswith':
      return text(actual, ignoreCase).endsWith(text(filter.value, ignoreCase));
    default:
      break;
  }

  const left = comparable(actual);
  const right = comparable(filter.value);

  if (filter.operator === 'eq' || filter.operator === 'neq') {
    const equal =
      typeof left === 'string' && typeof right === 'string' && ignoreCase
        ? left.toLocaleLowerCase(locale) === right.toLocaleLowerCase(locale)
        : left === right;
    return filter.operator === 'eq' ? equal : !equal;
  }

  // An absent value is not greater or less than anything: it is absent, so it matches no
  // ordered comparison rather than counting as zero or as the empty string.
  if (left == null || right == null) return false;

  const order = compareValues(left, right, locale);
  switch (filter.operator) {
    case 'gt':
      return order > 0;
    case 'gte':
      return order >= 0;
    case 'lt':
      return order < 0;
    case 'lte':
      return order <= 0;
    default:
      return true;
  }
}

const collators = new Map<string, Intl.Collator>();
const collator = (locale?: string) => {
  const key = locale ?? '';
  let found = collators.get(key);
  if (!found) {
    // numeric so "item 10" sorts after "item 9", sensitivity base so case and accents do not
    // split a column into two.
    found = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    collators.set(key, found);
  }
  return found;
};

function compareValues(a: number | string, b: number | string, locale?: string): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator(locale).compare(String(a), String(b));
}

/** Whether one row passes a condition or a whole tree of them. */
export function passes(item: unknown, filter: Filter | undefined, locale?: string): boolean {
  if (!filter) return true;
  if (!isComposite(filter)) return matches(item, filter, locale);
  // An empty group matches everything: a filter nobody has filled in should not hide the data.
  if (filter.filters.length === 0) return true;
  return filter.logic === 'or'
    ? filter.filters.some((child) => passes(item, child, locale))
    : filter.filters.every((child) => passes(item, child, locale));
}

export function filterItems<T>(items: readonly T[], filter: Filter | undefined, locale?: string): T[] {
  return filter ? items.filter((item) => passes(item, filter, locale)) : [...items];
}

/**
 * Sorts by several fields, the first one winning.
 *
 * Stable, because `Array.prototype.sort` is required to be since ES2019 — so sorting by city
 * and then by name leaves the names in order within each city, which is the only reason to
 * sort by two fields at all.
 */
export function sortItems<T>(items: readonly T[], sort: readonly SortDescriptor[] = [], locale?: string): T[] {
  if (sort.length === 0) return [...items];
  return [...items].sort((a, b) => {
    for (const { field, direction = 'asc' } of sort) {
      const left = comparable(getField(a, field));
      const right = comparable(getField(b, field));
      // Absent values sort last whichever way the column is pointing: they are missing, not
      // small, and a descending sort led by a column of blanks is useless.
      if (left == null && right == null) continue;
      if (left == null) return 1;
      if (right == null) return -1;
      const order = compareValues(left, right, locale);
      if (order !== 0) return direction === 'desc' ? -order : order;
    }
    return 0;
  });
}

/** One aggregate over a column. `count` counts rows; the rest ignore rows with no value. */
export function aggregate<T>(items: readonly T[], descriptor: AggregateDescriptor): number {
  if (descriptor.kind === 'count') return items.length;
  const numbers = items
    .map((item) => getField(item, descriptor.field))
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

  if (numbers.length === 0) return 0;
  switch (descriptor.kind) {
    case 'sum':
      return numbers.reduce((total, value) => total + value, 0);
    case 'min':
      return Math.min(...numbers);
    case 'max':
      return Math.max(...numbers);
    case 'average':
      return numbers.reduce((total, value) => total + value, 0) / numbers.length;
    default:
      return 0;
  }
}

/**
 * Groups by one field, keeping the order the rows arrived in.
 *
 * Insertion order rather than sorted groups: the caller has already said what order it wants by
 * sorting, and re-sorting the groups here would quietly override it.
 */
export function groupItems<T>(
  items: readonly T[],
  field: string,
  aggregates: readonly AggregateDescriptor[] = [],
): Array<Group<T>> {
  const groups = new Map<string, Group<T>>();
  for (const item of items) {
    const value = getField(item, field);
    const key = String(value);
    let group = groups.get(key);
    if (!group) {
      group = { field, value, items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }

  const out = [...groups.values()];
  if (aggregates.length > 0) {
    for (const group of out) {
      group.aggregates = Object.fromEntries(
        aggregates.map((descriptor) => [`${descriptor.field}:${descriptor.kind}`, aggregate(group.items, descriptor)]),
      );
    }
  }
  return out;
}

export interface QueryResult<T> {
  /** The rows for the page asked for. */
  items: T[];
  /** How many rows matched before paging, which is what a pager needs. */
  total: number;
  groups?: Array<Group<T>>;
  aggregates?: Record<string, number>;
}

/**
 * Filter, then sort, then aggregate and group, then page — in that order, which is the only
 * order that gives the right answers.
 *
 * `total` is the count after filtering and before paging: it is what a pager shows, and
 * counting after paging would make every page claim to be the whole result.
 */
export function query<T>(items: readonly T[], options: QueryOptions = {}): QueryResult<T> {
  const { filter, sort, group, aggregates = [], skip = 0, take, locale } = options;

  const filtered = filterItems(items, filter, locale);
  const sorted = sortItems(filtered, sort, locale);

  const result: QueryResult<T> = {
    items: take == null ? sorted.slice(skip) : sorted.slice(skip, skip + take),
    total: sorted.length,
  };

  if (aggregates.length > 0) {
    // Over everything that matched, not over the page: a total that changes as you page is
    // not a total.
    result.aggregates = Object.fromEntries(
      aggregates.map((descriptor) => [`${descriptor.field}:${descriptor.kind}`, aggregate(sorted, descriptor)]),
    );
  }
  if (group) result.groups = groupItems(result.items, group, aggregates);

  return result;
}

/** The operators that make sense for a field of this type, for a UI that offers them. */
export { OPERATORS, isUnary } from './operators';
export type { FieldType, Operator, OperatorSpec } from './operators';

// Re-exported so a consumer importing the query does not also have to know where the operator
// list lives; FieldType and Operator above are used by this file's own types.
