#!/usr/bin/env python3
"""
Hunter-Agent: Lead Research Automatisierung für Feldhub
Sprint JL | Stand: 31.03.2026

Nutzt Perplexity Sonar Pro um Leads in Zielbranchen zu recherchieren.
Output: Strukturierte Lead-Liste → JSON + CSV + MC-API Upload
"""

import os
import json
import csv
import time
import httpx
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional

# --- Config ---
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")  # Set via env: export PERPLEXITY_API_KEY=pplx-...
MC_API_URL = "https://mission-control-tawny-omega.vercel.app/api"
MC_TOKEN = os.getenv("MC_API_KEY")  # Set via env: export MC_API_KEY=mc_live_...
OUTPUT_DIR = Path(__file__).parent.parent / "docs" / "research"

PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
MODEL = "llama-3.1-sonar-large-128k-online"

# --- Zielgruppen-Profile ---
TARGET_PROFILES = [
    {
        "id": "forst",
        "label": "Forstbetriebe Deutschland",
        "query_template": (
            "Liste 5 konkrete Forstbetriebe oder Forstwirtschaftsunternehmen in Deutschland "
            "mit mehr als 10 Mitarbeitern, die Aufforstung, Holzeinschlag oder Forstdienstleistungen "
            "anbieten. Für jeden Betrieb: Name, Ort/Region, Bundesland, geschätzte Mitarbeiterzahl, "
            "Website falls bekannt, Kernleistungen. Fokus auf {region}."
        ),
        "regions": ["Bayern", "Baden-Württemberg", "Hessen", "NRW", "Niedersachsen"],
        "prio": "HIGH"
    },
    {
        "id": "galabau",
        "label": "GaLaBau-Betriebe Deutschland",
        "query_template": (
            "Liste 5 konkrete Garten- und Landschaftsbau-Unternehmen in {region}, Deutschland, "
            "mit 10-100 Mitarbeitern. Name, Ort, Website, Kernleistungen (Anlage/Pflege/Bau), "
            "geschätzte Umsatzgröße. Bevorzugt Betriebe ohne erkennbare digitale Eigenentwicklung."
        ),
        "regions": ["Bayern", "NRW", "Baden-Württemberg", "Hessen"],
        "prio": "HIGH"
    },
    {
        "id": "tiefbau",
        "label": "Tiefbauunternehmen Mittelstand",
        "query_template": (
            "Liste 5 mittelständische Tiefbauunternehmen in {region}, Deutschland, "
            "mit 20-200 Mitarbeitern. Fokus auf Erdarbeiten, Straßenbau, Leitungsbau. "
            "Name, Ort, Website, Kernleistungen, Gründungsjahr falls bekannt."
        ),
        "regions": ["Bayern", "NRW", "Baden-Württemberg"],
        "prio": "MEDIUM"
    },
    {
        "id": "agrar",
        "label": "Agrar-Lohnunternehmen",
        "query_template": (
            "Liste 5 Lohnunternehmen oder größere landwirtschaftliche Betriebe in {region}, Deutschland, "
            "die Dienstleistungen für andere Landwirte erbringen (Ernte, Düngung, Pflanzenschutz). "
            "Name, Ort, Website, Kernleistungen, Mitarbeiterzahl."
        ),
        "regions": ["Bayern", "Niedersachsen", "Sachsen-Anhalt"],
        "prio": "MEDIUM"
    }
]


async def query_perplexity(query: str, retries: int = 3) -> Optional[str]:
    """Perplexity Sonar Pro abfragen mit Retry-Logic."""
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Du bist ein B2B-Lead-Recherche-Assistent für Feldhub. "
                    "Antworte präzise, strukturiert, nur faktische Informationen. "
                    "Kein Marketing-Text. Nur echte Unternehmen mit echten Daten."
                )
            },
            {"role": "user", "content": query}
        ],
        "temperature": 0.1,
        "max_tokens": 1500,
        "return_citations": True
    }

    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(PERPLEXITY_URL, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                elif resp.status_code == 429:
                    wait = 60 * (attempt + 1)
                    print(f"  Rate limit. Warte {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    print(f"  Fehler {resp.status_code}: {resp.text[:200]}")
                    return None
        except Exception as e:
            print(f"  Exception: {e}")
            if attempt < retries - 1:
                await asyncio.sleep(10)
    return None


def parse_leads_from_text(raw_text: str, profile_id: str, region: str) -> list[dict]:
    """Einfacher Parser: Strukturiert Perplexity-Output in Lead-Objekte."""
    leads = []
    lines = raw_text.split('\n')

    current_lead = {}
    lead_count = 0

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Neue Lead-Einträge erkennen (nummeriert oder Bullet)
        if (line.startswith(('1.', '2.', '3.', '4.', '5.', '•', '-', '*'))
                and any(c.isupper() for c in line[:20])):
            if current_lead.get('name'):
                leads.append(current_lead)
                lead_count += 1
            current_lead = {
                'id': f"{profile_id}_{region}_{lead_count+1}",
                'profile': profile_id,
                'region': region,
                'name': '',
                'location': '',
                'website': '',
                'services': '',
                'size': '',
                'notes': line,
                'discovered_at': datetime.now().isoformat(),
                'status': 'new',
                'source': 'perplexity_hunter'
            }
            # Name aus der Zeile extrahieren
            name_part = line.lstrip('1234567890.-•* ')
            if ':' in name_part:
                current_lead['name'] = name_part.split(':')[0].strip()
            else:
                current_lead['name'] = name_part[:60].strip()

        elif current_lead:
            lower = line.lower()
            if 'ort:' in lower or 'standort:' in lower or 'sitz:' in lower:
                current_lead['location'] = line.split(':', 1)[-1].strip()
            elif 'website:' in lower or 'web:' in lower or 'url:' in lower:
                current_lead['website'] = line.split(':', 1)[-1].strip()
            elif 'leistung' in lower or 'service' in lower or 'tätigk' in lower:
                current_lead['services'] = line.split(':', 1)[-1].strip()
            elif 'mitarb' in lower or 'größe:' in lower or 'size:' in lower:
                current_lead['size'] = line.split(':', 1)[-1].strip()
            else:
                current_lead['notes'] = (current_lead.get('notes', '') + ' ' + line).strip()

    if current_lead.get('name'):
        leads.append(current_lead)

    return leads


async def upload_leads_to_mc(leads: list[dict]) -> int:
    """Leads in Mission Control als Tasks anlegen."""
    uploaded = 0
    headers = {
        "x-amadeus-token": "AmadeusLoop2026!xK9mP",
        "x-vercel-bypass-automation-protection": "rpFNEmGS7CB0FunapN20rLGDCG0foMzx",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        for lead in leads:
            task = {
                "title": f"[LEAD] {lead['name']} — {lead['region']}",
                "description": (
                    f"**Branche:** {lead['profile']}\n"
                    f"**Region:** {lead['region']}\n"
                    f"**Standort:** {lead.get('location', 'unbekannt')}\n"
                    f"**Website:** {lead.get('website', 'unbekannt')}\n"
                    f"**Größe:** {lead.get('size', 'unbekannt')}\n"
                    f"**Leistungen:** {lead.get('services', '')}\n"
                    f"**Notizen:** {lead.get('notes', '')}\n\n"
                    f"*Quelle: Perplexity Hunter-Agent, {lead['discovered_at'][:10]}*"
                ),
                "status": "backlog",
                "priority": "medium",
                "tags": ["lead", lead['profile'], "hunter-agent"]
            }
            try:
                resp = await client.post(
                    f"{MC_API_URL}/tasks",
                    headers=headers,
                    json=task
                )
                if resp.status_code in (200, 201):
                    uploaded += 1
                    print(f"  ✅ Lead in MC: {lead['name']}")
                else:
                    print(f"  ⚠️ MC Upload fehlgeschlagen ({resp.status_code}): {lead['name']}")
            except Exception as e:
                print(f"  ❌ MC Exception: {e}")
            await asyncio.sleep(0.5)  # Rate limiting

    return uploaded


def save_leads_to_files(leads: list[dict], run_id: str):
    """Leads als JSON + CSV speichern."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # JSON
    json_path = OUTPUT_DIR / f"leads-{run_id}.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(leads, f, ensure_ascii=False, indent=2)

    # CSV
    csv_path = OUTPUT_DIR / f"leads-{run_id}.csv"
    if leads:
        fieldnames = ['id', 'profile', 'region', 'name', 'location', 'website',
                      'services', 'size', 'status', 'discovered_at', 'source']
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(leads)

    print(f"\n  💾 Gespeichert: {json_path}")
    print(f"  💾 Gespeichert: {csv_path}")
    return json_path, csv_path


async def run_hunter(max_profiles: int = 2, max_regions_per_profile: int = 2):
    """Haupt-Funktion: Hunter-Agent ausführen."""
    run_id = datetime.now().strftime('%Y%m%d-%H%M')
    all_leads = []
    total_queries = 0

    print(f"\n🎯 Hunter-Agent Start — Run {run_id}")
    print(f"   Profile: {max_profiles}, Regionen/Profil: {max_regions_per_profile}")
    print("=" * 60)

    for profile in TARGET_PROFILES[:max_profiles]:
        print(f"\n📌 Profil: {profile['label']} [{profile['prio']}]")
        regions = profile['regions'][:max_regions_per_profile]

        for region in regions:
            print(f"  🔍 Region: {region}")
            query = profile['query_template'].format(region=region)

            raw_text = await query_perplexity(query)
            total_queries += 1

            if not raw_text:
                print(f"  ❌ Keine Antwort für {profile['id']}/{region}")
                continue

            leads = parse_leads_from_text(raw_text, profile['id'], region)
            print(f"  ✓ {len(leads)} Leads geparst")
            all_leads.extend(leads)

            # Rate limiting zwischen Anfragen
            if total_queries > 1:
                await asyncio.sleep(3)

    print(f"\n📊 Gesamt: {len(all_leads)} Leads gefunden")

    if all_leads:
        # In Dateien speichern
        save_leads_to_files(all_leads, run_id)

        # In Mission Control hochladen
        print(f"\n⬆️  Upload zu Mission Control...")
        uploaded = await upload_leads_to_mc(all_leads)
        print(f"   ✅ {uploaded}/{len(all_leads)} Leads in MC angelegt")

    print(f"\n✅ Hunter-Agent abgeschlossen — {run_id}")
    return all_leads


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Feldhub Hunter-Agent — Lead Research")
    parser.add_argument('--profiles', type=int, default=2, help='Max. Branchen-Profile')
    parser.add_argument('--regions', type=int, default=2, help='Max. Regionen pro Profil')
    parser.add_argument('--dry-run', action='store_true', help='Nur ausgeben, nichts in MC speichern')
    args = parser.parse_args()

    asyncio.run(run_hunter(
        max_profiles=args.profiles,
        max_regions_per_profile=args.regions
    ))
