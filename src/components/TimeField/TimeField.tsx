import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useDateSegment, useLocale, useTimeField } from 'react-aria';
import { useTimeFieldState, type DateFieldState } from 'react-stately';
import type { Time } from '@internationalized/date';
import { resolveSlotClass, useComponentConfig, type SlotOverrides, type TimeFieldSlot } from '../../config/config';
import styles from './TimeField.module.scss';

type Segment = DateFieldState['segments'][number];

export interface TimeFieldProps {
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  value?: Time | null;
  defaultValue?: Time | null;
  onChange?: (value: Time | null) => void;
  /** 12 or 24 hour. Left out, it follows the locale rather than an assumption. */
  hourCycle?: 12 | 24;
  /** How precise to go. Minutes by default. */
  granularity?: 'hour' | 'minute' | 'second';
  minValue?: Time;
  maxValue?: Time;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  supportingText?: ReactNode;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TimeFieldSlot>;
}

/**
 * The input mode of a time picker: separate hour and minute segments rather than a text box.
 *
 * Each segment takes the arrow keys and typing, and the whole thing follows the locale for the
 * hour cycle and the segment order, which is why there is no format string to get wrong.
 *
 * The clock dial is the other mode the spec draws, and it is `TimePicker`, which can show this
 * field as its input mode behind the same value.
 */
export function TimeField(props: TimeFieldProps) {
  const { slots } = useComponentConfig('TimeField');
  const {
    label,
    disabled,
    readOnly,
    required,
    error,
    supportingText,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const { locale } = useLocale();
  const ariaProps = {
    ...rest,
    label,
    isDisabled: disabled,
    isReadOnly: readOnly,
    isRequired: required,
    isInvalid: error,
    description: supportingText,
  };

  const state = useTimeFieldState({ ...ariaProps, locale });
  const ref = useRef<HTMLDivElement>(null);
  const { labelProps, fieldProps, descriptionProps } = useTimeField(ariaProps, state, ref);

  const slot = (name: TimeFieldSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <div
      className={slot('root', 'grange-time-field', styles.root)}
      style={style}
      data-disabled={disabled || undefined}
      data-error={error || undefined}
    >
      {label != null && (
        <span {...labelProps} className={slot('label', 'grange-time-field-label', styles.label)}>
          {label}
        </span>
      )}
      <div {...fieldProps} ref={ref} className={slot('input', 'grange-time-field-input', styles.field)}>
        {state.segments.map((segment, i) => (
          <SegmentBox key={i} segment={segment} state={state} />
        ))}
      </div>
      {supportingText != null && (
        <span {...descriptionProps} className={styles.supporting}>
          {supportingText}
        </span>
      )}
    </div>
  );
}

function SegmentBox({ segment, state }: { segment: Segment; state: DateFieldState }) {
  const ref = useRef<HTMLDivElement>(null);
  const { segmentProps } = useDateSegment(segment, state, ref);

  return (
    <div
      {...segmentProps}
      ref={ref}
      className={styles.segment}
      data-literal={segment.type === 'literal' ? 'true' : undefined}
      data-placeholder={segment.isPlaceholder || undefined}
    >
      {segment.text}
    </div>
  );
}
