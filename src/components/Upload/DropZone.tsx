import { useRef, type CSSProperties, type ReactNode } from 'react';
import { mergeProps, useButton, useClipboard, useDrop, useFocusRing, useHover } from 'react-aria';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type UploadSlot,
} from '../../config/config';
import styles from './Upload.module.scss';

export interface DropZoneProps {
  /** Fired with the files, however they arrived: dropped, pasted, or chosen from the dialog. */
  onFiles?: (files: File[]) => void;
  children?: ReactNode;
  /** Passed to the file input, and used to turn away files that do not match. */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<UploadSlot>;
}

/**
 * A target that takes files — by drop, by paste, or by being pressed.
 *
 * **Dropping is not an interaction everybody has**, which is the whole design of this. A drop
 * zone that only listens for `dragover` is unusable without a pointer, so this one is a real
 * button: press it, or focus it and press Enter, and the file dialog opens. `useClipboard` adds
 * the third path — focus it and paste, and the files on the clipboard arrive the same way.
 *
 * All three routes end in one `onFiles`, so a caller never has to know which was used.
 */
export function DropZone(props: DropZoneProps) {
  const { slots } = useComponentConfig('DropZone');
  const {
    onFiles,
    children,
    accept,
    multiple = true,
    disabled,
    className,
    classNames,
    style,
    'aria-label': ariaLabel = 'Drop files here, or press to choose',
  } = props;

  const ref = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const deliver = (files: File[]) => {
    if (files.length > 0) onFiles?.(multiple ? files : files.slice(0, 1));
  };

  const { dropProps, isDropTarget } = useDrop({
    ref,
    isDisabled: disabled,
    onDrop: async (event) => {
      const files = await Promise.all(
        event.items.filter((item) => item.kind === 'file').map((item) => item.getFile()),
      );
      deliver(files);
    },
  });

  // Pasting is the keyboard's version of dropping, and costs one hook.
  const { clipboardProps } = useClipboard({
    isDisabled: disabled,
    onPaste: async (items) => {
      const files = await Promise.all(
        items.filter((item) => item.kind === 'file').map((item) => item.getFile()),
      );
      deliver(files);
    },
  });

  const { buttonProps } = useButton(
    { isDisabled: disabled, onPress: () => inputRef.current?.click(), 'aria-label': ariaLabel },
    ref,
  );
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const slot = (name: UploadSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <>
      <button
        {...mergeProps(buttonProps, dropProps, clipboardProps, hoverProps, focusProps)}
        ref={ref}
        type="button"
        className={slot('zone', 'grange-drop-zone', styles.zone)}
        style={style}
        data-drop-target={isDropTarget || undefined}
        data-hovered={isHovered || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-disabled={disabled || undefined}
      >
        {children ?? (
          <>
            <Glyph />
            <span className={styles.zoneLabel}>Drop files here, or press to choose</span>
          </>
        )}
      </button>

      {/*
        The real input, kept out of sight. It is what opens the operating system's own file
        dialog; nothing else can, and reimplementing it is not possible.
      */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className={styles.input}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          deliver([...(event.target.files ?? [])]);
          // Cleared so choosing the same file twice in a row still fires a change.
          event.target.value = '';
        }}
      />
    </>
  );
}

const Glyph = () => (
  <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true" className={styles.zoneIcon}>
    <path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
  </svg>
);
