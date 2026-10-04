import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useLocale, type PressEvent } from 'react-aria';
import { ButtonBase, type CornerRadii, type GrangeButtonElement } from '../ButtonBase/ButtonBase';
import {
  ButtonGroupContext,
  ButtonGroupItemIndex,
  type ButtonGroupContextValue,
  type ButtonGroupState,
} from '../ButtonBase/groupContext';
import { sizeCustomProperties, type ButtonSize, type ToggleButtonVariant } from '../Button/specs';
import { flattenChildren, useControlledState } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type ButtonSlot,
  type GroupSlot,
  type SlotOverrides,
} from '../../config/config';
import buttonStyles from '../Button/Button.module.scss';
import styles from './ButtonGroup.module.scss';

// ---------------------------------------------------------------------------
// Standard button group: pressed item widens, neighbours make room.
// ---------------------------------------------------------------------------

export interface ButtonGroupProps {
  children: ReactNode;
  /** Space between items, px. M3E small groups use 12. */
  gap?: number;
  /** How much the pressed item widens, as a fraction of its width. M3E default 0.15. */
  expandedRatio?: number;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  classNames?: SlotOverrides<GroupSlot>;
}

/**
 * Wraps Buttons, ToggleButtons or IconButtons. When one is pressed it grows by `expandedRatio`
 * and its direct neighbours shrink by the same amount, on the group width spring.
 */
export function ButtonGroup(props: ButtonGroupProps) {
  const { defaults, slots } = useComponentConfig('ButtonGroup');
  const {
    children,
    gap = defaults?.gap ?? 12,
    expandedRatio = defaults?.expandedRatio ?? 0.15,
    className,
    classNames,
    style,
    ...aria
  } = props;
  const items = flattenChildren(children);
  const count = items.length;
  const [state, setState] = useState<ButtonGroupState>({ pressedIndex: null, growth: 0 });

  const setPressed = useCallback(
    (index: number | null, ownWidth = 0, ownPadding = 16) => {
      if (index === null) {
        setState((s) => ({ ...s, pressedIndex: null }));
        return;
      }
      if (count < 2) return;
      const isMiddle = index > 0 && index < count - 1;
      // Growth per neighbour, capped by the neighbour's padding (its compression limit), as in Compose.
      const growth = Math.min(
        isMiddle ? (expandedRatio * ownWidth) / 2 : expandedRatio * ownWidth,
        ownPadding,
      );
      setState({ pressedIndex: index, growth });
    },
    [count, expandedRatio],
  );

  const ctx = useMemo<ButtonGroupContextValue>(
    () => ({ state, count, expandedRatio, setPressed }),
    [state, count, expandedRatio, setPressed],
  );

  return (
    <div
      role="group"
      {...aria}
      className={resolveSlotClass(
        'grange-button-group',
        styles.group,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={{ ...style, gap }}
    >
      <ButtonGroupContext.Provider value={ctx}>
        {items.map((child, i) => (
          <ButtonGroupItemIndex.Provider key={child.key ?? i} value={i}>
            {child}
          </ButtonGroupItemIndex.Provider>
        ))}
      </ButtonGroupContext.Provider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connected button group: joined toggle buttons (single or multi select).
// ---------------------------------------------------------------------------

interface ConnectedContextValue {
  count: number;
  size: ButtonSize;
  variant: ToggleButtonVariant;
  selectionMode: 'single' | 'multiple';
  isSelected(id: string): boolean;
  toggle(id: string): void;
  /** Whether this item is the group's single tab stop. Single select only. */
  isTabStop(id: string, index: number): boolean;
}

const ConnectedContext = createContext<ConnectedContextValue | null>(null);

export interface ConnectedButtonGroupProps {
  children: ReactNode;
  selectionMode?: 'single' | 'multiple';
  selectedKeys?: Iterable<string>;
  defaultSelectedKeys?: Iterable<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  /** Single mode only: keep one item selected at all times. Default true. */
  disallowEmptySelection?: boolean;
  size?: ButtonSize;
  variant?: ToggleButtonVariant;
  /** Stretch items to fill the row equally. */
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  classNames?: SlotOverrides<GroupSlot>;
}

/**
 * M3E connected button group. Items sit 2px apart; outer corners are full, inner corners 8px
 * (4px pressed); a selected item becomes fully round. Replaces segmented buttons.
 *
 * The two selection modes are genuinely different controls, and they say so:
 *
 * - **single** is a `radiogroup` of `radio`s. One tab stop for the whole group, the arrows move
 *   between items *and* select as they go, and Home and End jump to the ends. That is the radio
 *   pattern, and it is what a segmented control is: picking one of a set, not pressing buttons.
 * - **multiple** stays a `group` of `aria-pressed` toggle buttons, each its own tab stop, because
 *   that is what it is.
 *
 * It was a group of `aria-pressed` buttons in both modes, which told a screen reader that a
 * single-select segmented control was a row of independent toggles, and left a keyboard user
 * tabbing through every segment.
 */
export function ConnectedButtonGroup(props: ConnectedButtonGroupProps) {
  const { defaults, slots } = useComponentConfig('ConnectedButtonGroup');
  const {
    children,
    selectionMode = defaults?.selectionMode ?? 'single',
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    disallowEmptySelection = defaults?.disallowEmptySelection ?? true,
    size = defaults?.size ?? 's',
    variant = defaults?.variant ?? 'filled',
    fullWidth = defaults?.fullWidth,
    className,
    classNames,
    style,
    ...aria
  } = props;
  const { direction } = useLocale();
  const items = flattenChildren(children);
  const [selected, setSelected] = useControlledState<Set<string>>(
    selectedKeys ? new Set(selectedKeys) : undefined,
    new Set(defaultSelectedKeys ?? []),
    onSelectionChange,
  );

  /*
   * A radiogroup has one tab stop: the selected item, or the first one when nothing is selected.
   * The ids are read off the children, which is the only place they exist — an item declares its
   * own id rather than being keyed by position.
   */
  const ids = items.map((child) => (child.props as { id?: string }).id);
  const firstSelectable = ids.findIndex(
    (id, index) => id !== undefined && !(items[index]!.props as { disabled?: boolean }).disabled,
  );

  const ctx = useMemo<ConnectedContextValue>(
    () => ({
      count: items.length,
      size,
      variant,
      selectionMode,
      isTabStop: (id, index) => {
        if (selectionMode !== 'single') return true;
        if (selected.size > 0) return selected.has(id);
        return index === firstSelectable;
      },
      isSelected: (id) => selected.has(id),
      toggle: (id) => {
        if (selectionMode === 'single') {
          if (selected.has(id)) {
            if (!disallowEmptySelection) setSelected(new Set());
          } else setSelected(new Set([id]));
        } else {
          const next = new Set(selected);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          setSelected(next);
        }
      },
    }),
    [
      items.length,
      size,
      variant,
      selected,
      selectionMode,
      disallowEmptySelection,
      setSelected,
      firstSelectable,
    ],
  );

  /**
   * The radio pattern's keyboard: the arrows move and select in one go, so a group is walked
   * through rather than tabbed into and then operated. Handled on the container because
   * ButtonBase routes its props through useButton, which would drop an onKeyDown given to an
   * item.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (selectionMode !== 'single') return;
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const radios = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])')];
    if (radios.length === 0) return;
    event.preventDefault();

    const current = radios.indexOf(document.activeElement as HTMLElement);
    const last = radios.length - 1;
    // Forwards is to the end of the row, which in an RTL locale is to the left.
    const forwards = direction === 'rtl' ? ['ArrowLeft', 'ArrowDown'] : ['ArrowRight', 'ArrowDown'];
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : forwards.includes(event.key)
            ? current >= last
              ? 0
              : current + 1
            : current <= 0
              ? last
              : current - 1;

    const target = radios[next];
    target?.focus();
    // Moving within a radiogroup selects, which is the part that makes it one tab stop.
    target?.click();
  };

  return (
    <div
      role={selectionMode === 'single' ? 'radiogroup' : 'group'}
      onKeyDown={onKeyDown}
      {...aria}
      className={resolveSlotClass(
        'grange-connected-group',
        [styles.group, styles.connected, fullWidth ? styles.fullWidth : undefined].filter(Boolean).join(' '),
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={style}
    >
      <ConnectedContext.Provider value={ctx}>
        {items.map((child, i) => (
          <ButtonGroupItemIndex.Provider key={child.key ?? i} value={i}>
            {child}
          </ButtonGroupItemIndex.Provider>
        ))}
      </ConnectedContext.Provider>
    </div>
  );
}

export interface ConnectedButtonGroupItemProps {
  /** Selection key. */
  id: string;
  icon?: ReactNode;
  selectedIcon?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  onPress?: (e: PressEvent) => void;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ButtonSlot>;
}

export const ConnectedButtonGroupItem = forwardRef<GrangeButtonElement, ConnectedButtonGroupItemProps>(
  function ConnectedButtonGroupItem(props, ref) {
    const { slots, behavior, sizes } = useComponentConfig('ConnectedButtonGroupItem');
    const { id, icon, selectedIcon, children, onPress, className, classNames, style, disabled, ...rest } =
      props;
    const group = useContext(ConnectedContext);
    const index = useContext(ButtonGroupItemIndex);
    if (!group) throw new Error('ConnectedButtonGroupItem must be inside a ConnectedButtonGroup');
    const { size, variant, count, selectionMode } = group;
    const { direction } = useLocale();
    const spec = sizes.button[size];
    const selected = group.isSelected(id);
    const full = spec.height / 2;
    const isFirst = index === 0;
    const isLast = index === count - 1;

    const slot = (name: ButtonSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    const corners = ({ isPressed }: { isPressed: boolean }): CornerRadii => {
      const inner = selected
        ? full
        : isPressed
          ? behavior.connectedInnerCornerPressed
          : behavior.connectedInnerCorner;
      const start = isFirst ? full : inner;
      const end = isLast ? full : inner;
      // Motion animates the physical corner radii, so start and end are mapped by hand: in an
      // RTL locale the first item sits on the right and its full corners belong there.
      return direction === 'rtl'
        ? { topRight: start, bottomRight: start, topLeft: end, bottomLeft: end }
        : { topLeft: start, bottomLeft: start, topRight: end, bottomRight: end };
    };

    return (
      <ButtonBase
        ref={ref}
        {...rest}
        // A single-select group is a radiogroup, so an item is a radio and says it is checked;
        // multiple select is a row of toggles, where aria-pressed is the right thing to say.
        role={selectionMode === 'single' ? 'radio' : undefined}
        aria-pressed={selectionMode === 'single' ? undefined : selected}
        domProps={
          selectionMode === 'single'
            ? {
                'aria-checked': selected,
                // One tab stop for the group: the arrows move between the rest.
                tabIndex: group.isTabStop(id, index) ? 0 : -1,
              }
            : undefined
        }
        isDisabled={disabled}
        onPress={(e) => {
          group.toggle(id);
          onPress?.(e);
        }}
        className={slot('root', 'grange-connected-item', `${buttonStyles.button} ${styles.connectedItem}`)}
        style={{ ...sizeCustomProperties(spec), ...style }}
        padding={spec.padding}
        touchTarget={spec.height < behavior.touchTargetBelow}
        cornerSpring={behavior.springs.selection}
        corners={corners}
        dataAttributes={{
          'data-variant': variant,
          'data-size': size,
          'data-selected': String(selected),
        }}
      >
        {(selected && selectedIcon ? selectedIcon : icon) && (
          <span className={slot('icon', 'grange-button-icon', buttonStyles.icon)}>
            {selected && selectedIcon ? selectedIcon : icon}
          </span>
        )}
        {children != null && (
          <span className={slot('label', 'grange-button-label', buttonStyles.label)}>{children}</span>
        )}
      </ButtonBase>
    );
  },
);
