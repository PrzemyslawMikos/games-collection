import {
  createEmptyCollection,
  createEntry,
  createGame,
  createPlan,
  type CollectionData,
  type Condition,
  type Game,
} from './model'
import { normalizeTitle } from './normalize'
import { readWorkbookSheet, type WorkbookCell } from './xlsm'

const PLATFORM_BLOCKS = [
  { platform: 'PS5', startColumn: 1 },
  { platform: 'PS4', startColumn: 6 },
  { platform: 'PS3', startColumn: 11 },
  { platform: 'Switch 2', startColumn: 16 },
  { platform: 'Switch', startColumn: 21 },
] as const

const FIRST_DATA_ROW = 3
const LAST_DATA_ROW = 200

export interface ImportWarning {
  row: number
  platform: string
  title: string
  message: string
  severity: 'info' | 'warning'
}

export interface ImportSummary {
  sourceRows: number
  entries: number
  plans: number
  games: number
  warnings: number
}

export interface ImportResult {
  data: CollectionData
  warnings: ImportWarning[]
  summary: ImportSummary
}

const asText = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && value !== null && 'richText' in value) {
    const richText = (value as { richText: Array<{ text?: string }> }).richText
    return richText.map((part) => part.text ?? '').join('').trim()
  }
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String((value as { text?: unknown }).text ?? '').trim()
  }
  return String(value).trim()
}

const asPrice = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const normalized = asText(value).replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  const parsed = Number(normalized.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

const asCondition = (cell: WorkbookCell): Condition => {
  const color = cell.fillColor.toUpperCase().replace('#', '')
  if (color.endsWith('4A86E8')) return 'sealed'
  if (color.endsWith('FF9900')) return 'used'
  return 'unknown'
}

const completionFor = (value: string): 'not-started' | 'not-completed' | 'completed' => {
  if (value.toLocaleLowerCase('pl-PL') === 'tak') return 'completed'
  if (value.toLocaleLowerCase('pl-PL') === 'nie') return 'not-completed'
  return 'not-started'
}

const findOrCreateGame = (
  collection: CollectionData,
  gameByTitle: Map<string, Game>,
  title: string,
): Game => {
  const key = normalizeTitle(title)
  const existing = gameByTitle.get(key)
  if (existing) {
    if (existing.title !== title && !existing.aliases.includes(title)) existing.aliases.push(title)
    return existing
  }

  const game = createGame(title)
  collection.games.push(game)
  gameByTitle.set(key, game)
  return game
}

export const importWorkbook = async (file: File): Promise<ImportResult> => {
  const worksheet = await readWorkbookSheet(await file.arrayBuffer(), 'Arkusz1')

  const collection = createEmptyCollection()
  const warnings: ImportWarning[] = []
  const gameByTitle = new Map<string, Game>()
  let sourceRows = 0

  for (let rowNumber = FIRST_DATA_ROW; rowNumber <= LAST_DATA_ROW; rowNumber += 1) {
    for (const block of PLATFORM_BLOCKS) {
      const titleCell = worksheet.getCell(rowNumber, block.startColumn)
      const title = asText(titleCell.value)
      if (!title) continue

      sourceRows += 1
      const version = asText(worksheet.getCell(rowNumber, block.startColumn + 1).value)
      const price = asPrice(worksheet.getCell(rowNumber, block.startColumn + 2).value)
      const ownership = asText(worksheet.getCell(rowNumber, block.startColumn + 3).value)
      const completion = asText(worksheet.getCell(rowNumber, block.startColumn + 4).value)
      const condition = asCondition(titleCell)
      const game = findOrCreateGame(collection, gameByTitle, title)

      if (ownership.toLocaleLowerCase('pl-PL') === 'tak') {
        collection.entries.push(
          createEntry(game.id, {
            platform: block.platform,
            version,
            price,
            currency: 'PLN',
            condition,
            completion: completionFor(completion),
          }),
        )
        if (price === null) {
          warnings.push({
            row: rowNumber,
            platform: block.platform,
            title,
            message: 'Brak ceny dla posiadanej gry.',
            severity: 'warning',
          })
        }
      } else {
        const status = ownership.toLocaleLowerCase('pl-PL') === 'w drodze' ? 'ordered' : 'planned'
        collection.plans.push(
          createPlan(game.id, {
            platform: block.platform,
            version,
            currency: 'PLN',
            status,
          }),
        )

        if (condition !== 'unknown') {
          warnings.push({
            row: rowNumber,
            platform: block.platform,
            title,
            message: 'Kolor sugeruje stan egzemplarza, ale wiersz nie jest oznaczony jako posiadany.',
            severity: 'warning',
          })
        }
      }

      if (ownership && ownership.toLocaleLowerCase('pl-PL') !== 'tak' && ownership.toLocaleLowerCase('pl-PL') !== 'w drodze') {
        warnings.push({
          row: rowNumber,
          platform: block.platform,
          title,
          message: `Nieznany status posiadania: ${ownership}. Zapisano jako plan.`,
          severity: 'warning',
        })
      }
    }
  }

  collection.updatedAt = new Date().toISOString()
  return {
    data: collection,
    warnings,
    summary: {
      sourceRows,
      entries: collection.entries.length,
      plans: collection.plans.length,
      games: collection.games.length,
      warnings: warnings.length,
    },
  }
}
