import { render, screen } from '@testing-library/react';
import { HomePage } from 'src/pages/HomePage';

describe('HomePage', () => {
  it('renders the Lore Atlas welcome screen', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: 'Lore Atlas' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Build your universe/i)).toBeInTheDocument();
  });
});
