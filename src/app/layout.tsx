import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { ThemeProvider, ContrastWarningBanner } from "@/components/providers/ThemeProvider"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { PlausibleProvider } from "@/components/providers/PlausibleProvider"
import { getCurrentTenant } from "@/config/tenant"

function getTenantSafe() {
  try { return getCurrentTenant() } catch { return null }
}

const tc = getTenantSafe()

export const metadata: Metadata = {
  title: tc ? `${tc.shortName} — ${tc.tagline}` : "Feldhub",
  description: tc?.tagline ?? "Field Service Management",
  icons: {
    icon: tc?.branding?.favicon,
    apple: tc?.branding?.appleTouchIcon,
  },
  openGraph: {
    title: tc?.name ?? "Feldhub",
    description: tc?.tagline ?? "Field Service Management",
    images: tc?.branding?.ogImage ? [tc.branding.ogImage] : [],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={tc?.locale?.language ?? "de"} suppressHydrationWarning>
      <head>
        {/* Prevent FOUC (Flash of Unstyled Content) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('appfabrik-theme-mode');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (mode === 'dark' || (mode === 'system' && systemDark) || (!mode && systemDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased theme-transition">
        <SessionProvider>
          <ThemeProvider config={tc}>
            <PlausibleProvider config={tc}>
              {children}
              <Toaster 
                position="top-right" 
                richColors 
                toastOptions={{
                  className: 'surface',
                }}
              />
              {/* Kontrast-Warnungen nur in Development */}
              <ContrastWarningBanner />
            </PlausibleProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
