import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './Radio';

const meta = {
  title: 'UI/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Radio allows users to select one option from a group of mutually exclusive choices.',
      },
    },
  },
  args: {
    name: 'example',
    label: 'Option',
  },
} satisfies Meta<typeof Radio>;

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
    label: 'Private universe',
    hint: 'Only you will be able to access this universe.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Select a visibility option',
    error: 'Please select an option.',
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
    required: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    'aria-label': 'Select this option',
  },
};

export const RadioGroup: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <Radio name="visibility" value="private" label="Private" defaultChecked />
      <Radio name="visibility" value="unlisted" label="Unlisted" />
      <Radio name="visibility" value="public" label="Public" />
    </div>
  ),
};
