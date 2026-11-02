import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './Separator';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Separator visually and semantically divides content. Supports horizontal and vertical orientations.',
      },
    },
  },
  args: {
    orientation: 'horizontal',
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Horizontal: Story = {
  render: () => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <span>First section</span>
      <Separator orientation="horizontal" />
      <span>Second section</span>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        height: '80px',
      }}
    >
      <span>Characters</span>
      <Separator orientation="vertical" />
      <span>Locations</span>
      <Separator orientation="vertical" />
      <span>Events</span>
    </div>
  ),
};

export const InContent: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '400px',
      }}
    >
      <div>
        <strong>Overview</strong>
        <p>General information about this universe.</p>
      </div>

      <Separator />

      <div>
        <strong>Characters</strong>
        <p>Explore the inhabitants of this world.</p>
      </div>

      <Separator />

      <div>
        <strong>Locations</strong>
        <p>Discover important places and regions.</p>
      </div>
    </div>
  ),
};

export const InToolbar: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: '40px',
      }}
    >
      <button type="button">Bold</button>
      <button type="button">Italic</button>
      <button type="button">Underline</button>

      <Separator orientation="vertical" />

      <button type="button">Link</button>
      <button type="button">Image</button>
    </div>
  ),
};
