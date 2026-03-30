"use client"

/**
 * BugReportForm.tsx — Kunden-Bug-Report Formular
 * Sprint JN | Feldhub Base
 *
 * Öffentlich einbettbar, kein Login nötig.
 * Erstellt automatisch Ticket in Mission Control.
 */

import { useState } from "react"

type Severity = "low" | "medium" | "high" | "critical"
type Category = "bug" | "feature" | "question" | "other"

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: "low", label: "Niedrig — Kosmetischer Fehler", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "medium", label: "Mittel — Funktion beeinträchtigt", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { value: "high", label: "Hoch — Wichtige Funktion defekt", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "critical", label: "Kritisch — System nicht nutzbar", color: "text-red-600 bg-red-50 border-red-200" },
]

const CATEGORY_OPTIONS: { value: Category; label: string; icon: string }[] = [
  { value: "bug", label: "Fehler / Bug", icon: "🐛" },
  { value: "feature", label: "Funktion wünschen", icon: "✨" },
  { value: "question", label: "Frage / Support", icon: "❓" },
  { value: "other", label: "Sonstiges", icon: "📝" },
]

interface BugReportFormProps {
  onSuccess?: (ticketId: string | null) => void
  compact?: boolean
}

export function BugReportForm({ onSuccess, compact = false }: BugReportFormProps) {
  const [form, setForm] = useState({
    reporterName: "",
    reporterEmail: "",
    title: "",
    description: "",
    severity: "medium" as Severity,
    category: "bug" as Category,
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: "",
    url: "",
    browser: "",
    website: "", // honeypot
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        const firstError = data.details
          ? Object.values(data.details as Record<string, string[]>)[0]?.[0]
          : data.error
        throw new Error(firstError || "Fehler beim Senden")
      }

      setSuccess(data.message)
      onSuccess?.(data.ticketId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Senden")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-5xl">✅</div>
        <div className="text-lg font-semibold text-gray-800">Bericht eingegangen!</div>
        <div className="text-gray-500 text-sm max-w-sm mx-auto">{success}</div>
        <button
          onClick={() => {
            setSuccess(null)
            setForm({
              reporterName: "", reporterEmail: "", title: "", description: "",
              severity: "medium", category: "bug", stepsToReproduce: "",
              expectedBehavior: "", actualBehavior: "", url: "", browser: "", website: "",
            })
          }}
          className="text-sm text-[#2C3A1C] underline"
        >
          Weiteren Bericht senden
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => update("website", e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Kategorie */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Art der Meldung</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("category", opt.value)}
              className={`border rounded-lg p-2.5 text-sm text-left transition-colors ${
                form.category === opt.value
                  ? "border-[#2C3A1C] bg-[#2C3A1C]/5 text-[#2C3A1C] font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="mr-1.5">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schweregrad */}
      {form.category === "bug" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Schweregrad</label>
          <div className="space-y-2">
            {SEVERITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("severity", opt.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                  form.severity === opt.value
                    ? opt.color + " font-medium"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kontakt */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ihr Name *</label>
          <input
            type="text"
            required
            value={form.reporterName}
            onChange={(e) => update("reporterName", e.target.value)}
            placeholder="Max Mustermann"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2C3A1C] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
          <input
            type="email"
            required
            value={form.reporterEmail}
            onChange={(e) => update("reporterEmail", e.target.value)}
            placeholder="max@mustermann.de"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2C3A1C] focus:outline-none"
          />
        </div>
      </div>

      {/* Titel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {form.category === "bug" ? "Was ist der Fehler?" : "Kurze Beschreibung"}  *
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder={form.category === "bug" ? "z.B. Speichern funktioniert nicht" : "z.B. Ich möchte ..."}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2C3A1C] focus:outline-none"
        />
      </div>

      {/* Beschreibung */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Detaillierte Beschreibung *
        </label>
        <textarea
          required
          rows={compact ? 3 : 5}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder={
            form.category === "bug"
              ? "Bitte beschreiben Sie den Fehler so genau wie möglich..."
              : "Bitte erläutern Sie Ihr Anliegen..."
          }
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2C3A1C] focus:outline-none resize-none"
        />
      </div>

      {/* Advanced (Bug only) */}
      {form.category === "bug" && !compact && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-[#2C3A1C] flex items-center gap-1"
          >
            {showAdvanced ? "▼" : "▶"} Weitere Details (optional)
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-4 pl-4 border-l-2 border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Schritte zur Reproduktion
                </label>
                <textarea
                  rows={3}
                  value={form.stepsToReproduce}
                  onChange={(e) => update("stepsToReproduce", e.target.value)}
                  placeholder="1. Klick auf...&#10;2. Dann...&#10;3. Fehler erscheint"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#2C3A1C] focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Erwartet</label>
                  <textarea
                    rows={2}
                    value={form.expectedBehavior}
                    onChange={(e) => update("expectedBehavior", e.target.value)}
                    placeholder="Was sollte passieren?"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#2C3A1C] focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tatsächlich</label>
                  <textarea
                    rows={2}
                    value={form.actualBehavior}
                    onChange={(e) => update("actualBehavior", e.target.value)}
                    placeholder="Was ist passiert?"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#2C3A1C] focus:outline-none resize-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Seiten-URL</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => update("url", e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#2C3A1C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Browser</label>
                  <input
                    type="text"
                    value={form.browser}
                    onChange={(e) => update("browser", e.target.value)}
                    placeholder="z.B. Chrome 123"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#2C3A1C] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2C3A1C] text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-[#3d5228] transition-colors"
      >
        {loading ? "Wird gesendet..." : "📤 Bericht senden"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Ihre Daten werden nur zur Bearbeitung des Berichts verwendet.
      </p>
    </form>
  )
}

export default BugReportForm
