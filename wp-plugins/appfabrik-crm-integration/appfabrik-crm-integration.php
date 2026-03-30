<?php
/**
 * Plugin Name: AppFabrik CRM Integration
 * Plugin URI: https://appfabrik.de
 * Description: Lead-Capture für AppFabrik — sendet Website-Anfragen an Mission Control CRM
 * Version: 1.0.0
 * Author: Amadeus / FELDWERK
 */

if (!defined('ABSPATH')) exit;

class AppFabrik_CRM_Integration {

    const MC_API_URL = 'https://mission-control-tawny-omega.vercel.app/api';
    const MC_API_KEY = 'mc_live_25bd2bb6768f354f703e99434277af7f51e9cf02ced263df23a1c633ffd175f7';
    const MC_BYPASS  = 'rpFNEmGS7CB0FunapN20rLGDCG0foMzx';

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_shortcode('appfabrik_lead_form', [$this, 'render_lead_form']);
    }

    public function register_routes() {
        register_rest_route('appfabrik/v1', '/lead', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_lead'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle_lead(WP_REST_Request $request) {
        $data = $request->get_json_params();
        if (!$data) {
            $data = $request->get_body_params();
        }

        // Validation
        $required = ['name', 'email', 'message'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => "Pflichtfeld fehlt: $field"
                ], 400);
            }
        }

        if (!is_email($data['email'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Ungültige E-Mail-Adresse.'
            ], 400);
        }

        // Datenschutz check
        if (empty($data['datenschutz_accepted'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Bitte stimmen Sie der Datenschutzerklärung zu.'
            ], 400);
        }

        // 1. Lead-Task in Mission Control erstellen
        $mc_result = $this->create_mc_task($data);

        // 2. Bestätigungs-Email senden
        $this->send_confirmation_email($data);

        // 3. Intern benachrichtigen
        $this->send_internal_notification($data);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Vielen Dank! Wir melden uns innerhalb von 48 Stunden.',
            'mc_task_id' => $mc_result['id'] ?? null
        ], 200);
    }

    private function create_mc_task($data) {
        $name    = sanitize_text_field($data['name']);
        $email   = sanitize_email($data['email']);
        $company = sanitize_text_field($data['company'] ?? '');
        $phone   = sanitize_text_field($data['phone'] ?? '');
        $branche = sanitize_text_field($data['branche'] ?? 'Nicht angegeben');
        $size    = sanitize_text_field($data['mitarbeiter'] ?? '');
        $message = sanitize_textarea_field($data['message']);
        $source  = sanitize_text_field($data['source'] ?? 'Website');

        $title = "🎯 [LEAD] $name" . ($company ? " — $company" : "");
        $description = "**Neue Anfrage über AppFabrik Website**\n\n"
            . "**Name:** $name\n"
            . "**E-Mail:** $email\n"
            . ($phone    ? "**Telefon:** $phone\n" : '')
            . ($company  ? "**Unternehmen:** $company\n" : '')
            . "**Branche:** $branche\n"
            . ($size     ? "**Teamgröße:** $size Mitarbeiter\n" : '')
            . "**Quelle:** $source\n\n"
            . "---\n\n"
            . "**Nachricht:**\n$message\n\n"
            . "---\n*Lead eingegangen: " . date('d.m.Y H:i') . "*";

        $response = wp_remote_post(self::MC_API_URL . '/tasks', [
            'headers' => [
                'Authorization'                          => 'Bearer ' . self::MC_API_KEY,
                'Content-Type'                           => 'application/json',
                'x-vercel-bypass-automation-protection'  => self::MC_BYPASS,
            ],
            'body'    => json_encode([
                'title'       => $title,
                'description' => $description,
                'priority'    => 'high',
                'status'      => 'todo',
                'tags'        => ['lead', 'website', strtolower($branche)],
            ]),
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            error_log('[AppFabrik CRM] MC API Error: ' . $response->get_error_message());
            return [];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        error_log('[AppFabrik CRM] MC Task created: ' . json_encode($body));
        return $body ?? [];
    }

    private function send_confirmation_email($data) {
        $to      = sanitize_email($data['email']);
        $name    = sanitize_text_field($data['name']);
        $subject = 'Ihre Anfrage bei AppFabrik — wir melden uns bald!';

        $message = "Guten Tag $name,\n\n"
            . "vielen Dank für Ihre Anfrage bei AppFabrik.\n\n"
            . "Wir haben Ihre Nachricht erhalten und melden uns innerhalb von 48 Stunden bei Ihnen.\n\n"
            . "Mit freundlichen Grüßen,\n"
            . "Das AppFabrik Team\n\n"
            . "---\n"
            . "AppFabrik — Digitale Betriebssysteme für den Außendienst\n"
            . "https://appfabrik.de";

        wp_mail($to, $subject, $message, [
            'From: AppFabrik <hello@appfabrik.de>',
            'Content-Type: text/plain; charset=UTF-8',
        ]);
    }

    private function send_internal_notification($data) {
        $to      = 'hello@appfabrik.de';
        $name    = sanitize_text_field($data['name']);
        $email   = sanitize_email($data['email']);
        $company = sanitize_text_field($data['company'] ?? '');
        $branche = sanitize_text_field($data['branche'] ?? '');
        $message = sanitize_textarea_field($data['message']);

        $subject = "🎯 Neuer Lead: $name" . ($company ? " ($company)" : '');
        $body    = "Neuer Website-Lead:\n\n"
            . "Name: $name\n"
            . "E-Mail: $email\n"
            . ($company  ? "Unternehmen: $company\n" : '')
            . ($branche  ? "Branche: $branche\n"     : '')
            . "\nNachricht:\n$message\n\n"
            . "Zeit: " . date('d.m.Y H:i') . "\n"
            . "Lead wurde in Mission Control gespeichert.";

        wp_mail($to, $subject, $body, [
            'From: AppFabrik Website <noreply@appfabrik.de>',
            'Content-Type: text/plain; charset=UTF-8',
        ]);
    }

    public function render_lead_form($atts) {
        $atts = shortcode_atts([
            'title'    => 'Demo anfragen',
            'subtitle' => 'Kostenloses Erstgespräch — wir melden uns innerhalb von 48 Stunden.',
        ], $atts);

        $nonce = wp_create_nonce('appfabrik_lead_form');
        $api_url = rest_url('appfabrik/v1/lead');

        ob_start(); ?>
<div class="af-lead-form" style="max-width:640px; margin:0 auto;">
  <div id="af-form-success" style="display:none; background:#edf7ed; border:1px solid #c3e6cb; border-radius:10px; padding:24px; text-align:center; margin-bottom:24px;">
    <p style="font-size:1.3rem; margin:0 0 8px; color:#2C3A1C;">✅ Anfrage gesendet!</p>
    <p style="color:#444; margin:0;">Wir melden uns innerhalb von 48 Stunden. Schauen Sie auch in Ihren Spam-Ordner.</p>
  </div>
  <div id="af-form-error" style="display:none; background:#fef3f2; border:1px solid #fca5a5; border-radius:10px; padding:16px; margin-bottom:24px;">
    <p id="af-error-text" style="margin:0; color:#991b1b;"></p>
  </div>
  <form id="af-lead-form" onsubmit="return afSubmitLead(event)">
    <input type="hidden" name="_wpnonce" value="<?php echo esc_attr($nonce); ?>">
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
      <div>
        <label style="display:block; font-weight:600; margin-bottom:6px; font-size:14px;">Name *</label>
        <input type="text" name="name" required placeholder="Ihr Name" style="width:100%; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:15px; box-sizing:border-box;">
      </div>
      <div>
        <label style="display:block; font-weight:600; margin-bottom:6px; font-size:14px;">Unternehmen</label>
        <input type="text" name="company" placeholder="Firma GmbH" style="width:100%; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:15px; box-sizing:border-box;">
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
      <div>
        <label style="display:block; font-weight:600; margin-bottom:6px; font-size:14px;">E-Mail *</label>
        <input type="email" name="email" required placeholder="info@firma.de" style="width:100%; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:15px; box-sizing:border-box;">
      </div>
      <div>
        <label style="display:block; font-weight:600; margin-bottom:6px; font-size:14px;">Telefon</label>
        <input type="tel" name="phone" placeholder="+49 XXX XXXXXXX" style="width:100%; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:15px; box-sizing:border-box;">
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
      <div>
        <label style="display:block; font-weight:600; margin-bottom:6px; font-size:14px;">Branche</label>
        <select name="branche" style="width:100%; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:15px; background:white; box-sizing:border-box;">
          <option value="">Bitte wählen...</option>
          <option value="Forstwirtschaft">🌲 Forstwirtschaft</option>
          <option value="GaLaBau">🌿 GaLaBau / Landschaftsbau</option>
          <option value="Tiefbau">🏗️ Tiefbau / Kabelbau</option>
          <option value="Reinigung">🧹 Gebäudereinigung</option>
          <option value="Handwerk">🔧 Handwerk / Service</option>
          <option value="Sonstiges">Sonstiges</option>
        </select>
      </div>
      <div>
        <label style="display:block; font-weight:600; margin-bottom:6px; font-size:14px;">Teamgröße</label>
        <select name="mitarbeiter" style="width:100%; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:15px; background:white; box-sizing:border-box;">
          <option value="">Mitarbeiter...</option>
          <option value="1-5">1–5</option>
          <option value="6-15">6–15</option>
          <option value="16-30">16–30</option>
          <option value="31-50">31–50</option>
          <option value="50+">50+</option>
        </select>
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <label style="display:block; font-weight:600; margin-bottom:6px; font-size:14px;">Ihre Nachricht *</label>
      <textarea name="message" required rows="4" placeholder="Beschreiben Sie kurz, was Sie digitalisieren möchten..." style="width:100%; padding:10px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:15px; resize:vertical; box-sizing:border-box;"></textarea>
    </div>
    <div style="margin-bottom:20px; display:flex; align-items:flex-start; gap:10px;">
      <input type="checkbox" name="datenschutz_accepted" id="af-datenschutz" required style="margin-top:3px; flex-shrink:0;">
      <label for="af-datenschutz" style="font-size:13px; color:#666; cursor:pointer;">
        Ich stimme der <a href="/datenschutz/" target="_blank" style="color:#2C3A1C;">Datenschutzerklärung</a> zu und bin einverstanden, dass meine Daten zur Bearbeitung meiner Anfrage gespeichert werden. *
      </label>
    </div>
    <button type="submit" id="af-submit-btn" style="background:#2C3A1C; color:white; border:none; padding:14px 32px; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; width:100%; transition:background 0.2s;">
      Demo anfragen →
    </button>
    <p style="text-align:center; color:#999; font-size:12px; margin-top:12px;">Kein Verkaufsdruck. Kein Spam. Antwort innerhalb von 48h.</p>
  </form>
</div>
<script>
async function afSubmitLead(e) {
  e.preventDefault();
  const form = document.getElementById('af-lead-form');
  const btn  = document.getElementById('af-submit-btn');
  const err  = document.getElementById('af-form-error');
  const ok   = document.getElementById('af-form-success');

  btn.textContent = 'Wird gesendet...';
  btn.disabled = true;
  err.style.display = 'none';

  const fd = new FormData(form);
  const data = {};
  fd.forEach((v, k) => { data[k] = v; });
  data.datenschutz_accepted = fd.has('datenschutz_accepted');
  data.source = 'AppFabrik Website';

  try {
    const res = await fetch('<?php echo esc_js($api_url); ?>', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': '<?php echo esc_js($nonce); ?>' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.success) {
      form.style.display = 'none';
      ok.style.display = 'block';
    } else {
      document.getElementById('af-error-text').textContent = json.message || 'Fehler beim Senden.';
      err.style.display = 'block';
      btn.textContent = 'Demo anfragen →';
      btn.disabled = false;
    }
  } catch(ex) {
    document.getElementById('af-error-text').textContent = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
    err.style.display = 'block';
    btn.textContent = 'Demo anfragen →';
    btn.disabled = false;
  }
  return false;
}
</script>
        <?php
        return ob_get_clean();
    }
}

new AppFabrik_CRM_Integration();
