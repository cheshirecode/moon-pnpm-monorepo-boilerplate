import type { Meta, StoryObj } from '@storybook/react-vite';

import Spinner from './index';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  args: {
    type: 'plain',
    size: 'medium',
    palette: 'primary',
    center: true
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['plain', 'inset', 'moon']
    },
    size: {
      control: 'inline-radio',
      options: ['small', 'medium', 'large']
    },
    palette: {
      control: 'select',
      options: ['cta', 'primary', 'secondary', 'tertiary', 'error', 'success', 'information', 'warning']
    }
  },
  parameters: {
    layout: 'centered'
  }
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const Screen: Story = {
  args: {
    screen: true,
    screenClassName: 'h-40 w-80 items-center justify-center bg-secondary'
  }
};
