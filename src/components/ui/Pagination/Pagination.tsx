import type { ComponentPropsWithoutRef } from 'react';

import styles from './Pagination.module.css';

export type PaginationSize = 'sm' | 'md';

type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

export interface PaginationProps extends Omit<
  ComponentPropsWithoutRef<'nav'>,
  'onChange'
> {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  showFirstLast?: boolean;
  size?: PaginationSize;
  disabled?: boolean;
}

function getPageItems(
  page: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PageItem[] {
  if (totalPages <= 0) {
    return [];
  }

  const pages = new Set<number>();

  // Pages at the beginning.
  for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) {
    pages.add(i);
  }

  // Pages around the current page.
  const siblingStart = Math.max(1, page - siblingCount);
  const siblingEnd = Math.min(totalPages, page + siblingCount);

  for (let i = siblingStart; i <= siblingEnd; i++) {
    pages.add(i);
  }

  // Pages at the end.
  for (let i = Math.max(1, totalPages - boundaryCount + 1); i <= totalPages; i++) {
    pages.add(i);
  }

  const sortedPages = [...pages].sort((a, b) => a - b);
  const result: PageItem[] = [];

  sortedPages.forEach((currentPage, index) => {
    if (index > 0) {
      const previousPage = sortedPages[index - 1];
      const gap = currentPage - previousPage;

      if (gap === 2) {
        result.push(previousPage + 1);
      } else if (gap > 2) {
        result.push(index === 1 ? 'start-ellipsis' : 'end-ellipsis');
      }
    }

    result.push(currentPage);
  });

  return result;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  showFirstLast = true,
  size = 'md',
  disabled = false,
  className = '',
  ...navProps
}: PaginationProps) {
  const safeTotalPages = Math.max(0, Math.floor(totalPages));

  if (safeTotalPages === 0) {
    return null;
  }

  const currentPage = Math.min(Math.max(1, Math.floor(page)), safeTotalPages);

  const safeSiblingCount = Math.max(0, Math.floor(siblingCount));
  const safeBoundaryCount = Math.max(0, Math.floor(boundaryCount));

  const pageItems = getPageItems(
    currentPage,
    safeTotalPages,
    safeSiblingCount,
    safeBoundaryCount,
  );

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === safeTotalPages;

  const rootClassName = [
    styles.root,
    styles[size],
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const buttonClassName = styles.button;

  const goToPage = (nextPage: number) => {
    if (
      disabled ||
      nextPage < 1 ||
      nextPage > safeTotalPages ||
      nextPage === currentPage
    ) {
      return;
    }

    onPageChange(nextPage);
  };

  return (
    <nav
      {...navProps}
      aria-label={navProps['aria-label'] ?? 'Pagination'}
      className={rootClassName}
    >
      <ul className={styles.list}>
        {showFirstLast && (
          <li>
            <button
              type="button"
              className={buttonClassName}
              aria-label="Go to first page"
              disabled={disabled || isFirstPage}
              onClick={() => goToPage(1)}
            >
              <span aria-hidden="true">«</span>
            </button>
          </li>
        )}

        <li>
          <button
            type="button"
            className={buttonClassName}
            aria-label="Go to previous page"
            disabled={disabled || isFirstPage}
            onClick={() => goToPage(currentPage - 1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
        </li>

        {pageItems.map((item) => {
          if (typeof item !== 'number') {
            return (
              <li key={item} className={styles.ellipsis} aria-hidden="true">
                …
              </li>
            );
          }

          const isCurrent = item === currentPage;

          return (
            <li key={item}>
              <button
                type="button"
                className={[buttonClassName, isCurrent && styles.active]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`Page ${item}`}
                aria-current={isCurrent ? 'page' : undefined}
                disabled={disabled}
                onClick={() => goToPage(item)}
              >
                {item}
              </button>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            className={buttonClassName}
            aria-label="Go to next page"
            disabled={disabled || isLastPage}
            onClick={() => goToPage(currentPage + 1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </li>

        {showFirstLast && (
          <li>
            <button
              type="button"
              className={buttonClassName}
              aria-label="Go to last page"
              disabled={disabled || isLastPage}
              onClick={() => goToPage(safeTotalPages)}
            >
              <span aria-hidden="true">»</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export { Pagination };
