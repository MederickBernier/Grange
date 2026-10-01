import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { M3EProvider } from '../src';
import './preview.scss';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color scheme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
    motionScheme: {
      description: 'M3E motion scheme',
      toolbar: { title: 'Motion', icon: 'lightning', items: ['expressive', 'standard'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light', motionScheme: 'expressive' },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as string;
      useEffect(() => {
        document.documentElement.dataset.theme = theme;
      }, [theme]);
      return (
        <M3EProvider scheme={context.globals.motionScheme}>
          <Story />
        </M3EProvider>
      );
    },
  ],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
  },
};
export default preview;
