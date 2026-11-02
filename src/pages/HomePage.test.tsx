import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'src/features/theme/ThemeProvider.tsx';
import { HomePage } from 'src/pages/HomePage';

describe('HomePage', () => {
  it('renders the Lore Atlas welcome screen', () => {
    render(
      <ThemeProvider>
        <HomePage />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Lore Atlas' })).toBeInTheDocument();
    expect(screen.getByText(/Build your universe/i)).toBeInTheDocument();
  });
});
