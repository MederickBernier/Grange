import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useButton, useFilter, useSearchField } from 'react-aria';
import { useSearchFieldState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type SearchSlot,
  type SlotOverrides,
} from '../../config/config';
import styles from './Search.module.scss';

export interface SearchProps {
  /** The current query. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fired on Enter. */
  onSubmit?: (value: string) => void;
  /** Fired when the field is cleared, by the clear button or by Escape. */
  onClear?: () => void;
  placeholder?: string;
  /** Usually a menu button or a back arrow. */
  leading?: ReactNode;
  /** Usually an avatar or a filter button. Sits after the clear button. */
  trailing?: ReactNode;
  /**
   * Results or suggestions. Given these, the bar becomes a view: docked under the bar by
   * default, or filling its container when `fullScreen` is set.
   */
  children?: ReactNode;
  /** Whether the view is showing. Controlled, so the app decides when results appear. */
  open?: boolean;
  fullScreen?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SearchSlot>;
}

/**
 * A search bar, and the view it opens into.
 *
 * useSearchField gives it what a bare input has not: Escape clears the field, the clear button
 * is announced properly, and the whole thing is a searchbox rather than a textbox, which is what
 * a screen reader needs to describe it.
 *
 * The results are the app's to render and filter; `useFilter` is re-exported as
 * `useSearchFilter` for that, because locale-aware matching is not something to hand-roll.
 */
export function Search(props: SearchProps) {
  const { slots } = useComponentConfig('Search');
  const {
    placeholder,
    leading,
    trailing,
    children,
    open = false,
    fullScreen = false,
    disabled,
    className,
    classNames,
    style,
    onSubmit,
    onClear,
    ...rest
  } = props;

  const ariaProps = {
    ...rest,
    placeholder,
    isDisabled: disabled,
    onSubmit,
    onClear,
    'aria-label': props['aria-label'] ?? 'Search',
  };

  const state = useSearchFieldState(ariaProps);
  const ref = useRef<HTMLInputElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const { inputProps, clearButtonProps } = useSearchField(ariaProps, state, ref);
  // clearButtonProps are button options, not DOM props: spread straight onto a button they look
  // right and do nothing. The same is true of useSelect's triggerProps and useToast's
  // closeButtonProps, and all three have caught me out.
  const { buttonProps: clearProps } = useButton(clearButtonProps, clearRef);

  const showView = open && children != null;

  const slot = (name: SearchSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <div
      className={slot('root', 'grange-search', styles.root)}
      style={style}
      data-open={showView || undefined}
      data-full-screen={fullScreen || undefined}
      data-disabled={disabled || undefined}
    >
      <div className={slot('bar', 'grange-search-bar', styles.bar)}>
        {leading && <span className={styles.icon}>{leading}</span>}
        <input {...inputProps} ref={ref} className={slot('input', 'grange-search-input', styles.input)} />
        {state.value !== '' && (
          <button {...clearProps} ref={clearRef} type="button" className={styles.clear}>
            <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
            </svg>
          </button>
        )}
        {trailing && <span className={styles.icon}>{trailing}</span>}
      </div>

      {showView && (
        <div className={slot('view', 'grange-search-view', styles.view)} role="presentation">
          {children}
        </div>
      )}
    </div>
  );
}

export { useFilter as useSearchFilter };
