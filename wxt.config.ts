import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'MessageInputBot',
    description: 'Message input browser extension',
    permissions: ['storage', 'tabs', 'scripting'],
  },
});
