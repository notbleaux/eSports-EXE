/** [Ver002.000] */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_ANALYTICS_ID: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_PANDASCORE_TOKEN?: string;
  readonly VITE_RIOT_API_KEY?: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
