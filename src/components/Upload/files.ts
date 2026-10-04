/**
 * File validation and formatting, kept pure.
 *
 * `accept` matching is the part worth testing: it takes three different kinds of pattern in one
 * comma-separated string, and getting it slightly wrong either rejects files people chose or
 * lets through ones the server will refuse.
 */

export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadFile {
  /** Stable across renders. The caller's own id, or one made from the name and size. */
  id: string;
  name: string;
  size: number;
  type?: string;
  status: FileStatus;
  /** 0 to 1 while uploading. Absent means "started, length unknown". */
  progress?: number;
  /** Why it failed, shown beside the row and announced. */
  error?: string;
  /** The file itself, when it came from a picker or a drop rather than from the server. */
  file?: File;
}

/**
 * Whether a file matches an `accept` string, which the file input understands three ways:
 * an extension (`.png`), a full type (`image/png`), or a wildcard (`image/*`).
 *
 * An empty or missing `accept` takes everything, as the attribute does. Matching is
 * case-insensitive, because `.PNG` off a camera is the same file as `.png`.
 */
export function acceptsFile(file: FileLike, accept?: string): boolean {
  if (!accept || accept.trim() === '') return true;

  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();

  return accept
    .split(',')
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean)
    .some((pattern) => {
      if (pattern.startsWith('.')) return name.endsWith(pattern);
      if (pattern.endsWith('/*')) return type.startsWith(`${pattern.slice(0, -1)}`);
      return type === pattern;
    });
}

export interface FileRules {
  accept?: string;
  /** The largest a file may be, in bytes. */
  maxSize?: number;
}

/**
 * Why a file cannot be accepted, or null if it can.
 *
 * A sentence rather than a code, because it is shown beside the file and read out: "Too large
 * (4.2 MB of 2 MB)" tells someone what to do and "E_SIZE" does not.
 */
export function rejectReason(file: FileLike, rules: FileRules = {}): string | null {
  if (!acceptsFile(file, rules.accept)) return `Not an accepted type (${rules.accept})`;
  if (rules.maxSize != null && file.size > rules.maxSize) {
    return `Too large (${formatBytes(file.size)} of ${formatBytes(rules.maxSize)})`;
  }
  return null;
}

const UNITS = ['B', 'kB', 'MB', 'GB', 'TB'] as const;

/**
 * A size people can read.
 *
 * Decimal rather than binary units — kB is 1000 bytes — because that is what every operating
 * system's file browser shows, and a component that disagrees with the file browser looks
 * broken rather than precise.
 */
export function formatBytes(bytes: number, locale?: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1000) return `${Math.round(bytes)} B`;

  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  // One decimal below 10, none above: "4.2 MB" and "128 MB", which is how a file browser reads.
  const digits = value < 10 ? 1 : 0;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value)} ${UNITS[unit]}`;
}

/** An id for a file the caller has not given one, stable for the same file in the same list. */
export function fileId(file: FileLike, index = 0): string {
  return `${file.name}:${file.size}:${index}`;
}

/** Turns picked or dropped files into rows, marking the ones that cannot be accepted. */
export function toUploadFiles(files: readonly File[], rules: FileRules = {}): UploadFile[] {
  return files.map((file, index) => {
    const reason = rejectReason(file, rules);
    return {
      id: fileId(file, index),
      name: file.name,
      size: file.size,
      type: file.type,
      // Rejected up front rather than on submit: telling someone a file is too large after
      // they have waited for it to upload is the worst time to say so.
      status: reason ? ('error' as const) : ('pending' as const),
      ...(reason ? { error: reason } : {}),
      file,
    };
  });
}
