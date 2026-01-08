import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.game2048',
  appName: '2048',
  webDir: 'capacitor-2048/web',
  backgroundColor: '#faf8ef',
  ios: {
    contentInset: 'always'
  },
  android: {
    backgroundColor: '#faf8ef',
    allowMixedContent: false
  }
};

export default config;
