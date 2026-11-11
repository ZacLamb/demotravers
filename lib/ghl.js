// Sends website leads into the Travers Group GoHighLevel sub-account.
//
// Env (either name works):
//   GHL_API      | GHL_PIT          Private Integration token for the sub-account
//                                   (if this holds an https:// URL it is treated as a workflow webhook URL)
//   LOCATION_ID  | GHL_LOCATION_ID  sub-account (location) ID
//   GHL_WEBHOOK_URL                 optional workflow "Inbound Webhook" trigger URL
//
// PIT scopes: contacts.write, contacts.readonly, locations/customFields.readonly
// (+ locations/customFields.write so missing custom fields are auto-created).
const API = 'https://services.leadconnectorhq.com';
const SOURCE = 'Website - traversgroupma.com';
const SITE = (process.env.SITE_URL || 'https://www.traversgroupma.com').replace(/\/$/, '');

const env = (...names) => {
  for (const n of names) {
    const v = (process.env[n] || '').trim();
    if (v) return v;
  }
  return '';
};
const rawToken = env('GHL_API', 'GHL_PIT', 'ghl', 'GHL', 'GHL_TOKEN', 'GHL_API_KEY');
const TOKEN = /^https?:\/\//i.test(rawToken) ? '' : rawToken;
const LOCATION_ID = env('GHL_LOCATION_ID', 'LOCATION_ID', 'location_id');
const WEBHOOK_URL = env('GHL_WEBHOOK_URL') || (/^https?:\/\//i.test(rawToken) ? rawToken : '');

// Form fields that have no standard GHL contact field -> contact custom fields.
// Matched by name (case-insensitive); created in the sub-account if missing.
const CUSTOM_FIELDS = [
  { key: 'service', name: 'Website Service Requested', dataType: 'TEXT' },
  { key: 'message', name: 'Website Message', dataType: 'LARGE_TEXT' },
  { key: 'urgent', name: 'Website Emergency', dataType: 'TEXT' },
  { key: 'town', name: 'Website Service Area', dataType: 'TEXT' },
  { key: 'address', name: 'Website Project Address', dataType: 'TEXT' },
  { key: 'contactPref', name: 'Website Contact Preference', dataType: 'TEXT' },
  { key: 'page', name: 'Website Lead Page', dataType: 'TEXT' },
];

async function ghl(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GHL ${method} ${path} ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

// Resolve (and create if needed) the custom field IDs once, then cache.
let fieldMapPromise = null;
function getFieldMap() {
  if (!fieldMapPromise) {
    fieldMapPromise = (async () => {
      const map = {};
      let existing = [];
      try {
        const r = await ghl('GET', `/locations/${LOCATION_ID}/customFields?model=contact`);
        existing = r.customFields || [];
      } catch (e) {
        console.error('GHL custom field lookup failed (add customFields.readonly scope):', e.message);
        return map;
      }
      for (const f of CUSTOM_FIELDS) {
        const hit = existing.find((x) => (x.name || '').trim().toLowerCase() === f.name.toLowerCase());
        if (hit) { map[f.key] = hit.id; continue; }
        try {
          const c = await ghl('POST', `/locations/${LOCATION_ID}/customFields`, { name: f.name, dataType: f.dataType, model: 'contact' });
          const id = (c.customField && c.customField.id) || c.id;
          if (id) { map[f.key] = id; console.log('GHL custom field created:', f.name); }
        } catch (e) {
          console.error(`GHL could not create custom field "${f.name}" (add customFields.write scope or create it manually):`, e.message);
        }
      }
      return map;
    })().catch((e) => { fieldMapPromise = null; throw e; });
    // retry the lookup on the next lead if nothing resolved (e.g. scope fixed later)
    fieldMapPromise.then((m) => { if (!Object.keys(m).length) fieldMapPromise = null; });
  }
  return fieldMapPromise;
}

function formatPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d[0] === '1') return '+' + d;
  return p || undefined;
}

async function sendLead(lead) {
  const results = { contact: null, webhook: null };
  const [firstName, ...rest] = (lead.name || '').trim().split(/\s+/);
  const tags = [
    'website lead',
    lead.service && `web service: ${lead.service}`,
    lead.town && `web town: ${lead.town}`,
    lead.urgent && 'urgent',
  ].filter(Boolean);

  const values = {
    service: lead.serviceName || lead.service || 'Not sure',
    message: lead.message || '',
    urgent: lead.urgent ? 'Yes' : 'No',
    town: lead.town || '',
    address: lead.address || '',
    contactPref: lead.contactPref || '',
    page: lead.page ? `${SITE}${lead.page.startsWith('/') ? '' : '/'}${lead.page}` : '',
  };

  if (TOKEN && LOCATION_ID) {
    const fieldMap = await getFieldMap().catch(() => ({}));
    const customFields = Object.entries(fieldMap)
      .filter(([k]) => values[k])
      .map(([k, id]) => ({ id, field_value: values[k] }));

    const up = await ghl('POST', '/contacts/upsert', {
      locationId: LOCATION_ID,
      firstName: firstName || undefined,
      lastName: rest.join(' ') || undefined,
      name: lead.name || undefined,
      phone: formatPhone(lead.phone),
      email: lead.email || undefined,
      postalCode: lead.zip || undefined,
      address1: lead.address || undefined,
      city: lead.town || undefined,
      state: 'MA',
      country: 'US',
      source: SOURCE,
      tags,
      customFields: customFields.length ? customFields : undefined,
    });
    const id = up.contact && up.contact.id;
    results.contact = id || true;

    // Upsert can replace tags on an existing contact in some accounts; make sure ours are on.
    if (id) {
      await ghl('POST', `/contacts/${id}/tags`, { tags }).catch((e) => console.error('tag add failed', e.message));
      const note = [
        `Website request (${lead.urgent ? 'URGENT' : 'standard'})`,
        `Name: ${lead.name || '-'}`,
        `Phone: ${lead.phone || '-'}`,
        `Email: ${lead.email || '-'}`,
        `Service: ${values.service}`,
        `Address: ${lead.address || '-'}`,
        `Town: ${lead.town || '-'} ${lead.zip || ''}`.trim(),
        `Best way to reach: ${lead.contactPref || '-'}`,
        `Page: ${values.page || '-'}`,
        `Message: ${lead.message || '-'}`,
      ].join('\n');
      await ghl('POST', `/contacts/${id}/notes`, { body: note }).catch((e) => console.error('note failed', e.message));
    }
  } else {
    console.error(`GHL not configured: token ${TOKEN ? 'set' : 'MISSING (ghl / GHL_PIT)'}, location ${LOCATION_ID ? 'set' : 'MISSING (LOCATION_ID / GHL_LOCATION_ID)'}`);
  }

  if (WEBHOOK_URL) {
    const r = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, ...{ serviceName: values.service, emergency: values.urgent, pageUrl: values.page }, tags, source: SOURCE }),
    });
    results.webhook = r.ok;
    if (!r.ok) console.error('webhook failed', r.status);
  }

  if (!results.contact && !results.webhook) throw new Error('No GHL destination configured (set GHL_API + LOCATION_ID in Railway)');
  return results;
}

// Warm the custom-field lookup at boot so the first lead isn't slower.
if (TOKEN && LOCATION_ID) getFieldMap().catch(() => {});

module.exports = { sendLead };
