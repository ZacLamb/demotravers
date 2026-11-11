const express = require('express');
const path = require('path');
const compression = require('compression');

const biz = require('./data/business');
const services = require('./data/services');
const towns = require('./data/towns');
const articles = require('./data/articles');
const images = require('./data/images');
const { serviceTown, townHub, list } = require('./data/compose');
const { sendLead } = require('./lib/ghl');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = (process.env.SITE_URL || 'https://demolition.traversgroupma.com').replace(/\/$/, '');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
app.use(compression());
app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// Optional canonical-host redirect: set CANONICAL_HOST (e.g. demolition.traversgroupma.com)
// once the custom domain is live so the *.up.railway.app host 301s to it.
const CANONICAL_HOST = (process.env.CANONICAL_HOST || '').toLowerCase();
app.use((req, res, next) => {
  if (CANONICAL_HOST && req.hostname.toLowerCase() !== CANONICAL_HOST && !req.hostname.startsWith('localhost')) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }
  next();
});

// Trailing-slash normalization
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) return res.redirect(301, req.path.slice(0, -1) + (req.url.slice(req.path.length) || ''));
  next();
});

const svcUrl = (s) => `/services/${s.slug}`;
const townUrl = (t) => `/service-areas/${t.slug}`;
const stUrl = (s, t) => `/services/${s.slug}/${t.slug}`;
const artUrl = (a) => `/articles/${a.slug}`;
const regions = [...new Set(towns.map((t) => t.region))];

app.locals = Object.assign(app.locals, {
  biz, services, why: services.why, IMG: services.IMG, GALLERY: services.GALLERY, towns, regions, articles,
  img: images.src, srcset: images.srcset, svcUrl, townUrl, stUrl, artUrl, list,
  SITE_URL, GA_ID: process.env.GA_ID || '', year: new Date().getFullYear(),
});

function render(res, view, data) {
  res.render(view, { canonical: SITE_URL + (res.req.path === '/' ? '' : res.req.path), breadcrumbs: [], ...data });
}

// ---------- Pages ----------
app.get('/', (req, res) => render(res, 'home', {
  title: 'Travers Demolition | House & Commercial Demolition, Pool Removal | South Shore MA',
  description: `Residential and light commercial demolition, pool removal, concrete removal and site prep across the South Shore and Cape Cod Canal. A division of Travers Group — ${biz.years} years local. ${biz.phone}.`,
}));

app.get('/services', (req, res) => render(res, 'services', {
  title: 'Demolition Services | House, Commercial, Pool & Concrete Removal | Travers Demolition',
  description: 'House demolition, light commercial demolition, interior gut-outs, garage and shed removal, pool removal, concrete removal, excavation and debris hauling on the South Shore.',
  breadcrumbs: [{ name: 'Services', url: '/services' }],
}));

app.get('/services/:slug', (req, res, next) => {
  const service = services.find((s) => s.slug === req.params.slug);
  if (!service) return next();
  render(res, 'service', {
    service, title: service.title, description: service.meta, ogImage: service.hero,
    breadcrumbs: [{ name: 'Services', url: '/services' }, { name: service.name, url: svcUrl(service) }],
  });
});

app.get('/services/:slug/:town', (req, res, next) => {
  const service = services.find((s) => s.slug === req.params.slug);
  const town = towns.find((t) => t.slug === req.params.town);
  if (!service || !town) return next();
  const c = serviceTown(service, town, towns);
  render(res, 'service-town', {
    service, town, c, title: c.title, description: c.meta, ogImage: service.hero,
    breadcrumbs: [
      { name: 'Services', url: '/services' },
      { name: service.name, url: svcUrl(service) },
      { name: `${town.name}, MA`, url: stUrl(service, town) },
    ],
  });
});

app.get('/service-areas', (req, res) => render(res, 'areas', {
  title: 'Service Areas | South Shore & Cape Cod Canal Demolition | Travers Demolition',
  description: `Travers Demolition serves ${towns.length} towns from Bourne to Hingham — Plymouth, Kingston, Duxbury, Marshfield, Pembroke, Hanover, Norwell, Scituate and more.`,
  breadcrumbs: [{ name: 'Service Areas', url: '/service-areas' }],
}));

app.get('/service-areas/:town', (req, res, next) => {
  const town = towns.find((t) => t.slug === req.params.town);
  if (!town) return next();
  const c = townHub(town);
  render(res, 'town', {
    town, c, title: c.title, description: c.meta,
    nearby: town.nearby.map((s) => towns.find((t) => t.slug === s)).filter(Boolean),
    breadcrumbs: [{ name: 'Service Areas', url: '/service-areas' }, { name: `${town.name}, MA`, url: townUrl(town) }],
  });
});

app.get('/articles', (req, res) => render(res, 'articles', {
  title: 'Demolition Planning Guides | Travers Demolition',
  description: 'Plain-English guides to demolition permits, pool removal, teardown prep and site work for South Shore homeowners, builders and property owners.',
  breadcrumbs: [{ name: 'Articles', url: '/articles' }],
}));

app.get('/articles/:slug', (req, res, next) => {
  const article = articles.find((a) => a.slug === req.params.slug);
  if (!article) return next();
  render(res, 'article', {
    article, title: article.metaTitle, description: article.meta, ogImage: article.img, ogType: 'article',
    breadcrumbs: [{ name: 'Articles', url: '/articles' }, { name: article.category, url: artUrl(article) }],
  });
});

app.get('/about', (req, res) => render(res, 'about', {
  title: `About Travers Demolition | A Division of Travers Group | Bourne, MA`,
  description: `Travers Demolition is the demolition division of Travers Group — family-owned in Bourne, MA for ${biz.years} years, serving the South Shore and Cape Cod Canal.`,
  breadcrumbs: [{ name: 'About', url: '/about' }],
}));

const CUSTOMER_TYPES = ['Homeowner', 'Contractor / builder', 'Property manager', 'Commercial owner', 'Developer', 'Real estate / estate sale'];
app.get('/contact', (req, res) => render(res, 'contact', {
  preService: services.some((s) => s.slug === req.query.service) ? req.query.service : '',
  preTown: towns.some((t) => t.slug === req.query.town) ? req.query.town : '',
  preType: CUSTOMER_TYPES.includes(req.query.type) ? req.query.type : (req.query.service === 'commercial-demolition' ? 'Contractor / builder' : 'Homeowner'),
  title: 'Request a Demolition Estimate | Travers Demolition | (508) 888-9432',
  description: 'Request a free demolition estimate — house, commercial, garage and shed, pool and concrete removal or site prep on the South Shore. Call (508) 888-9432.',
  breadcrumbs: [{ name: 'Free Estimate', url: '/contact' }],
}));

// ---------- Leads -> GoHighLevel ----------
const hits = new Map(); // simple per-IP limiter: 8 submissions / 15 min
function limited(ip) {
  const now = Date.now(), win = 15 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 8;
}
const svcBySlug = Object.fromEntries(services.map((s) => [s.slug, s]));
const townBySlug = Object.fromEntries(towns.map((t) => [t.slug, t]));
app.post('/api/lead', async (req, res) => {
  const b = req.body || {};
  const wantsJson = (req.headers.accept || '').includes('application/json');
  const done = () => (wantsJson ? res.json({ ok: true }) : res.redirect(303, '/contact?sent=1'));
  const fail = (status, msg) => (wantsJson ? res.status(status).json({ ok: false, error: msg }) : res.status(status).send(msg));
  if (b.company_website) return done(); // honeypot
  if (limited(req.ip)) return fail(429, `Too many requests — please call ${biz.phone}.`);
  const clean = (v, n = 200) => String(v || '').trim().slice(0, n);
  const t = townBySlug[clean(b.town, 60)];
  const lead = {
    name: clean(b.name, 80), phone: clean(b.phone, 30), email: clean(b.email, 120), company: clean(b.company, 120),
    address: clean(b.address, 160), zip: clean(b.zip, 10) || (t && t.zip) || '',
    town: t ? t.name : clean(b.town, 60), service: clean(b.service, 60),
    customerType: clean(b.customer_type, 60), timeline: clean(b.timeline, 120),
    message: clean(b.message, 1500), page: clean(b.page, 300), contactPref: clean(b.contact_pref, 20),
    urgent: false,
  };
  lead.serviceName = svcBySlug[lead.service] ? svcBySlug[lead.service].name : (lead.service || 'Not sure');
  const digits = lead.phone.replace(/\D/g, '');
  if (!lead.name || digits.length < 10) return fail(400, 'Please include your name and a 10-digit phone number.');
  try {
    await sendLead(lead);
    console.log('lead ok', lead.service, lead.town, lead.customerType);
    return done();
  } catch (e) {
    console.error('LEAD FAILED', e.message, JSON.stringify(lead));
    return fail(502, `Sorry — we could not submit that. Please call ${biz.phone}.`);
  }
});

// ---------- Redirects: old ChatGPT mockup URLs + strategy-doc /demolition paths ----------
const legacy = {
  '/insights': '/articles',
  '/insights/pool-removal-planning-south-shore': '/articles/pool-removal-massachusetts',
  '/insights/residential-demolition-estimate-checklist': '/articles/house-demolition-checklist',
  '/areas': '/service-areas',
  '/services/selective-interior': '/services/interior-demolition',
  '/demolition': '/',
};
Object.entries(legacy).forEach(([from, to]) => app.get(from, (req, res) => res.redirect(301, to)));
app.get('/areas/:town', (req, res) => res.redirect(301, `/service-areas/${req.params.town.replace(/-ma$/, '')}-ma`));
app.get('/demolition/areas/:town', (req, res) => res.redirect(301, `/service-areas/${req.params.town.replace(/-ma$/, '')}-ma`));
app.get('/demolition/articles/:slug', (req, res) => res.redirect(301, `/articles/${req.params.slug}`));
app.get('/demolition/:slug', (req, res) => res.redirect(301, `/services/${req.params.slug}`));

// ---------- SEO ----------
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    ['/', '1.0'], ['/services', '0.9'], ['/service-areas', '0.8'], ['/articles', '0.7'], ['/about', '0.5'], ['/contact', '0.8'],
  ];
  services.forEach((s) => urls.push([svcUrl(s), '0.9']));
  towns.forEach((t) => urls.push([townUrl(t), t.priority ? '0.8' : '0.7']));
  services.forEach((s) => towns.forEach((t) => urls.push([stUrl(s, t), t.priority ? '0.7' : '0.6'])));
  articles.forEach((a) => urls.push([artUrl(a), '0.6', a.date]));
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(([u, p, d]) => `  <url><loc>${SITE_URL}${u === '/' ? '' : u}</loc><lastmod>${d || today}</lastmod><priority>${p}</priority></url>`).join('\n') +
    `\n</urlset>\n`
  );
});

app.use((req, res) => res.status(404).render('404', {
  title: 'Page not found | Travers Demolition', description: '', canonical: SITE_URL, breadcrumbs: [], noindex: true,
}));

if (require.main === module) app.listen(PORT, () => console.log(`Travers Demolition site on :${PORT}`));
module.exports = app;
