# Feldhub Tech Radar
## Version 1.0 — Q1 2026

> Sprint JB | 30.03.2026
> Inspired by ThoughtWorks Technology Radar
> Review-Rhythmus: Quartalweise

---

## Legende

| Ring | Bedeutung |
|------|-----------|
| 🟢 **ADOPT** | Bewährt, produktionsreif, aktiv einsetzen |
| 🔵 **TRIAL** | Vielversprechend, gezielt testen |
| 🟡 **ASSESS** | Beobachten, noch nicht einsetzen |
| 🔴 **HOLD** | Vermeiden oder ablösen |

---

## 🔧 LANGUAGES & FRAMEWORKS

### 🟢 ADOPT
| Technologie | Einschätzung | Projekt |
|-------------|-------------|---------|
| TypeScript 5.x | Pflichtstandard — Typsicherheit, IDE-Support | Alle |
| Next.js 15 (App Router) | Produktionsreif, Server Components, Edge | feldhub-base |
| React Native (Expo SDK 52) | Bestes DX für RN, managed workflow | feldhub-app-base |
| Tailwind CSS v4 | CSS-first, schnell, konsistent | feldhub-base |
| Prisma ORM 6.x | Type-safe DB-Access, Migrations, Neon-kompatibel | feldhub-base |
| Zod 3.x | Schema Validation, runtime-sicher | feldhub-base |

### 🔵 TRIAL
| Technologie | Einschätzung | Chance |
|-------------|-------------|--------|
| React Server Components (RSC) | Noch junge Patterns, klare Trennung hilft | Perf-Boost |
| tRPC v11 | Type-safe API ohne OpenAPI-Overhead | feldhub-base API-Layer |
| Expo Router v4 | File-based routing für RN, bewährt sich | feldhub-app-base |

### 🟡 ASSESS
| Technologie | Einschätzung | Beobachten |
|-------------|-------------|-----------|
| Bun | Schnell, aber Ecosystem noch unreif für Prod | Ersatz für Node.js? |
| SvelteKit | Interessant, aber Team-Know-how in React | 2027? |
| Qwik | Resumability spannend, niche | Beobachten |

### 🔴 HOLD
| Technologie | Warum | Ersatz |
|-------------|-------|--------|
| Next.js Pages Router | Veraltet, App Router ist Standard | App Router |
| JavaScript (ohne TS) | Keine Typsicherheit | TypeScript |
| Class Components (React) | Legacy Pattern | Functional Components + Hooks |
| Redux | Overly complex für unsere Größe | Zustand / React Query |

---

## 🗄️ DATA & STORAGE

### 🟢 ADOPT
| Technologie | Einschätzung | Projekt |
|-------------|-------------|---------|
| Neon PostgreSQL (serverless) | Branching, Scale-to-zero, Vercel-Integration | feldhub-base |
| WatermelonDB | Offline-First Sync für React Native, bewährt | feldhub-app-base |
| pgvector | AI/RAG-Features direkt in PostgreSQL | Sylvia / Förder-Berater |
| Redis (Upstash) | Serverless Redis für Sessions/Cache | feldhub-base |

### 🔵 TRIAL
| Technologie | Einschätzung | Chance |
|-------------|-------------|--------|
| Drizzle ORM | Leichter als Prisma, SQL-first | Migration bei Skalierung? |
| Turso (LibSQL/SQLite Edge) | Edge-DB, interessant für kleine Tenants | Alt. zu Neon |

### 🟡 ASSESS
| Technologie | Einschätzung | Beobachten |
|-------------|-------------|-----------|
| PlanetScale | MySQL, weniger pgvector-freundlich | Nein für KI |
| Supabase | Gute DX, aber weniger Kontrolle | Alt. bei Anfang |
| MongoDB | Kein DSGVO-freundlicher EU-Hosting-Standard | Nein |

### 🔴 HOLD
| Technologie | Warum | Ersatz |
|-------------|-------|--------|
| SQLite (lokal prod) | Kein Multi-User, kein Sync | Neon PostgreSQL |
| Firebase Realtime DB | US-Server, DSGVO-problematisch | Supabase / Neon |
| MySQL 5.x | Kein JSON, kein pgvector | PostgreSQL 16 |

---

## ☁️ INFRASTRUCTURE & DEPLOYMENT

### 🟢 ADOPT
| Technologie | Einschätzung | Projekt |
|-------------|-------------|---------|
| Vercel | Zero-config Deploy, Edge Network, Preview URLs | feldhub-base, alle |
| GitHub Actions | CI/CD, gut integriert | feldhub-base |
| Docker (Compose) | Dev-Umgebung standardisiert | Lokal |
| EAS Build (Expo) | Cloud-Build für iOS/Android | feldhub-app-base |

### 🔵 TRIAL
| Technologie | Einschätzung | Chance |
|-------------|-------------|--------|
| Vercel Organizations | Zentrale Verwaltung aller Tenants | HI-Konzept |
| GitHub Environments | Staging/Prod-Trennung in Repos | feldhub-base |

### 🟡 ASSESS
| Technologie | Einschätzung | Beobachten |
|-------------|-------------|-----------|
| Fly.io | Günstig, eigene Server, mehr Kontrolle | Alt. zu Vercel bei Skalierung |
| Railway | PaaS, gut für Backend-Services | Für Hintergrunddienste |
| Cloudflare Workers | Edge Computing, sehr schnell | Spezielle Use Cases |

### 🔴 HOLD
| Technologie | Warum | Ersatz |
|-------------|-------|--------|
| Heroku | Zu teuer, veraltetes UX | Vercel / Railway |
| AWS/GCP direkt | Zu komplex für Team-Größe | Vercel + Neon |
| Self-hosted K8s | Operativer Overhead zu hoch | Managed Services |

---

## 🤖 AI & INTELLIGENCE

### 🟢 ADOPT
| Technologie | Einschätzung | Projekt |
|-------------|-------------|---------|
| Claude Sonnet/Opus (Anthropic) | Beste Code-Qualität, Amadeus-Standard | OpenClaw |
| Perplexity Sonar Pro | Echtzeit-Recherche, kein Halluzinieren | Research-Cron |
| pgvector (RAG) | Embeddings direkt in PostgreSQL | Förder-Berater |
| OpenClaw | Orchestrierung + Multi-Agent | Amadeus |

### 🔵 TRIAL
| Technologie | Einschätzung | Chance |
|-------------|-------------|--------|
| Vercel AI SDK | Streaming, Tool Use, gut für Next.js | feldhub-base AI-Features |
| LangChain.js | Agent-Workflows, aber heavy | Nur wenn nötig |
| Ollama | Lokale LLMs für Sensitivdaten | Datenschutz-kritische Features |

### 🟡 ASSESS
| Technologie | Einschätzung | Beobachten |
|-------------|-------------|-----------|
| GPT-4o | Gut, aber US-Server (DSGVO) | EU-Hosting abwarten |
| Gemini Pro | Wettbewerber, beobachten | API-Zugang |
| Mistral (EU) | EU-Modell, DSGVO-konform | Interessant für Prod |

### 🔴 HOLD
| Technologie | Warum | Ersatz |
|-------------|-------|--------|
| ChatGPT Plugins | Deprecated | OpenAI Assistants API |
| Auto-GPT/AgentGPT | Instabil, unkontrollierbar | OpenClaw mit Amadeus |
| Fine-Tuning für jede Aufgabe | Zu teuer, zu komplex | Prompt Engineering + RAG |

---

## 🧪 TESTING & QUALITY

### 🟢 ADOPT
| Technologie | Einschätzung | Projekt |
|-------------|-------------|---------|
| Jest 29 | Unit + Integration Tests Standard | feldhub-base |
| Playwright 1.4x | E2E Browser-Tests | feldhub-base |
| ESLint 9 + Prettier | Code-Qualität automatisch | Alle |
| TypeScript strict mode | Compile-time Sicherheit | Alle |

### 🔵 TRIAL
| Technologie | Einschätzung | Chance |
|-------------|-------------|--------|
| Vitest | Schneller als Jest, Vite-basiert | Migration erwägen |
| Storybook 8 | Komponentendokumentation | UI-Library |

### 🟡 ASSESS
| Technologie | Einschätzung | Beobachten |
|-------------|-------------|-----------|
| Cypress | Playwright vorgezogen | Nein |
| Testing Library (mobile) | React Native Testing Library | App-Tests |

### 🔴 HOLD
| Technologie | Warum | Ersatz |
|-------------|-------|--------|
| Enzyme | Deprecated | Testing Library |
| Karma/Jasmine | Veraltet | Jest |
| Detox (RN E2E) | Aufwändig, flaky | EAS Builds + manuell |

---

## 🔒 SECURITY

### 🟢 ADOPT
| Technologie | Einschätzung | Projekt |
|-------------|-------------|---------|
| NextAuth v5 | Auth-Standard für Next.js | feldhub-base |
| bcrypt (Passwort-Hash) | Sicher, weit verbreitet | feldhub-base |
| HTTPS/TLS everywhere | Pflicht | Alle |
| Vercel Edge Middleware | Auth-Guards, Rate Limiting | feldhub-base |

### 🔵 TRIAL
| Technologie | Einschätzung | Chance |
|-------------|-------------|--------|
| Better Auth | Neue Generation nach NextAuth v5 | Langfristig |
| Arcjet | Rate Limiting, Bot Protection | feldhub-base |

### 🟡 ASSESS
| Technologie | Einschätzung | Beobachten |
|-------------|-------------|-----------|
| Clerk | Managed Auth, gute UX | Wenn eigene Auth zu komplex |
| Auth0 | Enterprise, teuer | Erst bei Enterprise-Kunden |

### 🔴 HOLD
| Technologie | Warum | Ersatz |
|-------------|-------|--------|
| JWT ohne Rotation | Sicherheitslücke | NextAuth Sessions |
| HTTP basic auth | Unsicher | OAuth2/JWT |
| MD5 für Passwörter | Veraltet und unsicher | bcrypt/argon2 |

---

## Review-Prozess

- **Häufigkeit:** Quartalsweise (Jan, Apr, Jul, Okt)
- **Verantwortlich:** Amadeus (Vorschlag) → Tomek (Freigabe)
- **Einstufungskriterien:**
  - ADOPT: ≥6 Monate productiv, kein kritischer Bug, Team kennt es
  - TRIAL: Proof-of-Concept läuft, Low-Risk Einsatz möglich
  - ASSESS: Beobachtet, kein Produktionseinsatz
  - HOLD: Aktiv ablösen oder nicht mehr verwenden

**Nächstes Review:** 01. Juli 2026
