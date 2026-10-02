import { forwardRef, useRef, type CSSProperties, type ReactNode } from 'react';
import { VisuallyHidden, useCheckbox, useFocusRing, useHover, useObjectRef } from 'react-aria';
import { useToggleState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type CheckboxSlot,
  type SlotOverrides,
} from '../../config/config';
import { checkbox as spec } from './specs';
import styles from './Checkbox.module.scss';

export interface CheckboxProps {
  /** The visible label. Without one, pass aria-label. */
  children?: ReactNode;
  /** Controlled checked state. Material Web calls this `checked`. */
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /**
   * Neither checked nor unchecked: the state a parent checkbox takes when some but not all of
   * its children are checked. Clicking an indeterminate checkbox checks it.
   */
  indeterminate?: boolean;
  disabled?: boolean;
  /** Turns the box and its outline the error colour. */
  error?: boolean;
  /** Submitted with the form under this name when checked. */
  name?: string;
  value?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<CheckboxSlot>;
}

/**
 * A checkbox, on React Aria's useCheckbox, so it is a real `<input type="checkbox">` underneath:
 * it participates in forms, answers Space, and reports indeterminate to assistive tech rather
 * than only looking the part.
 *
 * The 40px round hover and focus layer is the shared state layer primitive, which is why it
 * picks up the same timings as every other control.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, forwardedRef) {
  const { slots } = useComponentConfig('Checkbox');
  const {
    children,
    checked,
    defaultChecked,
    onChange,
    indeterminate = false,
    disabled,
    error,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const ref = useObjectRef(forwardedRef);
  const ariaProps = {
    ...rest,
    isSelected: checked,
    defaultSelected: defaultChecked,
    onChange,
    isIndeterminate: indeterminate,
    isDisabled: disabled,
    isInvalid: error,
    children,
  };

  const state = useToggleState(ariaProps);
  const { inputProps } = useCheckbox(ariaProps, state, ref);
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const isSelected = state.isSelected;
  const slot = (name: CheckboxSlot, hook: string, builtIn?: string) =>
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
      className={slot('root', 'grange-checkbox', styles.root)}
      style={style}
      data-selected={indeterminate ? 'mixed' : String(isSelected)}
      data-disabled={disabled || undefined}
      data-error={error || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      <VisuallyHidden>
        <input {...inputProps} {...focusProps} ref={ref} />
      </VisuallyHidden>

      <span className={styles.layerHost} aria-hidden="true">
        <span className="grange-state-layer" />
        <span className={slot('box', 'grange-checkbox-box', styles.box)}>
          <svg className={styles.tick} viewBox="0 0 18 18" focusable="false">
            {indeterminate ? (
              <path d="M4 8.25h10v1.5H4z" />
            ) : (
              <path d="M7.1 13.4 3 9.3l1.4-1.4 2.7 2.7 6.5-6.5L15 5.5z" />
            )}
          </svg>
        </span>
      </span>

      {children != null && (
        <span className={slot('label', 'grange-checkbox-label', styles.label)}>{children}</span>
      )}
    </label>
  );
});
