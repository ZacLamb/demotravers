// Downloads every referenced image into public/img/media so the site can run with LOCAL_IMAGES=1.
const fs = require('fs'); const path = require('path');
const { HOSTS, site } = require('../data/images'); const services = require('../data/services');
const refs = new Set(Object.values(site));
services.forEach((s) => [s.hero, s.card, ...s.features.map((f) => f.img), ...s.gallery].forEach((r) => refs.add(r)));
const out = path.join(__dirname, '..', 'public', 'img', 'media'); fs.mkdirSync(out, { recursive: true });
(async () => {
  for (const ref of refs) {
    const [h, file] = ref.split(':'); const dest = path.join(out, file);
    if (fs.existsSync(dest)) continue;
    const r = await fetch(HOSTS[h] + file); if (!r.ok) { console.log('FAIL', ref, r.status); continue; }
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); console.log('ok', file);
  }
})();
