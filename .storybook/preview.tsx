import type { Preview } from '@storybook/react-vite';
import { useLayoutEffect, type ReactNode } from 'react';
import '../src/styles/themes.css';
import '../src/styles/global.css';

type Theme = 'dark' | 'light' | 'system';

type ThemeWrapperProps = {
  theme: Theme;
  children: ReactNode;
};

function ThemeWrapper({ theme, children }: ThemeWrapperProps) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: light)',
    );

    const applyTheme = () => {
      const resolvedTheme =
        theme === 'system'
          ? mediaQuery.matches
            ? 'light'
            : 'dark'
          : theme;

      root.dataset.theme = resolvedTheme;
    };

    applyTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);

      return () => {
        mediaQuery.removeEventListener('change', applyTheme);
      };
    }
  }, [theme]);

  return children;
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Application theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
          { value: 'system', title: 'System' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'dark',
  },

  decorators: [
    (Story, context) => (
      <ThemeWrapper theme={context.globals.theme as Theme}>
        <Story />
      </ThemeWrapper>
    ),
  ],

  parameters: {
    controls: {
      expanded: true,
    },
    actions: {
      argTypesRegex: '^on[A-Z].*',
    },
    layout: 'centered',
  },
};

export default preview;
