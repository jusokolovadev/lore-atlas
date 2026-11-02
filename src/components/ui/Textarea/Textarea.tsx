import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styles from './Textarea.module.css';
import { Text } from '../Text/Text';

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
        <Text color="error" size="xs" id={`${textareaId}-error`}>
          {error}
        </Text>
      ) : hint ? (
        <Text color="secondary" size="xs" id={`${textareaId}-hint`}>
          {hint}
        </Text>
      ) : null}
    </div>
  );
});
