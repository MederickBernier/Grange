import { useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { useFocusRing, useHover, useTab, useTabList, useTabPanel } from 'react-aria';
import { Item, useTabListState, type TabListProps, type TabListState } from 'react-stately';
import { resolveSlotClass, useComponentConfig, type SlotOverrides, type TabsSlot } from '../../config/config';
import type { TabsVariant } from './specs';

export type { TabsVariant };
import styles from './Tabs.module.scss';

// useTabListState is generic over `T extends object`, so the derivations use `object` here
// rather than the `unknown` the menu and select use.
type Key = NonNullable<TabListProps<object>['disabledKeys']> extends Iterable<infer K> ? K : never;
type CollectionChildren = TabListProps<object>['children'];
type CollectionNode = TabListState<object>['collection'] extends Iterable<infer N> ? N : never;

export interface TabProps {
  /** The tab's label. */
  title: ReactNode;
  /** The panel shown while this tab is selected. */
  children: ReactNode;
  icon?: ReactNode;
  textValue?: string;
}

/**
 * One tab and its panel. Identified by its React `key`, as the menu and select items are.
 *
 * The label goes in `title` and the panel content in `children`, which is this collection's
 * convention: the tab strip is built from the titles without rendering any panel but the one
 * being shown.
 */
export const Tab = Item as (props: TabProps) => ReactElement;

export interface TabsProps {
  /** Tab children. */
  children: CollectionChildren;
  variant?: TabsVariant;
  /** Tabs always have one selected, so unlike a select this cannot be null. */
  selectedKey?: Key;
  defaultSelectedKey?: Key;
  onSelectionChange?: (key: Key) => void;
  disabledKeys?: Iterable<Key>;
  /** Lets the strip scroll rather than squeeze when the tabs do not fit. */
  scrollable?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TabsSlot>;
}

/**
 * Tabs, primary or secondary.
 *
 * Primary tabs stack an icon above the label and their indicator hugs the label; secondary tabs
 * keep the icon inline, span the indicator across the whole tab and sit above a divider. That is
 * the whole difference the spec draws, and the tokens agree: only primary publishes an
 * indicator, and the two disagree about the active colour.
 *
 * useTabList brings the keyboard: the arrows move between tabs, Home and End jump, and the strip
 * is one tab stop so Tab moves on to the panel rather than through every tab.
 */
export function Tabs(props: TabsProps) {
  const { defaults, slots } = useComponentConfig('Tabs');
  const {
    variant = defaults?.variant ?? 'primary',
    scrollable = defaults?.scrollable ?? false,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const state = useTabListState(rest);
  const ref = useRef<HTMLDivElement>(null);
  const { tabListProps } = useTabList(rest, state, ref);

  // Any tab carrying an icon makes the whole strip the taller size, so they line up.
  const hasIcons = [...state.collection].some((item) => (item.props as TabProps).icon != null);

  const slot = (name: TabsSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <div
      className={slot('root', 'grange-tabs', styles.root)}
      style={style}
      data-variant={variant}
      data-with-icon={hasIcons || undefined}
    >
      <div
        {...tabListProps}
        ref={ref}
        className={slot('list', 'grange-tabs-list', styles.list)}
        data-scrollable={scrollable || undefined}
      >
        {[...state.collection].map((item) => (
          <TabItem
            key={item.key}
            item={item}
            state={state}
            className={slot('tab', 'grange-tab', styles.tab)}
          />
        ))}
      </div>
      <TabPanel
        key={state.selectedItem?.key}
        state={state}
        className={slot('panel', 'grange-tab-panel', styles.panel)}
      />
    </div>
  );
}

function TabItem({
  item,
  state,
  className,
}: {
  item: CollectionNode;
  state: TabListState<object>;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { tabProps, isSelected, isDisabled } = useTab({ key: item.key }, state, ref);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing();
  const props = item.props as TabProps;

  return (
    <div
      {...tabProps}
      {...hoverProps}
      {...focusProps}
      ref={ref}
      className={className}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      <span className={styles.content}>
        {props.icon && <span className={styles.icon}>{props.icon}</span>}
        <span className={styles.label}>{props.title}</span>
      </span>
      {/* Inside the tab, so a primary indicator can hug the content and a secondary one span it. */}
      <span className={styles.indicator} aria-hidden="true" />
    </div>
  );
}

function TabPanel({ state, className }: { state: TabListState<object>; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { tabPanelProps } = useTabPanel({}, state, ref);

  return (
    <div {...tabPanelProps} ref={ref} className={className}>
      {state.selectedItem?.props.children}
    </div>
  );
}
