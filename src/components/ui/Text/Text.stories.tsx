import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

const meta = {
  title: 'Components/Typography/Text',
  component: Text,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Text is a typography component for body text, descriptions, labels and supporting information.',
      },
    },
  },
  args: {
    children: 'The quick brown fox jumps over the lazy dog.',
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <Text size="xs">Extra small text</Text>
      <Text size="sm">Small text</Text>
      <Text size="md">Medium text</Text>
      <Text size="lg">Large text</Text>
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <Text weight="normal">Normal weight</Text>
      <Text weight="medium">Medium weight</Text>
      <Text weight="semibold">Semibold weight</Text>
      <Text weight="bold">Bold weight</Text>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <Text color="primary">Primary text</Text>
      <Text color="secondary">Secondary text</Text>
      <Text color="tertiary">Tertiary text</Text>
      <Text color="success">Success text</Text>
      <Text color="warning">Warning text</Text>
      <Text color="error">Error text</Text>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Text align="left">Left aligned text</Text>
      <Text align="center">Center aligned text</Text>
      <Text align="right">Right aligned text</Text>
    </div>
  ),
};

export const Truncated: Story = {
  render: () => (
    <div style={{ width: '240px' }}>
      <Text truncate>
        This is a long text that will be truncated when it exceeds the available container
        width.
      </Text>
    </div>
  ),
};

export const SemanticElements: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <Text as="p">Paragraph element</Text>
      <Text as="span">Span element</Text>
      <Text as="div">Div element</Text>
    </div>
  ),
};

export const Combined: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      <Text size="lg" weight="semibold">
        Important information
      </Text>
      <Text color="secondary" size="sm">
        Supporting information with a smaller, secondary style.
      </Text>
      <Text color="success" size="xs" weight="medium">
        Successfully saved
      </Text>
    </div>
  ),
};
