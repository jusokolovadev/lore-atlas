import { Text, Progress, Heading } from 'src/components/ui';

import styles from './LoadingScreen.module.css';

export function LoadingScreen() {
  return (
    <main className={styles.screen}>
      <div className={styles.background} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.logoMark} aria-hidden="true">
          ✧
        </div>

        <Heading level={1} className={styles.title}>
          LORE ATLAS
        </Heading>

        <Text color="secondary" className={styles.subtitle}>
          A universe of stories
        </Text>

        <div className={styles.divider} aria-hidden="true">
          <span />
          <span className={styles.dividerSymbol}>◇</span>
          <span />
        </div>

        <div className={styles.loading}>
          <Text color="secondary">Preparing your worlds...</Text>

          <Progress indeterminate className={styles.progress} />
        </div>
      </div>

      <Text size="xs" color="tertiary" className={styles.version}>
        v0.1.0
      </Text>
    </main>
  );
}
