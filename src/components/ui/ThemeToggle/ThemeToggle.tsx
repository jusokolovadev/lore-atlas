import { useTheme } from 'src/features/theme/useTheme.ts';
import type { Theme } from 'src/features/theme/theme.types.ts';

import styles from './ThemeToggle.module.css';

const options: {
  value: Theme;
  label: string;
  icon: string;
}[] = [
  {
    value: 'dark',
    label: 'Dark',
    icon: '🌙',
  },
  {
    value: 'light',
    label: 'Light',
    icon: '☀️',
  },
  {
    value: 'system',
    label: 'System',
    icon: '💻',
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.toggle} role="group" aria-label="Theme selection">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.option} ${theme === option.value ? styles.active : ''}`}
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
        >
          <span aria-hidden="true">{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
