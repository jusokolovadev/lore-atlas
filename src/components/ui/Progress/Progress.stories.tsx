import type { Meta, StoryObj } from '@storybook/react-vite';

import { Progress } from './Progress';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Progress indicators communicate the completion status of an operation or task.',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 65,
  },
};

export const WithLabel: Story = {
  args: {
    value: 65,
    label: 'Universe completion',
    showValue: true,
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Progress value={70} label="Default" showValue />
      <Progress value={85} label="Success" variant="success" showValue />
      <Progress value={45} label="Warning" variant="warning" showValue />
      <Progress value={25} label="Error" variant="error" showValue />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Progress value={60} size="sm" />
      <Progress value={60} size="md" />
      <Progress value={60} size="lg" />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    label: 'Importing universe',
    showValue: true,
  },
};

export const WithoutAnimation: Story = {
  args: {
    value: 65,
    animated: false,
    showValue: true,
  },
};

export const WithoutTrack: Story = {
  args: {
    value: 65,
    showTrack: false,
  },
};

export const Circular: Story = {
  args: {
    type: 'circular',
    value: 75,
    showValue: true,
  },
};

export const CircularSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <Progress type="circular" value={65} size="sm" showValue />
      <Progress type="circular" value={65} size="md" showValue />
      <Progress type="circular" value={65} size="lg" showValue />
    </div>
  ),
};

export const CircularVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <Progress type="circular" value={80} variant="default" showValue />
      <Progress type="circular" value={80} variant="success" showValue />
      <Progress type="circular" value={45} variant="warning" showValue />
      <Progress type="circular" value={25} variant="error" showValue />
    </div>
  ),
};

export const CircularIndeterminate: Story = {
  args: {
    type: 'circular',
    indeterminate: true,
    showValue: true,
    label: 'Loading',
  },
};

export const LoreAtlasExample: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 420,
      }}
    >
      <Progress value={72} label="The Ashen Kingdom" showValue />

      <Progress value={48} label="Character profiles" variant="success" showValue />

      <Progress value={30} label="World locations" variant="warning" showValue />

      <Progress indeterminate label="Importing universe data" showValue />
    </div>
  ),
};
