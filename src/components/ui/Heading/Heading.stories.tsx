import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './Heading';
import { Text } from '../Text/Text';

const meta = {
  title: 'Components/Typography/Heading',
  component: Heading,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Heading is a semantic heading component with configurable HTML heading level and visual size.',
      },
    },
  },
  args: {
    children: 'Heading example',
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Levels: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Heading level={1}>Heading level 1</Heading>
      <Heading level={2}>Heading level 2</Heading>
      <Heading level={3}>Heading level 3</Heading>
      <Heading level={4}>Heading level 4</Heading>
      <Heading level={5}>Heading level 5</Heading>
      <Heading level={6}>Heading level 6</Heading>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Heading size="sm">Small heading</Heading>
      <Heading size="md">Medium heading</Heading>
      <Heading size="lg">Large heading</Heading>
      <Heading size="xl">Extra large heading</Heading>
      <Heading size="2xl">2XL heading</Heading>
      <Heading size="3xl">3XL heading</Heading>
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Heading weight="medium">Medium weight</Heading>
      <Heading weight="semibold">Semibold weight</Heading>
      <Heading weight="bold">Bold weight</Heading>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Heading color="primary">Primary heading</Heading>
      <Heading color="secondary">Secondary heading</Heading>
      <Heading color="tertiary">Tertiary heading</Heading>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Heading align="left">Left aligned heading</Heading>
      <Heading align="center">Center aligned heading</Heading>
      <Heading align="right">Right aligned heading</Heading>
    </div>
  ),
};

export const SemanticVsVisualSize: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Heading level={1} size="sm">
        H1 with small visual size
      </Heading>
      <Heading level={2} size="3xl">
        H2 with large visual size
      </Heading>
      <Heading level={3} size="xl">
        H3 with extra large visual size
      </Heading>
    </div>
  ),
};

export const LoreAtlasExample: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '8px', maxWidth: '520px' }}>
      <Heading level={1} size="2xl">
        The Witcher Universe
      </Heading>

      <Text color="secondary" size="sm">
        Fictional universe · 24 entries
      </Text>

      <Heading level={2} size="lg">
        Overview
      </Heading>

      <Text>
        Explore characters, locations, events and relationships across the world.
      </Text>

      <Text color="tertiary" size="xs">
        Last updated 2 hours ago
      </Text>
    </div>
  ),
};
