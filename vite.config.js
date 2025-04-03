import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true, // Permite acessar de outros dispositivos
    allowedHosts: [
      "46f9dd6e-f4b5-4aa5-ac68-b3319645f8bd-00-1lbxsrig1z7b.riker.replit.dev",
    ],
  },
});
