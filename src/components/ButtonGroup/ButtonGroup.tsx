import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
import { useControlledState } from '../../utils';
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
  const items = Children.toArray(children).filter(isValidElement);
  const count = items.length;
  const countRef = useRef(count);
  countRef.current = count;
  const [state, setState] = useState<ButtonGroupState>({ pressedIndex: null, growth: 0 });

  const setPressed = useCallback(
    (index: number | null, ownWidth = 0, ownPadding = 16) => {
      if (index === null) {
        setState((s) => ({ ...s, pressedIndex: null }));
        return;
      }
      const n = countRef.current;
      if (n < 2) return;
      const isMiddle = index > 0 && index < n - 1;
      // Growth per neighbour, capped by the neighbour's padding (its compression limit), as in Compose.
      const growth = Math.min(isMiddle ? (expandedRatio * ownWidth) / 2 : expandedRatio * ownWidth, ownPadding);
      setState({ pressedIndex: index, growth });
    },
    [expandedRatio],
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
  isSelected(id: string): boolean;
  toggle(id: string): void;
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
  const items = Children.toArray(children).filter(isValidElement);
  const [selected, setSelected] = useControlledState<Set<string>>(
    selectedKeys ? new Set(selectedKeys) : undefined,
    new Set(defaultSelectedKeys ?? []),
    onSelectionChange,
  );

  const ctx = useMemo<ConnectedContextValue>(
    () => ({
      count: items.length,
      size,
      variant,
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
    [items.length, size, variant, selected, selectionMode, disallowEmptySelection, setSelected],
  );

  return (
    <div
      role="group"
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
    const { id, icon, selectedIcon, children, onPress, className, classNames, style, disabled, ...rest } = props;
    const group = useContext(ConnectedContext);
    const index = useContext(ButtonGroupItemIndex);
    if (!group) throw new Error('ConnectedButtonGroupItem must be inside a ConnectedButtonGroup');
    const { size, variant, count } = group;
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
        aria-pressed={selected}
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
