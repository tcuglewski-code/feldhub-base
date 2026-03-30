"use client"

/**
 * ImportWizard.tsx — KI-Import-Wizard Haupt-Komponente
 * Sprint JN-IMP | Feldhub Base
 *
 * 4-Step Wizard:
 * 1. Upload CSV/Excel
 * 2. KI-Spalten-Mapping (auto + manuell korrigierbar)
 * 3. Vorschau + Validierung
 * 4. Import-Bestätigung + Ergebnis
 */

import { useState, useCallback, useRef } from "react"
import type { TargetField, ColumnMapping, ImportMappingResult } from "@/lib/import-ai"

type WizardStep = "upload" | "mapping" | "preview" | "result"

interface PreviewResult {
  totalRows: number
  validRows: number
  errorRows: number
  errors: { row: number; field: string; message: string }[]
  previewData: Record<string, string | number | boolean | null>[]
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

const STEP_LABELS: Record<WizardStep, string> = {
  upload: "1. Datei hochladen",
  mapping: "2. Spalten zuordnen",
  preview: "3. Vorschau prüfen",
  result: "4. Ergebnis",
}

const ENTITY_LABELS: Record<string, string> = {
  kunden: "Kunden / Kontakte",
  mitarbeiter: "Mitarbeiter",
  auftraege: "Aufträge",
  artikel: "Artikel / Lager",
  geraete: "Geräte",
}

export function ImportWizard({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState<WizardStep>("upload")
  const [entityType, setEntityType] = useState("kunden")
  const [file, setFile] = useState<File | null>(null)
  const [csvText, setCsvText] = useState<string>("")
  const [analysisResult, setAnalysisResult] = useState<{
    totalRows: number
    sampleRows: Record<string, string>[]
    targetFields: TargetField[]
    mappingResult: ImportMappingResult
  } | null>(null)
  const [confirmedMappings, setConfirmedMappings] = useState<ColumnMapping[]>([])
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(async (f: File) => {
    setFile(f)
    setError(null)
    const text = await f.text()
    setCsvText(text)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const f = e.dataTransfer.files[0]
      if (f) handleFileChange(f)
    },
    [handleFileChange]
  )

  const handleAnalyze = async () => {
    if (!file || !csvText) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("entityType", entityType)

      const res = await fetch("/api/import?action=analyze", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setAnalysisResult({
        totalRows: data.totalRows,
        sampleRows: data.sampleRows,
        targetFields: data.targetFields,
        mappingResult: data.mappingResult,
      })
      setConfirmedMappings(data.mappingResult.mappings)
      setStep("mapping")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse fehlgeschlagen")
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/import?action=preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, entityType, mappings: confirmedMappings }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setPreviewResult(data)
      setStep("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vorschau fehlgeschlagen")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/import?action=execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, entityType, mappings: confirmedMappings }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setImportResult({ imported: data.imported, skipped: data.skipped, errors: data.errors })
      setStep("result")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import fehlgeschlagen")
    } finally {
      setLoading(false)
    }
  }

  const updateMapping = (idx: number, targetField: string | null) => {
    setConfirmedMappings((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, targetField, confidence: 1.0 } : m))
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2C3A1C] to-[#4a6030] px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">📥 KI-Import-Wizard</h2>
          <p className="text-white/70 text-sm">CSV/Excel importieren mit automatischer Spalten-Erkennung</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">
            ✕
          </button>
        )}
      </div>

      {/* Step Indicators */}
      <div className="flex border-b border-gray-100 bg-gray-50">
        {(Object.keys(STEP_LABELS) as WizardStep[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 px-3 py-3 text-xs text-center font-medium transition-colors ${
              s === step
                ? "text-[#2C3A1C] border-b-2 border-[#2C3A1C] bg-white"
                : "text-gray-400"
            }`}
          >
            {STEP_LABELS[s]}
          </div>
        ))}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Datentyp</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2C3A1C] focus:outline-none"
              >
                {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file
                  ? "border-[#2C3A1C] bg-green-50"
                  : "border-gray-200 hover:border-[#2C3A1C] hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              {file ? (
                <>
                  <div className="text-3xl mb-2">✅</div>
                  <div className="font-medium text-[#2C3A1C]">{file.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📄</div>
                  <div className="font-medium text-gray-700">CSV-Datei hierher ziehen</div>
                  <div className="text-sm text-gray-400 mt-1">oder klicken zum Auswählen</div>
                  <div className="text-xs text-gray-400 mt-2">.csv · .txt · .tsv · Komma, Semikolon oder Tab</div>
                </>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full bg-[#2C3A1C] text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-[#3d5228] transition-colors"
            >
              {loading ? "KI analysiert Spalten..." : "🤖 KI-Analyse starten"}
            </button>
          </div>
        )}

        {/* STEP 2: Mapping */}
        {step === "mapping" && analysisResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{analysisResult.totalRows} Zeilen erkannt</span>
              {analysisResult.mappingResult.suggestions.length > 0 && (
                <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs">
                  ⚠️ {analysisResult.mappingResult.suggestions[0]}
                </span>
              )}
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-0 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                <span>CSV-Spalte</span>
                <span>→ Zielfeld</span>
                <span>Konfidenz</span>
              </div>
              {confirmedMappings.map((m, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-3 gap-0 px-4 py-2.5 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{m.sourceColumn}</div>
                    <div className="text-xs text-gray-400">{m.sampleValues.filter(Boolean).slice(0, 2).join(", ")}</div>
                  </div>
                  <select
                    value={m.targetField || ""}
                    onChange={(e) => updateMapping(idx, e.target.value || null)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#2C3A1C] focus:outline-none"
                  >
                    <option value="">— ignorieren —</option>
                    {analysisResult.targetFields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.label}{f.required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-12 h-1.5 rounded-full ${
                        m.confidence >= 0.8
                          ? "bg-green-400"
                          : m.confidence >= 0.5
                          ? "bg-yellow-400"
                          : "bg-red-300"
                      }`}
                    />
                    <span className="text-xs text-gray-400">{Math.round(m.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Zurück
              </button>
              <button
                onClick={handlePreview}
                disabled={loading}
                className="flex-1 bg-[#2C3A1C] text-white py-2 rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-[#3d5228]"
              >
                {loading ? "Prüfe Daten..." : "Vorschau anzeigen →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === "preview" && previewResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{previewResult.validRows}</div>
                <div className="text-xs text-green-700">gültige Zeilen</div>
              </div>
              <div className={`rounded-lg p-3 text-center border ${previewResult.errorRows > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                <div className={`text-2xl font-bold ${previewResult.errorRows > 0 ? "text-red-600" : "text-gray-400"}`}>
                  {previewResult.errorRows}
                </div>
                <div className={`text-xs ${previewResult.errorRows > 0 ? "text-red-700" : "text-gray-500"}`}>
                  Fehler
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{previewResult.totalRows}</div>
                <div className="text-xs text-blue-700">gesamt</div>
              </div>
            </div>

            {previewResult.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <div className="text-xs font-medium text-amber-700 mb-2">Übersprungene Zeilen:</div>
                {previewResult.errors.slice(0, 5).map((e, i) => (
                  <div key={i} className="text-xs text-amber-600">
                    Zeile {e.row}: {e.message}
                  </div>
                ))}
                {previewResult.errors.length > 5 && (
                  <div className="text-xs text-amber-500 mt-1">+ {previewResult.errors.length - 5} weitere</div>
                )}
              </div>
            )}

            <div className="border border-gray-100 rounded-lg overflow-auto max-h-48">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {previewResult.previewData[0] &&
                      Object.keys(previewResult.previewData[0]).map((k) => (
                        <th key={k} className="px-3 py-2 text-left text-gray-500 font-medium border-b border-gray-100">
                          {k}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewResult.previewData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700">
                          {String(v ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("mapping")}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm"
              >
                Zurück
              </button>
              <button
                onClick={handleImport}
                disabled={loading || previewResult.validRows === 0}
                className="flex-1 bg-[#2C3A1C] text-white py-2 rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-[#3d5228]"
              >
                {loading ? "Importiere..." : `✓ ${previewResult.validRows} Zeilen importieren`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === "result" && importResult && (
          <div className="text-center space-y-4">
            <div className="text-5xl">{importResult.imported > 0 ? "🎉" : "⚠️"}</div>
            <div>
              <div className="text-xl font-semibold text-gray-800">
                {importResult.imported} Datensätze importiert
              </div>
              {importResult.skipped > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  {importResult.skipped} Zeilen übersprungen
                </div>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-left bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-32 overflow-auto">
                {importResult.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full bg-[#2C3A1C] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#3d5228]"
            >
              Fertig
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportWizard
