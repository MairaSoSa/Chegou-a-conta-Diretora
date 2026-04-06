'use strict';
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const os = require('os');
const Module = require('module');

const distDir = __dirname;
const tmpDir = os.tmpdir();

// ── 1. Extract native SQLite binary (optional — app uses PostgreSQL as primary) ─
const nativeGz  = path.join(distDir, 'better_sqlite3.gz');
const nativeTmp = path.join(tmpDir, 'better_sqlite3.node');
const hasSqlite = fs.existsSync(nativeGz);
if (hasSqlite && !fs.existsSync(nativeTmp)) {
  try {
    fs.writeFileSync(nativeTmp, zlib.gunzipSync(fs.readFileSync(nativeGz)));
  } catch (e) {
    console.warn('[bootstrap] SQLite binary extraction skipped:', e.message);
  }
}

// ── 2. Patch Module loading so better-sqlite3's `bindings` finds the binary ──
if (hasSqlite && fs.existsSync(nativeTmp)) {
  const origLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request && request.endsWith('.node') && path.basename(request) === 'better_sqlite3.node') {
      return origLoad.call(this, nativeTmp, parent, isMain);
    }
    return origLoad.apply(this, arguments);
  };
  process.env.BETTER_SQLITE3_NODE = nativeTmp;
}

// ── 2b. Polyfill browser globals required by pdfjs-dist on Node.js ───────────
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() { this.a=1;this.b=0;this.c=0;this.d=1;this.e=0;this.f=0; }
    static fromFloat32Array() { return new globalThis.DOMMatrix(); }
    static fromFloat64Array() { return new globalThis.DOMMatrix(); }
    static fromMatrix() { return new globalThis.DOMMatrix(); }
    multiply() { return new globalThis.DOMMatrix(); }
    translate() { return new globalThis.DOMMatrix(); }
    scale() { return new globalThis.DOMMatrix(); }
    rotate() { return new globalThis.DOMMatrix(); }
    inverse() { return new globalThis.DOMMatrix(); }
    transformPoint(p) { return p || {x:0,y:0}; }
  };
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(sw, sh) {
      this.width = sw instanceof Uint8ClampedArray ? arguments[1] : sw;
      this.height = sw instanceof Uint8ClampedArray ? arguments[2] : sh;
      this.data = sw instanceof Uint8ClampedArray ? sw : new Uint8ClampedArray(this.width * this.height * 4);
    }
  };
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    constructor() {}
    addPath(){}closePath(){}moveTo(){}lineTo(){}bezierCurveTo(){}
    quadraticCurveTo(){}arc(){}arcTo(){}ellipse(){}rect(){}
  };
}

// ── 3. Decompress and execute the main server bundle ─────────────────────────
// Module._compile sets __dirname = distDir so paths resolve correctly.
const gzPath = path.join(distDir, 'index.cjs.gz');
let source  = zlib.gunzipSync(fs.readFileSync(gzPath)).toString('utf8');

// ── 3a. Patch: guard createRequire input for Node runtime compatibility ─────
// Some pdfjs code paths call createRequire(gxe.url), but gxe.url may be
// undefined in this bundled CommonJS runtime, causing ERR_INVALID_ARG_VALUE.
const _REQ_OLD = 'createRequire(gxe.url)';
const _REQ_NEW = 'createRequire((typeof gxe!=="undefined"&&gxe&&gxe.url)?gxe.url:__filename)';
const _reqPatched = source.replace(_REQ_OLD, _REQ_NEW);
if (_reqPatched === source) {
  console.warn('[bootstrap] createRequire guard patch NOT applied — pattern not found');
} else {
  source = _reqPatched;
}

// ── 3b. Clear-Site-Data patch — fires for first 3 HTML requests after restart ──
// Clears stale cached JS chunks (e.g. old Dashboard version) after a deploy.
// Counter resets on every server restart. After 3 requests the header is omitted
// so long-running sessions are not penalised.
globalThis._cacheBustCount = 20;
const _CACHE_BUST_ANCHOR = 'i.setHeader("Cache-Control","no-store, no-cache, must-revalidate"),i.setHeader("Pragma","no-cache"),i.setHeader("Expires","0"),i.sendFile(';
const _CACHE_BUST_REPLACE = '(()=>{if(globalThis._cacheBustCount>0){globalThis._cacheBustCount--;i.setHeader("Clear-Site-Data","\\"cache\\"");}})(),i.setHeader("Cache-Control","no-store, no-cache, must-revalidate"),i.setHeader("Pragma","no-cache"),i.setHeader("Expires","0"),i.sendFile(';
const _cacheBustPatched = source.replace(_CACHE_BUST_ANCHOR, _CACHE_BUST_REPLACE);
if (_cacheBustPatched !== source) {
  source = _cacheBustPatched;
  console.log('[bootstrap] Clear-Site-Data cache-bust patch applied (first 3 loads)');
} else {
  console.warn('[bootstrap] Clear-Site-Data patch NOT applied — anchor not found');
}

// ── 3c. Patch: redirect direct /dashboard access to / ─────────────────────────
// The Dashboard requires school context set via React state from the home page.
// Direct navigation (refresh/bookmark) loses that state and crashes React DOM.
// Insert a dedicated Express route for /dashboard BEFORE the catch-all handlers
// so Express's own path-matching redirects cleanly without touching req.path.
const _REDIR_ANCHOR = 't.use("/{*path}",(n,i,a)=>n.path.startsWith("/assets/")';
const _REDIR_INSERT = 't.use("/dashboard",(n,i)=>i.redirect(302,"/")),';
const _redirPatched = source.replace(_REDIR_ANCHOR, _REDIR_INSERT + _REDIR_ANCHOR);
if (_redirPatched === source) {
  console.warn('[bootstrap] Dashboard-redirect patch NOT applied — anchor not found');
} else {
  source = _redirPatched;
}

// ── 3c1. Patch: /api/secretaria-municipal endpoint (Google Places) ─────────
// The runtime server executes index.cjs.gz, so this route must be injected here.
// It always returns {ok:true,dados:{...}} with sensible fallback fields.
const _SEC_EXISTING_START = 'e.get("/api/secretaria-municipal",async(A,g)=>{';
// End marker: the setTimeout that immediately follows the sec route closing })
// This is tighter than the original end (which was /api/escola-completa),
// so we no longer accidentally remove the /api/schools routes between them.
const _SEC_EXISTING_END = '}),setTimeout(async()=>{try{await Cnt';
const _SEC_EXISTING_ROUTE =
  'e.get("/api/secretaria-municipal",async(A,g)=>{'+
    'let E=String(A.query.municipio||"").trim(),v=String(A.query.uf||"").trim().toUpperCase();'+
    'if(!E||v.length!==2)return g.status(400).json({ok:!1,message:"Informe municipio e UF"});'+
    'let x=process.env.GOOGLE_PLACES_API_KEY||process.env.GOOGLE_API_KEY,w=`Secretaria Municipal de Educa\\xE7\\xE3o de ${E} ${v}`,T={ok:!0,dados:{sigla:"Nome da Secretaria",nome:`Secretaria Municipal de Educa\\xE7\\xE3o de ${E}`,titular:"Secret\\xE1rio(a): n\\xE3o identificado em base p\\xFAblica",tel:"Telefone: n\\xE3o encontrado",email:"",foco:"Endere\\xE7o: n\\xE3o encontrado",site:"",maps:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w)}`},fonte:"google_places",diagnostico:"fallback"};'+
    'if(!x){T.diagnostico="google_places_sem_chave";return g.json(T)};'+
    'const _scr=async(prefBase)=>{const sl=["/secretaria-municipal-de-educacao/","/secretaria-de-educacao/","/secretaria-educacao/","/semed/","/educacao/","/portal-da-transparencia/estrutura-organizacional/secretaria-municipal-de-educacao/"];for(const p of sl){try{const r=await fetch(prefBase+p,{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(5000)});if(!r.ok)continue;const h=await r.text();const c=h.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi," ").replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\\s+/g," ");if(!/Respons[aá]vel\\s*:/i.test(c))continue;const rm=c.match(/Respons[aá]vel\\s*:\\s*([A-Z\\xC0-\\xD6\\xD8-\\xDE][^\\n:]{4,80}?)(?=\\s+Hor[aá]rio|\\s+Endere[cç]o\\s*:|\\s+Telefone\\s*:|\\s+E-?mail\\s*:)/i),em=c.match(/Endere[cç]o\\s*:\\s*([^\\n:]{10,120}?)(?=\\s+Bairro\\s*:|\\s+Telefone\\s*:|\\s+E-?mail\\s*:|\\s+Hor[aá]rio\\s*:|$)/i),bm=c.match(/Bairro\\s*:\\s*([^\\n:]{3,60}?)(?=\\s+\\d{5}|\\s+Telefone|\\s+CEP|\\s+E-?mail|$)/i),cm=c.match(/(\\d{5}-\\d{3})/),tm=c.match(/Telefone\\s*:[\\s\\xA0]*([\\(\\d][\\d\\s\\(\\)\\-\\.]{5,20}[\\d\\)])/),xm=c.match(/E-?mail\\s*:[\\s\\xA0]*([\\w.\\-]+@[\\w.\\-]+\\.\\w+)/i),hm=c.match(/Hor[aá]rio[^:]{0,30}:\\s*([^\\n:]{4,50}?)(?=\\s+Endere[cç]o|\\s+Telefone|\\s+E-?mail|$)/i);let end=em?.[1]?.trim()||"";if(bm)end+=(end?", Bairro: "+bm[1].trim():"Bairro: "+bm[1].trim());if(cm&&!end.includes(cm[1]))end+=(end?" "+cm[1]:cm[1]);return{responsavel:rm?.[1]?.trim()||null,tel:tm?.[1]?.trim()||null,email:xm?.[1]?.trim()||null,endereco:end||null,horario:hm?.[1]?.trim()||null,paginaFonte:prefBase+p};}catch(_e){}}return null};'+
    'try{'+
      'let I=[w,`SEMED ${E} ${v}`,`Secretaria de Educa\\xE7\\xE3o ${E} ${v}`,`Prefeitura de ${E} ${v} secretaria de educa\\xE7\\xE3o`],D=null,B=null;'+
      'for(let N of I){let R=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":x,"X-Goog-FieldMask":"places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri"},body:JSON.stringify({textQuery:N,languageCode:"pt-BR",regionCode:"BR",maxResultCount:3})});if(!R.ok)continue;let M=await R.json();D=M&&M.places&&M.places[0]||null;if(D){B=D;break}}'+
      'if(!B){T.diagnostico="google_places_sem_resultado";return g.json(T)}'+
      'if(B){let N=B.displayName&&B.displayName.text&&B.displayName.text.trim();N&&(T.dados.nome=N);let R=B.nationalPhoneNumber&&B.nationalPhoneNumber.trim();R&&(T.dados.tel=`Telefone: ${R}`);let M=B.formattedAddress&&B.formattedAddress.trim();M&&(T.dados.foco=`Endere\\xE7o: ${M}`);let L=B.websiteUri&&B.websiteUri.trim();L&&(T.dados.site=L);let te=B.googleMapsUri&&B.googleMapsUri.trim();te&&(T.dados.maps=te)}'+
      'let pR=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":x,"X-Goog-FieldMask":"places.websiteUri"},body:JSON.stringify({textQuery:`Prefeitura Municipal de ${E} ${v}`,languageCode:"pt-BR",regionCode:"BR",maxResultCount:1})}).catch(()=>null);'+
      'let pSite=pR&&pR.ok?((await pR.json().catch(()=>null))?.places?.[0]?.websiteUri||null):null;'+
      'if(pSite){let pBase=pSite.replace(/\\/+$/,"");let sc=await _scr(pBase).catch(()=>null);if(sc){T.dados.paginaFonte=sc.paginaFonte;if(sc.responsavel)T.dados.titular=sc.responsavel;if(sc.tel)T.dados.tel=`Telefone: ${sc.tel}`;if(sc.email)T.dados.email=sc.email;if(sc.endereco)T.dados.foco=`Endere\\xE7o: ${sc.endereco}`;if(sc.horario)T.dados.horario=`Atendimento: ${sc.horario}`;if(!T.dados.site)T.dados.site=pSite;T.diagnostico="google_places_ok_scraped";}else{T.diagnostico="google_places_ok";}}else{T.diagnostico="google_places_ok";}'+
      'return g.json(T)'+
    '}catch(I){T.diagnostico="google_places_erro";return g.json(T)}'+
  '}),';
const _secExistingStartIdx = source.indexOf(_SEC_EXISTING_START);
if (_secExistingStartIdx !== -1) {
  const _secExistingEndIdx = source.indexOf(_SEC_EXISTING_END, _secExistingStartIdx);
  if (_secExistingEndIdx !== -1) {
    source = source.slice(0, _secExistingStartIdx) + _SEC_EXISTING_ROUTE + source.slice(_secExistingEndIdx + 3);
    console.log('[bootstrap] secretaria-municipal existing route patched');
  } else {
    console.warn('[bootstrap] secretaria-municipal existing route patch NOT applied — end marker not found');
  }
}

const _SEC_ANCHOR = 'e.get("/api/health",(A,g)=>{g.status(200).json({ok:!0,ts:Date.now()})}),';
const _SEC_ROUTE =
  // helper: try to scrape secretaria page from prefeitura website
  'async function _scrapePrefSec(prefBase){'+
    'const slugs=["/secretaria-municipal-de-educacao/","/secretaria-de-educacao/","/secretaria-educacao/","/semed/","/educacao/","/portal-da-transparencia/estrutura-organizacional/secretaria-municipal-de-educacao/"];'+
    'for(const sl of slugs){'+
      'try{'+
        'const _r=await fetch(prefBase+sl,{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(5000)});'+
        'if(!_r.ok)continue;'+
        'const _h=await _r.text();'+
        'const _c=_h.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi," ").replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\\s+/g," ");'+
        'if(!/Respons[aá]vel\\s*:/i.test(_c))continue;'+
        'const _rm=_c.match(/Respons[aá]vel\\s*:\\s*([A-Z\\xC0-\\xD6\\xD8-\\xDE][^\\n:]{4,80}?)(?=\\s+Hor[aá]rio|\\s+Endere[cç]o\\s*:|\\s+Telefone\\s*:|\\s+E-?mail\\s*:)/i);'+
        'const _em=_c.match(/Endere[cç]o\\s*:\\s*([^\\n:]{10,120}?)(?=\\s+Bairro\\s*:|\\s+Telefone\\s*:|\\s+E-?mail\\s*:|\\s+Hor[aá]rio\\s*:|$)/i);'+
        'const _bm=_c.match(/Bairro\\s*:\\s*([^\\n:]{3,60}?)(?=\\s+\\d{5}|\\s+Telefone|\\s+CEP|\\s+E-?mail|$)/i);'+
        'const _cm=_c.match(/(\\d{5}-\\d{3})/);'+
        'const _tm=_c.match(/Telefone\\s*:[\\s\\xA0]*([\\(\\d][\\d\\s\\(\\)\\-\\.]{5,20}[\\d\\)])/);'+
        'const _xm=_c.match(/E-?mail\\s*:[\\s\\xA0]*([\\w.\\-]+@[\\w.\\-]+\\.\\w+)/i);'+
        'const _hm=_c.match(/Hor[aá]rio[^:]{0,30}:\\s*([^\\n:]{4,50}?)(?=\\s+Endere[cç]o|\\s+Telefone|\\s+E-?mail|$)/i);'+
        'let _end=_em?.[1]?.trim()||"";'+
        'if(_bm)_end+=(_end?", Bairro: "+_bm[1].trim():"Bairro: "+_bm[1].trim());'+
        'if(_cm&&!_end.includes(_cm[1]))_end+=(_end?" "+_cm[1]:_cm[1]);'+
        'return{responsavel:_rm?.[1]?.trim()||null,tel:_tm?.[1]?.trim()||null,email:_xm?.[1]?.trim()||null,endereco:_end||null,horario:_hm?.[1]?.trim()||null,paginaFonte:prefBase+sl};'+
      '}catch(_e){}'+
    '}'+
    'return null;'+
  '}'+
  'e.get("/api/secretaria-municipal",async(A,g)=>{'+
    'let E=String(A.query.municipio||"").trim(),v=String(A.query.uf||"").trim().toUpperCase();'+
    'if(!E||v.length!==2)return g.status(400).json({ok:!1,message:"Informe municipio e UF"});'+
    'let x=process.env.GOOGLE_PLACES_API_KEY||process.env.GOOGLE_API_KEY,w=`Secretaria Municipal de Educa\\xE7\\xE3o de ${E} ${v}`,T={ok:!0,dados:{sigla:"Nome da Secretaria",nome:`Secretaria Municipal de Educa\\xE7\\xE3o de ${E}`,titular:"Secret\\xE1rio(a): n\\xE3o identificado em base p\\xFAblica",tel:"Telefone: n\\xE3o encontrado",email:"",foco:"Endere\\xE7o: n\\xE3o encontrado",site:"",maps:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w)}`},fonte:"google_places",diagnostico:"fallback"};'+
    'if(!x){T.diagnostico="google_places_sem_chave";return g.json(T)};'+
    'try{'+
      'let I=[w,`SEMED ${E} ${v}`,`Secretaria de Educa\\xE7\\xE3o ${E} ${v}`,`Prefeitura de ${E} ${v} secretaria de educa\\xE7\\xE3o`],D=null,B=null;'+
      'for(let N of I){let R=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":x,"X-Goog-FieldMask":"places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri"},body:JSON.stringify({textQuery:N,languageCode:"pt-BR",regionCode:"BR",maxResultCount:3})});if(!R.ok)continue;let M=await R.json();D=M&&M.places&&M.places[0]||null;if(D){B=D;break}}'+
      'if(!B){T.diagnostico="google_places_sem_resultado";return g.json(T)}'+
      'if(B){let N=B.displayName&&B.displayName.text&&B.displayName.text.trim();N&&(T.dados.nome=N);let R=B.nationalPhoneNumber&&B.nationalPhoneNumber.trim();R&&(T.dados.tel=`Telefone: ${R}`);let M=B.formattedAddress&&B.formattedAddress.trim();M&&(T.dados.foco=`Endere\\xE7o: ${M}`);let L=B.websiteUri&&B.websiteUri.trim();L&&(T.dados.site=L);let te=B.googleMapsUri&&B.googleMapsUri.trim();te&&(T.dados.maps=te)}'+
      'let _prefR=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":x,"X-Goog-FieldMask":"places.websiteUri"},body:JSON.stringify({textQuery:`Prefeitura Municipal de ${E} ${v}`,languageCode:"pt-BR",regionCode:"BR",maxResultCount:1})}).catch(()=>null);'+
      'let _prefSite=_prefR&&_prefR.ok?((await _prefR.json().catch(()=>null))?.places?.[0]?.websiteUri||null):null;'+
      'if(_prefSite){'+
        'let _prefBase=_prefSite.replace(/\\/+$/,"");'+
        'let _sc=await _scrapePrefSec(_prefBase).catch(()=>null);'+
        'if(_sc){'+
          'T.dados.paginaFonte=_sc.paginaFonte;'+
          'if(_sc.responsavel)T.dados.titular=_sc.responsavel;'+
          'if(_sc.tel)T.dados.tel=`Telefone: ${_sc.tel}`;'+
          'if(_sc.email)T.dados.email=_sc.email;'+
          'if(_sc.endereco)T.dados.foco=`Endere\\xE7o: ${_sc.endereco}`;'+
          'if(_sc.horario)T.dados.horario=`Atendimento: ${_sc.horario}`;'+
          'if(!T.dados.site)T.dados.site=_prefSite;'+
          'T.diagnostico="google_places_ok_scraped";'+
        '}else{T.diagnostico="google_places_ok";}'+
      '}else{T.diagnostico="google_places_ok";}'+
      'return g.json(T)'+
    '}catch(I){T.diagnostico="google_places_erro";return g.json(T)}'+
  '}),';
if (!source.includes('/api/secretaria-municipal')) {
  const _secPatched = source.replace(_SEC_ANCHOR, _SEC_ANCHOR + _SEC_ROUTE);
  if (_secPatched === source) {
    console.warn('[bootstrap] secretaria-municipal patch NOT applied — anchor not found');
  } else {
    source = _secPatched;
    console.log('[bootstrap] secretaria-municipal patch applied');
  }
}

// ── 3c2. Patch: /api/raw-js endpoint — serves large JS files as JSON ──────────
// The Replit proxy injects malicious FNDE JavaScript into large (>250KB) JS files
// when served with application/javascript content-type to browsers.
// This endpoint reads from disk and returns as application/json, bypassing injection.
// The browser bootstrap fetches from here and creates blob URLs directly.
const _RAW_JS_ANCHOR = 't.use("/dashboard",(n,i)=>i.redirect(302,"/")),';
const _rawJsDistDir = JSON.stringify(distDir);
const _RAW_JS_ROUTE = `t.get("/api/raw-js",function(rq,rs){` +
  `var _fm={` +
    `"vendor":"vendor-react-CRHowRiP-fix2.js",` +
    `"dashboard":"Dashboard-v30.js",` +
    `"shared10":"index-v10-shared.js",` +
    `"entry":"index-v21.js",` +
    `"charts":"charts-core-aq.js",` +
    `"maps":"maps-core-aq.js",` +
    `"motion":"motion-core-aq.js"` +
  `};` +
  `var _k=rq.query&&rq.query.f;` +
  `var _fn=_fm[_k];` +
  `if(!_fn)return rs.status(403).end("not allowed");` +
  `var _fp=require("path").join(${_rawJsDistDir},"public","assets",_fn);` +
  `try{` +
    `var _code=require("fs").readFileSync(_fp,"utf8");` +
    `rs.setHeader("Content-Type","application/json");` +
    `rs.setHeader("Cache-Control","no-store, no-cache");` +
    `rs.setHeader("Access-Control-Allow-Origin","*");` +
    `rs.end(JSON.stringify({code:_code}));` +
  `}catch(_e){rs.status(500).json({error:_e.message});}` +
`}),`;
if (source.indexOf(_RAW_JS_ANCHOR) !== -1) {
  source = source.replace(_RAW_JS_ANCHOR, _RAW_JS_ANCHOR + _RAW_JS_ROUTE);
  console.log('[bootstrap] /api/raw-js endpoint patch applied');
} else {
  console.warn('[bootstrap] /api/raw-js patch NOT applied — anchor not found (dashboard-redirect not present)');
}

// ── 3d. Patch: fix PDDE exercise dropdown data consistency ──────────────────
// The bundled server had a fixed year list and left an_exercicio untyped.
// This breaks exercise filters/menu behavior when data arrives as strings.
const _PDDE_YEARS_OLD = '[2026,2025,2024,2023,2022,2021,2020]';
const _PDDE_YEARS_NEW = 'Array.from({length:new Date().getFullYear()-2013},(_,k)=>new Date().getFullYear()-k)';
if (source.includes(_PDDE_YEARS_OLD)) {
  source = source.split(_PDDE_YEARS_OLD).join(_PDDE_YEARS_NEW);
} else {
  console.warn('[bootstrap] PDDE dynamic years patch NOT applied — fixed list not found');
}

const _PDDE_ANO_OLD = 'an_exercicio:o.AN_EXERCICIO';
const _PDDE_ANO_NEW = 'an_exercicio:Number(o.AN_EXERCICIO)||Number(t)||null';
if (source.includes(_PDDE_ANO_OLD)) {
  source = source.replace(_PDDE_ANO_OLD, _PDDE_ANO_NEW);
} else {
  console.warn('[bootstrap] PDDE an_exercicio type patch NOT applied — mapper not found');
}

// execfin year filtering is handled in the frontend bundle to avoid altering
// the server's cached aggregate payload and causing empty results.

// ── 3e. Patch: PDDE year fallback ─────────────────────────────────────────────
// When the current year (2026) has no PDDE data yet, the handler returns ok:false
// and the dashboard shows a blank page. This patch makes the handler automatically
// retry with the previous year (2025) when no explicit ?ano= was requested.
const _PDDE_FALLBACK_OLD = 'let I=await Yrt(v,E);I?.ok&&_u(x,I);let D=Date.now();g.json({...I,_cached_at:D})';
const _PDDE_FALLBACK_NEW = 'let I=await Yrt(v,E);if(!I?.ok&&!A.query.ano){try{const _fb=await Yrt(v-1,E);if(_fb?.ok){const _fk=`pdde_info_${E}_${v-1}`;_u(_fk,_fb);I=_fb;}}catch(_){}}I?.ok&&_u(x,I);let D=Date.now();g.json({...I,_cached_at:D})';
if (source.includes(_PDDE_FALLBACK_OLD)) {
  source = source.replace(_PDDE_FALLBACK_OLD, _PDDE_FALLBACK_NEW);
  console.log('[bootstrap] PDDE year fallback patch applied');
} else {
  console.warn('[bootstrap] PDDE year fallback patch NOT applied — pattern not found');
}

// ── 3f. Patch: hide program chip in repasses header ─────────────────────────
// The repasses card header already shows the council, CNPJ and role.
// The extra ds_programa_fnde chip (for example, "PDDE") adds redundant noise
// between the destinações and repasses blocks, so remove only that badge.
const dashboardAssetPath = path.join(distDir, 'public/assets/Dashboard-v10.js');
const _PDDE_REPASSE_CHIP_REGEX = /,uex0\.ds_programa_fnde&&e\.jsx\("div",\{style:\{display:"flex",alignItems:"center",background:"#f3e8ff",border:"1px solid #d8b4fe",borderRadius:"20px",padding:"4px 12px",fontSize:"11px",color:"#6b21a8",fontWeight:600,whiteSpace:"nowrap"\},children:"(?:\\uD83D\\uDCCC |📌 )"\+uex0\.ds_programa_fnde\}\)/;
if (fs.existsSync(dashboardAssetPath)) {
  const dashboardSource = fs.readFileSync(dashboardAssetPath, 'utf8');
  if (_PDDE_REPASSE_CHIP_REGEX.test(dashboardSource)) {
    fs.writeFileSync(
      dashboardAssetPath,
      dashboardSource.replace(_PDDE_REPASSE_CHIP_REGEX, ''),
      'utf8'
    );
    console.log('[bootstrap] Dashboard repasses program chip patch applied');
  } else {
    console.warn('[bootstrap] Dashboard repasses program chip patch NOT applied — pattern not found');
  }
}

// ── 3g2. Patch: add ?_refresh=1 cache bypass to PDDE endpoint ───────────────
// Allows bypassing the 4-hour cache to test enrichment results or force fresh data.
const _CACHE_BYPASS_OLD = 'T&&Date.now()-T.updated_at<w){let B=JSON.parse(T.data),N=B&&B.matriculas_por_nivel&&Object.keys(B.matriculas_por_nivel).length>0;if(N||!B?.matriculas_total)return g.json({...B,_cached_at:T.updated_at})}';
const _CACHE_BYPASS_NEW = 'T&&Date.now()-T.updated_at<w&&!A.query._refresh){let B=JSON.parse(T.data),N=B&&B.matriculas_por_nivel&&Object.keys(B.matriculas_por_nivel).length>0;if(N||!B?.matriculas_total)return g.json({...B,_cached_at:T.updated_at})}';
if (source.includes(_CACHE_BYPASS_OLD)) {
  source = source.replace(_CACHE_BYPASS_OLD, _CACHE_BYPASS_NEW);
  console.log('[bootstrap] PDDE cache bypass patch applied');
} else {
  console.warn('[bootstrap] PDDE cache bypass patch NOT applied — anchor not found');
}

// ── 3g. Patch: enrich PDDE response with FNDE HTML page data ─────────────────
// The server builds destinacoes from execfin data but:
//   (1) grouping by DS_PROGRAMA_FNDE|SG_DESTINACAO doubles values when duplicate rows exist
//   (2) situacao_uex fields are all null (mandato, dados_cadastrais, prestacao_contas)
//   (3) contas always show programa="PDDE" regardless of actual program
// This patch scrapes the FNDE escola/consultar HTML page (which is already accessible)
// and replaces/enriches d.destinacoes, d.situacao_uex, d.contas after the execfin build.
const _FNDE_HTML_OLD = 'd.destinacoes=[...dm.values()];console.log(`[PDDE Olinda] ok: saldo=${saldo.length} contas, exec=${exec.length} repasses`);return d;';
const _FNDE_HTML_NEW =
`d.destinacoes=[...dm.values()];` +
`console.log(\`[PDDE Olinda] ok: saldo=\${saldo.length} contas, exec=\${exec.length} repasses\`);` +
`try{` +
  // Use Node.js https module directly (avoids bundled undici TLS issues)
  `const _fhtml=await new Promise((_fres,_frej)=>{` +
    `const _fhttps=require('https');` +
    `const _fpath='/pddeinfo/pddeinfo/escola/consultar?ano='+encodeURIComponent(t)+'&co_escola='+encodeURIComponent(e)+'&cnpj=&consultar=Consultar';` +
    `const _fopt={hostname:'www.fnde.gov.br',path:_fpath,headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','Accept':'text/html,application/xhtml+xml','Accept-Language':'pt-BR,pt;q=0.9'},timeout:20000};` +
    `const _freq=_fhttps.get(_fopt,_fr=>{const _fc=[];_fr.on('data',c=>_fc.push(c));_fr.on('end',()=>_fres(Buffer.concat(_fc).toString('latin1')));});` +
    `_freq.on('error',_frej);` +
    `_freq.on('timeout',()=>{_freq.destroy();_frej(new Error('https timeout'));});` +
  `});` +
  `if(_fhtml&&_fhtml.length>1000){` +
    // ── contas: replace with correct programa names from HTML ──
    `const _bi=_fhtml.indexOf('Programa/A');` +
    `if(_bi>=0){` +
      `const _bseg=_fhtml.slice(_bi,_bi+2000);` +
      `const _brows=_bseg.match(/<tr[^>]*>[\\s\\S]*?<\\/tr>/g)||[];` +
      `const _nc=[];` +
      `for(const _br of _brows){` +
        `const _bc=(_br.match(/<td[^>]*>([\\s\\S]*?)<\\/td>/g)||[]).map(c=>c.replace(/<[^>]*>/g,'').replace(/\\s+/g,' ').trim());` +
        `if(_bc.length>=5&&_bc[0].includes('PDDE')&&!_bc[0].startsWith('N\\xE3o')&&!_bc[0].includes('mandato')){` +
          `const _bs=parseFloat(_bc[4].replace(/\\./g,'').replace(',','.'))||0;` +
          `_nc.push({programa:_bc[0],banco:_bc[1],agencia:_bc[2],conta:_bc[3],saldo:_bs,ocorrencia:_bc[5]||null});` +
        `}` +
      `}` +
      `if(_nc.length>0)d.contas=_nc;` +
    `}` +
    // ── situacao_uex: mandato, dados_cadastrais, prestacao_contas ──
    `const _mm=[..._fhtml.matchAll(/mandato:<\\/b>(\\d{2}\\/\\d{2}\\/\\d{4})/g)];` +
    `const _dc=_fhtml.match(/Dados Cadastrais<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>/);` +
    `const _pc=_fhtml.match(/Presta[^<]*Contas<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>/);` +
    `d.situacao_uex={` +
      `mandato_inicio:_mm[0]?_mm[0][1]:null,` +
      `mandato_fim:_mm[1]?_mm[1][1]:null,` +
      `dados_cadastrais:_dc?_dc[1].replace(/<[^>]*>/g,'').replace(/\\s+/g,' ').trim():null,` +
      `prestacao_contas:_pc?_pc[1].replace(/<[^>]*>/g,'').replace(/\\s+/g,' ').trim():null,` +
      `programas_pendentes:[]` +
    `};` +
    // ── situacao_eex: adesao + prestacao_contas EEx ──
    `const _eexIdx=_fhtml.indexOf('da Entidade Executora');` +
    `const _eexSeg=_eexIdx>=0?_fhtml.slice(_eexIdx,_eexIdx+2000):'';` +
    `const _aeCell=_eexSeg.match(/<th>Ades[^<]*<\\/th>[\\s\\S]*?<td>([\\s\\S]*?)<\\/td>/);` +
    `const _aeText=_aeCell?_aeCell[1].replace(/\\s+/g,' ').trim():'';` +
    `const _ae=_aeText.match(/(\\d{2}\\/\\d{2}\\/\\d{4})/);` +
    `const _epcCell=_eexSeg.match(/Presta[^<]*<\\/th>[\\s\\S]*?<td>([\\s\\S]*?)<\\/td>/);` +
    `const _epc=_epcCell?_epcCell[1].replace(/\\s+/g,' ').trim():'';` +
    `d.situacao_eex={` +
      `adesao:_aeText||null,` +
      `adesao_data:_ae?_ae[1]:null,` +
      `prestacao_contas:_epc||null` +
    `};` +
    // ── destinacoes: replace with HTML table data (deduplicated, correct values) ──
    `const _di=_fhtml.indexOf('Vl Devido Custeio');` +
    `if(_di>=0){` +
      `const _dseg=_fhtml.slice(_di-300,_di+8000);` +
      `const _drows=_dseg.match(/<tr[^>]*>[\\s\\S]*?<\\/tr>/g)||[];` +
      `const _nd=[];` +
      `const _pm=s=>{const n=parseFloat((s||'').replace(/\\./g,'').replace(',','.'));return isNaN(n)?null:n;};` +
      `for(const _dr of _drows){` +
        `const _dc2=(_dr.match(/<td[^>]*>([\\s\\S]*?)<\\/td>/g)||[]).map(c=>c.replace(/<[^>]*>/g,'').replace(/\\s+/g,' ').trim());` +
        `if(_dc2.length>=11&&_dc2[0]&&!_dc2[0].match(/^(Subtotal|Total)$/i)){` +
          `_nd.push({destinacao:_dc2[0],devido_custeio:_pm(_dc2[1]),devido_capital:_pm(_dc2[2]),devido_total:_pm(_dc2[3]),ajuste_custeio:_pm(_dc2[4]),ajuste_capital:_pm(_dc2[5]),ajuste_total:_pm(_dc2[6]),final_devido_total:_pm(_dc2[7]),pago_custeio:_pm(_dc2[8]),pago_capital:_pm(_dc2[9]),pago_total:_pm(_dc2[10]),data_ordem_pgto:_dc2[11]||null});` +
        `}` +
      `}` +
      `if(_nd.length>0)d.destinacoes=_nd;` +
    `}` +
    `console.log(\`[PDDE FNDE-HTML] enriched: \${d.destinacoes.length} dest, mandato=\${d.situacao_uex.mandato_inicio}, eex_adesao=\${d.situacao_eex&&d.situacao_eex.adesao_data}\`);` +
  `}` +
`}catch(_fe){console.warn('[PDDE FNDE-HTML] scrape failed:',_fe.message);}` +
`return d;`;
if (source.includes(_FNDE_HTML_OLD)) {
  source = source.replace(_FNDE_HTML_OLD, _FNDE_HTML_NEW);
  console.log('[bootstrap] PDDE FNDE-HTML enrichment patch applied');
} else {
  console.warn('[bootstrap] PDDE FNDE-HTML enrichment patch NOT applied — anchor not found');
}

// ── Fix: school search accent normalization + multi-word cross-field search ──────
// Strategy: find Qx by its unique signature then slice it out by brace-counting.
// Bug 1: Accented chars return 0 — the original SQL has json_extract() (SQLite syntax)
//        which fails silently in PostgreSQL, aborting the query. Fix: remove it.
// Bug 2: Multi-word searches fail — each word must match nome AND municipio. Fix: OR.
(function _patchQx() {
  const QX_START_MARKER = 'async function Qx(t,e=20){';
  const qxStart = source.indexOf(QX_START_MARKER);
  if (qxStart === -1) {
    console.warn('[bootstrap] Qx patch: function not found');
    return;
  }
  // Brace-count from the opening { to find the matching closing }
  let depth = 0;
  let qxEnd = -1;
  for (let ci = qxStart + QX_START_MARKER.length - 1; ci < source.length; ci++) {
    if (source[ci] === '{') depth++;
    else if (source[ci] === '}') { depth--; if (depth === 0) { qxEnd = ci + 1; break; } }
  }
  if (qxEnd === -1) {
    console.warn('[bootstrap] Qx patch: could not find closing brace');
    return;
  }
  // Build the REPLACE chain for accents using actual Unicode chars (valid UTF-8 SQL).
  // PostgreSQL (UTF-8) accepts literal accented chars in string literals.
  const RC = [
    ['\u00C1','A'],['\u00C0','A'],['\u00C2','A'],['\u00C3','A'],['\u00C4','A'],
    ['\u00C9','E'],['\u00CA','E'],['\u00CB','E'],
    ['\u00CD','I'],['\u00CE','I'],
    ['\u00D3','O'],['\u00D4','O'],['\u00D5','O'],['\u00D6','O'],
    ['\u00DA','U'],['\u00DC','U'],['\u00DB','U'],
    ['\u00C7','C'],['\u00D1','N']
  ];
  function buildRC(field) {
    // Each entry: REPLACE(acc,'Á','A') — accented char as literal in SQL string
    return RC.reduce((acc, [ch, rep]) =>
      `REPLACE(${acc},'${ch}','${rep}')`, `UPPER(${field})`);
  }
  const sn = buildRC('nome');
  const sm = buildRC('municipio');
  // New Qx function — cross-field OR per word, no json_extract
  const newQx =
    'async function Qx(t,e=20){' +
      'let r=t.trim();' +
      'if(/^\\d{7,8}$/.test(r))' +
        'return(await fn("SELECT inep,nome,municipio,uf,dependencia,localizacao,matriculas FROM censo_escolar WHERE inep=? ORDER BY ano DESC LIMIT 1",[r])).map(uke);' +
      'let i=2025;' +
      'try{i=(await Fn("SELECT MAX(ano) as max_ano FROM censo_escolar",[]))?.max_ano||2025;}catch(_){}' +
      'let n;' +
      'try{n=r.normalize("NFD").replace(/[\\u0300-\\u036f]/gu,"").toUpperCase();}' +
      'catch(_){n=r.toUpperCase();}' +
      'let w=n.split(/\\s+/).filter(d=>d.length>0);' +
      'if(!w.length)return[];' +
      'const _sn=' + JSON.stringify(sn) + ';' +
      'const _sm=' + JSON.stringify(sm) + ';' +
      'let wc=w.map(()=>"("+_sn+" LIKE ? OR "+_sm+" LIKE ?)").join(" AND ");' +
      'let wp=w.flatMap(d=>["%"+d+"%","%"+d+"%"]);' +
      'try{' +
        'return(await fn(' +
          '"SELECT inep,nome,municipio,uf,dependencia,localizacao,matriculas FROM censo_escolar WHERE ano=? AND ("+wc+") LIMIT ?",' +
          '[i,...wp,e]' +
        ')).map(uke);' +
      '}catch(_e){console.error("[Qx-err]",_e.message);return[];}' +
    '}';
  source = source.slice(0, qxStart) + newQx + source.slice(qxEnd);
  console.log('[bootstrap] Qx accent+multiword patch applied (position-based)');
})();

// ── Fix schools route handler: wrap with explicit try/catch ──────────────────
// In Express 4, async errors in route handlers are NOT caught automatically.
// If Qx throws, the request hangs or falls through to static middleware (HTML).
// Fix: patch the route handler to add try/catch and always return JSON.
(function _patchSchoolsRoute() {
  // The route handler as it appears in the minified source
  const SEARCH_PATH_MARKER = 'T0.schools.search.path,async(A,g)=>';
  const markerIdx = source.indexOf(SEARCH_PATH_MARKER);
  console.log('[bootstrap] Schools route marker at:', markerIdx);
  if (markerIdx > 0) {
    const ctxBefore = source.slice(markerIdx - 10, markerIdx);
    const ctxAfter = source.slice(markerIdx, markerIdx + 100);
    console.log('[bootstrap] Route ctx before marker:', JSON.stringify(ctxBefore));
    console.log('[bootstrap] Route ctx after marker:', JSON.stringify(ctxAfter));
  }

  const OLD_HANDLER = 'e.get(T0.schools.search.path,async(A,g)=>{let E=A.query.q;if(!E||E.length<2)return g.json([]);g.json(await Qx(E))})';
  if (source.includes(OLD_HANDLER)) {
    const NEW_HANDLER = 'e.get(T0.schools.search.path,async(A,g)=>{try{let E=A.query.q;if(!E||E.length<2)return g.json([]);let _R=await Qx(E);g.json(Array.isArray(_R)?_R:[])}catch(_e){console.error("[schools-route-err]",_e&&_e.message||_e);g.json([])}})';
    source = source.replace(OLD_HANDLER, NEW_HANDLER);
    console.log('[bootstrap] Schools route handler try/catch patch applied');
  } else {
    console.warn('[bootstrap] Schools route handler patch NOT applied — pattern not found');
    // Show what the actual route looks like to diagnose the mismatch
    if (markerIdx > 0) {
      console.warn('[bootstrap] Actual route (80 chars):', JSON.stringify(source.slice(markerIdx - 15, markerIdx + 80)));
    }
  }
})();

// ── Seed U21: Como ler dados e indicadores da escola ─────────────────────────
// Injeta uma função de semeadura que roda após o servidor inicializar.
// Usa as variáveis minificadas (vt = Drizzle client, Gu = trilha_units, Ft = eq).
(function _patchTrilhaSeedU21() {
  const SEED_MARKER = '"Pre-warming stats cache in background...")';
  if (!source.includes(SEED_MARKER)) {
    console.warn('[bootstrap] Trilha seed U21 — marker not found, skipping');
    return;
  }

  const u21 = {
    unitId: 'U21',
    part: '5',
    title: 'Como ler dados e indicadores da escola',
    subtitle: 'Interpretando números, índices e relatórios que descrevem sua escola.',
    duration: '25 min',
    intro: 'Ensina como interpretar os principais dados educacionais disponíveis sobre a escola — IDEB, Censo Escolar, indicadores de fluxo e dados de repasse PDDE — para que a diretora possa compreender a realidade da escola com mais clareza e usar as informações na tomada de decisão.',
    sections: JSON.stringify([
      {
        id: 's1',
        title: 'O que é o IDEB e como ler a nota',
        content: 'O IDEB (Índice de Desenvolvimento da Educação Básica) é calculado a cada dois anos pelo INEP. Ele combina duas informações: o desempenho dos alunos na Prova Brasil (proficiência em Língua Portuguesa e Matemática) e o fluxo escolar (taxas de aprovação, reprovação e abandono).\n\nComo ler: a nota vai de 0 a 10. Uma nota acima de 6 é considerada boa. Compare sempre o IDEB da sua escola com a média do município, do estado e do país — não apenas com a meta projetada.\n\nDica prática: se o IDEB subiu mas a taxa de abandono também subiu, pode ser sinal de que alunos com baixo desempenho saíram da escola.',
        type: 'teoria'
      },
      {
        id: 's2',
        title: 'Censo Escolar: o que ele registra',
        content: 'O Censo Escolar é realizado todo ano pelo INEP e registra informações detalhadas sobre a escola: número de matrículas por etapa e modalidade, quantidade de docentes, turmas, infraestrutura (salas de aula, laboratórios, banheiros, internet) e condições de acessibilidade.\n\nEsses dados são usados pelo governo para distribuir recursos — inclusive o PDDE. Por isso, é essencial que os dados informados pela escola no censo sejam precisos e atualizados.',
        type: 'teoria'
      },
      {
        id: 's3',
        title: 'Indicadores de fluxo: aprovação, reprovação e abandono',
        content: 'Os três indicadores de fluxo mostram o que acontece com os alunos ao longo do ano:\n\n• Taxa de aprovação: percentual de alunos que passaram de ano.\n• Taxa de reprovação: percentual de alunos que ficaram retidos.\n• Taxa de abandono: percentual de alunos que saíram sem concluir o ano letivo.\n\nA soma dos três deve ser 100%. O abandono é o indicador mais crítico — ele impacta diretamente o IDEB e sinaliza problemas sociais, econômicos ou pedagógicos que precisam de atenção.',
        type: 'teoria'
      },
      {
        id: 's4',
        title: 'Como ler os dados de repasse PDDE',
        content: 'Ao consultar os repasses PDDE, você verá campos como:\n\n• Ação/Programa: identifica qual modalidade do PDDE (básico, acessibilidade, campo etc.)\n• Ano de exercício: o ano a que se refere o recurso\n• Valor custeio: recursos para despesas do dia a dia (material, serviços)\n• Valor capital: recursos para bens permanentes (equipamentos, mobiliário)\n• Situação: se o recurso foi creditado, pendente ou restituído\n\nSempre verifique se os valores creditados correspondem ao que está na conta bancária da escola.',
        type: 'pratica'
      },
      {
        id: 's5',
        title: 'Onde encontrar os dados da sua escola',
        content: 'Principais fontes de dados educacionais:\n\n• Painel da Educação (este sistema): IDEB, Censo Escolar, dados PDDE integrados por escola.\n• Portal FNDE (fnde.gov.br): consulta de repasses PDDE por escola.\n• QEdu (qedu.org.br): IDEB, fluxo e aprendizado por escola, município e estado.\n• Painel de Monitoramento do INEP (painel.inep.gov.br): dados do Censo Escolar.\n• SIMEC (simec.mec.gov.br): obras e programas do MEC vinculados à escola.',
        type: 'recurso'
      }
    ]),
    materials: JSON.stringify([]),
    previousUnit: 'U20',
    nextUnit: '',
    sortOrder: 21
  };

  const seedCode = `;setImmediate(async function(){try{` +
    `var _ex=await vt.select().from(Gu).where(Ft(Gu.unitId,${JSON.stringify(u21.unitId)}));` +
    `if(_ex.length===0){` +
      `await vt.insert(Gu).values(${JSON.stringify(u21)});` +
      `console.log("[seed] U21 inserida com sucesso");` +
      `await vt.update(Gu).set({nextUnit:${JSON.stringify(u21.unitId)}}).where(Ft(Gu.unitId,"U20"));` +
      `console.log("[seed] U20 atualizada: nextUnit -> U21");` +
    `}else{console.log("[seed] U21 já existe, pulando");}` +
  `}catch(_e){console.error("[seed] erro ao inserir U21:",_e&&_e.message||_e);}});`;

  source = source.replace(SEED_MARKER, SEED_MARKER + seedCode);
  console.log('[bootstrap] Trilha seed U21 patch applied');
})();

const m = new Module(path.join(distDir, 'index.cjs'));
m.filename = path.join(distDir, 'index.cjs');
m.paths = Module._nodeModulePaths(distDir);
m._compile(source, path.join(distDir, 'index.cjs'));

// ── 4. Load PDDE Fields Extension after server initialization ──────────────────
try {
  const setupPDDEExtension = require(path.join(distDir, 'pdde-fields-extension.cjs'));
  if (typeof setupPDDEExtension === 'function') {
    // Delay extension setup to allow server to fully initialize
    setImmediate(() => {
      setupPDDEExtension(m.exports);
    });
  }
} catch (err) {
  console.warn('[bootstrap] PDDE Fields Extension not loaded:', err.message);
}

module.exports = m.exports;
