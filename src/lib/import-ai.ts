/**
 * import-ai.ts — KI-gestütztes Spalten-Mapping für CSV/Excel Imports
 * Sprint JN-IMP | Feldhub Base
 *
 * Verwendet Anthropic Claude für:
 * - Auto-Mapping von CSV/Excel Spalten auf Ziel-Schema
 * - Datenvalidierung + Fehlerhinweise
 * - Datum/Format-Normalisierung
 */

export interface ColumnMapping {
  sourceColumn: string
  targetField: string | null
  confidence: number // 0-1
  dataType: "string" | "number" | "date" | "boolean" | "email" | "phone" | "unknown"
  sampleValues: string[]
  issue?: string
}

export interface ImportMappingResult {
  mappings: ColumnMapping[]
  unmappedSources: string[]
  unmappedTargets: string[]
  suggestions: string[]
  estimatedRowCount: number
}

export interface TargetField {
  name: string
  label: string
  type: "string" | "number" | "date" | "boolean" | "email" | "phone"
  required: boolean
  description?: string
}

export interface ParsedCSVResult {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  sampleRows: Record<string, string>[] // first 5 rows for AI
}

/**
 * Parse CSV text into structured data
 */
export function parseCSV(csvText: string, delimiter = ","): ParsedCSVResult {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error("CSV muss mindestens eine Kopfzeile und eine Datenzeile haben")

  // Auto-detect delimiter
  const firstLine = lines[0]
  if (firstLine.includes(";") && !firstLine.includes(",")) {
    delimiter = ";"
  } else if (firstLine.includes("\t")) {
    delimiter = "\t"
  }

  const headers = parseCSVLine(firstLine, delimiter)
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVLine(lines[i], delimiter)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ""
    })
    rows.push(row)
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
    sampleRows: rows.slice(0, 5),
  }
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Detect data type from sample values
 */
export function detectDataType(values: string[]): ColumnMapping["dataType"] {
  const nonEmpty = values.filter((v) => v && v.trim() !== "")
  if (nonEmpty.length === 0) return "string"

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/
  const dateRegex = /^\d{1,4}[\-\/\.]\d{1,2}[\-\/\.]\d{1,4}$/
  const numberRegex = /^-?[\d.,]+$/
  const boolRegex = /^(true|false|ja|nein|yes|no|1|0|x|✓|✗)$/i

  const checks = { email: 0, phone: 0, date: 0, number: 0, boolean: 0 }
  for (const v of nonEmpty) {
    if (emailRegex.test(v)) checks.email++
    if (phoneRegex.test(v)) checks.phone++
    if (dateRegex.test(v)) checks.date++
    if (numberRegex.test(v)) checks.number++
    if (boolRegex.test(v)) checks.boolean++
  }

  const threshold = nonEmpty.length * 0.7
  if (checks.email >= threshold) return "email"
  if (checks.phone >= threshold) return "phone"
  if (checks.date >= threshold) return "date"
  if (checks.number >= threshold) return "number"
  if (checks.boolean >= threshold) return "boolean"
  return "string"
}

/**
 * Heuristic column matching (no AI) — fast fallback
 */
export function heuristicMapping(
  sourceHeaders: string[],
  targetFields: TargetField[],
  sampleRows: Record<string, string>[]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = []

  for (const header of sourceHeaders) {
    const normalized = header.toLowerCase().replace(/[_\s-]/g, "")
    const sampleValues = sampleRows.map((r) => r[header] || "").slice(0, 5)
    const dataType = detectDataType(sampleValues)

    let bestMatch: TargetField | null = null
    let bestScore = 0

    for (const target of targetFields) {
      const targetNorm = target.name.toLowerCase().replace(/[_\s-]/g, "")
      const labelNorm = target.label.toLowerCase().replace(/[_\s-]/g, "")

      let score = 0
      if (normalized === targetNorm) score = 1.0
      else if (normalized === labelNorm) score = 0.9
      else if (normalized.includes(targetNorm) || targetNorm.includes(normalized)) score = 0.7
      else if (normalized.includes(labelNorm) || labelNorm.includes(normalized)) score = 0.6

      // type match bonus
      if (score > 0 && dataType === target.type) score = Math.min(1, score + 0.1)

      if (score > bestScore) {
        bestScore = score
        bestMatch = target
      }
    }

    mappings.push({
      sourceColumn: header,
      targetField: bestScore >= 0.5 ? bestMatch!.name : null,
      confidence: bestScore,
      dataType,
      sampleValues,
    })
  }

  return mappings
}

/**
 * AI-gestütztes Spalten-Mapping via Claude API
 */
export async function aiColumnMapping(
  sourceHeaders: string[],
  targetFields: TargetField[],
  sampleRows: Record<string, string>[],
  entityName: string = "Daten"
): Promise<ImportMappingResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Fallback to heuristic
    const mappings = heuristicMapping(sourceHeaders, targetFields, sampleRows)
    return buildMappingResult(mappings, sourceHeaders, targetFields)
  }

  const sampleData = sourceHeaders.map((h) => ({
    column: h,
    samples: sampleRows.map((r) => r[h] || "").slice(0, 3),
  }))

  const prompt = `Du bist ein Daten-Import-Experte. Mappe die Quell-Spalten einer CSV-Datei auf die Ziel-Felder des Systems.

## Ziel-Schema (${entityName})
${targetFields
  .map(
    (f) =>
      `- ${f.name} (${f.label}, Typ: ${f.type}${f.required ? ", PFLICHT" : ""}${f.description ? `: ${f.description}` : ""})`
  )
  .join("\n")}

## Quell-Spalten mit Beispieldaten
${sampleData.map((s) => `- "${s.column}": [${s.samples.map((v) => `"${v}"`).join(", ")}]`).join("\n")}

Antworte NUR mit einem JSON-Array (kein Markdown, keine Erklärung):
[
  {
    "sourceColumn": "...",
    "targetField": "fieldName oder null",
    "confidence": 0.0-1.0,
    "dataType": "string|number|date|boolean|email|phone",
    "issue": "optionale Warnung oder null"
  }
]`

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`)

    const data = await response.json()
    const text = data.content?.[0]?.text || "[]"
    const aiMappings = JSON.parse(text.replace(/```json?\n?|\n?```/g, "").trim())

    // Merge with sample values from source
    const mappings: ColumnMapping[] = aiMappings.map((m: Omit<ColumnMapping, "sampleValues">) => ({
      ...m,
      sampleValues: sampleRows.map((r) => r[m.sourceColumn] || "").slice(0, 5),
    }))

    return buildMappingResult(mappings, sourceHeaders, targetFields)
  } catch (err) {
    console.error("AI mapping failed, using heuristic fallback:", err)
    const mappings = heuristicMapping(sourceHeaders, targetFields, sampleRows)
    return buildMappingResult(mappings, sourceHeaders, targetFields)
  }
}

function buildMappingResult(
  mappings: ColumnMapping[],
  sourceHeaders: string[],
  targetFields: TargetField[]
): ImportMappingResult {
  const mappedTargets = mappings.filter((m) => m.targetField).map((m) => m.targetField!)
  const unmappedSources = mappings.filter((m) => !m.targetField).map((m) => m.sourceColumn)
  const unmappedTargets = targetFields
    .filter((f) => f.required && !mappedTargets.includes(f.name))
    .map((f) => f.name)

  const suggestions: string[] = []
  if (unmappedTargets.length > 0) {
    suggestions.push(`Pflichtfelder ohne Mapping: ${unmappedTargets.join(", ")}`)
  }
  if (unmappedSources.length > 0) {
    suggestions.push(`${unmappedSources.length} Spalten konnten nicht gemappt werden`)
  }
  const lowConfidence = mappings.filter((m) => m.targetField && m.confidence < 0.7)
  if (lowConfidence.length > 0) {
    suggestions.push(
      `${lowConfidence.length} Mappings mit niedriger Konfidenz – bitte manuell prüfen`
    )
  }

  return {
    mappings,
    unmappedSources,
    unmappedTargets,
    suggestions,
    estimatedRowCount: 0, // set by caller
  }
}

/**
 * Transform row data according to confirmed mappings
 */
export function transformRows(
  rows: Record<string, string>[],
  mappings: ColumnMapping[]
): Record<string, string | number | boolean | null>[] {
  const activeMappings = mappings.filter((m) => m.targetField)

  return rows.map((row) => {
    const result: Record<string, string | number | boolean | null> = {}
    for (const mapping of activeMappings) {
      const raw = row[mapping.sourceColumn] || ""
      result[mapping.targetField!] = coerceValue(raw, mapping.dataType)
    }
    return result
  })
}

function coerceValue(
  value: string,
  type: ColumnMapping["dataType"]
): string | number | boolean | null {
  if (!value || value.trim() === "") return null
  const v = value.trim()

  switch (type) {
    case "number": {
      const n = parseFloat(v.replace(",", ".").replace(/[^\d.-]/g, ""))
      return isNaN(n) ? null : n
    }
    case "boolean":
      return /^(true|ja|yes|1|x|✓)$/i.test(v)
    case "date": {
      // Normalize common German date formats
      const normalized = v
        .replace(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/, "$3-$2-$1")
        .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, "$3-$2-$1")
      const d = new Date(normalized)
      return isNaN(d.getTime()) ? v : d.toISOString().split("T")[0]
    }
    default:
      return v
  }
}

/**
 * Validate transformed rows against target schema
 */
export function validateRows(
  rows: Record<string, string | number | boolean | null>[],
  targetFields: TargetField[]
): { valid: Record<string, string | number | boolean | null>[]; errors: { row: number; field: string; message: string }[] } {
  const valid: Record<string, string | number | boolean | null>[] = []
  const errors: { row: number; field: string; message: string }[] = []

  rows.forEach((row, idx) => {
    let rowValid = true
    for (const field of targetFields) {
      if (field.required && (row[field.name] === null || row[field.name] === undefined || row[field.name] === "")) {
        errors.push({ row: idx + 2, field: field.name, message: `Pflichtfeld "${field.label}" fehlt` })
        rowValid = false
      }
    }
    if (rowValid) valid.push(row)
  })

  return { valid, errors }
}
