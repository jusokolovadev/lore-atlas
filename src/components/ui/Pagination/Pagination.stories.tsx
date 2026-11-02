import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pagination } from './Pagination';

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pagination allows users to navigate through multiple pages of content.',
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    page: 3,
    totalPages: 10,
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const FirstPage: Story = {
  args: {
    page: 1,
    totalPages: 10,
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const LastPage: Story = {
  args: {
    page: 10,
    totalPages: 10,
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const ManyPages: Story = {
  args: {
    page: 25,
    totalPages: 100,
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const FewPages: Story = {
  args: {
    page: 2,
    totalPages: 4,
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const Small: Story = {
  args: {
    page: 3,
    totalPages: 10,
    size: 'sm',
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const WithoutFirstLast: Story = {
  args: {
    page: 5,
    totalPages: 20,
    showFirstLast: false,
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const MoreSiblings: Story = {
  args: {
    page: 10,
    totalPages: 30,
    siblingCount: 2,
    boundaryCount: 1,
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const Disabled: Story = {
  args: {
    page: 3,
    totalPages: 10,
    disabled: true,
    onPageChange: (page) => console.log('Page:', page),
  },
};

export const Controlled: Story = {
  render: function ControlledPagination() {
    const [page, setPage] = useState(1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Pagination page={page} totalPages={10} onPageChange={setPage} />

        <span>Current page: {page}</span>
      </div>
    );
  },
};

export const LoreAtlasExample: Story = {
  render: function LoreAtlasPagination() {
    const [page, setPage] = useState(3);
    const totalPages = 24;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 600,
        }}
      >
        <div>
          <strong>Characters</strong>
          <p>Showing 41–60 of 480 characters</p>
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <span>
          Page {page} of {totalPages}
        </span>
      </div>
    );
  },
};
