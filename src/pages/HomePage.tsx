import styles from './HomePage.module.css';
import { ThemeToggle } from 'src/components/ui/ThemeToggle/ThemeToggle';

export function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <ThemeToggle />
      </header>
      <main className={styles.main}>
        <section className={styles.content} aria-labelledby="welcome-title">
          <p className={styles.eyebrow}>A workspace for imagined worlds</p>
          <h1 id="welcome-title">Lore Atlas</h1>
          <p className={styles.description}>
            Build your universe. Connect its stories. Keep every detail in one place.
          </p>
          <span className={styles.status}>Foundation initialized</span>
        </section>
      </main>
    </div>
  );
}
