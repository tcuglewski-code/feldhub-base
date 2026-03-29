# Branch Protection Rules

Dieses Dokument beschreibt die empfohlenen Branch-Protection-Regeln für das `appfabrik-base` Repository.

## Übersicht

| Branch | Schutzlevel | Direkter Push | PR erforderlich |
|--------|-------------|---------------|-----------------|
| `main` | Geschützt | ❌ Nein | ✅ Ja |
| `develop` | Optional | ⚠️ Team Lead | ✅ Empfohlen |
| Feature-Branches | Keine | ✅ Ja | — |

---

## Main Branch — Produktionsschutz

### Einstellungen in GitHub

1. **Repository → Settings → Branches → Add rule**
2. **Branch name pattern:** `main`

### Empfohlene Regeln

```
✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ✅ Require review from Code Owners (optional)

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Status checks:
   - CI Checks (ci)

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings

❌ Allow force pushes (DEAKTIVIERT)
❌ Allow deletions (DEAKTIVIERT)
```

---

## GitHub Actions Secrets

Die CI/CD Pipeline benötigt folgende Secrets (Repository → Settings → Secrets):

| Secret | Beschreibung | Woher |
|--------|--------------|-------|
| `DATABASE_URL` | Neon PostgreSQL Connection String | Neon Dashboard |
| `NEXTAUTH_SECRET` | Zufälliger String für NextAuth | `openssl rand -base64 32` |
| `VERCEL_TOKEN` | Vercel Personal Access Token | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel Team/Org ID | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel Projekt ID | `.vercel/project.json` |

### Secrets erstellen

```bash
# Vercel IDs aus lokalem Projekt extrahieren
cat .vercel/project.json

# NextAuth Secret generieren
openssl rand -base64 32
```

---

## Branch-Strategie

### Trunk-Based Development (empfohlen)

```
main ────────●────────●────────●────────► (Production)
              ↑        ↑        ↑
         feature/  feature/  hotfix/
         auth      dashboard bugfix
```

### Feature-Branch Workflow

1. **Branch erstellen:** `git checkout -b feature/mein-feature`
2. **Entwickeln & Committen:** Atomic Commits mit klaren Messages
3. **Push:** `git push -u origin feature/mein-feature`
4. **Pull Request:** PR gegen `main` erstellen
5. **CI prüft:** Lint, Type-Check, Build
6. **Review:** Mind. 1 Approval erforderlich
7. **Merge:** Squash & Merge empfohlen

### Branch-Naming-Konvention

| Typ | Präfix | Beispiel |
|-----|--------|----------|
| Feature | `feature/` | `feature/auth-2fa` |
| Bugfix | `fix/` | `fix/login-error` |
| Hotfix | `hotfix/` | `hotfix/prod-crash` |
| Refactor | `refactor/` | `refactor/api-routes` |
| Docs | `docs/` | `docs/readme-update` |

---

## Commit-Messages

Format: **Conventional Commits**

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Beispiele:
```
feat(auth): add 2FA TOTP verification
fix(dashboard): correct KPI calculation
docs(readme): update deployment instructions
chore(deps): bump prisma to 7.5.0
```

---

## CI/CD Pipeline

### Jobs

| Job | Trigger | Beschreibung |
|-----|---------|--------------|
| `ci` | Push + PR | Lint, Type-Check, Build |
| `deploy` | Push to main | Prisma Migrate + Vercel Deploy |
| `preview` | PR | Preview-Deployment auf Vercel |

### Ablauf bei Push zu `main`

```
1. CI Checks (Lint, TypeCheck, Build)
   ↓ (erfolgreich)
2. Prisma Migrate Deploy
   ↓
3. Vercel Build
   ↓
4. Vercel Deploy (Production)
```

---

## Notfall: Bypass Branch Protection

In kritischen Situationen kann ein Admin die Protection temporär deaktivieren:

1. Settings → Branches → main → Edit
2. "Do not allow bypassing" deaktivieren
3. Fix deployen
4. **SOFORT wieder aktivieren!**

⚠️ Dokumentiere jeden Bypass im Incident-Log!

---

## Checkliste für neue Repositories

- [ ] Branch Protection auf `main` aktiviert
- [ ] Alle Secrets in GitHub konfiguriert
- [ ] CI/CD Workflow getestet
- [ ] CODEOWNERS Datei erstellt (optional)
- [ ] README mit Deployment-Anleitung
