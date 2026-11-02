import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Switch allows users to toggle a setting between on and off states.',
      },
    },
  },
  args: {
    label: 'Enable notifications',
  },
} satisfies Meta<typeof Switch>;

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
    label: 'Show spoilers',
    hint: 'Display content marked as spoilers.',
    defaultChecked: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Enable public access',
    error: 'Unable to update this setting.',
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

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    'aria-label': 'Enable notifications',
  },
};

export const LoreAtlasSettings: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '20px' }}>
      <Switch
        label="Show spoilers"
        hint="Display content marked as spoilers."
        defaultChecked
      />
      <Switch
        label="Public universe"
        hint="Allow other users to discover your universe."
      />
      <Switch label="Enable notifications" defaultChecked />
    </div>
  ),
};
