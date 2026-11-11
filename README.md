# Travers Demolition — Standalone Website Mockup

A new, independent GitHub/Railway-ready Express website for **Travers Demolition, a division of Travers Group**. It is separate from the main Travers website and doesn't modify its code.

## Start locally

```bash
npm install
npm start
```

Visit `http://localhost:3000`. Test with `npm test`.

## Deploy to GitHub and Railway

1. Create a **new** GitHub repository (for example `travers-demolition`).
2. Upload **the contents of this ZIP** to the repository root (not a nested folder).
3. In Railway create a new service from the repo, with `npm start` as the start command (usually auto-detected).
4. Test using Railway's generated `*.up.railway.app` domain first.
5. Add a new custom domain only when you choose one. Do not change the existing Travers Group DNS for this preview.
6. Set `SITE_URL` to the deployed public HTTPS URL for accurate sitemap/canonical links.

### Lead forms

The form intentionally refuses to claim success until CRM delivery is configured. For GoHighLevel set `GHL_API` and `LOCATION_ID` in Railway for the same integration approach as the existing Travers website, or provide `GHL_WEBHOOK_URL` if the library supports that setup. Test with an actual lead before promoting the site.

### Content program ($100/month proposal)

The first two editorial drafts live in `data/articles.js`. Add two fact-checked new articles per month, with distinct original information and internal links. The site automatically includes new entries in the article index and sitemap. Avoid generating duplicate town pages at scale: use verified local information, real project proof, and service-specific examples.

### Important

Mockup copy is written as an invitation to discuss project suitability, not a guarantee of licenses, permitting, or service availability. Verify all actual demolition capabilities, compliance, lead routing and imagery licenses before public marketing. A background photograph is loaded from Unsplash and requires network connectivity; replace it with licensed Travers project imagery when available.
