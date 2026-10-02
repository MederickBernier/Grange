import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { VisuallyHidden, mergeProps, useFocusRing, useHover, useRadio, useRadioGroup } from 'react-aria';
import { useRadioGroupState, type RadioGroupState } from 'react-stately';
import { resolveSlotClass, useComponentConfig, type RatingSlot, type SlotOverrides } from '../../config/config';
import styles from './Rating.module.scss';

export interface RatingProps {
  /** The visible label for the whole control. Without one, pass aria-label. */
  label?: ReactNode;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** How many stars. Defaults to five. */
  max?: number;
  /**
   * The smallest step. `1` is whole stars; `0.5` adds a half position to each one, which is two
   * options per star rather than a different kind of control.
   */
  precision?: 1 | 0.5;
  /** Shows the rating without letting it be changed, as a label rather than a control. */
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Lets the chosen star be pressed again to clear the rating. */
  allowClear?: boolean;
  /** The icons. Both default to a star; a heart or a thumb works the same way. */
  icon?: ReactNode;
  emptyIcon?: ReactNode;
  /** Names each option for assistive tech. Given the value, returns the label. */
  optionLabel?: (value: number, max: number) => string;
  /** Submitted with the form under this name. */
  name?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<RatingSlot>;
}

const defaultOptionLabel = (value: number, max: number) =>
  `${value} ${value === 1 ? 'star' : 'stars'} out of ${max}`;

/**
 * A star rating.
 *
 * There is no React Aria hook for a rating and no ARIA pattern either, so the question is which
 * existing pattern it actually is. It is a radio group: a set of options where exactly one can be
 * chosen, which is why this is built on `useRadioGroup` rather than on a row of buttons or a
 * slider. That buys the whole keyboard — one tab stop, arrows that move and select, Home and
 * End — plus real inputs that post in a form, and it means a screen reader says "3 stars out of
 * 5, radio button, 3 of 5" rather than reading five unlabelled graphics.
 *
 * Half stars are not a second mechanism: `precision={0.5}` simply doubles the number of options,
 * so each star holds two of them and the arrow keys step through halves.
 *
 * Read-only is a different thing from disabled, and renders differently: a disabled control is
 * still a control, while a read-only rating is a statement, so it becomes a single labelled
 * image rather than a group of options nobody can choose from.
 */
export function Rating(props: RatingProps) {
  const { defaults, slots } = useComponentConfig('Rating');
  const {
    label,
    value,
    defaultValue,
    onChange,
    max = defaults?.max ?? 5,
    precision = defaults?.precision ?? 1,
    readOnly = false,
    disabled,
    required,
    allowClear = defaults?.allowClear ?? false,
    icon,
    emptyIcon,
    optionLabel = defaultOptionLabel,
    name,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const [hovered, setHovered] = useState<number | null>(null);
  const filled = icon ?? <Star />;
  const empty = emptyIcon ?? <Star outline />;

  const slot = (slotName: RatingSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[slotName] ?? []),
      classNames?.[slotName],
      slotName === 'root' ? className : undefined,
    );

  // Every option the precision allows, as strings, because that is what a radio group speaks.
  const steps: number[] = [];
  for (let step = precision; step <= max + 1e-9; step += precision) steps.push(Number(step.toFixed(1)));

  const ariaProps = {
    ...aria,
    label,
    value: value === undefined ? undefined : String(value),
    defaultValue: defaultValue === undefined ? undefined : String(defaultValue),
    onChange: (next: string) => onChange?.(Number(next)),
    name,
    isDisabled: disabled,
    isRequired: required,
    isReadOnly: readOnly,
  };

  const state = useRadioGroupState(ariaProps);
  const { radioGroupProps, labelProps } = useRadioGroup(ariaProps, state);
  const current = state.selectedValue === null ? 0 : Number(state.selectedValue);
  // While a pointer is over the control it shows what pressing would give, not what is chosen.
  const shown = hovered ?? current;

  if (readOnly) {
    return (
      <div
        className={slot('root', 'grange-rating', styles.rating)}
        style={style}
        data-readonly="true"
        data-size={max}
      >
        {label != null && <span className={slot('label', 'grange-rating-label', styles.label)}>{label}</span>}
        <span
          className={styles.stars}
          role="img"
          aria-label={`${optionLabel(current, max)}${label != null ? '' : ''}`}
        >
          {Array.from({ length: max }, (_, i) => (
            <Portion key={i} index={i} shown={current} filled={filled} empty={empty} />
          ))}
        </span>
      </div>
    );
  }

  return (
    <div
      {...radioGroupProps}
      className={slot('root', 'grange-rating', styles.rating)}
      style={style}
      data-disabled={disabled || undefined}
      data-size={max}
    >
      {label != null && (
        <span {...labelProps} className={slot('label', 'grange-rating-label', styles.label)}>
          {label}
        </span>
      )}
      <span
        className={styles.stars}
        onPointerLeave={() => setHovered(null)}
        // The stars are drawn once and the options sit over them, so a half option can cover
        // half a star without that star being split into two elements.
        aria-hidden={undefined}
      >
        {Array.from({ length: max }, (_, i) => (
          <Portion key={i} index={i} shown={shown} filled={filled} empty={empty} />
        ))}

        <span className={styles.options}>
          {steps.map((step) => (
            <Option
              key={step}
              step={step}
              max={max}
              state={state}
              label={optionLabel(step, max)}
              className={slot('item', 'grange-rating-item', styles.option)}
              onHover={setHovered}
              allowClear={allowClear}
              onClear={() => {
                state.setSelectedValue('');
                onChange?.(0);
              }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}

/** One star, filled by however much of it the current value covers. */
function Portion({
  index,
  shown,
  filled,
  empty,
}: {
  index: number;
  shown: number;
  filled: ReactNode;
  empty: ReactNode;
}) {
  // 0 when this star is past the value, 1 when it is covered, and anything between for a part.
  const amount = Math.min(1, Math.max(0, shown - index));
  return (
    <span className={styles.star} aria-hidden="true">
      <span className={styles.empty}>{empty}</span>
      {/* Clipped rather than swapped, so a half star is the same glyph cut in two. */}
      <span className={styles.fill} style={{ width: `${amount * 100}%` }}>
        {filled}
      </span>
    </span>
  );
}

function Option({
  step,
  max,
  state,
  label,
  className,
  onHover,
  allowClear,
  onClear,
}: {
  step: number;
  max: number;
  state: RadioGroupState;
  label: string;
  className: string;
  onHover: (value: number | null) => void;
  allowClear: boolean;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const ariaProps = { value: String(step), 'aria-label': label };
  const { inputProps, isSelected } = useRadio(ariaProps, state, ref);
  const { hoverProps } = useHover({ isDisabled: state.isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    <label
      {...hoverProps}
      className={className}
      style={{ width: `${(step / max) * 100}%` }}
      data-selected={isSelected || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-step={step}
      onPointerEnter={() => onHover(step)}
    >
      <VisuallyHidden>
        {/*
          The clear handler goes on the input rather than on the label. Pressing a radio that is
          already checked fires a click and no change event, so clearing has to hang off the
          click — and usePress on the input does not reliably let that click reach the label,
          which makes a handler up there look wired and do nothing.
        */}
        <input
          {...mergeProps(inputProps, focusProps, {
            onClick: () => {
              if (allowClear && isSelected) onClear();
            },
          })}
          ref={ref}
        />
      </VisuallyHidden>
    </label>
  );
}

/** The default glyph: Material Symbols star, filled or outlined. */
function Star({ outline = false }: { outline?: boolean }) {
  return (
    <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
      {outline ? (
        <path d="m354-247 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-80l65-281L80-550l288-25 112-265 112 265 288 25-218 189 65 281-247-149L233-80Zm247-350Z" />
      ) : (
        <path d="m233-80 65-281L80-550l288-25 112-265 112 265 288 25-218 189 65 281-247-149L233-80Z" />
      )}
    </svg>
  );
}
