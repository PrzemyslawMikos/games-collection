import { describe, expect, it } from 'vitest'
import { zipSync } from 'fflate'
import { importWorkbook } from './importer'

describe('workbook migration', () => {
  it('reads worksheet values and condition fills into entries and plans', async () => {
    const workbook = zipSync({
      '[Content_Types].xml': new TextEncoder().encode('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'),
      'xl/workbook.xml': new TextEncoder().encode('<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Arkusz1" r:id="rId1"/></sheets></workbook>'),
      'xl/_rels/workbook.xml.rels': new TextEncoder().encode('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
      'xl/styles.xml': new TextEncoder().encode('<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fills count="4"><fill><patternFill/></fill><fill><patternFill/></fill><fill><patternFill><fgColor rgb="FF4A86E8"/></patternFill></fill><fill><patternFill><fgColor rgb="FFFF9900"/></patternFill></fill></fills><cellXfs count="4"><xf fillId="0"/><xf fillId="0"/><xf fillId="2"/><xf fillId="3"/></cellXfs></styleSheet>'),
      'xl/worksheets/sheet1.xml': new TextEncoder().encode('<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="3"><c r="A3" s="2" t="inlineStr"><is><t>Example Game</t></is></c><c r="B3" t="inlineStr"><is><t>Complete Edition</t></is></c><c r="C3"><v>120</v></c><c r="D3" t="inlineStr"><is><t>Tak</t></is></c><c r="E3" t="inlineStr"><is><t>Nie</t></is></c><c r="F3" s="3" t="inlineStr"><is><t>Example Game</t></is></c><c r="H3"><v>50</v></c></row></sheetData></worksheet>'),
    })
    const file = { arrayBuffer: async () => workbook.buffer } as unknown as File
    const result = await importWorkbook(file)

    expect(result.summary).toMatchObject({ sourceRows: 2, entries: 1, plans: 1, games: 1 })
    expect(result.data.entries[0]).toMatchObject({ platform: 'PS5', price: 120, currency: 'PLN', completion: 'not-completed', condition: 'sealed' })
    expect(result.data.plans[0]).toMatchObject({ platform: 'PS4', status: 'planned' })
    expect(result.warnings).toHaveLength(1)
  })
})
