import type { CSSProperties, ReactNode } from 'react';
import { IconButton } from '../Button/Button';
import { Select, SelectItem } from '../Select/Select';
import { useControlledState } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type PagerSlot,
  type SlotOverrides,
} from '../../config/config';
import { clampPage, pageCount, pageList, pageRange } from './paging';
import { pager as spec } from './specs';
import styles from './Pager.module.scss';

export interface PagerProps {
  /** How many items there are in total, not how many are on this page. */
  total: number;
  /** The current page, 1-based — what the pager shows and what a reader means by "page 3". */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (size: number) => void;
  /** The page sizes to offer. Pass an empty array to drop the chooser. */
  pageSizes?: readonly number[];
  /** Hides the numbered buttons, leaving the arrows and the summary. */
  numbers?: boolean;
  /** How many pages either side of the current one to draw before a gap. */
  siblings?: number;
  /** Replaces the "41–50 of 240" summary. */
  summary?: (range: { from: number; to: number; total: number }) => ReactNode;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<PagerSlot>;
}

/**
 * A pager: which page you are on, how to get to another, and how many rows a page holds.
 *
 * **The summary is a live region, and that is the part most pagers miss.** Pressing "next"
 * changes a table somewhere else on the page; without an announcement, a screen reader user
 * presses a button and is told nothing at all. Here "41–50 of 240" is `aria-live="polite"`, so
 * the result of the press is spoken.
 *
 * The page buttons say which page they go to *and* which one you are on — `aria-current="page"`
 * on the current one — so the set reads as a position rather than as a row of numbers.
 *
 * The arithmetic is in `paging.ts` and tested there. Paging is almost entirely off-by-one
 * cases: the last page is short, an empty list is still one page, and a gap that hides a single
 * page is wider than the page it hides.
 */
export function Pager(props: PagerProps) {
  const { defaults, slots } = useComponentConfig('Pager');
  const {
    total,
    page,
    defaultPage = 1,
    onPageChange,
    pageSize,
    defaultPageSize = defaults?.pageSize ?? spec.pageSizes[0],
    onPageSizeChange,
    pageSizes = defaults?.pageSizes ?? spec.pageSizes,
    numbers = defaults?.numbers ?? true,
    siblings = spec.siblings,
    summary,
    'aria-label': ariaLabel = 'Pagination',
    className,
    classNames,
    style,
  } = props;

  const [size, setSize] = useControlledState(pageSize, defaultPageSize, onPageSizeChange);
  const [at, setAt] = useControlledState(page, defaultPage, onPageChange);
  const current = clampPage(at, total, size);
  const { from, to, pages } = pageRange(total, current, size);

  const go = (next: number) => setAt(clampPage(next, total, size));

  const slot = (name: PagerSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <nav className={slot('root', 'grange-pager', styles.pager)} style={style} aria-label={ariaLabel}>
      {pageSizes.length > 0 && (
        <Select
          aria-label="Rows per page"
          className={styles.size}
          selectedKey={String(size)}
          onSelectionChange={(key) => {
            const next = Number(key);
            setSize(next);
            // Keep the reader roughly where they were: the row they were looking at is still
            // on screen, which jumping to page 1 would not manage.
            setAt(clampPage(Math.floor((from - 1) / next) + 1, total, next));
          }}
        >
          {pageSizes.map((value) => (
            <SelectItem key={String(value)}>{String(value)}</SelectItem>
          ))}
        </Select>
      )}

      {/*
        A live region. Pressing "next" changes a table elsewhere on the page; without this, the
        press is silent and the reader is told nothing about what it did.
      */}
      <span className={slot('summary', 'grange-pager-summary', styles.summary)} aria-live="polite">
        {summary ? summary({ from, to, total }) : `${from}–${to} of ${total}`}
      </span>

      <span className={styles.controls}>
        <IconButton
          variant="standard"
          size="xs"
          aria-label="First page"
          disabled={current === 1}
          onClick={() => go(1)}
        >
          <Glyph path="M240-240v-480h80v480h-80Zm520 0L520-480l240-240v480Z" />
        </IconButton>
        <IconButton
          variant="standard"
          size="xs"
          aria-label="Previous page"
          disabled={current === 1}
          onClick={() => go(current - 1)}
        >
          <Glyph path="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" />
        </IconButton>

        {numbers &&
          pageList(current, pages, siblings).map((entry, i) =>
            entry === 'gap' ? (
              // Not a button and not announced: it stands for pages that are not offered.
              <span key={`gap-${i}`} className={styles.gap} aria-hidden="true">
                &hellip;
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                className={slot('page', 'grange-pager-page', styles.page)}
                aria-label={`Page ${entry}`}
                aria-current={entry === current ? 'page' : undefined}
                onClick={() => go(entry)}
              >
                {entry}
              </button>
            ),
          )}

        <IconButton
          variant="standard"
          size="xs"
          aria-label="Next page"
          disabled={current === pages}
          onClick={() => go(current + 1)}
        >
          <Glyph path="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
        </IconButton>
        <IconButton
          variant="standard"
          size="xs"
          aria-label="Last page"
          disabled={current === pages}
          onClick={() => go(pageCount(total, size))}
        >
          <Glyph path="M640-240v-480h80v480h-80Zm-440 0v-480l240 240-240 240Z" />
        </IconButton>
      </span>
    </nav>
  );
}

const Glyph = ({ path }: { path: string }) => (
  <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
    <path d={path} />
  </svg>
);
