import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from './Textarea';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    placeholder: 'Enter text...',
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: 'Description',
    placeholder: 'Describe your universe...',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Character biography',
    placeholder: 'Write a short biography...',
    hint: 'You can add more details later.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Description',
    defaultValue: 'Short text',
    error: 'Description must contain at least 100 characters.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Description',
    defaultValue: 'This field is currently unavailable.',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'System-generated summary',
    defaultValue: 'This content cannot be edited.',
    readOnly: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Universe description',
    placeholder: 'Describe your universe...',
    required: true,
  },
};

export const WithDefaultValue: Story = {
  args: {
    label: 'World history',
    defaultValue:
      'The first kingdoms emerged after the Great Cataclysm. Over centuries, they developed their own cultures, traditions, and political systems.',
  },
};

export const CustomRows: Story = {
  args: {
    label: 'Notes',
    rows: 8,
    placeholder: 'Add your notes...',
  },
};
