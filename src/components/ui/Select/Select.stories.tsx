import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Select allows users to choose one option from a dropdown list.',
      },
    },
  },
  args: {
    placeholder: 'Select an option',
    children: (
      <>
        <option value="option-1">Option 1</option>
        <option value="option-2">Option 2</option>
        <option value="option-3">Option 3</option>
      </>
    ),
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: 'Universe type',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Universe type',
    hint: 'Choose the type that best describes your universe.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Universe type',
    error: 'Please select a universe type.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Universe type',
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Universe type',
    required: true,
  },
};

export const WithDefaultValue: Story = {
  args: {
    label: 'Universe type',
    defaultValue: 'fantasy',
    placeholder: undefined,
    children: (
      <>
        <option value="fantasy">Fantasy</option>
        <option value="sci-fi">Science Fiction</option>
        <option value="historical">Historical</option>
        <option value="other">Other</option>
      </>
    ),
  },
};

export const LoreAtlasExample: Story = {
  args: {
    label: 'Universe genre',
    hint: 'You can change this later.',
    placeholder: 'Choose a genre',
    children: (
      <>
        <option value="fantasy">Fantasy</option>
        <option value="sci-fi">Science Fiction</option>
        <option value="horror">Horror</option>
        <option value="mystery">Mystery</option>
        <option value="historical">Historical</option>
        <option value="other">Other</option>
      </>
    ),
  },
};
