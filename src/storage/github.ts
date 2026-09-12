import { migrateCollection, type CollectionData } from '../domain/model'
import { LocalizedError } from '../i18n/errors'

const GITHUB_API = 'https://api.github.com'
const AUTH_KEY = 'games-collection-github-auth'

export interface GitHubAuth {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  username?: string
}

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface AccessTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  refresh_token_expires_in?: number
  error?: string
  error_description?: string
}

interface GitHubFileResponse {
  content?: string
  encoding?: string
  sha: string
}

export interface RemoteCollection {
  data: CollectionData
  sha: string
}

export class RemoteConflictError extends LocalizedError {
  constructor() {
    super('errors.syncConflict')
    this.name = 'RemoteConflictError'
  }
}

export const readGitHubAuth = (): GitHubAuth | null => {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GitHubAuth
  } catch {
    localStorage.removeItem(AUTH_KEY)
    return null
  }
}

export const writeGitHubAuth = (auth: GitHubAuth): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
}

export const clearGitHubAuth = (): void => {
  localStorage.removeItem(AUTH_KEY)
}

export const refreshGitHubAuth = async (auth: GitHubAuth): Promise<GitHubAuth> => {
  if (!auth.refreshToken || !auth.expiresAt || new Date(auth.expiresAt).getTime() > Date.now() + 60_000) return auth
  const response = await fetch(authProxyUrl('/login/oauth/access_token'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken,
    }),
  })
  const result = (await response.json()) as AccessTokenResponse
  if (!response.ok || !result.access_token) throw new LocalizedError('errors.githubSessionExpired')
  const refreshed: GitHubAuth = {
    accessToken: result.access_token,
    refreshToken: result.refresh_token ?? auth.refreshToken,
    expiresAt: result.expires_in ? new Date(Date.now() + result.expires_in * 1000).toISOString() : undefined,
    username: auth.username,
  }
  writeGitHubAuth(refreshed)
  return refreshed
}

const clientId = (): string => {
  const value = import.meta.env.VITE_GITHUB_APP_CLIENT_ID
  if (!value) throw new LocalizedError('errors.missingClientId')
  return value
}

const authProxyUrl = (path: string): string => {
  const base = import.meta.env.DEV ? '/github-auth' : import.meta.env.VITE_AUTH_PROXY_URL
  if (!base) throw new LocalizedError('errors.missingProxy')
  return `${base.replace(/\/$/, '')}${path}`
}

const authHeaders = (auth: GitHubAuth): HeadersInit => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${auth.accessToken}`,
  'X-GitHub-Api-Version': '2022-11-28',
})

export const beginDeviceLogin = async (): Promise<DeviceCodeResponse> => {
  const response = await fetch(authProxyUrl('/login/device/code'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId() }),
  })

  if (!response.ok) throw new LocalizedError('errors.loginFailed')
  return (await response.json()) as DeviceCodeResponse
}

export const pollDeviceLogin = async (
  deviceCode: DeviceCodeResponse,
  onPending?: () => void,
): Promise<GitHubAuth> => {
  const deadline = Date.now() + deviceCode.expires_in * 1000
  let interval = deviceCode.interval * 1000

  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, interval))
    const response = await fetch(authProxyUrl('/login/oauth/access_token'), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId(),
        device_code: deviceCode.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })
    const result = (await response.json()) as AccessTokenResponse

    if (result.access_token) {
      return {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expiresAt: result.expires_in ? new Date(Date.now() + result.expires_in * 1000).toISOString() : undefined,
      }
    }

    if (result.error === 'authorization_pending') {
      onPending?.()
      continue
    }
    if (result.error === 'slow_down') {
      interval += 5000
      continue
    }
    throw new LocalizedError('errors.loginFailed')
  }

  throw new LocalizedError('errors.loginExpired')
}

export const getGitHubUsername = async (auth: GitHubAuth): Promise<string | undefined> => {
  const response = await fetch(`${GITHUB_API}/user`, { headers: authHeaders(auth) })
  if (!response.ok) return undefined
  const user = (await response.json()) as { login?: string }
  return user.login
}

export class GitHubCollectionRepository {
  private readonly owner: string
  private readonly repository: string
  private readonly branch: string
  private readonly path = 'collection.json'

  constructor(
    owner = import.meta.env.VITE_DATA_REPOSITORY_OWNER ?? '',
    repository = import.meta.env.VITE_DATA_REPOSITORY_NAME ?? '',
    branch = import.meta.env.VITE_DATA_BRANCH ?? 'data',
  ) {
    this.owner = owner
    this.repository = repository
    this.branch = branch
  }

  get configured(): boolean {
    return Boolean(this.owner && this.repository)
  }

  get reference(): string {
    return `${this.owner}/${this.repository}@${this.branch}`
  }

  async load(auth: GitHubAuth): Promise<RemoteCollection | null> {
    this.assertConfigured()
    const response = await fetch(
      `${GITHUB_API}/repos/${this.owner}/${this.repository}/contents/${this.path}?ref=${encodeURIComponent(this.branch)}`,
      { headers: authHeaders(auth) },
    )

    if (response.status === 404) return null
    if (!response.ok) throw await this.errorFrom(response)
    const file = (await response.json()) as GitHubFileResponse
    if (!file.content || file.encoding !== 'base64') throw new LocalizedError('errors.githubResponse')

    try {
      const json = decodeBase64(file.content)
       const data = migrateCollection(JSON.parse(json))
      return { data, sha: file.sha }
    } catch {
      throw new LocalizedError('errors.githubResponse')
    }
  }

  async save(auth: GitHubAuth, data: CollectionData, expectedSha: string | null): Promise<string> {
    this.assertConfigured()
    const remote = await this.load(auth)
    if (!remote && !expectedSha) await this.assertBranch(auth)
    if (remote && expectedSha && remote.sha !== expectedSha) throw new RemoteConflictError()
    if (remote && !expectedSha) throw new RemoteConflictError()
    if (!remote && expectedSha) throw new RemoteConflictError()

    const response = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repository}/contents/${this.path}`, {
      method: 'PUT',
      headers: { ...authHeaders(auth), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `data: sync collection ${new Date().toISOString()}`,
        content: encodeBase64(JSON.stringify(data, null, 2)),
        branch: this.branch,
        ...(remote ? { sha: remote.sha } : {}),
      }),
    })

    if (response.status === 409) throw new RemoteConflictError()
    if (!response.ok) throw await this.errorFrom(response)
    const result = (await response.json()) as { content?: { sha?: string } }
    if (!result.content?.sha) throw new LocalizedError('errors.fileNotSaved')
    return result.content.sha
  }

  private assertConfigured(): void {
    if (!this.configured) throw new LocalizedError('errors.repositoryNotConfigured')
  }

  private async assertBranch(auth: GitHubAuth): Promise<void> {
    const response = await fetch(
      `${GITHUB_API}/repos/${this.owner}/${this.repository}/branches/${encodeURIComponent(this.branch)}`,
      { headers: authHeaders(auth) },
    )
    if (response.ok) return
    if (response.status === 404) {
      throw new LocalizedError('errors.branchMissing', { reference: this.reference })
    }
    throw await this.errorFrom(response)
  }

  private async errorFrom(response: Response): Promise<Error> {
    await response.text()
    return new LocalizedError('errors.githubApi', { status: response.status })
  }
}

const encodeBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const decodeBase64 = (value: string): string => {
  const binary = atob(value.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
