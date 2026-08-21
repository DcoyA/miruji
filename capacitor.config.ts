import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.miruji.app",
  appName: "미루지말자",
  webDir: "public",
  server: {
    url: "https://miruji-omega.vercel.app",
    cleartext: false,
  },
};

export default config;
