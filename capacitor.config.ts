import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kuettu.smartpos",
  appName: "Kuettu Global POS",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1d4ed8",
    },
  },
};

export default config;
