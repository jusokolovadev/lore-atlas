import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';
import { Heading } from '../Heading/Heading';
import { Text } from '../Text/Text';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    children: 'Card content',
    padding: 'md',
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: 'Card with small padding.',
  },
};

export const MediumPadding: Story = {
  args: {
    padding: 'md',
    children: 'Card with medium padding.',
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: 'Card with large padding.',
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: 'Hover over this card to see the interactive state.',
  },
};

export const WithHeading: Story = {
  args: {
    children: (
      <>
        <Heading level={3} size="lg">
          The Forgotten Kingdom
        </Heading>

        <Text color="secondary">
          An ancient realm lost to history, waiting to be rediscovered.
        </Text>
      </>
    ),
  },
};

export const ContentCard: Story = {
  args: {
    padding: 'lg',
    children: (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <Heading level={3} size="lg">
            Character profile
          </Heading>

          <Text as="span" size="xs" color="secondary">
            Main character
          </Text>
        </div>

        <Text>
          A wandering scholar searching for the truth behind an ancient civilization.
        </Text>
      </>
    ),
  },
};

export const InteractiveContentCard: Story = {
  args: {
    interactive: true,
    padding: 'lg',
    children: (
      <>
        <Heading level={3} size="lg">
          Northern Territories
        </Heading>

        <Text color="secondary">
          Explore the geography, settlements, and history of the northern lands.
        </Text>
      </>
    ),
  },
};
