/**
 * The operator set, which is the one thing `FilterBuilder` and the data query have to agree
 * about exactly. It lives here so there is one list rather than two that drift: the builder
 * offers what the query can run, and nothing else.
 */

export type FieldType = 'text' | 'number' | 'date' | 'boolean';

export type Operator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'doesnotcontain'
  | 'startswith'
  | 'endswith'
  | 'isempty'
  | 'isnotempty'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export interface OperatorSpec {
  key: Operator;
  label: string;
  /** Operators that are about the field itself rather than about a value to compare it with. */
  unary?: boolean;
}

const COMMON: OperatorSpec[] = [
  { key: 'eq', label: 'Is equal to' },
  { key: 'neq', label: 'Is not equal to' },
];

const ORDERED: OperatorSpec[] = [
  { key: 'gt', label: 'Is after' },
  { key: 'gte', label: 'Is after or equal to' },
  { key: 'lt', label: 'Is before' },
  { key: 'lte', label: 'Is before or equal to' },
];

/**
 * The operators a field of each type can be compared with.
 *
 * Numbers and dates share the ordered set with different words, because "is after" is what a
 * date means by `gt` and "is greater than" is what a number means, and a filter row that reads
 * "Date is greater than" is a filter row nobody wrote on purpose.
 */
export const OPERATORS: Record<FieldType, OperatorSpec[]> = {
  text: [
    ...COMMON,
    { key: 'contains', label: 'Contains' },
    { key: 'doesnotcontain', label: 'Does not contain' },
    { key: 'startswith', label: 'Starts with' },
    { key: 'endswith', label: 'Ends with' },
    { key: 'isempty', label: 'Is empty', unary: true },
    { key: 'isnotempty', label: 'Is not empty', unary: true },
  ],
  number: [
    ...COMMON,
    { key: 'gt', label: 'Is greater than' },
    { key: 'gte', label: 'Is greater than or equal to' },
    { key: 'lt', label: 'Is less than' },
    { key: 'lte', label: 'Is less than or equal to' },
  ],
  date: [...COMMON, ...ORDERED],
  boolean: COMMON,
};

/** Whether an operator takes a value at all. `isempty` does not, and asking for one is noise. */
export function isUnary(operator: Operator): boolean {
  return operator === 'isempty' || operator === 'isnotempty';
}
