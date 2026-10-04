import { createContext, forwardRef, useContext, type CSSProperties, type ReactNode } from 'react';
import { VisuallyHidden, useFocusRing, useHover, useObjectRef, useRadio, useRadioGroup } from 'react-aria';
import { useRadioGroupState, type RadioGroupState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type RadioSlot,
  type SlotOverrides,
} from '../../config/config';
import styles from './Radio.module.scss';

const RadioContext = createContext<RadioGroupState | null>(null);

export interface RadioGroupProps {
  /** Radio children. */
  children: ReactNode;
  /** The visible label for the whole group. Without one, pass aria-label. */
  label?: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  /** Turns every radio in the group the error colour. */
  error?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root' | 'label'>;
}

/**
 * The group is the control, not the individual radio: it owns the value, the name and the arrow
 * key navigation, which is why a lone Radio is not exported as usable on its own.
 *
 * React Aria's useRadioGroup gives the roving tab stop and the arrow keys, so Tab reaches the
 * group once and the arrows move within it, which is the radio pattern rather than one tab stop
 * per option.
 */
export function RadioGroup(props: RadioGroupProps) {
  const { defaults, slots } = useComponentConfig('RadioGroup');
  const {
    children,
    label,
    value,
    defaultValue,
    onChange,
    orientation = defaults?.orientation ?? 'vertical',
    disabled,
    error,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const ariaProps = {
    ...rest,
    label,
    value,
    defaultValue,
    onChange,
    orientation,
    isDisabled: disabled,
    isInvalid: error,
  };

  const state = useRadioGroupState(ariaProps);
  const { radioGroupProps, labelProps } = useRadioGroup(ariaProps, state);

  return (
    <div
      {...radioGroupProps}
      className={resolveSlotClass(
        'grange-radio-group',
        styles.group,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={style}
      data-orientation={orientation}
      data-error={error || undefined}
    >
      {label != null && (
        <span
          {...labelProps}
          className={resolveSlotClass('grange-radio-group-label', styles.groupLabel, classNames?.label)}
        >
          {label}
        </span>
      )}
      <div className={styles.options}>
        <RadioContext.Provider value={state}>{children}</RadioContext.Provider>
      </div>
    </div>
  );
}

export interface RadioProps {
  /** The value this option sets on the group. */
  value: string;
  children?: ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<RadioSlot>;
}

/** One option. Must sit inside a RadioGroup, which owns the value. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(props, forwardedRef) {
  const { slots } = useComponentConfig('Radio');
  const { children, disabled, className, classNames, style, ...rest } = props;
  const state = useContext(RadioContext);
  if (!state) throw new Error('Radio must be inside a RadioGroup');

  const ref = useObjectRef(forwardedRef);
  const ariaProps = { ...rest, children, isDisabled: disabled };
  const { inputProps, isSelected, isDisabled } = useRadio(ariaProps, state, ref);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const slot = (name: RadioSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <label
      {...hoverProps}
      className={slot('root', 'grange-radio', styles.root)}
      style={style}
      data-selected={String(isSelected)}
      data-disabled={isDisabled || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      <VisuallyHidden>
        <input {...inputProps} {...focusProps} ref={ref} />
      </VisuallyHidden>

      <span className={styles.layerHost} aria-hidden="true">
        <span className="grange-state-layer" />
        <span className={slot('ring', 'grange-radio-ring', styles.ring)}>
          <span className={styles.dot} />
        </span>
      </span>

      {children != null && (
        <span className={slot('label', 'grange-radio-label', styles.label)}>{children}</span>
      )}
    </label>
  );
});
