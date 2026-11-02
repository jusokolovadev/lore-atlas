import { useEffect, useId, useRef, useState, Fragment, type ReactNode } from 'react';

import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

export type BreadcrumbsSize = 'sm' | 'md';

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  ariaLabel?: string;
  maxItems?: number;
  size?: BreadcrumbsSize;
  separator?: ReactNode;
  className?: string;
}

function Breadcrumbs({
  items,
  ariaLabel = 'Breadcrumb',
  maxItems = 4,
  size = 'md',
  separator = '›',
  className = '',
}: BreadcrumbsProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);

  const containerRef = useRef<HTMLElement | null>(null);
  const menuId = useId();
  const overflowTriggerRef = useRef<HTMLButtonElement | null>(null);

  const limit = Math.max(3, maxItems);
  const shouldCollapse = items.length > limit;

  const tailCount = limit - 2;

  const hiddenItems = shouldCollapse ? items.slice(1, items.length - tailCount) : [];

  const visibleItems = shouldCollapse
    ? [items[0], ...items.slice(items.length - tailCount)]
    : items;

  useEffect(() => {
    if (!overflowOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOverflowOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOverflowOpen(false);
        overflowTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [overflowOpen]);

  if (items.length === 0) {
    return null;
  }

  const renderItem = (item: BreadcrumbItem, index: number) => {
    const isCurrent = item.current ?? index === items.length - 1;

    const itemClassName = [styles.item, isCurrent && styles.current]
      .filter(Boolean)
      .join(' ');

    if (isCurrent) {
      return (
        <span className={itemClassName} aria-current="page">
          {item.label}
        </span>
      );
    }

    if (item.href) {
      return (
        <a href={item.href} className={itemClassName} onClick={item.onClick}>
          {item.label}
        </a>
      );
    }

    if (item.onClick) {
      return (
        <button type="button" className={itemClassName} onClick={item.onClick}>
          {item.label}
        </button>
      );
    }

    return <span className={itemClassName}>{item.label}</span>;
  };

  const renderSeparator = (key: string) => (
    <li key={key} className={styles.separator} aria-hidden="true">
      {separator}
    </li>
  );

  const renderBreadcrumb = (item: BreadcrumbItem, index: number, key: string) => (
    <li key={key} className={styles.listItem}>
      {renderItem(item, index)}
    </li>
  );

  return (
    <nav
      ref={containerRef}
      aria-label={ariaLabel}
      className={[styles.root, styles[size], className].filter(Boolean).join(' ')}
    >
      <ol className={styles.list}>
        {shouldCollapse ? (
          <>
            {renderBreadcrumb(visibleItems[0], 0, 'first')}

            {renderSeparator('separator-first')}

            <li className={styles.overflow}>
              <button
                type="button"
                className={styles.overflowTrigger}
                aria-label="Show earlier breadcrumbs"
                aria-expanded={overflowOpen}
                aria-controls={menuId}
                onClick={() => setOverflowOpen((open) => !open)}
                ref={overflowTriggerRef}
              >
                <span aria-hidden="true">•••</span>
              </button>

              {overflowOpen && (
                <ol
                  id={menuId}
                  className={styles.overflowMenu}
                  aria-label="Earlier breadcrumb pages"
                >
                  {hiddenItems.map((item, index) => (
                    <li key={`${index}-${String(item.href ?? '')}`}>
                      {renderItem(item, index + 1)}
                    </li>
                  ))}
                </ol>
              )}
            </li>

            {visibleItems.slice(1).map((item, index) => (
              <Fragment key={`visible-${index}`}>
                {renderSeparator(`separator-${index}`)}

                {renderBreadcrumb(
                  item,
                  items.length - visibleItems.length + index + 1,
                  `tail-${index}`,
                )}
              </Fragment>
            ))}
          </>
        ) : (
          items.map((item, index) => (
            <Fragment key={`item-${index}`}>
              {index > 0 && renderSeparator(`separator-${index}`)}

              {renderBreadcrumb(item, index, `crumb-${index}`)}
            </Fragment>
          ))
        )}
      </ol>
    </nav>
  );
}

export { Breadcrumbs };
