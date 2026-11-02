import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'UI/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Breadcrumbs display the current page location within a navigational hierarchy.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Universes', href: '/universes' },
      { label: 'The Ashen Kingdom', href: '/universes/ashen' },
      { label: 'Characters', href: '/characters' },
      { label: 'Lyra Veyne', current: true },
    ],
  },
};

export const Short: Story = {
  args: {
    items: [
      { label: 'Universes', href: '/universes' },
      { label: 'The Ashen Kingdom', current: true },
    ],
  },
};

export const DeepHierarchy: Story = {
  args: {
    maxItems: 4,
    items: [
      { label: 'Universes', href: '#' },
      { label: 'The Ashen Kingdom', href: '#' },
      { label: 'Northern Provinces', href: '#' },
      { label: 'Winterhold Region', href: '#' },
      { label: 'Winterhold', href: '#' },
      { label: 'Old Archives', current: true },
    ],
  },
};

export const LongLabels: Story = {
  args: {
    items: [
      {
        label: 'The Chronicles of the Forgotten Kingdom',
        href: '#',
      },
      {
        label: 'The Northern Territories and Their Settlements',
        href: '#',
      },
      {
        label: 'The Ancient City of Winterhold',
        current: true,
      },
    ],
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    items: [
      { label: 'Universes', href: '#' },
      { label: 'The Ashen Kingdom', href: '#' },
      { label: 'Characters', current: true },
    ],
  },
};

export const CustomSeparator: Story = {
  args: {
    separator: '/',
    items: [
      { label: 'Universes', href: '#' },
      { label: 'Worlds', href: '#' },
      { label: 'Characters', current: true },
    ],
  },
};

export const Clickable: Story = {
  args: {
    items: [
      {
        label: 'Universes',
        onClick: () => alert('Universes clicked'),
      },
      {
        label: 'The Ashen Kingdom',
        onClick: () => alert('World clicked'),
      },
      {
        label: 'Characters',
        current: true,
      },
    ],
  },
};

export const LoreAtlasExample: Story = {
  args: {
    maxItems: 4,
    items: [
      { label: 'Universes', href: '#' },
      { label: 'The Ashen Kingdom', href: '#' },
      { label: 'Northern Provinces', href: '#' },
      { label: 'Winterhold Region', href: '#' },
      { label: 'Winterhold', href: '#' },
      { label: 'Lyra Veyne', current: true },
    ],
  },
};
