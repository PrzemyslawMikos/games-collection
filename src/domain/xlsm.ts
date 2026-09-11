import { unzipSync } from 'fflate'

export interface WorkbookCell {
  value: string | number | null
  fillColor: string
}

export interface WorkbookSheet {
  getCell: (row: number, column: number) => WorkbookCell
}

const RELATIONSHIP_NAMESPACE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

const textFrom = (element: Element | null): string => element?.textContent?.trim() ?? ''

const xmlDocument = (files: Record<string, Uint8Array>, path: string): Document => {
  const file = files[path]
  if (!file) throw new Error(`Brak pliku ${path} w archiwum Excela.`)
  return new DOMParser().parseFromString(new TextDecoder().decode(file), 'application/xml')
}

const resolveTarget = (target: string): string => {
  const normalized = target.replace(/\\/g, '/').replace(/^\//, '')
  return normalized.startsWith('xl/') ? normalized : `xl/${normalized}`
}

const columnNumber = (reference: string): number => {
  const letters = reference.match(/^[A-Z]+/i)?.[0].toUpperCase() ?? ''
  return [...letters].reduce((result, letter) => result * 26 + letter.charCodeAt(0) - 64, 0)
}

const sharedString = (item: Element): string =>
  [...item.getElementsByTagName('t')].map((text) => textFrom(text)).join('')

const valueForCell = (cell: Element, sharedStrings: string[]): string | number | null => {
  const type = cell.getAttribute('t')
  if (type === 'inlineStr') return sharedString(cell)
  const raw = textFrom(cell.getElementsByTagName('v')[0] ?? null)
  if (!raw) return null
  if (type === 's') return sharedStrings[Number(raw)] ?? ''
  if (type === 'b') return raw === '1' ? 'TRUE' : 'FALSE'
  const numeric = Number(raw)
  return Number.isFinite(numeric) && raw.trim() !== '' ? numeric : raw
}

export const readWorkbookSheet = async (buffer: ArrayBuffer, sheetName: string): Promise<WorkbookSheet> => {
  const files = unzipSync(new Uint8Array(buffer))
  const workbook = xmlDocument(files, 'xl/workbook.xml')
  const relationships = xmlDocument(files, 'xl/_rels/workbook.xml.rels')
  const relationshipTargets = new Map<string, string>()

  for (const relationship of [...relationships.getElementsByTagName('Relationship')]) {
    const id = relationship.getAttribute('Id')
    const target = relationship.getAttribute('Target')
    if (id && target) relationshipTargets.set(id, resolveTarget(target))
  }

  const sheets = [...workbook.getElementsByTagName('sheet')]
  const selectedSheet = sheets.find((sheet) => sheet.getAttribute('name') === sheetName) ?? sheets[0]
  if (!selectedSheet) throw new Error('Nie znaleziono arkusza z danymi kolekcji.')

  const relationshipId = selectedSheet.getAttributeNS(RELATIONSHIP_NAMESPACE, 'id') ?? selectedSheet.getAttribute('r:id')
  const sheetPath = relationshipId ? relationshipTargets.get(relationshipId) : undefined
  if (!sheetPath) throw new Error('Nie znaleziono pliku danych wybranego arkusza.')

  const sheet = xmlDocument(files, sheetPath)
  const sharedStringsDocument = files['xl/sharedStrings.xml'] ? xmlDocument(files, 'xl/sharedStrings.xml') : null
  const sharedStrings = sharedStringsDocument
    ? [...sharedStringsDocument.getElementsByTagName('si')].map(sharedString)
    : []

  const stylesDocument = files['xl/styles.xml'] ? xmlDocument(files, 'xl/styles.xml') : null
  const fills = stylesDocument
    ? [...stylesDocument.getElementsByTagName('fill')].map((fill) => {
      const color = fill.getElementsByTagName('fgColor')[0]
      return color?.getAttribute('rgb') ?? color?.getAttribute('indexed') ?? ''
    })
    : []
  const styleFills = stylesDocument
    ? [...stylesDocument.getElementsByTagName('cellXfs')[0]?.getElementsByTagName('xf') ?? []].map((style) => {
      const fillId = Number(style.getAttribute('fillId') ?? 0)
      return fills[fillId] ?? ''
    })
    : []
  const cells = new Map<string, WorkbookCell>()

  for (const cell of [...sheet.getElementsByTagName('c')]) {
    const reference = cell.getAttribute('r')
    if (!reference) continue
    const styleIndex = Number(cell.getAttribute('s') ?? 0)
    cells.set(reference, {
      value: valueForCell(cell, sharedStrings),
      fillColor: styleFills[styleIndex] ?? '',
    })
  }

  return {
    getCell: (row, column) => {
      const letters = (() => {
        let value = column
        let result = ''
        while (value > 0) {
          const remainder = (value - 1) % 26
          result = String.fromCharCode(65 + remainder) + result
          value = Math.floor((value - 1) / 26)
        }
        return result
      })()
      return cells.get(`${letters}${row}`) ?? { value: null, fillColor: '' }
    },
  }
}

export const columnIndexFromReference = columnNumber
