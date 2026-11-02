import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Modal } from './Modal';
import { Button } from '../Button/Button';
import { Text } from 'src/components/ui/Text/Text';

function ModalDemo(props: Omit<React.ComponentProps<typeof Modal>, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>

      <Modal {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const meta = {
  title: 'UI/Modal',
  component: ModalDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    title: 'Modal title',
    description: 'This is a description of the modal.',
    children: 'Modal content goes here.',
  },
} satisfies Meta<Omit<React.ComponentProps<typeof Modal>, 'open' | 'onClose'>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <ModalDemo {...args} />,
};

export const WithoutDescription: Story = {
  args: {
    description: undefined,
  },
  render: (args) => <ModalDemo {...args} />,
};

export const LongContent: Story = {
  args: {
    title: 'Character details',
    description: 'Review information about this character.',
    children: (
      <div style={{ display: 'grid', gap: 16 }}>
        {Array.from({ length: 12 }, (_, index) => (
          <Text key={index}>
            Section {index + 1}: Character background, personality, relationships,
            history, and other important details.
          </Text>
        ))}
      </div>
    ),
  },
  render: (args) => <ModalDemo {...args} />,
};

export const FormContent: Story = {
  args: {
    title: 'Create a universe',
    description: 'Add a new fictional universe to your atlas.',
    children: (
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
        style={{ display: 'grid', gap: 16 }}
      >
        <label style={{ display: 'grid', gap: 8 }}>
          Universe name
          <input
            placeholder="Enter universe name"
            required
            style={{ minHeight: 40, padding: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 8 }}>
          Description
          <textarea
            placeholder="Describe your universe"
            rows={4}
            style={{ padding: 8 }}
          />
        </label>

        <Button type="submit">Create universe</Button>
      </form>
    ),
  },
  render: (args) => <ModalDemo {...args} />,
};

export const Confirmation: Story = {
  args: {
    title: 'Delete character?',
    description: 'This action cannot be undone.',
    children: (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </div>
    ),
  },
  render: (args) => <ModalDemo {...args} />,
};
