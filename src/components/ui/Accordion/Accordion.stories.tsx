import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { Heading } from '../Heading/Heading';
import { Text } from '../Text/Text';
import { Badge } from '../Badge/Badge';
import { Accordion } from './Accordion';

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Accordion organizes content into collapsible sections. Supports single and multiple expansion modes.',
      },
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<Omit<ComponentProps<typeof Accordion>, 'children'>>;

export const Default: Story = {
  render: () => (
    <Accordion defaultValue="biography">
      <Accordion.Item value="biography">
        <Accordion.Trigger>Biography</Accordion.Trigger>
        <Accordion.Content>
          <Text>
            A detailed biography of the character, including their origins, childhood, and
            important life events.
          </Text>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="appearance">
        <Accordion.Trigger>Appearance</Accordion.Trigger>
        <Accordion.Content>
          <Text>
            Physical appearance, clothing, distinguishing features, and other visual
            details.
          </Text>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="personality">
        <Accordion.Trigger>Personality</Accordion.Trigger>
        <Accordion.Content>
          <Text>Character traits, motivations, fears, and beliefs.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['biography', 'appearance']}>
      <Accordion.Item value="biography">
        <Accordion.Trigger>Biography</Accordion.Trigger>
        <Accordion.Content>
          <Text>Biography details.</Text>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="appearance">
        <Accordion.Trigger>Appearance</Accordion.Trigger>
        <Accordion.Content>
          <Text>Appearance details.</Text>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="personality">
        <Accordion.Trigger>Personality</Accordion.Trigger>
        <Accordion.Content>
          <Text>Personality details.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const AllCollapsed: Story = {
  render: () => (
    <Accordion>
      <Accordion.Item value="first">
        <Accordion.Trigger>First section</Accordion.Trigger>
        <Accordion.Content>First section content.</Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="second">
        <Accordion.Trigger>Second section</Accordion.Trigger>
        <Accordion.Content>Second section content.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const NonCollapsible: Story = {
  render: () => (
    <Accordion defaultValue="first" collapsible={false}>
      <Accordion.Item value="first">
        <Accordion.Trigger>First section</Accordion.Trigger>
        <Accordion.Content>
          This section cannot be collapsed while another section is selected.
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="second">
        <Accordion.Trigger>Second section</Accordion.Trigger>
        <Accordion.Content>Second section content.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <Accordion defaultValue="first">
      <Accordion.Item value="first">
        <Accordion.Trigger>Available section</Accordion.Trigger>
        <Accordion.Content>Available content.</Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="second" disabled>
        <Accordion.Trigger>Unavailable section</Accordion.Trigger>
        <Accordion.Content>This content is unavailable.</Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="third">
        <Accordion.Trigger>Another section</Accordion.Trigger>
        <Accordion.Content>Another section content.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Accordion defaultValue="first" disabled>
      <Accordion.Item value="first">
        <Accordion.Trigger>First section</Accordion.Trigger>
        <Accordion.Content>First content.</Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="second">
        <Accordion.Trigger>Second section</Accordion.Trigger>
        <Accordion.Content>Second content.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Controlled: Story = {
  render: function ControlledAccordion() {
    const [value, setValue] = useState<string | null>('biography');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Text color="secondary">Open section: {value ?? 'None'}</Text>

        <Accordion value={value} onValueChange={setValue}>
          <Accordion.Item value="biography">
            <Accordion.Trigger>Biography</Accordion.Trigger>
            <Accordion.Content>Biography content.</Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="appearance">
            <Accordion.Trigger>Appearance</Accordion.Trigger>
            <Accordion.Content>Appearance content.</Accordion.Content>
          </Accordion.Item>
        </Accordion>

        <Button variant="secondary" onClick={() => setValue('appearance')}>
          Open appearance externally
        </Button>

        <Button variant="ghost" onClick={() => setValue(null)}>
          Close all
        </Button>
      </div>
    );
  },
};

export const ControlledMultiple: Story = {
  render: function ControlledMultipleAccordion() {
    const [values, setValues] = useState<string[]>(['first']);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Text color="secondary">Open sections: {values.join(', ') || 'None'}</Text>

        <Accordion type="multiple" value={values} onValueChange={setValues}>
          <Accordion.Item value="first">
            <Accordion.Trigger>First section</Accordion.Trigger>
            <Accordion.Content>First content.</Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="second">
            <Accordion.Trigger>Second section</Accordion.Trigger>
            <Accordion.Content>Second content.</Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="third">
            <Accordion.Trigger>Third section</Accordion.Trigger>
            <Accordion.Content>Third content.</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </div>
    );
  },
};

export const LoreAtlasExample: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 20 }}>
        <Heading level={2} size="xl">
          Lyra Veyne
        </Heading>
        <Text color="secondary" size="sm">
          Character · The Ashen Kingdom
        </Text>
      </div>

      <Accordion type="multiple" defaultValue={['overview']}>
        <Accordion.Item value="overview">
          <Accordion.Trigger>
            <span>Overview</span>
            <Badge variant="primary" size="sm">
              Main
            </Badge>
          </Accordion.Trigger>
          <Accordion.Content>
            <Text>
              A royal archivist searching for the truth behind the disappearance of the
              old dynasty.
            </Text>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="background">
          <Accordion.Trigger>Background</Accordion.Trigger>
          <Accordion.Content>
            <Text>
              Born in the northern provinces, Lyra grew up surrounded by the kingdom's
              ancient archives.
            </Text>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="relationships">
          <Accordion.Trigger>Relationships</Accordion.Trigger>
          <Accordion.Content>
            <Text>Allies, rivals, family members, and important connections.</Text>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="notes">
          <Accordion.Trigger>Notes</Accordion.Trigger>
          <Accordion.Content>
            <Text>Additional worldbuilding notes and ideas.</Text>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  ),
};
