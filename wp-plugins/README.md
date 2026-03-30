# WP Plugins — AppFabrik

Diese Plugins werden auf der Koch Aufforstung WordPress-Installation eingesetzt.

## Deployment

SSH auf den Server und Plugin-Ordner hochladen:
```bash
# SSH Zugang einrichten (Key /tmp/amadeus_key neu generieren wenn nötig)
scp -P 65002 -r appfabrik-crm-integration/ u142409877@82.198.227.185:/home/u142409877/domains/peru-otter-113714.hostingersite.com/public_html/wp-content/plugins/

# Plugin aktivieren via WP-CLI oder WP Admin
wp plugin activate appfabrik-crm-integration
```

## Plugins

### appfabrik-crm-integration
**Status:** Bereit für Deployment (SSH nötig — /tmp/amadeus_key aktuell korrupt)  
**Funktion:** Lead-Capture WP → Mission Control CRM  
**Shortcode:** `[appfabrik_lead_form]`  
**REST Endpoint:** `POST /wp-json/appfabrik/v1/lead`

**Was es tut:**
1. Stellt REST-Endpoint `/appfabrik/v1/lead` bereit
2. Validiert Formulardaten (Name, Email, Message, Datenschutz)
3. Erstellt Task in Mission Control (HIGH priority, Tag: lead)
4. Sendet Bestätigungs-Email an Interessenten
5. Sendet interne Benachrichtigung an hello@appfabrik.de

**MC Integration:** Uses `Authorization: Bearer mc_live_...` → POST `/api/tasks`

**⚠️ Deployment Blocker:** SSH Key /tmp/amadeus_key ist korrupt.  
Tomek muss SSH-Zugang reparieren oder Plugin manuell hochladen.
