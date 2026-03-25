/** [Ver002.001] */
/// <reference types="vite/client" />

// Hub JSX module declarations — allows TypeScript to resolve .jsx hub entry points
// without requiring full type inference on JSX files (which have no .d.ts).
declare module '@hub-1/index' {
  import type { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}
declare module '@hub-2/index' {
  import type { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}
declare module '@hub-3/index' {
  import type { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}
declare module '@hub-5/index' {
  import type { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_ANALYTICS_ID: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_PANDASCORE_TOKEN?: string;
  readonly VITE_RIOT_API_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_ENVIRONMENT?: string;
  readonly VITE_MODEL_REGISTRY_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
