/**
 * AppFabrik Tenant Configuration
 * Passe diese Datei für jeden neuen Kunden an.
 */

export const tenantConfig = {
  name: "AppFabrik Demo",
  shortName: "Demo",
  tagline: "Field Service Management",
  logo: "/logo.png",
  favicon: "/favicon.ico",
  
  colors: {
    primary: "#2C3A1C",
    secondary: "#C5A55A",
    background: "#F8F7F2",
  },

  modules: {
    auftraege: true,
    mitarbeiter: true,
    lager: true,
    fuhrpark: true,
    rechnungen: true,
    protokolle: true,
    kontakte: true,
    dokumente: true,
    reports: true,
    lohn: true,
    // Optionale Module (branchenspezifisch)
    foerderung: false,
    abnahme: false,
    qualifikationen: false,
    saatguternte: false,
  },

  labels: {
    auftrag: "Auftrag",
    auftraege: "Aufträge",
    protokoll: "Tagesprotokoll",
    protokolle: "Tagesprotokolle",
    mitarbeiter: "Mitarbeiter",
    lager: "Lager",
    fuhrpark: "Fuhrpark",
    kunde: "Kunde",
    kunden: "Kunden",
  },

  contact: {
    email: "info@example.com",
    phone: "",
    address: "",
  },

  legal: {
    companyName: "Muster GmbH",
    taxId: "",
    privacyUrl: "/datenschutz",
    imprintUrl: "/impressum",
  },
}

export type TenantConfig = typeof tenantConfig
export default tenantConfig
