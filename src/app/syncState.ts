export const remoteVersionChanged = (remoteSha: string | null, storedRemoteSha: string | null): boolean =>
  remoteSha !== null && remoteSha !== storedRemoteSha
