#!/bin/bash
# =============================================================================
# AppFabrik Demo Environment Setup
# Erstellt eine vollständig konfigurierte Demo-Instanz auf Vercel
# =============================================================================

set -e

TENANT_ID="demo"
DEMO_URL="https://demo.appfabrik.de"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"  # Set via environment variable

echo "🚀 AppFabrik Demo-Umgebung Setup"
echo "================================"
echo ""

# 1. Prüfe Voraussetzungen
echo "📋 Prüfe Voraussetzungen..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js fehlt"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx fehlt"; exit 1; }

# 2. Environment für Demo setzen
echo ""
echo "🔧 Erstelle Demo-Environment..."
cat > .env.demo << EOF
# Demo Tenant Configuration
NEXT_PUBLIC_TENANT_ID=demo
NEXT_PUBLIC_APP_NAME="AppFabrik Demo"
NEXT_PUBLIC_DEMO_MODE=true

# Demo Database (Neon DB - demo branch)
DATABASE_URL="${DEMO_DATABASE_URL:-postgresql://demo_user:demo_pass@demo.neon.tech/demo_db}"

# Auth
NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-demo-secret-change-in-production}"
NEXTAUTH_URL="https://demo.appfabrik.de"

# Demo Reset (Cron)
DEMO_RESET_INTERVAL_MINUTES=60
DEMO_RESET_CRON="0 * * * *"
EOF

echo "✅ .env.demo erstellt"

# 3. Neon Demo-Branch erstellen (manuell via Neon Console)
echo ""
echo "🗄️  Datenbank-Setup:"
echo "   → Neon Console: https://console.neon.tech"
echo "   → Branch erstellen: 'demo'"
echo "   → DATABASE_URL in Vercel Environment eintragen"

# 4. Demo-Daten seeden
echo ""
echo "🌱 Demo-Daten werden vorbereitet..."
if [ -f "prisma/seed-demo.ts" ]; then
    npx ts-node prisma/seed-demo.ts
    echo "✅ Demo-Daten eingespeist"
else
    echo "⚠️  prisma/seed-demo.ts nicht gefunden - Demo-Daten manuell einpflegen"
fi

# 5. Vercel Deployment
echo ""
echo "☁️  Vercel Deployment..."
if [ -n "$VERCEL_TOKEN" ]; then
    npx vercel --token "$VERCEL_TOKEN" \
        --env-file .env.demo \
        --name "appfabrik-demo" \
        --prod \
        --yes
    echo "✅ Deployment erfolgreich → $DEMO_URL"
else
    echo "⚠️  VERCEL_TOKEN nicht gesetzt. Manuell deployen:"
    echo "   vercel --prod --name appfabrik-demo"
fi

# 6. Demo-Reset Cron einrichten (Vercel Cron Job)
echo ""
echo "🔄 Demo-Reset Cron Job:"
echo "   → vercel.json wurde mit Cron-Job konfiguriert (jede Stunde)"
echo "   → Endpoint: /api/demo/reset (mit DEMO_RESET_TOKEN)"

echo ""
echo "============================================"
echo "✅ Demo-Setup abgeschlossen!"
echo ""
echo "Demo-URLs:"
echo "  → Website:    $DEMO_URL"
echo "  → Admin:      $DEMO_URL/admin"
echo "  → API Docs:   $DEMO_URL/api-docs"
echo ""
echo "Demo-Zugänge:"
echo "  Admin:      admin@demo.appfabrik.de / Demo2026!"
echo "  Manager:    manager@demo.appfabrik.de / Demo2026!"
echo "  Mitarbeiter: mitarbeiter@demo.appfabrik.de / Demo2026!"
echo ""
echo "⚠️  WICHTIG: Demo-Daten werden stündlich zurückgesetzt!"
echo "============================================"
