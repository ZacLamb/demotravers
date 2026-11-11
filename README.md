# Travers Demolition — a division of Travers Group

Node/Express + EJS site built on the same design system as traversgroupma.com (repo `ZacLamb/Travers`).
**142 pages:** home, about, contact, services hub, 8 service pages, 14 town hubs, 112 service×town pages, articles hub + articles.

## Deploy (Railway)
1. New service from this repo — `npm start` is auto-detected.
2. Variables:
   - `SITE_URL` — public URL, e.g. `https://demolition.traversgroupma.com` (canonicals, sitemap, schema)
   - `GHL_API` — Private Integration token (contacts.write, contacts.readonly, locations/customFields.readonly + .write, opportunities.write)
   - `LOCATION_ID` — the Travers Group sub-account ID
   - `GHL_PIPELINE_ID` + `GHL_STAGE_ID` — optional: drop every lead into the Demolition pipeline's "New lead" stage
   - `CANONICAL_HOST` — optional: once the custom domain is live, 301 the railway.app host to it
   - `GA_ID` — optional GA4 measurement ID (fires `generate_lead` on submit)
3. Add the custom domain, then submit `/sitemap.xml` in Search Console.

## Leads
Every form posts to `/api/lead` → `lib/ghl.js` (same integration as the main Travers site), but tracked as its own channel:
source `Website - Travers Demolition`, tags `website lead`, `demolition lead`, `web division: demolition`, `web service: <slug>`, `web town: <name>`, `web customer: <type>`,
custom fields **Website Customer Type, Website Project Timeline, Website Division** (+ the existing Website * fields), and a note with the full submission.
Suggested GHL pipeline: New lead → Contacted → Site visit → Estimate sent → Won / Lost.
Forms: quick contact (header), full estimate (`/contact?service=<slug>&town=<slug>`), contractor bid request (`/services/commercial-demolition#bid`).

## Editing
- `data/business.js` — phone, email, address, coverage line
- `data/services.js` — the 8 services (copy, includes, FAQs, images). **Confirm pool removal, concrete removal and excavation with Travers.**
- `data/towns.js` — towns, villages and the town-specific demolition notes that make each local page unique
- `data/compose.js` — service×town page templates
- `data/articles.js` — SEO articles (2/month; upcoming topics listed at the top of the file)

## Old URLs
The ChatGPT mockup URLs (`/insights/*`, `/areas/*`, `/services/selective-interior`) and the strategy doc's `/demolition/*` paths all 301 to their new equivalents.

## Test
`npm start` then `npm test` — crawls every internal link, checks the sitemap and redirects.
