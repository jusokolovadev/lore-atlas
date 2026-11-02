import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Spinner indicates that an operation is currently in progress.',
      },
    },
  },
  args: {
    size: 'md',
    label: 'Loading',
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

export const CustomLabel: Story = {
  args: {
    label: 'Saving changes',
  },
};

export const InButton: Story = {
  render: () => (
    <button
      type="button"
      disabled
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '8px',
        background: 'var(--color-primary)',
        color: 'white',
        opacity: 0.8,
      }}
    >
      <Spinner size="sm" label="Saving" />
      Saving...
    </button>
  ),
};

export const PageLoading: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '48px',
      }}
    >
      <Spinner size="lg" label="Loading universe" />
      <span style={{ color: 'var(--color-text-secondary)' }}>Loading universe...</span>
    </div>
  ),
};

export const GraphLoading: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '320px',
        height: '200px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface)',
      }}
    >
      <Spinner label="Loading graph" />
      <span>Loading graph...</span>
    </div>
  ),
};
