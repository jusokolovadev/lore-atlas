import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Avatar displays an image or a fallback with initials when an image is unavailable.',
      },
    },
  },
  args: {
    name: 'John Doe',
    size: 'md',
    shape: 'circle',
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=12',
    alt: 'Portrait of John Doe',
  },
};

export const Fallback: Story = {
  args: {
    name: 'Aria Moon',
  },
};

export const WithoutName: Story = {
  args: {
    name: undefined,
  },
};

export const ImageError: Story = {
  args: {
    src: 'https://example.invalid/avatar.png',
    name: 'Aria Moon',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar name="Aria Moon" size="sm" />
      <Avatar name="Aria Moon" size="md" />
      <Avatar name="Aria Moon" size="lg" />
      <Avatar name="Aria Moon" size="xl" />
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar name="Aria Moon" shape="circle" size="lg" />
      <Avatar name="Aria Moon" shape="square" size="lg" />
    </div>
  ),
};

export const LoreAtlasCharacters: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar name="Aria Moon" size="lg" />
      <Avatar name="Elias Blackwood" size="lg" />
      <Avatar name="Mira" size="lg" />
    </div>
  ),
};
