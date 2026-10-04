/**
 * The arithmetic behind `Pager`, kept pure so the off-by-one cases can be tested as arithmetic
 * rather than through a rendered component. Paging is almost entirely off-by-one cases.
 *
 * Pages are 1-based throughout, because that is what a pager shows and what a reader means by
 * "page 3". Converting to a 0-based offset is the caller's job and is one subtraction.
 */

export interface PageRange {
  /** The first item on the page, 1-based. 0 when there is nothing at all. */
  from: number;
  /** The last item on the page, 1-based. 0 when there is nothing at all. */
  to: number;
  /** How many pages there are. At least 1, so a pager with no rows still reads "page 1 of 1". */
  pages: number;
}

/** How many pages `total` items make at `pageSize`. Never 0: an empty list is one empty page. */
export function pageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

/** Keeps a page number inside the range that exists. */
export function clampPage(page: number, total: number, pageSize: number): number {
  const pages = pageCount(total, pageSize);
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(Math.trunc(page), 1), pages);
}

/**
 * Which items a page shows, as the "41–50 of 240" summary means it.
 *
 * The last page is short, so `to` is clamped to the total rather than being page × size — the
 * classic pager bug, where the final page claims rows that are not there.
 */
export function pageRange(total: number, page: number, pageSize: number): PageRange {
  const pages = pageCount(total, pageSize);
  if (total <= 0) return { from: 0, to: 0, pages };
  const current = clampPage(page, total, pageSize);
  const from = (current - 1) * pageSize + 1;
  return { from, to: Math.min(current * pageSize, total), pages };
}

/**
 * The page numbers to draw, with gaps where numbers were left out.
 *
 * The first and last page are always shown, because they are the two a reader reaches for, and
 * `siblings` pages either side of the current one. A gap is only drawn where it actually saves
 * something: a gap standing in for one page is wider than the page it hides.
 */
export function pageList(page: number, pages: number, siblings = 1): Array<number | 'gap'> {
  const current = Math.min(Math.max(page, 1), pages);
  const shown = new Set<number>([1, pages]);
  for (let i = current - siblings; i <= current + siblings; i += 1) {
    if (i >= 1 && i <= pages) shown.add(i);
  }

  const out: Array<number | 'gap'> = [];
  let previous = 0;
  for (const number of [...shown].sort((a, b) => a - b)) {
    // A gap that hides exactly one page is a lie that takes up more room than the truth.
    if (previous && number - previous === 2) out.push(previous + 1);
    else if (previous && number - previous > 2) out.push('gap');
    out.push(number);
    previous = number;
  }
  return out;
}
