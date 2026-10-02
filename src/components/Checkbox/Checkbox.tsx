import { forwardRef, useContext, type CSSProperties, type ReactNode } from 'react';
import {
  VisuallyHidden,
  useCheckbox,
  useCheckboxGroupItem,
  useFocusRing,
  useHover,
  useObjectRef,
} from 'react-aria';
import type { CheckboxGroupState } from 'react-stately';
import { useToggleState } from 'react-stately';
import { CheckboxGroupContext } from './CheckboxGroup';
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
  /**
   * Required inside a `CheckboxGroup`, which is what identifies this box in the group's value.
   * The group then owns whether it is checked, so `checked` and `onChange` are ignored there.
   */
  value?: string;
  disabled?: boolean;
  /** Turns the box and its outline the error colour. */
  error?: boolean;
  /** Submitted with the form under this name when checked. */
  name?: string;
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
 *
 * Inside a `CheckboxGroup` the state comes from the group instead, through
 * `useCheckboxGroupItem`, so that the group's validity and its message reach every box. The two
 * hooks cannot both be called, so which one applies is decided by rendering one of two inner
 * components; the context does not change for the life of a mount, so that is safe.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, forwardedRef) {
  const group = useContext(CheckboxGroupContext);
  return group ? (
    <GroupedCheckbox {...props} group={group} forwardedRef={forwardedRef} />
  ) : (
    <StandaloneCheckbox {...props} forwardedRef={forwardedRef} />
  );
});

type InnerProps = CheckboxProps & { forwardedRef: React.ForwardedRef<HTMLInputElement> };

function StandaloneCheckbox({ forwardedRef, ...props }: InnerProps) {
  const { children, checked, defaultChecked, onChange, indeterminate = false, disabled, error, ...rest } = props;
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
  return <CheckboxView {...props} inputRef={ref} inputProps={inputProps} selected={state.isSelected} />;
}

function GroupedCheckbox({ forwardedRef, group, ...props }: InnerProps & { group: CheckboxGroupState }) {
  const { children, indeterminate = false, disabled, error, value, ...rest } = props;
  if (value === undefined) throw new Error('A Checkbox inside a CheckboxGroup needs a value');

  const ref = useObjectRef(forwardedRef);
  const ariaProps = {
    ...rest,
    value,
    isIndeterminate: indeterminate,
    isDisabled: disabled,
    isInvalid: error,
    children,
  };
  const { inputProps } = useCheckboxGroupItem(ariaProps, group, ref);
  return (
    <CheckboxView
      {...props}
      // The group decides invalidity for every box in it, which is the reason to have one.
      error={error || group.isInvalid}
      disabled={disabled || group.isDisabled}
      inputRef={ref}
      inputProps={inputProps}
      selected={group.isSelected(value)}
    />
  );
}

type ViewProps = CheckboxProps & {
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  selected: boolean;
};

/** The markup, shared by both so a grouped box and a lone one look and style identically. */
function CheckboxView(props: ViewProps) {
  const { slots } = useComponentConfig('Checkbox');
  const {
    children,
    indeterminate = false,
    disabled,
    error,
    className,
    classNames,
    style,
    inputRef: ref,
    inputProps,
    selected: isSelected,
  } = props;

  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();
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
}
