import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, hint, error, className = '', ...props },
  ref,
) {
  const textareaId =
    id ??
    (label ? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`${styles.textarea} ${error ? styles.invalid : ''} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
        }
        {...props}
      />
      {error ? (
        <span className={styles.error} id={`${textareaId}-error`}>
          {error}
        </span>
      ) : hint ? (
        <span className={styles.hint} id={`${textareaId}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
});
