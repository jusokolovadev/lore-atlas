import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tooltip displays contextual information when an element receives hover or keyboard focus.',
      },
    },
  },
  args: {
    content: 'This is a helpful tooltip',
    children: <Button>Hover me</Button>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Placements: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '64px',
        padding: '64px',
      }}
    >
      <Tooltip content="Appears above" placement="top">
        <Button>Top</Button>
      </Tooltip>

      <Tooltip content="Appears below" placement="bottom">
        <Button>Bottom</Button>
      </Tooltip>

      <Tooltip content="Appears on the left" placement="left">
        <Button>Left</Button>
      </Tooltip>

      <Tooltip content="Appears on the right" placement="right">
        <Button>Right</Button>
      </Tooltip>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const LongContent: Story = {
  args: {
    content:
      'This tooltip contains a longer explanation about an element in the Lore Atlas interface.',
  },
};

export const IconButtonTooltip: Story = {
  render: () => (
    <Tooltip content="Edit character">
      <IconButton icon={<span>✎</span>} label="Edit character" variant="ghost" />
    </Tooltip>
  ),
};

export const KeyboardFocus: Story = {
  render: () => (
    <Tooltip content="You can also see this tooltip using keyboard navigation">
      <Button>Tab to focus me</Button>
    </Tooltip>
  ),
};
