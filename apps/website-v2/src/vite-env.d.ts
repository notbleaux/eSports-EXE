/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_ENVIRONMENT: string
  readonly VITE_APP_VERSION: string
  readonly VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'
  readonly VITE_SENTRY_DSN: string
  readonly VITE_PANDASCORE_TOKEN: string
  readonly VITE_RIOT_API_KEY: string
  readonly VITE_MODEL_REGISTRY_URL: string
  readonly VITE_BUILD_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
