import { useId, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { useButton, useFocusRing, useHover } from 'react-aria';
import { useOverlayTriggerState } from 'react-stately';
import { Popover } from '../../overlays/Popover';
import { TreeView, type TreeViewProps } from '../Tree/Tree';
import { treeLabels } from '../Tree/labels';
import {
  resolveSlotClass,
  useComponentConfig,
  type SelectSlot,
  type SlotOverrides,
} from '../../config/config';
import type { TextFieldVariant } from '../TextField/specs';
import textFieldStyles from '../TextField/TextField.module.scss';
import selectStyles from '../Select/Select.module.scss';
import menuStyles from '../Menu/Menu.module.scss';
import styles from './DropDownTree.module.scss';

type Key = string | number;

export interface DropDownTreeProps {
  /** TreeItem children, nested, exactly as `TreeView` takes them. */
  children: TreeViewProps['children'];
  /** Floats from inside the field to its edge once something is chosen, as a select's does. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  selectedKeys?: Iterable<Key>;
  defaultSelectedKeys?: Iterable<Key>;
  onSelectionChange?: (keys: Set<Key>) => void;
  /** Single by default. `MultiSelectTree` is this field with multiple turned on. */
  selectionMode?: 'single' | 'multiple';
  expandedKeys?: Iterable<Key>;
  defaultExpandedKeys?: Iterable<Key>;
  onExpandedChange?: (keys: Set<Key>) => void;
  disabledKeys?: Iterable<Key>;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SelectSlot>;
}

/**
 * A field that opens a tree — the catalog's DropDownTree.
 *
 * It is `Select` with a tree where the list goes, and it is assembled from the parts rather
 * than written again: the trigger wears the text field's chrome, the surface is the shared
 * `Popover`, and the contents are `TreeView`. So the tree's levels, its arrow keys and its
 * typeahead come along, and a drop-down tree cannot drift from a select by a pixel.
 *
 * **Naming what was chosen is the part that needed work.** A tree's labels live in a nested
 * React structure rather than in a flat list of options, so there is nothing to look a key up
 * in. They are walked once by `treeLabels`, which is a pure function for that reason.
 *
 * The popover holds a `dialog`, not a `listbox`, and the trigger says so with
 * `aria-haspopup="dialog"`. A tree is not a list of options, and claiming otherwise would
 * promise a screen reader a shape it is not going to find.
 */
export function DropDownTree(props: DropDownTreeProps) {
  const { defaults, slots } = useComponentConfig('DropDownTree');
  const {
    children,
    label,
    variant = defaults?.variant ?? 'filled',
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    selectionMode = defaults?.selectionMode ?? 'single',
    expandedKeys,
    defaultExpandedKeys,
    onExpandedChange,
    disabledKeys,
    placeholder = '',
    supportingText,
    error,
    errorText,
    leadingIcon,
    disabled,
    open,
    defaultOpen,
    onOpenChange,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const state = useOverlayTriggerState({ isOpen: open, defaultOpen, onOpenChange });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(
    { isDisabled: disabled, onPress: () => state.toggle() },
    triggerRef,
  );
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  // Walked once per set of children: a tree's labels are a nested structure, and the field has
  // to turn a chosen key back into something readable.
  const labels = useMemo(() => treeLabels(children as ReactNode), [children]);
  const chosen = useMemo(
    () => new Set<Key>(selectedKeys ?? defaultSelectedKeys ?? []),
    [selectedKeys, defaultSelectedKeys],
  );
  const value = [...chosen].map((key) => labels.get(key)).filter((name) => name != null);

  const id = useId();
  const labelId = `${id}-label`;
  const supportingId = `${id}-supporting`;
  const showingError = Boolean(error) && errorText != null;
  const describing = showingError || supportingText != null;
  const populated = value.length > 0 || Boolean(placeholder) || state.isOpen;

  const slot = (name: SelectSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <div
      className={slot('root', 'grange-dropdown-tree', `${textFieldStyles.root} ${selectStyles.root}`)}
      style={style}
      data-variant={variant}
      data-populated={populated || undefined}
      data-focused={state.isOpen || isFocusVisible || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-hovered={isHovered || undefined}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
    >
      <button
        {...buttonProps}
        {...hoverProps}
        {...focusProps}
        ref={triggerRef}
        className={slot('trigger', 'grange-dropdown-tree-trigger', `${textFieldStyles.container} ${selectStyles.trigger}`)}
        /*
         * A dialog, not a listbox: what opens is a tree, and promising a screen reader a list
         * of options it will not find is worse than saying nothing.
         */
        aria-haspopup="dialog"
        aria-expanded={state.isOpen}
        aria-label={ariaLabel}
        aria-labelledby={label != null ? labelId : undefined}
        aria-describedby={describing ? supportingId : undefined}
      >
        {variant === 'outlined' && (
          <fieldset className={textFieldStyles.outline} aria-hidden="true">
            <legend className={textFieldStyles.notch}>
              <span>{label}</span>
            </legend>
          </fieldset>
        )}

        {leadingIcon && <span className={textFieldStyles.icon}>{leadingIcon}</span>}

        <span className={textFieldStyles.field}>
          {label != null && (
            <span id={labelId} className={slot('label', 'grange-dropdown-tree-label', textFieldStyles.label)}>
              {label}
            </span>
          )}
          <span className={`${selectStyles.value} ${styles.value}`}>
            {value.length > 0 ? <Joined parts={value} /> : placeholder}
          </span>
        </span>

        <span className={`${textFieldStyles.icon} ${selectStyles.arrow}`} aria-hidden="true">
          <svg viewBox="0 -960 960 960" focusable="false">
            <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
          </svg>
        </span>
      </button>

      {describing && (
        <div className={textFieldStyles.supporting}>
          <span id={supportingId}>{showingError ? errorText : supportingText}</span>
        </div>
      )}

      {state.isOpen && (
        <Popover state={state} triggerRef={triggerRef} matchTriggerWidth className={menuStyles.popover}>
          <div className={styles.panel}>
            <TreeView
              aria-label={typeof label === 'string' ? label : (ariaLabel ?? 'Options')}
              selectionMode={selectionMode}
              selectedKeys={selectedKeys}
              defaultSelectedKeys={defaultSelectedKeys}
              onSelectionChange={(keys) => {
                const next = keys === 'all' ? new Set<Key>(labels.keys()) : new Set<Key>(keys as Iterable<Key>);
                onSelectionChange?.(next);
                // A single-choice field closes on the choice, as a select does. A multiple one
                // stays open, because the next choice is the point of it.
                if (selectionMode === 'single') state.close();
              }}
              expandedKeys={expandedKeys}
              defaultExpandedKeys={defaultExpandedKeys}
              onExpandedChange={onExpandedChange as TreeViewProps['onExpandedChange']}
              disabledKeys={disabledKeys}
            >
              {children}
            </TreeView>
          </div>
        </Popover>
      )}
    </div>
  );
}

/** The chosen labels, comma-separated, without flattening React nodes into strings. */
function Joined({ parts }: { parts: ReactNode[] }) {
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 ? ', ' : null}
          {part}
        </span>
      ))}
    </>
  );
}

/** The multiple-selection face of the same field — the catalog's MultiSelectTree. */
export function MultiSelectTree(props: Omit<DropDownTreeProps, 'selectionMode'>) {
  return <DropDownTree {...props} selectionMode="multiple" />;
}
