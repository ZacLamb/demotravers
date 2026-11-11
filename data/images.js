// All imagery is the client's own photography from the existing GoHighLevel media library.
// Served through the LeadConnector image resizer (WebP, sized per use).
// To self-host later: run `node scripts/fetch-images.js` and set LOCAL_IMAGES=1.
const LOC = 'ENMZbnrUlbWf0nPU4x5L';
const HOSTS = {
  f: `https://assets.cdn.filesafe.space/${LOC}/media/`,
  g: `https://storage.googleapis.com/msgsndr/${LOC}/media/`,
};

function src(ref, w = 1200) {
  const [host, file] = ref.includes(':') ? ref.split(':') : ['f', ref];
  if (process.env.LOCAL_IMAGES === '1') return `/img/media/${file}`;
  return `https://images.leadconnectorhq.com/image/f_webp/q_80/r_${w}/u_${HOSTS[host]}${file}`;
}

function srcset(ref) {
  return [640, 1200, 1800].map((w) => `${src(ref, w)} ${w}w`).join(', ');
}

const site = {
  logo: 'f:677ffa1641faa5f00e465671.webp',
  homeHero: 'f:678fc65b6debad0636338bd3.jpeg',
  why: 'f:678007ac639dd25f3a631433.jpeg',
  about1: 'f:678007ac249ca0f8cdbe8b3c.jpeg',
  about2: 'f:678007acf30fd1ccd5306a3c.jpeg',
};

module.exports = { src, srcset, site, HOSTS };
