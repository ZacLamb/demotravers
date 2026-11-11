// Crawls every internal link from / and fails on any non-200 (redirects allowed for legacy paths).
const base = process.env.BASE || 'http://localhost:3000';
const seen = new Map(); const queue = ['/'];
(async () => {
  while (queue.length) {
    const p = queue.shift(); if (seen.has(p)) continue;
    const r = await fetch(base + p, { redirect: 'manual' }); seen.set(p, r.status);
    if (r.status !== 200) continue;
    const html = await r.text();
    for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
      const u = m[1]; if (/\.(css|js|svg|png|xml|txt)$/.test(u)) continue;
      if (!seen.has(u)) queue.push(u);
    }
  }
  const bad = [...seen].filter(([, s]) => s !== 200);
  console.log(`Crawled ${seen.size} pages. Non-200: ${bad.length}`); bad.forEach((b) => console.log(b));
  const sm = await (await fetch(base + '/sitemap.xml')).text();
  const locs = [...sm.matchAll(/<loc>[^<]*?(\/[^<]*)?<\/loc>/g)].length; console.log('Sitemap URLs:', locs);
  for (const old of ['/insights', '/areas', '/areas/plymouth', '/services/selective-interior', '/insights/pool-removal-planning-south-shore', '/demolition', '/demolition/pool-removal', '/demolition/areas/plymouth']) {
    const r = await fetch(base + old, { redirect: 'manual' }); console.log('redirect', old, r.status, r.headers.get('location'));
  }
  process.exit(bad.length ? 1 : 0);
})();
