import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Skeleton displays placeholder content while data is loading. Supports text, circular and rectangular variants.',
      },
    },
  },
  args: {
    variant: 'text',
    animated: true,
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Text: Story = {
  args: {
    variant: 'text',
    width: '240px',
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: '320px',
    height: '180px',
  },
};

export const WithoutAnimation: Story = {
  args: {
    variant: 'rectangular',
    animated: false,
  },
};

export const TextLines: Story = {
  render: () => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}
    >
      <Skeleton width="100%" />
      <Skeleton width="90%" />
      <Skeleton width="75%" />
      <Skeleton width="60%" />
    </div>
  ),
};

export const AvatarWithText: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Skeleton variant="circular" width={48} height={48} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <Skeleton width="140px" />
        <Skeleton width="90px" height="12px" />
      </div>
    </div>
  ),
};

export const CardLoading: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '320px',
        padding: '16px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface)',
      }}
    >
      <Skeleton variant="rectangular" height="160px" />
      <Skeleton width="65%" height="20px" />
      <Skeleton width="100%" />
      <Skeleton width="90%" />
      <Skeleton width="45%" />
    </div>
  ),
};

export const CharacterCardLoading: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        maxWidth: '400px',
        padding: '16px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <Skeleton variant="circular" width={64} height={64} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <Skeleton width="55%" height="20px" />
        <Skeleton width="35%" height="12px" />
        <Skeleton width="100%" />
        <Skeleton width="85%" />
      </div>
    </div>
  ),
};
