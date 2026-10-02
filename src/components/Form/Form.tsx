import { useCallback, useId, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useField } from 'react-aria';
import { FormValidationContext } from 'react-stately';
import { resolveSlotClass, useComponentConfig, type FormSlot, type SlotOverrides } from '../../config/config';
import styles from './Form.module.scss';

/** What a field holds once the browser has read the form: one value, or several under one name. */
export type FormValue = string | string[] | File | File[];
export type FormValues = Record<string, FormValue>;
/** One message per field, or several, keyed by the field's `name`. */
export type FormErrors = Record<string, string | string[]>;

export interface FormProps {
  children: ReactNode;
  /** Called with the collected values once validation has passed. */
  onSubmit?: (values: FormValues, event: FormEvent<HTMLFormElement>) => void;
  /**
   * Checks the whole form on submit. Return a message per field name, or nothing. Fields named
   * here are marked invalid and the submit does not go through.
   */
  validate?: (values: FormValues) => FormErrors | void;
  /**
   * Errors from somewhere else — a server, usually. Merged with whatever `validate` found, and
   * cleared field by field as each one is edited, which React Aria does on its own.
   */
  errors?: FormErrors;
  /**
   * `aria` is the default and leaves the messaging to the fields, which is what the M3 spec
   * draws. `native` lets the browser validate and show its own bubbles instead.
   */
  validationBehavior?: 'aria' | 'native';
  /** Buttons under the fields. Laid out as a row, aligned to the end. */
  actions?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<FormSlot>;
}

/**
 * A form, deliberately small.
 *
 * It is not a form-state library and does not try to be one: it holds no values, has no notion of
 * touched or dirty, and re-renders nothing as you type. An app that wants that brings a library
 * for it, and this still works underneath — every field here is an ordinary input with a `name`.
 *
 * What it does is the part that is genuinely awkward to wire by hand:
 *
 * - **Collects the values.** On submit it reads them out of `FormData`, which is the browser's
 *   own answer to "what is in this form" and therefore already right about checkboxes, radios,
 *   multiple selects and files.
 * - **Distributes the errors.** This is the useful bit. Every field in this library is built on
 *   a React Aria hook, and those hooks read `FormValidationContext` and look up their own
 *   `name` in it. So an error map goes in at the top and comes out as the right message under
 *   the right field, with no wrapper component, no cloning of children, and no prop threading.
 *   React Aria also clears a field's error as soon as its value changes, which is the behaviour
 *   you would otherwise have to build.
 *
 * `validationBehavior="aria"` sets `noValidate` on the form, because the two cannot both be in
 * charge: leaving the browser's validation on means its bubble appears over the message the
 * field is already showing.
 */
export function Form(props: FormProps) {
  const { defaults, slots } = useComponentConfig('Form');
  const {
    children,
    onSubmit,
    validate,
    errors,
    validationBehavior = defaults?.validationBehavior ?? 'aria',
    actions,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const [found, setFound] = useState<FormErrors>({});

  // The context identity matters: React Aria compares it to decide when a server error is new,
  // so a fresh object every render would make a field's error flicker back after every keystroke.
  const all = useMemo(() => ({ ...errors, ...found }), [errors, found]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    const values = readValues(event.currentTarget);
    const problems = validate?.(values) ?? {};

    if (Object.keys(problems).length > 0) {
      event.preventDefault();
      setFound(problems);
      return;
    }

    setFound({});
    // Not prevented here: a form that posts normally should be able to, and a handler that
    // wants to take over calls preventDefault itself.
    onSubmit?.(values, event);
  };

  /*
   * An error found by `validate` is stale the moment that field is edited, and React Aria cannot
   * do this part for us: it clears a context error by noticing the field's value change, which
   * only works for a controlled field. These are ordinary uncontrolled inputs, so the form
   * watches its own input events instead.
   *
   * The `errors` prop is left alone, because it is the app's: a server error is the app's to
   * clear when it knows better.
   */
  const clearOnEdit = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target as HTMLInputElement | null;
    const name = target?.name;
    if (!name) return;
    setFound((was) => (name in was ? omit(was, name) : was));
  };

  return (
    <form
      {...aria}
      className={resolveSlotClass('grange-form', styles.form, ...(slots?.root ?? []), classNames?.root, className)}
      style={style}
      // The two validations cannot both be in charge; see the note above.
      noValidate={validationBehavior === 'aria'}
      onSubmit={submit}
      onInput={clearOnEdit}
      onChange={clearOnEdit}
      onReset={() => setFound({})}
    >
      <FormValidationContext.Provider value={all}>
        <div className={styles.fields}>{children}</div>
        {actions != null && (
          <div
            className={resolveSlotClass(
              'grange-form-actions',
              styles.actions,
              ...(slots?.actions ?? []),
              classNames?.actions,
            )}
          >
            {actions}
          </div>
        )}
      </FormValidationContext.Provider>
    </form>
  );
}

/**
 * The values, as the browser sees them.
 *
 * `FormData` is used rather than any bookkeeping of our own because it is already right about
 * the cases that are easy to get wrong: an unchecked checkbox is absent rather than false, a
 * multiple select and a checkbox group collapse into one name, and a file input gives a `File`.
 * Several entries under one name become an array; one stays a single value.
 */
export function readValues(form: HTMLFormElement): FormValues {
  const values: FormValues = {};
  for (const [name, value] of new FormData(form).entries()) {
    const existing = values[name];
    if (existing === undefined) {
      values[name] = value as FormValue;
    } else if (Array.isArray(existing)) {
      (existing as (string | File)[]).push(value as string | File);
    } else {
      values[name] = [existing, value] as FormValue;
    }
  }
  return values;
}

export interface FormFieldProps {
  /**
   * The control. Given a render function it receives the ids to wire up, which is what a custom
   * control needs; given an element it is rendered as it is, for a control that labels itself.
   */
  children: ReactNode | ((props: FormFieldRenderProps) => ReactNode);
  label?: ReactNode;
  supportingText?: ReactNode;
  errorText?: ReactNode;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root' | 'label' | 'supporting'>;
}

export interface FormFieldRenderProps {
  id: string;
  'aria-labelledby': string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
  disabled?: boolean;
}

/**
 * A label, a control and its message, for a control that has none of its own.
 *
 * Every field in this library already renders its own label and supporting text, so this is not
 * for them — it is for the third-party date picker or colour input or bare `<input>` that has to
 * sit in the same form and look like it belongs. `useField` does the id wiring, so the label and
 * the message are actually associated with the control rather than merely next to it.
 */
export function FormField(props: FormFieldProps) {
  const { slots } = useComponentConfig('FormField');
  const { children, label, supportingText, errorText, error, required, disabled, className, classNames, style } =
    props;

  const message = error && errorText != null ? errorText : supportingText;
  const { labelProps, fieldProps, descriptionProps, errorMessageProps } = useField({
    label,
    description: error && errorText != null ? undefined : supportingText,
    errorMessage: error ? errorText : undefined,
    isInvalid: error,
  });
  const id = useId();

  const slot = (name: 'root' | 'label' | 'supporting', hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const render: FormFieldRenderProps = {
    ...(fieldProps as { 'aria-labelledby': string; 'aria-describedby'?: string }),
    id,
    'aria-invalid': error ? true : undefined,
    required,
    disabled,
  };

  return (
    <div
      className={slot('root', 'grange-form-field', styles.field)}
      style={style}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
    >
      {label != null && (
        <label {...labelProps} htmlFor={id} className={slot('label', 'grange-form-field-label', styles.label)}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {typeof children === 'function' ? children(render) : children}
      {message != null && (
        <span
          {...(error && errorText != null ? errorMessageProps : descriptionProps)}
          className={slot('supporting', 'grange-form-field-supporting', styles.supporting)}
        >
          {message}
        </span>
      )}
    </div>
  );
}

export interface FieldArrayRow {
  /** Stable across adds and removes, so React keeps the right row's DOM and focus. */
  key: string;
  index: number;
  /** `name` for an input in this row: `fieldName('city')` gives `address.0.city`. */
  fieldName: (field?: string) => string;
  remove: () => void;
  moveUp: () => void;
  moveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export interface FieldArrayProps {
  /** The group's name. Inputs inside are named `name.index.field`, which servers understand. */
  name: string;
  /** How many rows to start with. */
  defaultCount?: number;
  /** Fewest and most rows, which is what disables remove and add at the ends. */
  min?: number;
  max?: number;
  children: (rows: FieldArrayRow[], add: () => void, canAdd: boolean) => ReactNode;
}

/**
 * A repeating group of fields, and nothing more.
 *
 * It owns the *rows* — how many there are, their order, and a stable key each — and deliberately
 * not their values. The inputs inside stay ordinary named inputs, so the form reads them out of
 * `FormData` with everything else and nothing has to be mirrored into React state as you type.
 *
 * The keys are what make it work: removing the second of three rows with index keys would make
 * React reuse the third row's DOM for the second, moving the caret and the focus to a different
 * field than the one being edited.
 */
export function FieldArray({ name, defaultCount = 1, min = 0, max = Infinity, children }: FieldArrayProps) {
  const [keys, setKeys] = useState<string[]>(() =>
    Array.from({ length: Math.max(defaultCount, min) }, (_, i) => `${i}`),
  );
  const next = useMemo(() => ({ current: keys.length }), [keys.length]);

  const add = useCallback(() => {
    setKeys((was) => (was.length >= max ? was : [...was, `${next.current++}-${Date.now()}`]));
  }, [max, next]);

  const rows: FieldArrayRow[] = keys.map((key, index) => ({
    key,
    index,
    fieldName: (field?: string) => (field === undefined ? `${name}.${index}` : `${name}.${index}.${field}`),
    remove: () => setKeys((was) => (was.length <= min ? was : was.filter((_, i) => i !== index))),
    moveUp: () => setKeys((was) => swap(was, index, index - 1)),
    moveDown: () => setKeys((was) => swap(was, index, index + 1)),
    isFirst: index === 0,
    isLast: index === keys.length - 1,
  }));

  return <>{children(rows, add, keys.length < max)}</>;
}

function swap(keys: string[], from: number, to: number): string[] {
  if (to < 0 || to >= keys.length) return keys;
  const next = [...keys];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

function omit(errors: FormErrors, name: string): FormErrors {
  const next = { ...errors };
  delete next[name];
  return next;
}
