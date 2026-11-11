'use strict';
const express = require('express');
const path = require('path');
const compression = require('compression');
const division = require('./data/division');
const articles = require('./data/articles');
const { sendLead } = require('./lib/ghl');
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const MAIN_SITE_URL = 'https://www.traversgroupma.com';
const PHONE = '(508) 888-9432';
const PHONE_LINK = 'tel:+15088889432';
const IMG = 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1600/u_https://storage.googleapis.com/msgsndr/ENMZbnrUlbWf0nPU4x5L/media/67d097f8e1f641371dea52fe.png';
const services = division.services;
const towns = division.areas;
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), {maxAge: '1d'}));
app.use(express.json({limit: '25kb'}));
app.use(express.urlencoded({extended: false, limit: '25kb'}));
// No forced www/root hostname redirect: this standalone repo can run on any Railway custom domain.
app.use((req,res,next)=>{
  res.locals = {siteUrl:SITE_URL,mainSite:MAIN_SITE_URL,phone:PHONE,phoneLink:PHONE_LINK,
    heroImage:IMG,services,towns,articles,currentPath:req.path,year:new Date().getFullYear()};
  next();
});
function page(res,template,{title,description,...data}) {
  res.render(template,{title,description,canonical:SITE_URL+res.req.path, ...data});
}
app.get('/',(req,res)=>page(res,'home',{
  title:'Travers Demolition | South Shore MA Demolition & Excavation',
  description:'A dedicated division of Travers Group. Residential and commercial demolition, pool removal, excavation, and site preparation inquiries across the South Shore.'
}));
app.get('/services',(req,res)=>page(res,'services',{
  title:'Demolition & Excavation Services | Travers Demolition',
  description:'Explore residential demolition, commercial tear-outs, pool removal, concrete removal, excavation and site preparation.'
}));
app.get('/services/:slug',(req,res,next)=>{
  const service=services.find(s=>s.slug===req.params.slug);
  if(!service)return next();
  page(res,'service',{service,title:`${service.name} | Travers Demolition`,description:service.meta});
});
app.get('/areas',(req,res)=>page(res,'areas',{
  title:'South Shore Demolition Service Areas | Travers Demolition',
  description:'Demolition and excavation project inquiries across Plymouth, Marshfield, Duxbury, Hingham and surrounding South Shore communities.'
}));
app.get('/areas/:slug',(req,res,next)=>{
  const town=towns.find(t=>t.slug===req.params.slug); if(!town)return next();
  page(res,'area',{town,title:`Demolition Project Inquiries in ${town.name}, MA | Travers Demolition`,description:`Talk to Travers Demolition about residential demolition, commercial tear-outs, pool removal, concrete removal, and excavation projects in ${town.name}, MA.`});
});
app.get('/insights',(req,res)=>page(res,'insights',{
  title:'Demolition Planning Guides | Travers Demolition',
  description:'Helpful demolition, excavation, and pool-removal planning guides for South Shore property owners and contractors.'
}));
app.get('/insights/:slug',(req,res,next)=>{
  const article=articles.find(a=>a.slug===req.params.slug);if(!article)return next();
  page(res,'article',{article,title:`${article.title} | Travers Demolition`,description:article.summary});
});
app.get('/contact',(req,res)=>page(res,'contact',{
  title:'Request a Demolition Estimate | Travers Demolition',
  description:'Tell us about your South Shore demolition, pool removal, concrete removal, or excavation project.'
}));
const leadHits=new Map();
app.post('/api/lead',async(req,res)=>{
  const b=req.body||{};
  if(b.company_website)return res.status(200).json({ok:true});
  const clean=(s,n=250)=>String(s||'').trim().slice(0,n);
  const name=clean(b.name,90), phone=clean(b.phone,30), email=clean(b.email,120);
  if(!name||phone.replace(/\D/g,'').length<10)return res.status(400).json({ok:false,error:'Please add your name and a valid phone number.'});
  const ip=req.ip,now=Date.now(),list=(leadHits.get(ip)||[]).filter(t=>now-t<900000);list.push(now);leadHits.set(ip,list);
  if(list.length>6)return res.status(429).json({ok:false,error:'Too many submissions. Please call us instead.'});
  if(leadHits.size>2000)leadHits.clear();
  // Mockup mode: no false claim of delivery. Configure GHL_API and LOCATION_ID to activate.
  const enabled=Boolean(process.env.GHL_API||process.env.GHL_PIT||process.env.GHL_WEBHOOK_URL) && Boolean(process.env.LOCATION_ID||process.env.GHL_LOCATION_ID||process.env.GHL_WEBHOOK_URL);
  if(!enabled)return res.status(503).json({ok:false,error:'This is a preview form. Connect GoHighLevel in Railway before accepting real inquiries. Please call us for now.'});
  const service=clean(b.service,80),town=clean(b.town,80);
  const lead={name,phone,email,service,serviceName:service,town,address:clean(b.address,160),zip:clean(b.zip,12),message:clean(b.message,1400),contactPref:clean(b.contact_pref,30),page:clean(b.page,180)||req.headers.referer||'Standalone demolition site',urgent:false};
  try {await sendLead(lead);res.json({ok:true});}
  catch(err){console.error('Lead delivery failed:',err.message);res.status(502).json({ok:false,error:'The form could not be delivered. Please call us directly.'});}
});
app.get('/robots.txt',(req,res)=>res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`));
app.get('/sitemap.xml',(req,res)=>{
  const paths=['/','/services','/areas','/insights','/contact',...services.map(s=>`/services/${s.slug}`),...towns.map(t=>`/areas/${t.slug}`),...articles.map(a=>`/insights/${a.slug}`)];
  const escaped=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>`<url><loc>${escaped(SITE_URL+p)}</loc></url>`).join('')+'</urlset>');
});
app.use((req,res)=>res.status(404).render('404',{title:'Page Not Found | Travers Demolition',description:'This page could not be found.',canonical:SITE_URL+req.path}));
if(require.main===module)app.listen(PORT,'0.0.0.0',()=>console.log(`Travers Demolition running on port ${PORT}`));
module.exports=app;
