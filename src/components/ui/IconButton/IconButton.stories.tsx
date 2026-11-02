import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

const meta = {
  title: 'UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'IconButton is a compact button that displays an icon and requires an accessible label.',
      },
    },
  },
  args: {
    icon: '✎',
    label: 'Edit',
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    icon: '×',
    label: 'Delete',
    variant: 'danger',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const CommonActions: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <IconButton icon="✎" label="Edit" />
      <IconButton icon="×" label="Close" />
      <IconButton icon="⋯" label="More actions" />
      <IconButton icon="⌫" label="Delete" variant="danger" />
    </div>
  ),
};
