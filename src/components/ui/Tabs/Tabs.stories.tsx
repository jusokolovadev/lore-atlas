import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { Text } from '../Text/Text';
import { Heading } from '../Heading/Heading';
import { Tabs } from './Tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tabs allow users to switch between related sections of content.',
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<Omit<ComponentProps<typeof Tabs>, 'children'>>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <Tabs.List aria-label="Character information">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="relationships">Relationships</Tabs.Trigger>
        <Tabs.Trigger value="history">History</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview">
        <Text>Character overview content.</Text>
      </Tabs.Content>

      <Tabs.Content value="relationships">
        <Text>Character relationships content.</Text>
      </Tabs.Content>

      <Tabs.Content value="history">
        <Text>Character history content.</Text>
      </Tabs.Content>
    </Tabs>
  ),
};

export const Pills: Story = {
  render: () => (
    <Tabs defaultValue="graph" variant="pills">
      <Tabs.List aria-label="View mode">
        <Tabs.Trigger value="graph">Graph</Tabs.Trigger>
        <Tabs.Trigger value="list">List</Tabs.Trigger>
        <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="graph">
        <Text>Graph view</Text>
      </Tabs.Content>

      <Tabs.Content value="list">
        <Text>List view</Text>
      </Tabs.Content>

      <Tabs.Content value="timeline">
        <Text>Timeline view</Text>
      </Tabs.Content>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="general" orientation="vertical">
      <Tabs.List aria-label="Settings">
        <Tabs.Trigger value="general">General</Tabs.Trigger>
        <Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
        <Tabs.Trigger value="privacy">Privacy</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="general">
        <Heading level={3} size="lg">
          General settings
        </Heading>
        <Text color="secondary">Manage general application preferences.</Text>
      </Tabs.Content>

      <Tabs.Content value="appearance">
        <Heading level={3} size="lg">
          Appearance
        </Heading>
        <Text color="secondary">Customize the application appearance.</Text>
      </Tabs.Content>

      <Tabs.Content value="privacy">
        <Heading level={3} size="lg">
          Privacy
        </Heading>
        <Text color="secondary">Manage privacy preferences.</Text>
      </Tabs.Content>
    </Tabs>
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="first">
      <Tabs.List aria-label="Sections">
        <Tabs.Trigger value="first">First</Tabs.Trigger>
        <Tabs.Trigger value="second" disabled>
          Unavailable
        </Tabs.Trigger>
        <Tabs.Trigger value="third">Third</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="first">First tab content</Tabs.Content>
      <Tabs.Content value="second">Second tab content</Tabs.Content>
      <Tabs.Content value="third">Third tab content</Tabs.Content>
    </Tabs>
  ),
};

export const ManualActivation: Story = {
  render: () => (
    <Tabs defaultValue="overview" activationMode="manual">
      <Tabs.List aria-label="Character information">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="relationships">Relationships</Tabs.Trigger>
        <Tabs.Trigger value="history">History</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview">Overview content</Tabs.Content>
      <Tabs.Content value="relationships">Relationships content</Tabs.Content>
      <Tabs.Content value="history">History content</Tabs.Content>
    </Tabs>
  ),
};

export const Controlled: Story = {
  render: function ControlledTabs() {
    const [value, setValue] = useState('overview');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Text color="secondary">Selected tab: {value}</Text>

        <Tabs value={value} onValueChange={setValue}>
          <Tabs.List aria-label="Character information">
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="relationships">Relationships</Tabs.Trigger>
            <Tabs.Trigger value="history">History</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview">Overview content</Tabs.Content>
          <Tabs.Content value="relationships">Relationships content</Tabs.Content>
          <Tabs.Content value="history">History content</Tabs.Content>
        </Tabs>

        <Button variant="secondary" onClick={() => setValue('history')}>
          Open history externally
        </Button>
      </div>
    );
  },
};

export const PreserveContent: Story = {
  render: () => (
    <Tabs defaultValue="first">
      <Tabs.List aria-label="Persistent content">
        <Tabs.Trigger value="first">First</Tabs.Trigger>
        <Tabs.Trigger value="second">Second</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="first" forceMount>
        <Text>First tab stays mounted when hidden.</Text>
      </Tabs.Content>

      <Tabs.Content value="second" forceMount>
        <Text>Second tab stays mounted when hidden.</Text>
      </Tabs.Content>
    </Tabs>
  ),
};

export const LoreAtlasExample: Story = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Heading level={2} size="xl">
        Lyra Veyne
      </Heading>
      <Text color="secondary" size="sm">
        Character · The Ashen Kingdom
      </Text>

      <div style={{ marginTop: 20 }}>
        <Tabs defaultValue="overview">
          <Tabs.List aria-label="Character sections">
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="relationships">Relationships</Tabs.Trigger>
            <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
            <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview">
            <Heading level={3} size="lg">
              Overview
            </Heading>
            <Text>
              A royal archivist searching for the truth behind the disappearance of the
              old dynasty.
            </Text>
          </Tabs.Content>

          <Tabs.Content value="relationships">
            <Heading level={3} size="lg">
              Relationships
            </Heading>
            <Text>Connected characters and factions.</Text>
          </Tabs.Content>

          <Tabs.Content value="timeline">
            <Heading level={3} size="lg">
              Timeline
            </Heading>
            <Text>Important events in the character's life.</Text>
          </Tabs.Content>

          <Tabs.Content value="notes">
            <Heading level={3} size="lg">
              Notes
            </Heading>
            <Text>Private worldbuilding notes.</Text>
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  ),
};
