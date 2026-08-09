import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "id.barcelonacove.app",
  appName: "Barcelona Cove Portal",
  webDir: "out",
  server: {
    // Mode online: WebView memuat portal warga dari server produksi.
    url: "https://www.barcelonacove.web.id",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
