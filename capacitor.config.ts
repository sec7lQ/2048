import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qilinqian.game2048',
  appName: '2048',
  webDir: 'capacitor-2048/web',
  backgroundColor: '#faf8ef',
  ios: {
    contentInset: 'never'
  },
  android: {
    backgroundColor: '#faf8ef',
    allowMixedContent: false
  }
};

export default config;
