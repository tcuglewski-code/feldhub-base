# Magnet-Agent 🧲 — Lead Generation Monitoring

> Stand: 31.03.2026 | Sprint JY

## Übersicht

Magnet ist der **automatische Lead-Überwachungs-Agent** von Feldhub.
Er erfasst, bewertet und trackt potenzielle Kunden aus allen Quellen.

---

## Was Magnet macht

1. **Lead-Erfassung:** Neue Interessenten aus Website-Formularen, LinkedIn, Empfehlungen
2. **Lead-Scoring:** Automatische Bewertung 0-100 basierend auf Vollständigkeit + Branche
3. **MC-Integration:** Leads werden direkt in Mission Control Sales-Pipeline angelegt
4. **Tages-Reports:** Tägliche Zusammenfassung der Pipeline
5. **Qualifizierung:** Automatische Kategorisierung (Lead → Qualifiziert → Angebot)

---

## Lead-Scoring-Modell

```
Datenvollständigkeit:
  E-Mail vorhanden:        +20 Punkte
  Telefon vorhanden:       +10 Punkte
  Firma angegeben:         +15 Punkte
  Branche angegeben:       +10 Punkte
  Nachricht > 50 Zeichen:  +10 Punkte

Branchenpriorisierung:
  Forstwirtschaft/Aufforstung:  +25 Punkte (Kern-Zielgruppe)
  Landschaftsbau:               +20 Punkte
  Tiefbau:                      +15 Punkte
  Agrar:                        +15 Punkte
  Reinigung/Handwerk:           +10 Punkte

Kaufabsicht (Nachrichten-Keywords):
  "demo", "preis", "angebot":  +15 Punkte (hohe Absicht)
  "information", "interesse":  + 5 Punkte (mittlere Absicht)
```

**Schwellenwert für Qualifizierung:** Score ≥ 40 + E-Mail vorhanden

---

## Lead-Quellen (aktuell)

| ID | Quelle | Typ | Status |
|----|--------|-----|--------|
| website_main | Feldhub Website Kontaktformular | Website | 🟢 Aktiv |
| website_roi | ROI-Rechner Landing Page | Website | 🟢 Aktiv |
| website_ka_case | Koch Aufforstung Case Study | Website | 🟢 Aktiv |
| linkedin | LinkedIn Company Page | Social | 🟡 In Aufbau |
| referral_ka | Empfehlung Koch Aufforstung | Referral | 🟢 Aktiv |
| bwv | Bayerischer Waldbesitzerverband | Verband | 🔴 Geplant |

---

## Integration

### WP Kontaktformular → Magnet

Das WordPress-Kontaktformular auf der Koch-Aufforstung-Website leitet
neue Anfragen direkt an den Magnet-Agent weiter:

```php
// In functions.php oder CRM-Plugin (IF-Sprint):
function feldhub_send_to_magnet($form_data) {
  wp_remote_post('https://mission-control-tawny-omega.vercel.app/api/deals', [
    'headers' => [
      'Content-Type' => 'application/json',
      'x-mc-api-key' => FELDHUB_MC_API_KEY,
    ],
    'body' => json_encode([
      'title' => $form_data['name'],
      'contactEmail' => $form_data['email'],
      'source' => 'website_main',
      'stage' => 'lead',
    ]),
  ]);
}
add_action('wpcf7_mail_sent', 'feldhub_send_to_magnet');
```

### Programmatische Nutzung

```typescript
import { MagnetAgent, berechneLeadScore } from '@/cron/magnet-agent';

const magnet = new MagnetAgent();

// Lead erfassen
await magnet.erfasseLead({
  name: 'Hans Müller',
  email: 'hans@forstbetrieb-muster.de',
  firma: 'Forstbetrieb Muster GmbH',
  branche: 'Forstwirtschaft',
  nachricht: 'Hätte gerne eine Demo Ihrer Software',
  quelle: 'website_main',
  status: 'neu',
  erfasstAm: new Date(),
});
```

---

## Tages-Report Format

Magnet protokolliert täglich (08:00 Uhr) in Mission Control:

```
[Magnet] 🧲 Tages-Report:
  Neue Leads: 3
  Qualifiziert: 1
  Konversionsrate: 33%
  Pipeline: 37.000 €
```

---

## Erweiterungsplan

| Feature | Priorität | Beschreibung |
|---------|-----------|-------------|
| Hunter-Integration | 🟡 | Automatische Lead-Recherche via Hunter-Agent |
| Email-Tracking | 🟡 | Öffnungsraten, Klicks via SendGrid |
| LinkedIn-Scraper | 🔴 | Neue Follower → automatisch in Pipeline |
| Calendly-Webhook | 🟡 | Terminbuchung → Lead automatisch qualifizieren |
| Churn-Prediction | 🟢 | Ruhende Leads reaktivieren |
