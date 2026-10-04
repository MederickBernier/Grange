import { type CSSProperties } from 'react';
import { IconButton, type IconButtonProps } from '../Button/Button';
import { TextButton } from '../Button/variants';
import { Select, SelectItem } from '../Select/Select';
import { TextField } from '../TextField/TextField';
import { NumberField } from '../NumberField/NumberField';
import { Switch } from '../Switch/Switch';
import { useControlledState } from '../../utils';
import {
  isComposite,
  isUnary,
  OPERATORS,
  type CompositeFilter,
  type FieldType,
  type FilterDescriptor,
  type Operator,
} from '../../data/query';
import {
  resolveSlotClass,
  useComponentConfig,
  type FilterBuilderSlot,
  type SlotOverrides,
} from '../../config/config';
import { appendAt, emptyGroup, newCondition, replaceAt, type Path } from './edit';
import styles from './FilterBuilder.module.scss';

export interface FilterField {
  /** The key the filter writes, which is also the path the query reads. */
  name: string;
  label: string;
  type?: FieldType;
}

export interface FilterBuilderProps {
  /** The fields a condition may be about. The first one is what a new condition starts as. */
  fields: readonly FilterField[];
  value?: CompositeFilter;
  defaultValue?: CompositeFilter;
  onChange?: (value: CompositeFilter) => void;
  /** How deep a group may be nested. Beyond this the "add group" button is not offered. */
  maxDepth?: number;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<FilterBuilderSlot>;
}

/**
 * Nested and/or groups over field, operator and value — the catalog's Filter.
 *
 * It edits exactly what `query` runs: the same `CompositeFilter` shape, the same operator list
 * from `src/data/operators.ts`. That sharing is the point of building the two together — a
 * builder that offers an operator the query cannot run is worse than no builder.
 *
 * **The structure is a real nested list.** Each group is a `group` with a label saying what it
 * is, and a condition is a row of labelled controls, so a screen reader can tell how deep it
 * is and which conditions belong to which logic. A filter builder drawn as a flat pile of
 * selects is unusable without sight, however well it reads on screen.
 *
 * The tree edits are in `edit.ts` and pure: every change is "replace the node at this path",
 * copying the groups on the way down, because a nested mutation gives back the same object and
 * React re-renders nothing.
 */
export function FilterBuilder(props: FilterBuilderProps) {
  const { defaults, slots } = useComponentConfig('FilterBuilder');
  const {
    fields,
    value,
    defaultValue,
    onChange,
    maxDepth = defaults?.maxDepth ?? 3,
    disabled,
    className,
    classNames,
    style,
    'aria-label': ariaLabel = 'Filter',
  } = props;

  const [filter, setFilter] = useControlledState<CompositeFilter>(
    value,
    defaultValue ?? emptyGroup(),
    onChange,
  );

  const slot = (name: FilterBuilderSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <div
      className={slot('root', 'grange-filter-builder', styles.builder)}
      style={style}
      aria-label={ariaLabel}
      role="group"
    >
      <Group
        node={filter}
        path={[]}
        depth={0}
        maxDepth={maxDepth}
        fields={fields}
        disabled={disabled}
        onEdit={(next) => setFilter(next)}
        root={filter}
        classes={{
          group: slot('group', 'grange-filter-group', styles.group),
          row: slot('row', 'grange-filter-row', styles.row),
        }}
      />
    </div>
  );
}

interface GroupProps {
  node: CompositeFilter;
  path: Path;
  depth: number;
  maxDepth: number;
  fields: readonly FilterField[];
  disabled?: boolean;
  root: CompositeFilter;
  onEdit: (next: CompositeFilter) => void;
  classes: { group: string; row: string };
}

function Group({ node, path, depth, maxDepth, fields, disabled, root, onEdit, classes }: GroupProps) {
  const first = fields[0];
  const label = depth === 0 ? 'Filter group' : `Nested filter group, level ${depth + 1}`;

  return (
    <div className={classes.group} role="group" aria-label={label} data-depth={depth}>
      <div className={styles.logic}>
        <Select
          aria-label="Match"
          selectedKey={node.logic}
          disabled={disabled}
          onSelectionChange={(key) => onEdit(replaceAt(root, path, { ...node, logic: key as 'and' | 'or' }))}
          className={styles.logicSelect}
        >
          <SelectItem key="and">All of</SelectItem>
          <SelectItem key="or">Any of</SelectItem>
        </Select>

        <TextButton
          size="xs"
          disabled={disabled}
          onClick={() =>
            onEdit(appendAt(root, path, newCondition(first?.name ?? '', defaultOperator(first))))
          }
        >
          Add condition
        </TextButton>

        {depth + 1 < maxDepth && (
          <TextButton
            size="xs"
            disabled={disabled}
            onClick={() => onEdit(appendAt(root, path, emptyGroup()))}
          >
            Add group
          </TextButton>
        )}

        {path.length > 0 && (
          <Remove
            label="Remove group"
            disabled={disabled}
            onPress={() => onEdit(replaceAt(root, path, undefined))}
          />
        )}
      </div>

      {node.filters.length === 0 ? (
        /*
         * Said rather than left blank. An empty group matches everything, which is a surprise
         * worth printing where someone can read it.
         */
        <p className={styles.empty}>No conditions yet — this group matches everything.</p>
      ) : (
        <ul className={styles.children}>
          {node.filters.map((child, index) => (
            <li key={index} className={styles.child}>
              {isComposite(child) ? (
                <Group
                  node={child}
                  path={[...path, index]}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  fields={fields}
                  disabled={disabled}
                  root={root}
                  onEdit={onEdit}
                  classes={classes}
                />
              ) : (
                <Condition
                  node={child}
                  path={[...path, index]}
                  fields={fields}
                  disabled={disabled}
                  root={root}
                  onEdit={onEdit}
                  className={classes.row}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Condition({
  node,
  path,
  fields,
  disabled,
  root,
  onEdit,
  className,
}: {
  node: FilterDescriptor;
  path: Path;
  fields: readonly FilterField[];
  disabled?: boolean;
  root: CompositeFilter;
  onEdit: (next: CompositeFilter) => void;
  className: string;
}) {
  const field = fields.find((candidate) => candidate.name === node.field) ?? fields[0];
  const type = field?.type ?? 'text';
  const operators = OPERATORS[type];
  const edit = (next: FilterDescriptor) => onEdit(replaceAt(root, path, next));

  return (
    <div className={className} role="group" aria-label={`Condition on ${field?.label ?? node.field}`}>
      <Select
        aria-label="Field"
        selectedKey={node.field}
        disabled={disabled}
        onSelectionChange={(key) => {
          const chosen = fields.find((candidate) => candidate.name === key);
          /*
           * Changing the field can strand the operator: "contains" means nothing on a number.
           * The operator is kept when the new field still offers it and reset when it does not,
           * rather than leaving a row that cannot run.
           */
          const allowed = OPERATORS[chosen?.type ?? 'text'];
          const operator = allowed.some((spec) => spec.key === node.operator)
            ? node.operator
            : defaultOperator(chosen);
          edit({ ...node, field: String(key), operator, value: '' });
        }}
        className={styles.field}
      >
        {fields.map((candidate) => (
          <SelectItem key={candidate.name}>{candidate.label}</SelectItem>
        ))}
      </Select>

      <Select
        aria-label="Operator"
        selectedKey={node.operator}
        disabled={disabled}
        onSelectionChange={(key) => edit({ ...node, operator: key as Operator })}
        className={styles.operator}
      >
        {operators.map((spec) => (
          <SelectItem key={spec.key}>{spec.label}</SelectItem>
        ))}
      </Select>

      {/* A unary operator takes no value, and offering an input for one is noise. */}
      {!isUnary(node.operator) && (
        <Value
          type={type}
          value={node.value}
          disabled={disabled}
          onChange={(next) => edit({ ...node, value: next })}
        />
      )}

      <Remove
        label={`Remove condition on ${field?.label ?? node.field}`}
        disabled={disabled}
        onPress={() => onEdit(replaceAt(root, path, undefined))}
      />
    </div>
  );
}

function Value({
  type,
  value,
  disabled,
  onChange,
}: {
  type: FieldType;
  value: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  if (type === 'number') {
    return (
      <NumberField
        aria-label="Value"
        value={typeof value === 'number' ? value : undefined}
        disabled={disabled}
        onChange={(next) => onChange(next)}
        className={styles.value}
      />
    );
  }

  if (type === 'boolean') {
    return (
      <Switch
        aria-label="Value"
        selected={value === true}
        disabled={disabled}
        onChange={(next) => onChange(next)}
        className={styles.value}
      />
    );
  }

  return (
    <TextField
      aria-label="Value"
      /*
       * Even a date is a plain text field here, which is deliberate: `DateField` holds a
       * CalendarDate, and a filter value that is one does not survive being stored as JSON —
       * which is what a saved filter usually is. An ISO string does.
       */
      type="text"
      placeholder={type === 'date' ? 'YYYY-MM-DD' : undefined}
      // Only a primitive can be typed into a text field; anything else shows as empty rather
      // than as "[object Object]".
      value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
      disabled={disabled}
      onChange={(next) => onChange(next)}
      className={styles.value}
    />
  );
}

function Remove({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  const props: IconButtonProps = {
    variant: 'standard',
    size: 'xs',
    'aria-label': label,
    disabled,
    onClick: onPress,
    children: (
      <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360Z" />
      </svg>
    ),
  };
  return <IconButton {...props} />;
}

const defaultOperator = (field: FilterField | undefined): Operator =>
  field?.type === 'text' || field?.type == null ? 'contains' : 'eq';
