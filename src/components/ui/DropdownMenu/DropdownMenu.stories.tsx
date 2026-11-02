import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Text } from '../Text/Text';
import { DropdownMenu } from './DropdownMenu';

const meta = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'DropdownMenu provides an accessible menu of actions with keyboard navigation, typeahead, and automatic positioning.',
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<Omit<ComponentProps<typeof DropdownMenu>, 'children'>>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <Button variant="secondary">Actions</Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={() => console.log('Edit')}>Edit</DropdownMenu.Item>

        <DropdownMenu.Item onSelect={() => console.log('Duplicate')}>
          Duplicate
        </DropdownMenu.Item>

        <DropdownMenu.Item onSelect={() => console.log('Archive')}>
          Archive
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <Button variant="secondary">Actions</Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item>View</DropdownMenu.Item>
        <DropdownMenu.Item>Edit</DropdownMenu.Item>

        <DropdownMenu.Separator />

        <DropdownMenu.Item destructive>Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <Button variant="secondary">Options</Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Group>
          <DropdownMenu.Label>Character</DropdownMenu.Label>
          <DropdownMenu.Item>Edit character</DropdownMenu.Item>
          <DropdownMenu.Item>View relationships</DropdownMenu.Item>
        </DropdownMenu.Group>

        <DropdownMenu.Separator />

        <DropdownMenu.Group>
          <DropdownMenu.Label>Organization</DropdownMenu.Label>
          <DropdownMenu.Item>Add to collection</DropdownMenu.Item>
          <DropdownMenu.Item>Export</DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <Button variant="secondary">Actions</Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item>View</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Edit (unavailable)</DropdownMenu.Item>
        <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const DestructiveAction: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <Button variant="secondary">Entity actions</Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item>Edit</DropdownMenu.Item>
        <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item destructive>Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const IconTrigger: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <IconButton icon={<span>⋮</span>} label="More actions" variant="ghost" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item>Edit</DropdownMenu.Item>
        <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item destructive>Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const Controlled: Story = {
  render: function ControlledMenu() {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Text color="secondary">Menu is {open ? 'open' : 'closed'}</Text>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenu.Trigger>
            <Button variant="secondary">Toggle menu</Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content>
            <DropdownMenu.Item>Edit</DropdownMenu.Item>
            <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>

        <Button variant="ghost" onClick={() => setOpen(false)}>
          Close externally
        </Button>
      </div>
    );
  },
};

export const LoreAtlasExample: Story = {
  render: () => (
    <DropdownMenu placement="bottom-end">
      <DropdownMenu.Trigger>
        <IconButton icon={<span>⋮</span>} label="Character actions" variant="ghost" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Group>
          <DropdownMenu.Label>Character</DropdownMenu.Label>
          <DropdownMenu.Item onSelect={() => console.log('Edit character')}>
            Edit character
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => console.log('Relationships')}>
            View relationships
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => console.log('Collection')}>
            Add to collection
          </DropdownMenu.Item>
        </DropdownMenu.Group>

        <DropdownMenu.Separator />

        <DropdownMenu.Item onSelect={() => console.log('Export')}>
          Export
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        <DropdownMenu.Item destructive onSelect={() => console.log('Delete')}>
          Delete character
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};
