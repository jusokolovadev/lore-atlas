import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Input is a text field component with optional label, hint and error messages.',
      },
    },
  },
  args: {
    placeholder: 'Enter text...',
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: 'Character name',
    placeholder: 'Enter character name',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Email address',
    type: 'email',
    placeholder: 'name@example.com',
    hint: 'We will never share your email.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email address',
    type: 'email',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Username',
    defaultValue: 'disabled-user',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Universe ID',
    defaultValue: 'universe-001',
    readOnly: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Universe name',
    required: true,
    placeholder: 'Enter universe name',
  },
};

export const Email: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'name@example.com',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
  },
};
