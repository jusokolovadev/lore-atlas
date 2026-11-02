import { useToast, ToastProvider, type ToastType } from './Toast';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from 'src/components/ui';

function ToastDemo() {
  const { notify } = useToast();

  const showToast = (type: ToastType, message?: string, duration?: number) => {
    notify(
      message ?? `${type.charAt(0).toUpperCase()}${type.slice(1)} notification`,
      type,
      duration,
    );
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      <Button onClick={() => showToast('success')}>Success</Button>

      <Button onClick={() => showToast('error')}>Error</Button>

      <Button onClick={() => showToast('warning')}>Warning</Button>

      <Button onClick={() => showToast('info')}>Info</Button>

      <Button
        onClick={() =>
          showToast('info', 'This notification will stay until dismissed.', 0)
        }
      >
        Persistent
      </Button>

      <Button onClick={() => showToast('success', 'Changes saved successfully.', 6000)}>
        Custom duration
      </Button>
    </div>
  );
}

const meta = {
  title: 'Components/Toast',
  component: ToastDemo,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Toast notifications provide brief feedback about user actions. Use the useToast hook inside ToastProvider to display notifications.',
      },
    },
  },
} satisfies Meta<typeof ToastDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Success: Story = {
  render: () => <ToastTrigger type="success" message="Changes saved successfully." />,
};

export const Error: Story = {
  render: () => (
    <ToastTrigger type="error" message="Something went wrong. Please try again." />
  ),
};

export const Warning: Story = {
  render: () => (
    <ToastTrigger type="warning" message="Your session is about to expire." />
  ),
};

export const Info: Story = {
  render: () => <ToastTrigger type="info" message="A new update is available." />,
};

export const Persistent: Story = {
  render: () => (
    <ToastTrigger
      type="info"
      message="This notification will stay until dismissed."
      duration={0}
    />
  ),
};

function ToastTrigger({
  type,
  message,
  duration,
}: {
  type: ToastType;
  message: string;
  duration?: number;
}) {
  const { notify } = useToast();

  return (
    <Button onClick={() => notify(message, type, duration)}>Show {type} toast</Button>
  );
}
