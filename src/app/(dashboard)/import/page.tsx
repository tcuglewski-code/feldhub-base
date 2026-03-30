/**
 * /import — KI-Import-Wizard Seite
 * Sprint JN-IMP | Feldhub Base
 */

import { ImportWizard } from "@/components/import/ImportWizard"

export const metadata = {
  title: "Daten importieren | Feldhub",
}

export default function ImportPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Daten importieren</h1>
        <p className="text-gray-500 mt-1">
          Importiere Kunden, Mitarbeiter, Aufträge oder andere Daten aus CSV-Dateien.
          Die KI erkennt automatisch die Spalten und ordnet sie dem System zu.
        </p>
      </div>

      <ImportWizard />

      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="font-medium text-blue-800 mb-1">🤖 KI-Spalten-Erkennung</div>
          <div className="text-blue-600 text-xs">Claude analysiert Spaltenbezeichnungen und Beispieldaten automatisch</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="font-medium text-green-800 mb-1">✅ Validierung</div>
          <div className="text-green-600 text-xs">Pflichtfelder, Formate und Datentypen werden vor dem Import geprüft</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="font-medium text-purple-800 mb-1">🌍 Beliebige Formate</div>
          <div className="text-purple-600 text-xs">Komma, Semikolon, Tab-getrennt — auch mit deutschen Umlauten</div>
        </div>
      </div>
    </div>
  )
}
