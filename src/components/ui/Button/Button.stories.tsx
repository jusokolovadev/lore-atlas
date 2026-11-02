import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
	title: 'UI/Button',
	component: Button,
	tags: ['autodocs'],

	argTypes: {
		variant: {
			control: 'select',
			options: ['primary', 'secondary', 'ghost', 'danger'],
		},
		size: {
			control: 'inline-radio',
			options: ['sm', 'md', 'lg'],
		},
		disabled: {
			control: 'boolean',
		},
		loading: {
			control: 'boolean',
		},
		fullWidth: {
			control: 'boolean',
		},
	},

	args: {
		children: 'Button',
		variant: 'primary',
		size: 'md',
	},
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		children: 'Create entry',
		variant: 'primary',
	},
};

export const Secondary: Story = {
	args: {
		children: 'Cancel',
		variant: 'secondary',
	},
};

export const Ghost: Story = {
	args: {
		children: 'Learn more',
		variant: 'ghost',
	},
};

export const Danger: Story = {
	args: {
		children: 'Delete entry',
		variant: 'danger',
	},
};

export const Sizes: Story = {
	render: () => (
		<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
		</div>
	),
};

export const States: Story = {
	render: () => (
		<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
			<Button>Default</Button>
			<Button disabled>Disabled</Button>
			<Button loading>Loading</Button>
		</div>
	),
};
