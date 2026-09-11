/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_APP_CLIENT_ID?: string
  readonly VITE_AUTH_PROXY_URL?: string
  readonly VITE_DATA_REPOSITORY_OWNER?: string
  readonly VITE_DATA_REPOSITORY_NAME?: string
  readonly VITE_DATA_BRANCH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
