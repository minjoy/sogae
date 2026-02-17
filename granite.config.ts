import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'sogae',
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'node ait-build.js',
    },
  },
  permissions: [],
  outdir: 'ait-dist',
  brand: {
    displayName: '언연이',
    icon: 'https://mytype.co.kr/images/og-image.png',
    primaryColor: '#F59E0B',
    bridgeColorMode: 'inverted',
  },
  webViewProps: {
    type: 'external',
  },
});
