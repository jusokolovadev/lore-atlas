export type Theme = 'dark' | 'light' | 'system';

export type ResolvedTheme = 'dark' | 'light';

export interface ThemeContextValue {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
}