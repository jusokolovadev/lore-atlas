import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Checkbox allows users to select one or more options.',
      },
    },
  },
  args: {
    label: 'Accept terms and conditions',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const WithHint: Story = {
  args: {
    label: 'Enable notifications',
    hint: 'You will receive updates about your universe.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Accept terms and conditions',
    error: 'You must accept the terms to continue.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

export const Required: Story = {
  args: {
    label: 'I agree to the terms',
    required: true,
  },
};

export const LongLabel: Story = {
  args: {
    label: 'I understand that manually marked spoilers may be visible to other users.',
  },
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    'aria-label': 'Select this item',
  },
};
