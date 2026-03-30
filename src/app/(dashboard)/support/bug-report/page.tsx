/**
 * /support/bug-report — Bug-Report Seite (öffentlich zugänglich)
 * Sprint JN | Feldhub Base
 */

import { BugReportForm } from "@/components/support/BugReportForm"
import { getTenantConfig } from "@/config/tenant"

export const metadata = {
  title: "Fehler melden | Feldhub Support",
}

export default function BugReportPage() {
  const tenant = getTenantConfig()

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🐛</div>
          <h1 className="text-2xl font-semibold text-gray-900">Fehler melden</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Haben Sie einen Fehler entdeckt oder möchten Sie eine Funktion vorschlagen?
            Unser Team meldet sich so schnell wie möglich.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <BugReportForm />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-base mb-1">⚡</div>
            <div>Reaktion in &lt;24h</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-base mb-1">🎫</div>
            <div>Automatisches Ticket</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-base mb-1">📧</div>
            <div>E-Mail-Bestätigung</div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          Oder direkt per E-Mail:{" "}
          <a
            href={`mailto:${tenant.supportEmail || "support@feldhub.de"}`}
            className="text-[#2C3A1C] underline"
          >
            {tenant.supportEmail || "support@feldhub.de"}
          </a>
        </div>
      </div>
    </div>
  )
}
