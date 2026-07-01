import type { Meta, StoryObj } from '@storybook/react-vite';

import Copy from './index';

const meta = {
  title: 'Components/Copy',
  component: Copy,
  args: {
    data: 'storybook-copy-value',
    children: 'Copy value'
  },
  parameters: {
    layout: 'centered'
  }
} satisfies Meta<typeof Copy>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = {};

export const ObjectValue: Story = {
  args: {
    data: {
      clientId: 'local-client',
      scope: 'openid profile email'
    },
    children: 'Copy JSON'
  }
};
