import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppInitialization } from './AppInitialization';
import { initializeApp } from './initializeApp';

// Mock the initialization function.
// We test AppInitialization separately from the actual initialization logic.
jest.mock('./initializeApp', () => ({
  initializeApp: jest.fn(),
}));

const mockedInitializeApp = jest.mocked(initializeApp);

describe('AppInitialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders LoadingScreen while initialization is pending', () => {
    mockedInitializeApp.mockReturnValue(new Promise<void>(() => {}));

    render(
      <AppInitialization>
        <div>Application content</div>
      </AppInitialization>,
    );

    expect(screen.getByText('Preparing your worlds...')).toBeInTheDocument();

    expect(screen.queryByText('Application content')).not.toBeInTheDocument();
  });

  it('renders application content after successful initialization', async () => {
    mockedInitializeApp.mockResolvedValue(undefined);

    render(
      <AppInitialization>
        <div>Application content</div>
      </AppInitialization>,
    );

    expect(await screen.findByText('Application content')).toBeInTheDocument();
  });

  it('renders InitializationError after failed initialization', async () => {
    mockedInitializeApp.mockRejectedValue(new Error('Database connection failed'));

    render(
      <AppInitialization>
        <div>Application content</div>
      </AppInitialization>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'The atlas is not ready',
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();

    expect(screen.queryByText('Application content')).not.toBeInTheDocument();
  });

  it('retries initialization after clicking Try again', async () => {
    const user = userEvent.setup();

    mockedInitializeApp
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce(undefined);

    render(
      <AppInitialization>
        <div>Application content</div>
      </AppInitialization>,
    );

    const retryButton = await screen.findByRole('button', {
      name: 'Try again',
    });

    await user.click(retryButton);

    expect(await screen.findByText('Application content')).toBeInTheDocument();

    expect(mockedInitializeApp).toHaveBeenCalledTimes(2);
  });
});
