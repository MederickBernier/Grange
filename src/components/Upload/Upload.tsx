import { useState, type CSSProperties, type ReactNode } from 'react';
import { IconButton } from '../Button/Button';
import { LinearProgress } from '../Progress/LinearProgress';
import { useControlledState } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type UploadSlot,
} from '../../config/config';
import { DropZone } from './DropZone';
import { formatBytes, toUploadFiles, type FileRules, type UploadFile } from './files';
import styles from './Upload.module.scss';

export interface UploadProps extends FileRules {
  /** The rows. Controlled, so the app owns what the server has said about each file. */
  files?: readonly UploadFile[];
  defaultFiles?: readonly UploadFile[];
  onFilesChange?: (files: UploadFile[]) => void;
  /** Fired with the newly added files, which is where an app starts its own upload. */
  onAdd?: (files: UploadFile[]) => void;
  onRemove?: (file: UploadFile) => void;
  /** Shown beside a failed row. Without it a failure can only be removed, not retried. */
  onRetry?: (file: UploadFile) => void;
  multiple?: boolean;
  /** Hides the list, for an app that draws its own. */
  showList?: boolean;
  /** Replaces the inside of the drop zone. */
  children?: ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<UploadSlot>;
}

/**
 * A file picker, a drop target, and the list of what has been chosen.
 *
 * **The network stays the app's.** This component never uploads anything: it collects files,
 * reports them through `onAdd`, and draws whatever status the app hands back. Every library
 * that owns the request ends up with a prop for headers, one for the field name, one for
 * chunking, one for retries — and still cannot do what the app needed.
 *
 * **A file that cannot be accepted is rejected as it arrives**, not on submit. Telling someone
 * a file is too large after they have waited for it to upload is the worst possible moment,
 * and the reason is a sentence rather than a code: "Too large (4.2 MB of 2 MB)".
 *
 * Each row is announced when its status changes, through one live region rather than one per
 * row: eight files finishing would otherwise be eight regions talking at once.
 */
export function Upload(props: UploadProps) {
  const { defaults, slots } = useComponentConfig('Upload');
  const {
    files,
    defaultFiles = [],
    onFilesChange,
    onAdd,
    onRemove,
    onRetry,
    accept,
    maxSize,
    multiple = defaults?.multiple ?? true,
    showList = defaults?.showList ?? true,
    children,
    disabled,
    className,
    classNames,
    style,
    'aria-label': ariaLabel = 'Upload files',
  } = props;

  const [rows, setRows] = useControlledState<readonly UploadFile[]>(files, defaultFiles, (next) =>
    onFilesChange?.([...next]),
  );
  const [announcement, setAnnouncement] = useState('');

  const add = (picked: File[]) => {
    const next = toUploadFiles(picked, { accept, maxSize });
    setRows(multiple ? [...rows, ...next] : next);
    onAdd?.(next.filter((row) => row.status !== 'error'));

    const refused = next.filter((row) => row.status === 'error');
    setAnnouncement(
      refused.length > 0
        ? `${refused.length} of ${next.length} not accepted: ${refused.map((row) => row.error).join('; ')}`
        : `${next.length} ${next.length === 1 ? 'file' : 'files'} added`,
    );
  };

  const remove = (row: UploadFile) => {
    setRows(rows.filter((candidate) => candidate.id !== row.id));
    onRemove?.(row);
    setAnnouncement(`${row.name} removed`);
  };

  const slot = (name: UploadSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <div className={slot('root', 'grange-upload', styles.upload)} style={style}>
      <DropZone
        onFiles={add}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={ariaLabel}
        classNames={{ zone: classNames?.zone }}
      >
        {children}
      </DropZone>

      {showList && rows.length > 0 && (
        <ul className={slot('list', 'grange-upload-list', styles.list)}>
          {rows.map((row) => (
            <li key={row.id} className={slot('item', 'grange-upload-item', styles.item)} data-status={row.status}>
              {/*
                Name, size and progress in one column beside the buttons, rather than all four
                in one grid: a progress bar spanning the row pushed the buttons onto a line of
                their own, which read as a second, broken row.
              */}
              <span className={styles.main}>
                <span className={styles.line}>
                  <span className={styles.name}>{row.name}</span>
                  <span className={styles.meta}>{row.error ?? formatBytes(row.size)}</span>
                </span>

                {row.status === 'uploading' && (
                  <LinearProgress
                    className={styles.progress}
                    value={row.progress}
                    aria-label={`Uploading ${row.name}`}
                  />
                )}
              </span>

              <span className={styles.actions}>
                {row.status === 'error' && onRetry && (
                  <IconButton
                    variant="standard"
                    size="xs"
                    aria-label={`Retry ${row.name}`}
                    disabled={disabled}
                    onClick={() => onRetry(row)}
                  >
                    <Glyph path="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
                  </IconButton>
                )}
                <IconButton
                  variant="standard"
                  size="xs"
                  aria-label={`Remove ${row.name}`}
                  disabled={disabled}
                  onClick={() => remove(row)}
                >
                  <Glyph path="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </IconButton>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/*
        One region for the whole list. Eight files finishing at once would otherwise be eight
        live regions talking over each other.
      */}
      <span className={styles.announcement} role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

const Glyph = ({ path }: { path: string }) => (
  <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
    <path d={path} />
  </svg>
);
