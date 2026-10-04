import { isValidElement, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { VisuallyHidden, mergeProps, useFocusRing, useHover } from 'react-aria';
import { flattenChildren, useControlledState } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type StepperSlot,
} from '../../config/config';
import styles from './Stepper.module.scss';

export interface StepProps {
  /** The step's name. */
  label: ReactNode;
  /** A second line under it. */
  supportingText?: ReactNode;
  /** Replaces the number in the marker. A completed or failed step draws its own glyph instead. */
  icon?: ReactNode;
  /** Says so, and lets a linear stepper move past it. */
  optional?: boolean;
  /** This step's contents did not validate. Shown on the marker and said out loud. */
  error?: boolean;
  disabled?: boolean;
}

/**
 * One step. Described rather than rendered: the stepper decides what a step's marker shows,
 * which depends on where the step sits relative to the current one — something a step cannot
 * know about itself.
 */
export function Step(_props: StepProps): ReactElement | null {
  return null;
}

export interface StepperProps {
  /** Step children, in order. */
  children?: ReactNode;
  /** The current step, as a zero-based index. */
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  /**
   * Linear by default: a step further on than the current one cannot be jumped to, because the
   * steps before it have not been filled in. Turn it off for a stepper whose steps are
   * independent.
   */
  linear?: boolean;
  /**
   * Steps that are done, beyond the ones a linear stepper infers from the current index. Needed
   * for a non-linear stepper, where "before the current one" says nothing about whether a step
   * was completed.
   */
  completedSteps?: Iterable<number>;
  orientation?: 'horizontal' | 'vertical';
  /** What the list is called. Defaults to "Progress". */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<StepperSlot>;
}

const isStep = (child: ReactNode): child is ReactElement<StepProps> =>
  isValidElement(child) && child.type === Step;

/**
 * A numbered path through a task.
 *
 * There is no React Aria hook for this and no ARIA pattern either, which makes the markup a
 * decision rather than a lookup. It is an ordered list of buttons: the order is content, every
 * step is a thing you can press, and the current one carries `aria-current="step"`. A tablist
 * was the other candidate and is wrong — tabs are views of the same thing, steps are stages of
 * one thing, and a tablist would promise arrow-key navigation between panels that do not exist.
 *
 * Each step is its own Tab stop, as the accordion's headers are, for the same reason: they are
 * ordinary buttons, Tab already reaches them, and taking that away to add arrow keys would cost
 * a keyboard user more than it gives.
 *
 * **The state each step is in is said, not only drawn.** "Step 2 of 4, Address, completed" is
 * read out; the tick, the cross and the number are `aria-hidden` decorations of that sentence.
 * A stepper that shows a green tick and announces nothing is the usual failure here.
 */
export function Stepper(props: StepperProps) {
  const { defaults, slots } = useComponentConfig('Stepper');
  const {
    children,
    value,
    defaultValue = 0,
    onChange,
    linear = defaults?.linear ?? true,
    completedSteps,
    orientation = defaults?.orientation ?? 'horizontal',
    'aria-label': ariaLabel = 'Progress',
    className,
    classNames,
    style,
  } = props;

  const [current, setCurrent] = useControlledState(value, defaultValue, onChange);
  // flattenChildren, not Children.toArray: toArray leaves a fragment as one child, and a
  // stepper that counts its steps would then see one.
  const steps = flattenChildren(children)
    .filter(isStep)
    .map((child) => child.props);
  const done = new Set(completedSteps ?? []);

  const slot = (name: StepperSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <ol
      className={slot('root', 'grange-stepper', styles.stepper)}
      style={style}
      data-orientation={orientation}
      aria-label={ariaLabel}
    >
      {steps.map((step, i) => {
        /*
         * A linear stepper treats everything before the current step as done; a non-linear one
         * cannot, because its steps are not in any particular order, which is what
         * completedSteps is for.
         */
        const completed = done.has(i) || (linear && i < current);
        const isCurrent = i === current;
        // Linear: you may go back, and you may stay. You may not skip ahead to a step whose
        // predecessors have not been filled in.
        const reachable = !step.disabled && (isCurrent || (linear ? i < current || done.has(i) : true));

        return (
          <li
            key={i}
            className={slot('step', 'grange-step', styles.step)}
            data-current={isCurrent || undefined}
            data-completed={completed || undefined}
            data-error={step.error || undefined}
            data-disabled={!reachable || undefined}
            data-last={i === steps.length - 1 || undefined}
          >
            <StepButton
              index={i}
              total={steps.length}
              step={step}
              completed={completed}
              isCurrent={isCurrent}
              reachable={reachable}
              onSelect={() => setCurrent(i)}
              className={slot('button', 'grange-step-button', styles.button)}
            />
            {i < steps.length - 1 && <span className={styles.rail} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function StepButton({
  index,
  total,
  step,
  completed,
  isCurrent,
  reachable,
  onSelect,
  className,
}: {
  index: number;
  total: number;
  step: StepProps;
  completed: boolean;
  isCurrent: boolean;
  reachable: boolean;
  onSelect: () => void;
  className: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { hoverProps, isHovered } = useHover({ isDisabled: !reachable });
  const { focusProps, isFocusVisible } = useFocusRing();

  /*
   * aria-disabled rather than disabled: an unreachable step is still worth reading, because
   * knowing what comes next is most of what a stepper is for. A disabled button is skipped by
   * the Tab order and by some screen readers' element lists, which would hide the path.
   */
  const state = step.error ? 'failed' : completed ? 'completed' : isCurrent ? 'current' : 'not started';

  return (
    <button
      {...mergeProps(hoverProps, focusProps)}
      ref={ref}
      type="button"
      className={className}
      aria-current={isCurrent ? 'step' : undefined}
      aria-disabled={reachable ? undefined : true}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
      onClick={() => reachable && onSelect()}
    >
      <span className={styles.marker} aria-hidden="true">
        {step.error ? (
          <Glyph path="M440-400h80v-240h-80v240Zm40 160q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Z" />
        ) : completed ? (
          <Glyph path="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
        ) : (
          (step.icon ?? index + 1)
        )}
      </span>

      <span className={styles.text}>
        <span className={styles.label}>{step.label}</span>
        {step.supportingText != null && <span className={styles.supporting}>{step.supportingText}</span>}
      </span>

      {/* The sentence the decorations above are a drawing of. */}
      <VisuallyHidden>
        {`Step ${index + 1} of ${total}, ${state}${step.optional ? ', optional' : ''}`}
      </VisuallyHidden>
    </button>
  );
}

const Glyph = ({ path }: { path: string }) => (
  <svg viewBox="0 -960 960 960" focusable="false" className={styles.glyph}>
    <path d={path} />
  </svg>
);
