import type { Meta, StoryObj } from '@storybook/react-vite';

import Card from './index';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: {
    type: 'primary',
    hover: false,
    shadow: true,
    title: 'Current token',
    message: 'Authorization request is ready.'
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['cta', 'primary', 'secondary', 'tertiary', 'error', 'success', 'information', 'warning']
    }
  },
  parameters: {
    layout: 'centered'
  }
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Status: Story = {
  args: {
    type: 'success',
    hover: true,
    objects: [
      {
        code: 'pkce_ready',
        expiresIn: 900
      }
    ]
  }
};
