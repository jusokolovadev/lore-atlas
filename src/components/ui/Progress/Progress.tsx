import { useId, type HTMLAttributes } from 'react';

import styles from './Progress.module.css';

export type ProgressType = 'linear' | 'circular';

export type ProgressVariant = 'default' | 'success' | 'warning' | 'error';

export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  label?: string;
  type?: ProgressType;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showValue?: boolean;
  indeterminate?: boolean;
  animated?: boolean;
  showTrack?: boolean;
}

const CIRCUMFERENCE = 2 * Math.PI * 18;

function Progress({
  value = 0,
  max = 100,
  label,
  type = 'linear',
  variant = 'default',
  size = 'md',
  showValue = false,
  indeterminate = false,
  animated = true,
  showTrack = true,
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ProgressProps) {
  const generatedId = useId();
  const labelId = `${generatedId}-label`;

  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), safeMax) : 0;

  const percentage = Math.round((safeValue / safeMax) * 100);

  const rootClassName = [
    styles.root,
    styles[type],
    styles[size],
    styles[variant],
    animated && styles.animated,
    indeterminate && styles.indeterminate,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const accessibilityProps = {
    role: 'progressbar' as const,
    'aria-valuemin': 0,
    'aria-valuemax': safeMax,
    'aria-valuenow': indeterminate ? undefined : safeValue,
    'aria-valuetext': indeterminate ? 'In progress' : `${percentage}%`,
    'aria-labelledby': label ? labelId : undefined,
    'aria-label': label ? undefined : (ariaLabel ?? 'Progress'),
  };

  if (type === 'circular') {
    const strokeOffset = CIRCUMFERENCE * (1 - percentage / 100);

    return (
      <div className={rootClassName} {...props}>
        <div className={styles.circularWrapper} {...accessibilityProps}>
          <svg className={styles.circularSvg} viewBox="0 0 40 40" aria-hidden="true">
            {showTrack && (
              <circle className={styles.circularTrack} cx="20" cy="20" r="18" />
            )}

            <circle
              className={styles.circularFill}
              cx="20"
              cy="20"
              r="18"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={indeterminate ? undefined : strokeOffset}
            />
          </svg>

          {showValue && (
            <span className={styles.circularValue}>
              {indeterminate ? '…' : `${percentage}%`}
            </span>
          )}
        </div>

        {label && (
          <span id={labelId} className={styles.circularLabel}>
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={rootClassName} {...props}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && (
            <span id={labelId} className={styles.label}>
              {label}
            </span>
          )}

          {showValue && (
            <span className={styles.value}>
              {indeterminate ? 'In progress' : `${percentage}%`}
            </span>
          )}
        </div>
      )}

      <div
        className={[styles.track, !showTrack && styles.noTrack].filter(Boolean).join(' ')}
        {...accessibilityProps}
      >
        <div
          className={styles.fill}
          style={{
            width: indeterminate ? undefined : `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

export { Progress };
