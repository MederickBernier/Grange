import { useMemo, useRef, type CSSProperties } from 'react';
import { useColorSwatch, useFocusRing, useListBox, useLocale, useOption } from 'react-aria';
import {
  Item,
  parseColor as parseColorImpl,
  useListState,
  type Color as AriaColor,
  type ListState,
} from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type ColorSlot,
  type SlotOverrides,
} from '../../config/config';
import { SwatchGridDelegate } from './gridDelegate';
import { color as spec } from './specs';
import styles from './Color.module.scss';

type Node = ListState<unknown>['collection'] extends Iterable<infer N> ? N : never;

export interface ColorSwatchPickerProps {
  /** The colours to offer, as anything `parseColor` accepts. */
  colors: readonly (string | AriaColor)[];
  value?: string | AriaColor | null;
  defaultValue?: string | AriaColor | null;
  onChange?: (value: AriaColor) => void;
  /** How many swatches to a row. The arrow keys move by this. */
  columns?: number;
  /** A swatch's size in px. */
  size?: number;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ColorSlot>;
}

/**
 * A grid of colours to choose from — the catalog's ColorPalette.
 *
 * **Each swatch is named, not described as a hex.** `useColorSwatch` generates a localised
 * name for a colour — "dark grayish cyan blue" rather than "#334E66" — and that is what the
 * option announces. A palette that reads out hex codes is a palette nobody can use by ear.
 *
 * The arrow keys move across the grid rather than along a list, which needs a keyboard
 * delegate of its own: a listbox's own delegate treats "above" as "the previous item", so up
 * and down would step one swatch instead of one row and the keys would not match the picture.
 * `SwatchGridDelegate` is that, and it is a plain class so it can be tested as arithmetic.
 */
export function ColorSwatchPicker(props: ColorSwatchPickerProps) {
  const { defaults, slots } = useComponentConfig('ColorSwatchPicker');
  const {
    colors,
    value,
    defaultValue,
    onChange,
    columns = defaults?.columns ?? 8,
    size = defaults?.size ?? spec.swatchSize,
    disabled,
    className,
    classNames,
    style,
    'aria-label': ariaLabel = 'Colour',
  } = props;

  /*
   * The key is the colour's own string, so a value given as `#f00` and a swatch given as
   * `rgb(255, 0, 0)` do not count as different options. Everything is normalised through the
   * same formatter.
   */
  const keyed = useMemo(() => colors.map((entry) => ({ id: normalise(entry), color: entry })), [colors]);
  const selected = value ?? defaultValue;
  const selectedKey = selected == null ? undefined : normalise(selected);

  const state = useListState({
    items: keyed,
    children: (item: { id: string }) => <Item key={item.id}>{item.id}</Item>,
    selectionMode: 'single',
    disallowEmptySelection: true,
    selectedKeys: value === undefined ? undefined : selectedKey ? [selectedKey] : [],
    defaultSelectedKeys: selectedKey ? [selectedKey] : [],
    disabledKeys: disabled ? keyed.map((item) => item.id) : undefined,
    onSelectionChange: (keys) => {
      const [key] = keys === 'all' ? [] : [...keys];
      if (key != null) onChange?.(parse(String(key)));
    },
  });

  const ref = useRef<HTMLUListElement>(null);
  const { direction } = useLocale();
  const keyboardDelegate = useMemo(
    () => new SwatchGridDelegate([...state.collection.getKeys()], columns, direction),
    [state.collection, columns, direction],
  );

  const { listBoxProps } = useListBox(
    { 'aria-label': ariaLabel, keyboardDelegate, shouldFocusWrap: false },
    state,
    ref,
  );

  const slot = (name: ColorSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <ul
      {...listBoxProps}
      ref={ref}
      className={slot('root', 'grange-color-swatches', styles.swatches)}
      style={{ gridTemplateColumns: `repeat(${columns}, ${size}px)`, ...style }}
      data-disabled={disabled || undefined}
    >
      {[...state.collection].map((node) => (
        <Swatch key={node.key} node={node} state={state} size={size} />
      ))}
    </ul>
  );
}

function Swatch({ node, state, size }: { node: Node; state: ListState<unknown>; size: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const colorValue = parse(String(node.key));
  // The hook's job here is the name: it turns a colour into words, in the locale.
  const { colorSwatchProps, color } = useColorSwatch({ color: colorValue });
  const { optionProps, isSelected, isDisabled } = useOption(
    { key: node.key, 'aria-label': (colorSwatchProps as { 'aria-label'?: string })['aria-label'] },
    state,
    ref,
  );
  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    <li
      {...optionProps}
      {...focusProps}
      ref={ref}
      className={styles.swatch}
      style={{ width: size, height: size }}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      {/* The colour itself is decoration: the option is already named after it. */}
      <span className={styles.swatchColor} style={{ background: color.toString('css') }} aria-hidden="true" />
    </li>
  );
}

const parse = (value: string | AriaColor): AriaColor =>
  typeof value === 'string' ? parseColorSafe(value) : value;

const normalise = (value: string | AriaColor): string => parse(value).toString('rgba');

/**
 * `parseColor` throws on anything it does not understand, which would take a whole palette
 * down for one typo. A colour that cannot be read becomes transparent black, which is visible
 * as a mistake rather than as a blank screen.
 */
function parseColorSafe(value: string): AriaColor {
  try {
    return parseColorImpl(value);
  } catch {
    return parseColorImpl('rgba(0, 0, 0, 0)');
  }
}
