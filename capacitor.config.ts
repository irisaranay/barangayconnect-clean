import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Barangay Connect',
  webDir: 'www',
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen',
      saveToGallery: false
    }
  }
};

export default config;
