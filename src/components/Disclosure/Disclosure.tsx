import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import { mergeProps, useButton, useDisclosure, useFocusRing, useHover } from 'react-aria';
import {
  useDisclosureGroupState,
  useDisclosureState,
  type DisclosureGroupProps,
  type DisclosureGroupState,
} from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type DisclosureSlot,
  type SlotOverrides,
} from '../../config/config';
import type { AccordionVariant } from './specs';
import styles from './Disclosure.module.scss';

/**
 * The group an item belongs to, when it is in one. An expansion panel on its own has no context
 * and keeps its own state; the same component inside an `Accordion` defers to the group, which
 * is what makes "only one open at a time" possible without the panels knowing about each other.
 */
interface GroupContext {
  state: DisclosureGroupState;
  variant: AccordionVariant;
}
const AccordionContext = createContext<GroupContext | null>(null);

/*
 * React 19's own Key includes bigint, which React Aria's does not, so the library's key type is
 * read off the hook's own props rather than imported from React. Every keyed component here
 * does the same.
 */
type Key = NonNullable<DisclosureGroupProps['expandedKeys']> extends Iterable<infer K> ? K : never;

export interface ExpansionPanelProps {
  /** The header's label. */
  title: ReactNode;
  /** A second line under the title, for the part that is worth seeing while collapsed. */
  supportingText?: ReactNode;
  /** What the panel holds. */
  children?: ReactNode;
  leadingIcon?: ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
  variant?: AccordionVariant;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<DisclosureSlot>;
}

export interface AccordionItemProps extends Omit<ExpansionPanelProps, 'expanded' | 'defaultExpanded' | 'onExpandedChange' | 'variant'> {
  /**
   * Identifies the item to its group. A real prop rather than a React `key`, because nothing
   * here builds a collection: these children are rendered as they are written, so a `key` would
   * be invisible to the accordion and the id has to be readable by it.
   */
  id: Key;
}

export interface AccordionProps {
  /** AccordionItem children. */
  children?: ReactNode;
  /** Off by default: an accordion that opens one section at a time is the common case. */
  allowsMultipleExpanded?: boolean;
  expandedKeys?: Iterable<Key>;
  defaultExpandedKeys?: Iterable<Key>;
  onExpandedChange?: (keys: Set<Key>) => void;
  disabled?: boolean;
  variant?: AccordionVariant;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<DisclosureSlot>;
}

/**
 * One expanding section, on React Aria's `useDisclosure`.
 *
 * Two things the hook brings that a `useState` and a conditional render do not.
 *
 * **The panel stays in the DOM, hidden with `hidden="until-found"`.** Find-in-page can then
 * reach the text inside a collapsed section, and the browser opens it — the hook listens for
 * `beforematch` and expands. A section whose contents are removed when collapsed cannot be
 * searched, which on a long page is the difference between finding something and not.
 *
 * **It drives the open and close animation.** The hook measures the panel and writes
 * `--disclosure-panel-height` onto it, so the height can be transitioned from a real number to
 * another real number, then restores `auto` once the animation is over so the content can still
 * resize. Animating to `height: auto` is otherwise not a thing CSS can do.
 */
export function ExpansionPanel(props: ExpansionPanelProps) {
  const { expanded, defaultExpanded, onExpandedChange, ...rest } = props;
  const state = useDisclosureState({
    isExpanded: expanded,
    defaultExpanded,
    onExpandedChange,
  });
  return <Section {...rest} state={state} />;
}

/**
 * A set of expanding sections, on `useDisclosureGroupState`.
 *
 * The group owns which keys are open, so single-open falls out of the state rather than out of
 * each panel watching the others. Arrow keys deliberately do not move between the headers: the
 * ARIA pattern makes them optional, and a header is an ordinary button that Tab already reaches,
 * so adding them would take a Tab stop away from a keyboard user to buy nothing.
 */
export function Accordion(props: AccordionProps) {
  const { defaults, slots } = useComponentConfig('Accordion');
  const {
    children,
    allowsMultipleExpanded = defaults?.allowsMultipleExpanded ?? false,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedChange,
    disabled,
    variant = defaults?.variant ?? 'plain',
    className,
    classNames,
    style,
  } = props;

  const state = useDisclosureGroupState({
    allowsMultipleExpanded,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedChange,
    isDisabled: disabled,
  });

  return (
    <AccordionContext.Provider value={{ state, variant }}>
      <div
        className={resolveSlotClass(
          'grange-accordion',
          styles.accordion,
          ...(slots?.root ?? []),
          classNames?.root,
          className,
        )}
        style={style}
        data-variant={variant}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

/** One section of an `Accordion`. Outside one it throws, because its id would mean nothing. */
export function AccordionItem({ id, ...rest }: AccordionItemProps) {
  const group = useContext(AccordionContext);
  if (!group) {
    throw new Error('AccordionItem must be inside an Accordion. On its own, use ExpansionPanel.');
  }

  /*
   * Controlled by the group. useDisclosureState still does the work of turning a toggle into an
   * expanded flag; what changes is where the flag lives, which is why the handler ignores the
   * value it is given and asks the group to toggle instead.
   */
  const state = useDisclosureState({
    isExpanded: group.state.expandedKeys.has(id),
    onExpandedChange: () => group.state.toggleKey(id),
  });

  return <Section {...rest} state={state} variant={group.variant} disabled={rest.disabled || group.state.isDisabled} />;
}

type SectionProps = Omit<ExpansionPanelProps, 'expanded' | 'defaultExpanded' | 'onExpandedChange'> & {
  state: ReturnType<typeof useDisclosureState>;
};

function Section(props: SectionProps) {
  const { defaults, slots } = useComponentConfig('ExpansionPanel');
  const {
    title,
    supportingText,
    children,
    leadingIcon,
    disabled,
    variant = defaults?.variant ?? 'plain',
    className,
    classNames,
    style,
    state,
  } = props;

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: triggerOptions, panelProps } = useDisclosure({ isDisabled: disabled }, state, panelRef);
  // Button options, not DOM props — the same trap as the select's trigger and the combo box's
  // chevron. Spreading these straight onto a <button> would look right and do nothing.
  const { buttonProps } = useButton(triggerOptions, triggerRef);
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const slot = (name: DisclosureSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <div
      className={slot('root', 'grange-expansion-panel', styles.panel)}
      style={style}
      data-variant={variant}
      data-expanded={state.isExpanded || undefined}
      data-disabled={disabled || undefined}
    >
      <button
        {...mergeProps(buttonProps, hoverProps, focusProps)}
        ref={triggerRef}
        className={slot('header', 'grange-expansion-panel-header', styles.header)}
        data-hovered={isHovered || undefined}
        data-focus-visible={isFocusVisible || undefined}
      >
        {leadingIcon && <span className={styles.leading}>{leadingIcon}</span>}
        <span className={styles.text}>
          <span className={slot('title', 'grange-expansion-panel-title', styles.title)}>{title}</span>
          {supportingText != null && <span className={styles.supporting}>{supportingText}</span>}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          <svg viewBox="0 -960 960 960" focusable="false">
            <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
          </svg>
        </span>
      </button>

      {/*
        Always rendered. The hook hides it with hidden="until-found" rather than unmounting it,
        which is what lets find-in-page reach the text and open the section.
      */}
      <div {...panelProps} ref={panelRef} className={slot('panel', 'grange-expansion-panel-content', styles.content)}>
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
}
