import { createContext, type CSSProperties, type ReactNode } from 'react';
import { useCheckboxGroup } from 'react-aria';
import { useCheckboxGroupState, type CheckboxGroupState } from 'react-stately';
import { resolveSlotClass, useComponentConfig, type SlotOverrides } from '../../config/config';
import styles from './CheckboxGroup.module.scss';

export const CheckboxGroupContext = createContext<CheckboxGroupState | null>(null);

export interface CheckboxGroupProps {
  /** Checkbox children, each with a `value`. */
  children: ReactNode;
  /** The visible label for the whole group. Without one, pass aria-label. */
  label?: ReactNode;
  /** The values that are checked. The group owns them, not the individual boxes. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Marks the whole group invalid, which is the point of having a group at all. */
  error?: boolean;
  supportingText?: ReactNode;
  /** Shown in place of the supporting text while the group is in error. */
  errorText?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root' | 'label' | 'supportingText'>;
}

/**
 * A set of checkboxes validated together.
 *
 * A lone `Checkbox` is a complete control and stays one; this is for the case a single box
 * cannot express — "choose at least one" — where the validity and the message belong to the set
 * rather than to any member of it. `useCheckboxGroup` gives the group the `role="group"`, the
 * label association and the `aria-describedby` that carries that message to every box in it.
 *
 * Inside a group the boxes stop owning their own state: React Aria's `useCheckboxGroupItem`
 * reads the group's selection, so a `checked` or `onChange` on a grouped `Checkbox` is ignored.
 * That is the hook's contract and not a decision made here, which is why the `value` is what a
 * grouped box needs and nothing else.
 */
export function CheckboxGroup(props: CheckboxGroupProps) {
  const { defaults, slots } = useComponentConfig('CheckboxGroup');
  const {
    children,
    label,
    orientation = defaults?.orientation ?? 'vertical',
    disabled,
    readOnly,
    required,
    error,
    supportingText,
    errorText,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const ariaProps = {
    ...rest,
    label,
    isDisabled: disabled,
    isReadOnly: readOnly,
    isRequired: required,
    isInvalid: error,
    description: supportingText,
    errorMessage: errorText,
  };

  const state = useCheckboxGroupState(ariaProps);
  const { groupProps, labelProps, descriptionProps, errorMessageProps } = useCheckboxGroup(ariaProps, state);

  const message = error ? (errorText ?? supportingText) : supportingText;
  const messageProps = error && errorText != null ? errorMessageProps : descriptionProps;

  return (
    <div
      {...groupProps}
      className={resolveSlotClass(
        'grange-checkbox-group',
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
          className={resolveSlotClass('grange-checkbox-group-label', styles.groupLabel, classNames?.label)}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </span>
      )}

      <div className={styles.options} data-orientation={orientation}>
        <CheckboxGroupContext.Provider value={state}>{children}</CheckboxGroupContext.Provider>
      </div>

      {message != null && (
        <span
          {...messageProps}
          className={resolveSlotClass(
            'grange-checkbox-group-supporting-text',
            styles.supportingText,
            classNames?.supportingText,
          )}
        >
          {message}
        </span>
      )}
    </div>
  );
}
