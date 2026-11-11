// Builds the localized copy for service × town pages so each one reads naturally and differs
// meaningfully: town character + town-specific demolition context + service local angle +
// villages + nearby towns. Pages are only as good as data/towns.js — keep those notes real.
const biz = require('./business');

function list(arr) {
  if (arr.length <= 1) return arr.join('');
  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
}
const vil = (t, n = 3) => (t.villages.length ? ` — including ${list(t.villages.slice(0, n))}` : '');

const PHRASES = {
  'residential-demolition': {
    h1: (t) => `House demolition in ${t.name}, MA`,
    title: (t) => `House Demolition ${t.name} MA | Residential Teardowns | Travers Demolition`,
    meta: (t) => `Whole-house demolition and residential teardowns in ${t.name}, MA — permits walked through, debris hauled, lot graded for your builder. Free estimates: ${biz.phone}.`,
    lead: (t) => `Replacing an older home in ${t.name}? We take houses, cottages and additions down to grade across ${t.name}${vil(t)} — then haul every load and rough-grade the lot so your builder can start.`,
  },
  'commercial-demolition': {
    h1: (t) => `Commercial demolition in ${t.name}, MA`,
    title: (t) => `Commercial Demolition ${t.name} MA | Light Commercial Demo Contractor | Travers Demolition`,
    meta: (t) => `Light commercial demolition in ${t.name}, MA — small buildings, tenant tear-outs and site clearing for GCs, developers and owners. Bid requests: ${biz.phone}.`,
    lead: (t) => `Need a demolition sub for a light commercial job in ${t.name}? We take down small buildings, tear out tenant spaces and clear pads and hardscape — scheduled around your critical path, with full haul-off.`,
  },
  'interior-demolition': {
    h1: (t) => `Interior demolition in ${t.name}, MA`,
    title: (t) => `Interior Demolition ${t.name} MA | Kitchen, Bath & Gut-Outs | Travers Demolition`,
    meta: (t) => `Interior demolition and gut-outs in ${t.name}, MA — kitchens, baths, walls, ceilings and floors removed with the rest of the house protected. Call ${biz.phone}.`,
    lead: (t) => `Starting a remodel in ${t.name}? We handle the tear-out — kitchens, baths, walls, ceilings, floors or a full gut — protecting what stays and hauling every load so your contractor walks into a clean shell.`,
  },
  'garage-shed-removal': {
    h1: (t) => `Garage, shed & deck removal in ${t.name}, MA`,
    title: (t) => `Garage Demolition & Shed Removal ${t.name} MA | Deck Removal | Travers Demolition`,
    meta: (t) => `Detached garage demolition, shed removal and deck & porch removal in ${t.name}, MA. Teardown, slab and footings out, debris hauled, area left level. Call ${biz.phone}.`,
    lead: (t) => `That sagging garage, rotting shed or unsafe deck in ${t.name} — we take it down, pull the footings or slab, haul everything and leave the area level and raked clean.`,
  },
  'pool-removal': {
    h1: (t) => `Pool removal in ${t.name}, MA`,
    title: (t) => `Pool Removal ${t.name} MA | In-Ground Pool Demolition & Fill-In | Travers Demolition`,
    meta: (t) => `In-ground and above-ground pool removal in ${t.name}, MA — full or partial removal, clean fill, compaction and grading. Free estimates: ${biz.phone}.`,
    lead: (t) => `Done paying to open and close a pool you don’t use? We remove in-ground and above-ground pools across ${t.name}${vil(t)} — shell out, clean fill compacted in lifts, yard graded and ready.`,
  },
  'concrete-removal': {
    h1: (t) => `Concrete removal in ${t.name}, MA`,
    title: (t) => `Concrete Removal ${t.name} MA | Slab, Driveway & Patio Demolition | Travers Demolition`,
    meta: (t) => `Concrete removal in ${t.name}, MA — slabs, driveways, patios, walkways, steps and footings broken out and hauled away. Call ${biz.phone}.`,
    lead: (t) => `Cracked slab, heaved walkway or an old concrete patio in ${t.name}? We break it out with the right equipment, haul it away and leave the base ready for whatever goes in next.`,
  },
  'excavation-site-prep': {
    h1: (t) => `Excavation & site prep in ${t.name}, MA`,
    title: (t) => `Excavation & Site Preparation ${t.name} MA | Lot Clearing & Grading | Travers Demolition`,
    meta: (t) => `Excavation and site preparation in ${t.name}, MA — clearing, digging and rough grading after demolition so your build can start. Call ${biz.phone}.`,
    lead: (t) => `Getting a ${t.name} lot ready to build? We clear, dig and rough-grade — after a teardown or on raw land — so your foundation, addition or hardscape crew can start on day one.`,
  },
  'debris-removal': {
    h1: (t) => `Demolition debris removal in ${t.name}, MA`,
    title: (t) => `Debris Removal & Hauling ${t.name} MA | Demolition Debris | Travers Demolition`,
    meta: (t) => `Demolition and construction debris removal in ${t.name}, MA — loaded with equipment and hauled away, no dumpster in the driveway. Call ${biz.phone}.`,
    lead: (t) => `Construction debris, an old collapsed structure or a pile that’s been there for years — we load it with equipment and haul it out of ${t.name} fast, without a dumpster sitting in your driveway.`,
  },
};

function serviceTown(service, town, towns) {
  const p = PHRASES[service.slug];
  const nearby = town.nearby.map((s) => towns.find((t) => t.slug === s)).filter(Boolean);
  return {
    h1: p.h1(town),
    title: p.title(town),
    meta: p.meta(town),
    lead: p.lead(town),
    local: `${town.note} ${town.demo}`,
    angle: service.localAngle,
    nearby,
    faqs: [
      {
        q: `Do you do ${service.name.toLowerCase()} in ${town.name}, MA?`,
        a: `Yes. ${town.name} is part of our regular South Shore service area${town.villages.length ? `, including ${list(town.villages.slice(0, 4))}` : ''}. Call ${biz.phone} or request a free estimate online and we’ll set up a time to walk the property.`,
      },
      {
        q: `Who issues demolition permits in ${town.name}?`,
        a: `Demolition and building permits are issued by the ${town.name} Building Department. Requirements vary by project, and older buildings may need historical review first — we’ll go over what your job needs during the estimate.`,
      },
      ...service.faqs.slice(0, 2),
    ],
  };
}

function townHub(town) {
  return {
    h1: `Demolition contractor in ${town.name}, MA`,
    title: `Demolition Contractor ${town.name} MA | House, Commercial, Pool & Concrete Removal | Travers Demolition`,
    meta: `House demolition, commercial demo, garage and shed removal, pool removal, concrete removal and site prep in ${town.name}, MA. A division of Travers Group — ${biz.years} years local. ${biz.phone}.`,
  };
}

module.exports = { serviceTown, townHub, list };
