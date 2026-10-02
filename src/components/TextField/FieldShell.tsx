import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import styles from './TextField.module.scss';

/**
 * The chrome around a field, with nothing of its own behaviour.
 *
 * `TextField` grew all of this first — the floating label, the outlined variant's notch, the
 * leading and trailing slots, the affixes, the supporting row and the counter — and it is the
 * same chrome a number field, a masked field, a date field and a combo box all need. Rather
 * than each of them reproducing the markup and drifting from it, they render their own input
 * inside this.
 *
 * It renders no input and owns no state: the caller brings the control, the ARIA props from
 * whichever React Aria hook applies, and the resolved slot classes. The classes are resolved by
 * the caller because each component has its own config key and its own stable hook classes,
 * which is what an app targets.
 *
 * The outlined variant's notch is a real `<legend>` inside a `<fieldset>`, which reserves
 * exactly as much space as the label needs. Faking it with a background colour behind the label
 * only works when you know what the field is sitting on.
 */
export interface FieldShellClasses {
  root: string;
  container: string;
  label: string;
  supporting: string;
  leadingIcon?: string;
  trailingIcon?: string;
}

export interface FieldShellState {
  /** Whether the label has floated: there is a value, or focus, or a placeholder showing. */
  populated?: boolean;
  focused?: boolean;
  focusVisible?: boolean;
  hovered?: boolean;
  error?: boolean;
  disabled?: boolean;
  multiline?: boolean;
}

export interface FieldShellProps {
  variant: 'filled' | 'outlined';
  classes: FieldShellClasses;
  state: FieldShellState;
  /** The control itself: an input, a textarea, or a row of segments. */
  children: ReactNode;
  label?: ReactNode;
  labelProps?: HTMLAttributes<HTMLElement>;
  /**
   * Goes on the container. Hover handling belongs to the caller, which knows whether the field
   * is disabled, and a number field also has `groupProps` from its hook to put here.
   */
  containerProps?: HTMLAttributes<HTMLElement>;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /**
   * Controls at the end of the row, inside the container: a password reveal, a number field's
   * stepper, a combo box's chevron. Separate from `trailingIcon`, which is decoration.
   */
  trailing?: ReactNode;
  /** Static text before and after the control, such as a currency symbol or a unit. */
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** The supporting or error text, already chosen between by the caller. */
  supporting?: ReactNode;
  supportingProps?: HTMLAttributes<HTMLElement>;
  /** The character counter, and the id the caller has pointed aria-describedby at. */
  counter?: ReactNode;
  counterId?: string;
  style?: CSSProperties;
}

export function FieldShell(props: FieldShellProps) {
  const {
    variant,
    classes,
    state,
    children,
    label,
    labelProps,
    containerProps,
    leadingIcon,
    trailingIcon,
    trailing,
    prefix,
    suffix,
    supporting,
    supportingProps,
    counter,
    counterId,
    style,
  } = props;

  return (
    <div
      className={classes.root}
      style={style}
      data-variant={variant}
      data-populated={state.populated || undefined}
      data-focused={state.focused || undefined}
      data-focus-visible={state.focusVisible || undefined}
      data-hovered={state.hovered || undefined}
      data-error={state.error || undefined}
      data-disabled={state.disabled || undefined}
      data-multiline={state.multiline || undefined}
    >
      <div {...containerProps} className={classes.container}>
        {variant === 'outlined' && (
          <fieldset className={styles.outline} aria-hidden="true">
            <legend className={styles.notch}>
              <span>{label}</span>
            </legend>
          </fieldset>
        )}

        {leadingIcon && <span className={classes.leadingIcon}>{leadingIcon}</span>}

        <div className={styles.field}>
          {label != null && (
            <label {...labelProps} className={classes.label}>
              {label}
            </label>
          )}
          <div className={styles.inputRow}>
            {prefix && <span className={styles.affix}>{prefix}</span>}
            {children}
            {suffix && <span className={styles.affix}>{suffix}</span>}
          </div>
        </div>

        {trailingIcon && <span className={classes.trailingIcon}>{trailingIcon}</span>}
        {trailing}

        {variant === 'filled' && <span className={styles.indicator} aria-hidden="true" />}
      </div>

      {(supporting != null || counter != null) && (
        <div className={classes.supporting}>
          <span>{supporting != null && <span {...supportingProps}>{supporting}</span>}</span>
          {counter != null && (
            <span id={counterId} className={styles.counter}>
              {counter}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
