import { Button, Text, Heading } from 'src/components/ui';

import styles from './InitializationError.module.css';

interface InitializationErrorProps {
  message: string;
  onRetry: () => void;
}

export function InitializationError({ message, onRetry }: InitializationErrorProps) {
  return (
    <main className={styles.screen}>
      <div className={styles.background} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          ✧
        </div>

        <Heading level={1} className={styles.title}>
          The atlas is not ready
        </Heading>

        <Text color="secondary" className={styles.message}>
          {message}
        </Text>

        <Button onClick={onRetry}>Try again</Button>
      </div>

      <Text size="xs" color="tertiary" className={styles.version}>
        v0.1.0
      </Text>
    </main>
  );
}
