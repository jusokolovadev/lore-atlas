import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Badge displays a compact label for statuses, categories, and metadata.',
      },
    },
  },
  args: {
    children: 'Badge',
    variant: 'neutral',
    size: 'md',
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};

export const WithDot: Story = {
  args: {
    children: 'Active',
    variant: 'success',
    dot: true,
  },
};

export const Statuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Badge variant="success" dot>
        Published
      </Badge>
      <Badge variant="warning" dot>
        Draft
      </Badge>
      <Badge variant="error" dot>
        Archived
      </Badge>
      <Badge variant="neutral" dot>
        Private
      </Badge>
    </div>
  ),
};

export const EntityTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Badge variant="primary">Character</Badge>
      <Badge variant="info">Location</Badge>
      <Badge variant="success">Event</Badge>
      <Badge variant="warning">Organization</Badge>
      <Badge variant="neutral">Object</Badge>
    </div>
  ),
};

export const LoreAtlasExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Badge variant="primary">Fantasy</Badge>
      <Badge variant="neutral">Medieval</Badge>
      <Badge variant="info">Worldbuilding</Badge>
      <Badge variant="warning">Contains spoilers</Badge>
    </div>
  ),
};
