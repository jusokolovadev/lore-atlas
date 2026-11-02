import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Text } from '../Text/Text';
import { Heading } from '../Heading/Heading';
import { Popover } from './Popover';

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Popover displays interactive content in a floating panel.',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<Omit<ComponentProps<typeof Popover>, 'children'>>;

export const Default: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger>
        <Button variant="secondary">Open popover</Button>
      </Popover.Trigger>

      <Popover.Content aria-label="Example popover">
        <Text>Popover content</Text>
      </Popover.Content>
    </Popover>
  ),
};

export const Placements: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '80px',
        padding: '80px',
      }}
    >
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <Popover key={placement} placement={placement}>
          <Popover.Trigger>
            <Button variant="secondary">{placement}</Button>
          </Popover.Trigger>

          <Popover.Content aria-label={`${placement} popover`}>
            <Text>Position: {placement}</Text>
          </Popover.Content>
        </Popover>
      ))}
    </div>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger>
        <Button variant="secondary">Edit character</Button>
      </Popover.Trigger>

      <Popover.Content aria-label="Edit character" style={{ width: '280px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Heading level={3} size="lg">
            Edit character
          </Heading>

          <Input label="Character name" defaultValue="Aragorn" />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Popover.Close className="popover-cancel">Cancel</Popover.Close>

            <Button size="sm">Save</Button>
          </div>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const WithCloseButton: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger>
        <Button>Open</Button>
      </Popover.Trigger>

      <Popover.Content aria-label="Information">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text>Additional information about this entity.</Text>

          <Popover.Close>Close</Popover.Close>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const Controlled: Story = {
  render: function ControlledPopover() {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Text color="secondary">Popover is {open ? 'open' : 'closed'}</Text>

        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger>
            <Button variant="secondary">Toggle popover</Button>
          </Popover.Trigger>

          <Popover.Content aria-label="Controlled popover">
            <Text>This popover is controlled externally.</Text>
          </Popover.Content>
        </Popover>

        <Button variant="ghost" onClick={() => setOpen(false)}>
          Close externally
        </Button>
      </div>
    );
  },
};

export const DefaultOpen: Story = {
  render: () => (
    <Popover defaultOpen>
      <Popover.Trigger>
        <Button variant="secondary">Popover trigger</Button>
      </Popover.Trigger>

      <Popover.Content aria-label="Initially open popover">
        <Text>This popover starts in the open state.</Text>
      </Popover.Content>
    </Popover>
  ),
};

export const LoreAtlasExample: Story = {
  render: () => (
    <Popover placement="bottom-end">
      <Popover.Trigger>
        <Button variant="secondary">Entity actions</Button>
      </Popover.Trigger>

      <Popover.Content aria-label="Entity actions" style={{ width: '220px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Text weight="semibold">Character actions</Text>

          <Button variant="ghost" fullWidth>
            Edit character
          </Button>

          <Button variant="ghost" fullWidth>
            View relationships
          </Button>

          <Button variant="ghost" fullWidth>
            Add to collection
          </Button>

          <Popover.Close>Close</Popover.Close>
        </div>
      </Popover.Content>
    </Popover>
  ),
};
