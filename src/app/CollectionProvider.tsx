import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  clearGitHubAuth,
  beginDeviceLogin,
  GitHubCollectionRepository,
  getGitHubUsername,
  pollDeviceLogin,
  refreshGitHubAuth,
  readGitHubAuth,
  type GitHubAuth,
  writeGitHubAuth,
  RemoteConflictError,
} from '../storage/github'
import { loadLocalCollection, saveLocalCollection } from '../storage/local'
import {
  cloneCollection,
  createEntry,
  createGame,
  createPlan,
  now,
  type CollectionData,
} from '../domain/model'
import { calculateStats } from '../domain/stats'
import { CollectionContext, type CollectionContextValue } from './collectionContext'

const repository = new GitHubCollectionRepository()

const withTimestamp = (data: CollectionData): CollectionData => ({ ...data, updatedAt: now() })

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CollectionData>(() => ({
    schemaVersion: 1,
    updatedAt: now(),
    games: [],
    entries: [],
    plans: [],
  }))
  const [remoteSha, setRemoteSha] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auth, setAuth] = useState<GitHubAuth | null>(() => readGitHubAuth())
  const [loginPrompt, setLoginPrompt] = useState<{ url: string; code: string } | null>(null)
  const latestData = useRef(data)
  const latestRemoteSha = useRef(remoteSha)
  const syncRef = useRef<() => Promise<void>>(async () => undefined)

  useEffect(() => {
    latestData.current = data
  }, [data])

  useEffect(() => {
    latestRemoteSha.current = remoteSha
  }, [remoteSha])

  useEffect(() => {
    void loadLocalCollection()
      .then((record) => {
        if (!record) return
        setData(record.data)
        setRemoteSha(record.remoteSha)
        setDirty(false)
      })
      .catch(() => setError('Nie udało się odczytać lokalnego magazynu danych.'))
      .finally(() => setLoading(false))
  }, [])

  const mutate = (change: (current: CollectionData) => CollectionData): void => {
    setData((current) => withTimestamp(change(cloneCollection(current))))
    setDirty(true)
  }

  const saveLocal = async (): Promise<void> => {
    await saveLocalCollection(latestData.current, latestRemoteSha.current)
    setDirty(false)
  }

  useEffect(() => {
    if (loading) return
    void saveLocalCollection(data, remoteSha).catch(() => setError('Nie udało się zapisać danych lokalnie.'))
  }, [data, loading, remoteSha])

  const value = useMemo<CollectionContextValue>(
    () => ({
      data,
      stats: calculateStats(data),
      loading,
      saving,
      dirty,
      remoteSha,
      error,
      auth,
      loginPrompt,
      repositoryReference: repository.reference,
      setError,
      replaceData: (nextData) => {
        setData(withTimestamp(cloneCollection(nextData)))
        setRemoteSha(null)
        setDirty(true)
      },
      addGame: (title) => {
        if (!title.trim()) return null
        const game = createGame(title)
        mutate((current) => ({ ...current, games: [...current.games, game] }))
        return game
      },
      updateGame: (gameId, values) => {
        mutate((current) => ({
          ...current,
          games: current.games.map((game) =>
            game.id === gameId
              ? {
                ...game,
                ...values,
                aliases: values.title && values.title !== game.title
                  ? [...new Set([game.title, ...game.aliases, ...(values.aliases ?? [])].filter((alias) => alias !== values.title))]
                  : values.aliases ?? game.aliases,
                updatedAt: now(),
              }
              : game,
          ),
        }))
      },
      mergeGames: (targetId, sourceId) => {
        if (targetId === sourceId) return
        mutate((current) => {
          const target = current.games.find((game) => game.id === targetId)
          const source = current.games.find((game) => game.id === sourceId)
          if (!target || !source) return current
          const aliases = [...new Set([...target.aliases, source.title, ...source.aliases].filter((alias) => alias !== target.title))]
          return {
            ...current,
            games: current.games
              .filter((game) => game.id !== sourceId)
              .map((game) => game.id === targetId ? { ...game, aliases, updatedAt: now() } : game),
            entries: current.entries.map((entry) => entry.gameId === sourceId ? { ...entry, gameId: targetId, updatedAt: now() } : entry),
            plans: current.plans.map((plan) => plan.gameId === sourceId ? { ...plan, gameId: targetId, updatedAt: now() } : plan),
          }
        })
      },
      deleteGame: (gameId) => {
        mutate((current) => ({
          ...current,
          games: current.games.filter((game) => game.id !== gameId),
          entries: current.entries.filter((entry) => entry.gameId !== gameId),
          plans: current.plans.filter((plan) => plan.gameId !== gameId),
        }))
      },
      addEntry: (gameId, values) => {
        const entry = createEntry(gameId, values)
        mutate((current) => ({ ...current, entries: [...current.entries, entry] }))
      },
      updateEntry: (entryId, values) => {
        mutate((current) => ({
          ...current,
          entries: current.entries.map((entry) =>
            entry.id === entryId ? { ...entry, ...values, updatedAt: now() } : entry,
          ),
        }))
      },
      deleteEntry: (entryId) => {
        mutate((current) => ({ ...current, entries: current.entries.filter((entry) => entry.id !== entryId) }))
      },
      addPlan: (gameId, values) => {
        const plan = createPlan(gameId, values)
        mutate((current) => ({ ...current, plans: [...current.plans, plan] }))
      },
      updatePlan: (planId, values) => {
        mutate((current) => ({
          ...current,
          plans: current.plans.map((plan) =>
            plan.id === planId ? { ...plan, ...values, updatedAt: now() } : plan,
          ),
        }))
      },
      deletePlan: (planId) => {
        mutate((current) => ({ ...current, plans: current.plans.filter((plan) => plan.id !== planId) }))
      },
      convertPlan: (planId, values) => {
        mutate((current) => {
          const plan = current.plans.find((candidate) => candidate.id === planId)
          if (!plan) return current
          const entry = createEntry(plan.gameId, {
            platform: plan.platform,
            version: plan.version,
            notes: plan.notes,
            ...values,
          })
          return {
            ...current,
            entries: [...current.entries, entry],
            plans: current.plans.filter((candidate) => candidate.id !== planId),
          }
        })
      },
      saveLocal,
      loadRemote: async () => {
        if (!auth) throw new Error('Zaloguj się przez GitHub przed pobraniem danych.')
        setSaving(true)
        setError(null)
        try {
          const currentAuth = await refreshGitHubAuth(auth)
          if (currentAuth !== auth) setAuth(currentAuth)
          const remote = await repository.load(currentAuth)
          if (!remote) throw new Error('Repozytorium danych nie zawiera jeszcze pliku collection.json.')
          setData(remote.data)
          setRemoteSha(remote.sha)
          setDirty(false)
        } catch (loadError) {
          setError(loadError instanceof Error ? loadError.message : 'Nie udało się pobrać danych.')
          throw loadError
        } finally {
          setSaving(false)
        }
      },
      sync: async () => {
        if (!auth) throw new Error('Zaloguj się przez GitHub przed synchronizacją.')
        setSaving(true)
        setError(null)
        try {
          const currentAuth = await refreshGitHubAuth(auth)
          if (currentAuth !== auth) setAuth(currentAuth)
          const sha = await repository.save(currentAuth, latestData.current, latestRemoteSha.current)
          setRemoteSha(sha)
          setDirty(false)
          await saveLocalCollection(latestData.current, sha)
        } catch (syncError) {
          const message = syncError instanceof RemoteConflictError
            ? 'Konflikt synchronizacji. Pobierz zdalną wersję i porównaj dane przed ponownym zapisem.'
            : syncError instanceof Error
              ? syncError.message
              : 'Synchronizacja nie powiodła się.'
          setError(message)
          throw syncError
        } finally {
          setSaving(false)
        }
      },
      login: async () => {
        const deviceCode = await beginDeviceLogin()
        setLoginPrompt({ url: deviceCode.verification_uri, code: deviceCode.user_code })
        window.open(deviceCode.verification_uri, '_blank', 'noopener,noreferrer')
        const nextAuth = await pollDeviceLogin(deviceCode)
        const username = await getGitHubUsername(nextAuth)
        const authenticated = { ...nextAuth, username }
        writeGitHubAuth(authenticated)
        setAuth(authenticated)
        setLoginPrompt(null)
      },
      logout: () => {
        clearGitHubAuth()
        setAuth(null)
      },
    }),
    [auth, data, dirty, error, loading, loginPrompt, remoteSha, saving],
  )

  syncRef.current = value.sync

  useEffect(() => {
    if (!auth || !dirty) return
    const syncWhenOnline = (): void => {
      void syncRef.current().catch(() => undefined)
    }
    window.addEventListener('online', syncWhenOnline)
    return () => window.removeEventListener('online', syncWhenOnline)
  }, [auth, dirty])

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}
