import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppInitialization } from './AppInitialization';
import { initializeApp } from './initializeApp';

// Mock the initialization function.
// We test AppInitialization separately from the actual initialization logic.
jest.mock('./initializeApp', () => ({
  initializeApp: jest.fn(),
}));

const mockedInitializeApp = jest.mocked(initializeApp);

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AppInitialization', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('keeps LoadingScreen visible for at least 2 seconds', async () => {
    mockedInitializeApp.mockResolvedValue(undefined);

    render(
      <AppInitialization>
        <div>Application content</div>
      </AppInitialization>,
    );

    expect(screen.getByText('Preparing your worlds...')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.getByText('Preparing your worlds...')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText('Application content')).toBeInTheDocument();
  });

  it('keeps LoadingScreen visible until initialization finishes', async () => {
    let resolveInitialization!: () => void;

    mockedInitializeApp.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveInitialization = resolve;
      }),
    );

    render(
      <AppInitialization>
        <div>Application content</div>
      </AppInitialization>,
    );

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Preparing your worlds...')).toBeInTheDocument();

    await act(async () => {
      resolveInitialization();
    });

    expect(screen.getByText('Application content')).toBeInTheDocument();
  });

  it('renders InitializationError after failed initialization', async () => {
    mockedInitializeApp.mockRejectedValue(new Error('Database connection failed'));

    render(
      <AppInitialization>
        <div>Application content</div>
      </AppInitialization>,
    );

    await flushPromises();

    expect(
      screen.getByRole('heading', {
        name: 'The atlas is not ready',
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();

    expect(screen.queryByText('Application content')).not.toBeInTheDocument();
  });

  it('retries initialization after clicking Try again', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    mockedInitializeApp
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce(undefined);

    render(
      <AppInitialization>
        <div>Application content</div>
      </AppInitialization>,
    );

    await flushPromises();

    const retryButton = screen.getByRole('button', {
      name: 'Try again',
    });

    await user.click(retryButton);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Application content')).toBeInTheDocument();

    expect(mockedInitializeApp).toHaveBeenCalledTimes(2);
  });
});
