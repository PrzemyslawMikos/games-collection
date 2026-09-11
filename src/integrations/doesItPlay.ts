const DOES_IT_PLAY_LIST_URL = 'https://www.doesitplay.org/list'

const platformAliases: Record<string, string> = {
  '3ds': '3DS',
  evercade: 'Evercade',
  one: 'One',
  'xbox one': 'One',
  pc: 'PC',
  'ps vita': 'PS Vita',
  ps1: 'PS1',
  ps2: 'PS2',
  ps3: 'PS3',
  ps4: 'PS4',
  ps5: 'PS5',
  psp: 'PSP',
  'series x': 'Series X',
  'xbox series x': 'Series X',
  'series x & one': 'Series X & One',
  'xbox series x & one': 'Series X & One',
  switch: 'Switch',
  'switch 2': 'Switch 2',
  'wii u': 'Wii U',
  xbox: 'Xbox',
  'xbox 360': 'Xbox 360',
}

export const doesItPlayListUrl = (platform: string): string => {
  const url = new URL(DOES_IT_PLAY_LIST_URL)
  const canonicalPlatform = platformAliases[platform.trim().toLowerCase()]

  if (canonicalPlatform) url.searchParams.set('platform', canonicalPlatform)

  return url.toString()
}
