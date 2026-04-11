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

// ── 3c3. Patch: /api/mec-streams endpoint — scrapes YouTube MEC streams ─────
// Fetches the MEC YouTube channel streams page, extracts titles, dates/times
// and URLs. Uses an in-memory cache (30 min TTL) to avoid hammering YouTube.
const _MEC_STREAMS_ANCHOR = 'e.get("/api/health",(A,g)=>{g.status(200).json({ok:!0,ts:Date.now()})}),';
const _MEC_STREAMS_ROUTE =
  'globalThis._mecStreamsCache={ts:0,data:null};' +
  'e.get("/api/mec-streams",async(A,g)=>{' +
    'try{' +
      'const now=Date.now();' +
      'if(globalThis._mecStreamsCache.data&&(now-globalThis._mecStreamsCache.ts)<30*60*1000){' +
        'return g.json(globalThis._mecStreamsCache.data);' +
      '}' +
      'const resp=await fetch("https://www.youtube.com/@ministeriodaeducacao_MEC/streams",{' +
        'headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36","Accept-Language":"pt-BR,pt;q=0.9"},' +
        'signal:AbortSignal.timeout(15000)' +
      '});' +
      'if(!resp.ok)throw new Error("YouTube returned "+resp.status);' +
      'const html=await resp.text();' +
      'const streams=[];' +
      'const ytInit=html.match(/var ytInitialData\\s*=\\s*(\\{.+?\\});\\s*<\\/script>/s);' +
      'if(ytInit){' +
        'try{' +
          'const yt=JSON.parse(ytInit[1]);' +
          'const tabs=yt?.contents?.twoColumnBrowseResultsRenderer?.tabs||[];' +
          'let items=[];' +
          'for(const tab of tabs){' +
            'const sec=tab?.tabRenderer?.content?.richGridRenderer?.contents||[];' +
            'for(const s of sec){' +
              'const v=s?.richItemRenderer?.content?.videoRenderer;' +
              'if(v)items.push(v);' +
            '}' +
          '}' +
          'for(const v of items){' +
            'if(streams.length>=20)break;' +
            'const id=v.videoId;' +
            'const title=v.title?.runs?.[0]?.text||v.title?.simpleText||"";' +
            'if(!id||!title)continue;' +
            'const url="https://www.youtube.com/watch?v="+id;' +
            'let dateText=v.publishedTimeText?.simpleText||"";' +
            'let viewCount=v.viewCountText?.simpleText||v.viewCountText?.runs?.[0]?.text||"";' +
            'const lengthText=v.lengthText?.simpleText||"";' +
            'const thumbnailUrl=v.thumbnail?.thumbnails?.slice(-1)?.[0]?.url||"";' +
            'const isLive=!!(v.badges?.some(b=>b?.metadataBadgeRenderer?.label==="AO VIVO")||v.thumbnailOverlays?.some(o=>o?.thumbnailOverlayTimeStatusRenderer?.style==="LIVE"));' +
            'const isUpcoming=!!(v.upcomingEventData||v.thumbnailOverlays?.some(o=>o?.thumbnailOverlayTimeStatusRenderer?.style==="UPCOMING"));' +
            'let scheduledTime=null;' +
            'if(v.upcomingEventData?.startTime){scheduledTime=new Date(parseInt(v.upcomingEventData.startTime)*1000).toISOString();}' +
            'streams.push({id,title,url,dateText,viewCount,lengthText,thumbnailUrl,isLive,isUpcoming,scheduledTime});' +
          '}' +
        '}catch(pe){console.error("[mec-streams] JSON parse error:",pe.message);}' +
      '}' +
      'if(streams.length===0){' +
        'const vRe=/\\/watch\\?v=([\\w-]+)/g;' +
        'let m;const seen=new Set();' +
        'while((m=vRe.exec(html))&&streams.length<20){' +
          'if(seen.has(m[1]))continue;seen.add(m[1]);' +
          'streams.push({id:m[1],title:"Stream MEC",url:"https://www.youtube.com/watch?v="+m[1],dateText:"",viewCount:"",lengthText:"",thumbnailUrl:"",isLive:false,isUpcoming:false,scheduledTime:null});' +
        '}' +
      '}' +
      'const result={ok:true,streams,total:streams.length,cached_at:now};' +
      'globalThis._mecStreamsCache={ts:now,data:result};' +
      'g.json(result);' +
    '}catch(E){' +
      'console.error("[mec-streams]",E.message);' +
      'if(globalThis._mecStreamsCache.data){return g.json(globalThis._mecStreamsCache.data);}' +
      'g.status(500).json({ok:false,streams:[],total:0,error:E.message});' +
    '}' +
  '}),';
if (source.indexOf(_MEC_STREAMS_ANCHOR) !== -1) {
  source = source.replace(_MEC_STREAMS_ANCHOR, _MEC_STREAMS_ANCHOR + _MEC_STREAMS_ROUTE);
  console.log('[bootstrap] /api/mec-streams endpoint patch applied');
} else {
  console.warn('[bootstrap] /api/mec-streams patch NOT applied — anchor not found');
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

// ── Fix: gestão → administração + reorganizar U21 para posição 4 ─────────────
(function _patchTrilhaFixes() {
  const SEED_MARKER = '"Pre-warming stats cache in background...")';
  if (!source.includes(SEED_MARKER)) {
    console.warn('[bootstrap] Trilha fixes — marker not found, skipping');
    return;
  }

  const fixCode = `;setImmediate(async function(){try{` +
    // Substituições gestão → administração (REPLACE é idempotente — roda múltiplas vezes sem problema)
    `await vt.execute("UPDATE trilha_units SET intro = REPLACE(intro, 'gestão dos recursos', 'administração dos recursos') WHERE unit_id = 'U03'");` +
    `await vt.execute("UPDATE trilha_units SET intro = REPLACE(intro, 'gestão financeira', 'administração financeira') WHERE unit_id IN ('U05','U09','U14')");` +
    `await vt.execute("UPDATE trilha_units SET subtitle = REPLACE(subtitle, 'na gestão', 'na administração') WHERE unit_id = 'U06'");` +
    `await vt.execute("UPDATE trilha_units SET subtitle = REPLACE(subtitle, 'Gestão e arquivamento', 'Organização e arquivamento') WHERE unit_id = 'U15'");` +
    `await vt.execute("UPDATE trilha_units SET subtitle = REPLACE(subtitle, 'da gestão escolar', 'da administração escolar') WHERE unit_id = 'U19'");` +
    `await vt.execute("UPDATE trilha_units SET subtitle = REPLACE(subtitle, 'passagem de gestão', 'passagem de administração') WHERE unit_id = 'U20'");` +
    `await vt.execute("UPDATE trilha_units SET intro = REPLACE(intro, 'continuidade na gestão', 'continuidade na administração') WHERE unit_id = 'U20'");` +
    // Reorganizar sortOrders: U21 vai para posição 4, U04-U20 vão para 5-21
    // Etapa 1: mover tudo para 100+ para evitar conflito de unique
    `await vt.execute("UPDATE trilha_units SET sort_order = sort_order + 100 WHERE sort_order BETWEEN 1 AND 21");` +
    // Etapa 2: definir sort_order correto por unit_id (idempotente)
    `await vt.execute("UPDATE trilha_units SET sort_order = 1 WHERE unit_id = 'U01'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 2 WHERE unit_id = 'U02'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 3 WHERE unit_id = 'U03'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 4 WHERE unit_id = 'U21'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 5 WHERE unit_id = 'U04'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 6 WHERE unit_id = 'U05'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 7 WHERE unit_id = 'U06'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 8 WHERE unit_id = 'U07'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 9 WHERE unit_id = 'U08'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 10 WHERE unit_id = 'U09'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 11 WHERE unit_id = 'U10'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 12 WHERE unit_id = 'U11'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 13 WHERE unit_id = 'U12'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 14 WHERE unit_id = 'U13'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 15 WHERE unit_id = 'U14'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 16 WHERE unit_id = 'U15'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 17 WHERE unit_id = 'U16'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 18 WHERE unit_id = 'U17'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 19 WHERE unit_id = 'U18'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 20 WHERE unit_id = 'U19'");` +
    `await vt.execute("UPDATE trilha_units SET sort_order = 21 WHERE unit_id = 'U20'");` +
    // Ajustar links de navegação para a nova posição de U21
    `await vt.execute("UPDATE trilha_units SET next_unit = 'U21' WHERE unit_id = 'U03'");` +
    `await vt.execute("UPDATE trilha_units SET previous_unit = 'U03', next_unit = 'U04' WHERE unit_id = 'U21'");` +
    `await vt.execute("UPDATE trilha_units SET previous_unit = 'U21' WHERE unit_id = 'U04'");` +
    `console.log("[fixes] gestão→administração e reordenação aplicados com sucesso");` +
  `}catch(_e){console.error("[fixes] erro:",_e&&_e.message||_e);}});`;

  source = source.replace(SEED_MARKER, SEED_MARKER + fixCode);
  console.log('[bootstrap] Trilha fixes patch applied');
})();


// ── 3x-idx. Preload in-memory escola index for fast similares filtering ──────
(function _patchSimPreload() {
  const SEED_MARKER = '"Pre-warming stats cache in background...")';
  if (!source.includes(SEED_MARKER)) return;

  const preloadCode = `;setImmediate(async function(){try{` +
    `const _t=Date.now();` +
    `const [_rows,_icgRows]=await Promise.all([` +
    `fn("SELECT inep,nome,municipio,uf,dependencia,localizacao,situacao,"+` +
    `"CAST(COALESCE(matriculas,'0') AS BIGINT) as matriculas,"+` +
    `"(dados::jsonb)->>'telefone' as telefone,"+` +
    `"(dados::jsonb)->>'ds_endereco' as ds_endereco,"+` +
    `"(dados::jsonb)->>'no_bairro' as no_bairro,"+` +
    `"(dados::jsonb)->>'co_cep' as co_cep,"+` +
    `"CAST(COALESCE((dados::jsonb)->>'co_municipio','0') AS BIGINT) as co_municipio,"+` +
    `"CAST(COALESCE((dados::jsonb)->>'qt_mat_inf','0') AS BIGINT) as qt_mat_inf,"+` +
    `"CAST(COALESCE((dados::jsonb)->>'qt_mat_fund','0') AS BIGINT) as qt_mat_fund,"+` +
    `"CAST(COALESCE((dados::jsonb)->>'qt_mat_med','0') AS BIGINT) as qt_mat_med,"+` +
    `"CAST(COALESCE((dados::jsonb)->>'qt_mat_eja','0') AS BIGINT) as qt_mat_eja,"+` +
    `"CAST(COALESCE((dados::jsonb)->>'qt_mat_prof','0') AS BIGINT) as qt_mat_prof "+` +
    `"FROM censo_escolar WHERE ano=2025",[]),` +
    `fn("SELECT inep,(dados::jsonb)->>'nivel' as nivel FROM indicadores_educacionais WHERE ano=2025 AND tipo='icg'",[])` +
    `]);` +
    `const _idx=new Map();` +
    `for(const r of _rows){r.uf=r.uf?.toUpperCase()||"";r.matriculas=Number(r.matriculas)||0;_idx.set(r.inep,r);}` +
    `const _icgMap=new Map();for(const r of _icgRows)_icgMap.set(r.inep,r.nivel);` +
    `globalThis._simData={idx:_idx,icg:_icgMap,ready:true};` +
    `console.log("[sim-idx] Preloaded "+_idx.size+" schools + "+_icgMap.size+" ICG in "+(Date.now()-_t)+"ms");` +
  `}catch(_e){console.error("[sim-idx] Preload failed:",_e&&_e.message||_e);}});`;

  source = source.replace(SEED_MARKER, SEED_MARKER + preloadCode);
  console.log('[bootstrap] Similares in-memory preload patch applied');
})();

// ── 3x. Patch: Otimizar carregamento de Escolas Similares ───────────────────
// v4: in-memory filtering (0ms), only OSRM+road_dist is external
(function _patchSimilares() {
  const _SIM_START = 'e.get("/api/escola/:inep/similares",async(A,g)=>{let E=A.params.inep,v=parseInt(A.query.ano)||2025;try{let x=await Fn(';
  const _SIM_END_MARKER = '}catch(x){g.status(500).json({erro:x.message})}}),';
  const _simStartIdx = source.indexOf(_SIM_START);
  if (_simStartIdx < 0) {
    console.warn('[bootstrap] Similares optimization patch NOT applied -- start anchor not found');
    return;
  }
  const _simEndIdx = source.indexOf(_SIM_END_MARKER, _simStartIdx) + _SIM_END_MARKER.length;

  const _newSimFn = `e.get("/api/escola/:inep/similares",async(A,g)=>{
globalThis._simCache=globalThis._simCache||new Map();
let E=A.params.inep,v=parseInt(A.query.ano)||2025;
try{
  const _ck=E+":"+v,_now=Date.now();
  if(globalThis._simCache.size>500){for(const[k,en]of globalThis._simCache)if(_now-en.ts>=3600000)globalThis._simCache.delete(k);}
  const _ce=globalThis._simCache.get(_ck);
  if(_ce&&_now-_ce.ts<3600000)return g.json(_ce.data);

  const _t0=Date.now();
  const _sd=globalThis._simData;
  if(!_sd||!_sd.ready){
    return g.status(503).json({erro:"\\xCDndice de escolas ainda carregando, tente novamente em alguns segundos"});
  }
  const _idx=_sd.idx,_icg=_sd.icg;
  const x=_idx.get(E);
  if(!x)return g.status(404).json({erro:"Escola n\\xE3o encontrada"});
  const M=_icg.get(E)??null;

  let w=Math.floor((x.matriculas||50)*.33),T=Math.ceil((x.matriculas||50)*3);
  const D=j=>{let s=new Set;return j.qt_mat_inf>0&&s.add("EI"),j.qt_mat_fund>0&&s.add("EF"),j.qt_mat_med>0&&s.add("EM"),j.qt_mat_eja>0&&s.add("EJA"),j.qt_mat_prof>0&&s.add("EP"),s.size===0&&s.add("EF"),s};
  const B=D(x),N=[...B].sort().join("+"),L=x.uf?.toUpperCase()||"";
  const V=x.co_municipio||0;

  const P=(j,le)=>{let a=aq[j],c=aq[le];if(!a||!c)return 9999;let R=6371,dl=(c[0]-a[0])*Math.PI/180,dn=(c[1]-a[1])*Math.PI/180,h=Math.sin(dl/2)**2+Math.cos(a[0]*Math.PI/180)*Math.cos(c[0]*Math.PI/180)*Math.sin(dn/2)**2;return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))};
  const hasOverlap=r=>{const s=D(r);for(const m of B)if(s.has(m))return true;return false};

  const Z=[];
  for(const[inep,r] of _idx){
    if(inep===E)continue;
    if(r.situacao!=='Em Atividade')continue;
    if(r.dependencia!==x.dependencia)continue;
    if(r.uf!==L)continue;
    const mat=Number(r.matriculas)||0;
    if(mat<w||mat>T)continue;
    if(!hasOverlap(r))continue;
    const icg=_icg.get(inep)??null;
    if(M!==null&&icg!==null&&icg!==M)continue;
    Z.push({r,icg});
  }

  let Y=Z.sort((a,b)=>P(V,a.r.co_municipio||0)-P(V,b.r.co_municipio||0)).slice(0,50);

  let fe=false,G={},oe=aq[V];
  if(oe&&Y.length>0&&V){
    try{
      const allMuns=[...new Set(Y.map(e=>e.r.co_municipio).filter(Boolean))];
      if(allMuns.length>0){
        const ph=allMuns.map(()=>"?").join(",");
        try{const rows=await fn(\`SELECT co_mun_dest,km FROM mun_road_dist WHERE co_mun_orig=? AND co_mun_dest IN (\${ph})\`,[V,...allMuns]);
          for(const r of rows)G[r.co_mun_dest]=r.km;}catch{}
        const missing=allMuns.filter(m=>G[m]===void 0)
          .map(m=>{const c=aq[m];return c?{mun:m,coord:\`\${c[1]},\${c[0]}\`,dist:P(V,m)}:null})
          .filter(Boolean)
          .sort((a,b)=>a.dist-b.dist)
          .slice(0,15);
        if(missing.length>0){
          const coords=missing.map(r=>r.coord);
          const url=\`http://router.project-osrm.org/table/v1/driving/\${[\`\${oe[1]},\${oe[0]}\`,...coords].join(";")}?sources=0&annotations=distance\`;
          try{
            const res=await fetch(url,{signal:AbortSignal.timeout(4000)});
            if(res.ok){const j=await res.json();
              if(j.code==="Ok"&&Array.isArray(j.distances?.[0])){
                const ds=j.distances[0],ins="INSERT INTO mun_road_dist(co_mun_orig,co_mun_dest,km)VALUES(?,?,?)ON CONFLICT(co_mun_orig,co_mun_dest)DO UPDATE SET km=excluded.km";
                for(let i=0;i<missing.length;i++){const d=ds[i+1];if(d!=null&&isFinite(d)){const km=Math.round(d/1e3);G[missing[i].mun]=km;au(ins,[V,missing[i].mun,km]).catch(()=>{});au(ins,[missing[i].mun,V,km]).catch(()=>{});}}
              }
            }
          }catch{}
        }
        allMuns.some(m=>G[m]!==void 0)&&(fe=true);
      }
    }catch{}
    fe&&Y.sort((a,b)=>(G[a.r.co_municipio]??P(V,a.r.co_municipio||0))-(G[b.r.co_municipio]??P(V,b.r.co_municipio||0)));
  }

  let z={};for(const e of Y)e.r.uf&&(z[e.r.uf.toUpperCase()]=(z[e.r.uf.toUpperCase()]||0)+1);
  const _result={escola_base:{inep:E,dependencia:x.dependencia,localizacao:x.localizacao,matriculas:x.matriculas,uf:L,modalidades:N,icg_nivel:M},total:Y.length,por_uf:z,distancia_tipo:fe?"rodovi\\xE1ria":"linha reta",escolas:Y.map(e=>{const r=e.r;return{inep:r.inep,nome:r.nome,municipio:r.municipio,uf:r.uf?.toUpperCase(),dependencia:r.dependencia,localizacao:r.localizacao,matriculas:Number(r.matriculas)||0,distancia_km:V&&r.co_municipio?G[r.co_municipio]??Math.round(P(V,r.co_municipio)):null,telefone:r.telefone||null,ds_endereco:r.ds_endereco||null,no_bairro:r.no_bairro||null,co_cep:r.co_cep||null,icg_nivel:e.icg??null,modalidades:[r.qt_mat_inf>0&&"Infantil",r.qt_mat_fund>0&&"Fundamental",r.qt_mat_med>0&&"M\\xE9dio",r.qt_mat_eja>0&&"EJA",r.qt_mat_prof>0&&"Prof."].filter(Boolean)}})};
  globalThis._simCache.set(_ck,{ts:Date.now(),data:_result});
  g.json(_result);
}catch(x){g.status(500).json({erro:x.message})}
}),`;

  source = source.slice(0, _simStartIdx) + _newSimFn + source.slice(_simEndIdx);
  console.log('[bootstrap] Similares v4 patch applied (in-memory filter, OSRM top-15, 4s timeout)');
})();

// ── 4x. DOU Federal — enhanced API routes ──────────────────────────────────
(function _patchDOU() {
  const DOU_MARKER = 'e.get("/api/dou/search",async(A,g)=>';
  if (!source.includes(DOU_MARKER)) {
    console.warn('[bootstrap] DOU patch — marker not found, skipping');
  } else {
    // Inject new routes BEFORE the existing /api/dou/search
    const douRoutes = `
e.get("/api/dou/edicao",async(A,g)=>{
  try{
    const data=String(A.query.data||"").trim();
    const secao=String(A.query.secao||"do1").trim().toLowerCase();
    const orgao=String(A.query.orgao||"").trim();
    const page=Math.max(1,parseInt(A.query.page)||1);
    const size=Math.min(50,parseInt(A.query.size)||20);
    const cacheKey="dou-ed:"+data+":"+secao+":"+orgao+":"+page;
    globalThis._douCache=globalThis._douCache||new Map();
    const cached=globalThis._douCache.get(cacheKey);
    if(cached&&Date.now()-cached.ts<1800000)return g.json(cached.data);

    let query=orgao||"*";
    const params=new URLSearchParams();
    params.set("q",query);
    params.set("s",String((page-1)*size));
    params.set("delta",String(size));
    params.set("sortType","0");
    if(data){
      params.set("exactDate","personalizado");
      params.set("publishFrom",data);
      params.set("publishTo",data);
    }else{
      params.set("exactDate","dia");
    }
    if(secao!=="todos"){
      const secMap={"do1":"DO1","do2":"DO2","do3":"DO3","doe":"DOE","do1a":"DO1A","do1e":"DO1-E","do2e":"DO2-E","do3e":"DO3-E"};
      const secVal=secMap[secao]||secao.toUpperCase();
      params.set("newNormPublicationType",secVal);
    }
    const url="https://www.in.gov.br/consulta/-/buscar/dou?"+params.toString();
    let results=[];
    try{
      const r=await fetch(url,{
        headers:{"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Cookie:"COOKIE_SUPPORT=true; GUEST_LANGUAGE_ID=pt_BR"},
        signal:AbortSignal.timeout(20000)});
      if(r.ok){
        const html=await r.text();
        const jsonMatch=html.match(/"jsonArray"\\s*:\\s*(\\[[^\\]]*\\])/);
        if(jsonMatch){
          try{results=JSON.parse(jsonMatch[1]).map(i=>({
            title:i.title||"",href:i.urlTitle?"https://www.in.gov.br/web/dou/-/"+i.urlTitle:"",
            abstract:(i.content||"").replace(/<[^>]+>/g,"").replace(/\\s+/g," ").trim().substring(0,300),
            date:i.pubDate||"",section:(i.pubName||"").toLowerCase(),
            hierarchy:i.hierarchyStr||"",artType:i.artType||"",
            artCategory:i.artCategory||"",editionNumber:i.editionNumber||"",
            pageNumber:i.pageNumber||""}));}catch{}
        }
        if(results.length===0){
          const Dc=require("cheerio").load||require("cheerio");
          const $ch=(typeof Dc==="function"?Dc:Dc.load)(html);
          $ch(".resultados-lista .content-area, .resultado-busca, .resultados-702__item").each((_,el)=>{
            const $e=$ch(el);
            const title=$e.find("h5,h2,.title-marker,a.link-marker").first().text().trim();
            const href=$e.find("a").first().attr("href")||"";
            const abs=$e.find("p,.abstract-marker").first().text().trim();
            const dt=$e.find(".date-marker,.data").first().text().trim();
            if(title)results.push({title,href:href.startsWith("http")?href:"https://www.in.gov.br"+href,abstract:abs.substring(0,300),date:dt,section:secao,hierarchy:"",artType:"",artCategory:"",editionNumber:"",pageNumber:""});
          });
        }
      }
    }catch(_e){}
    const resp={ok:true,data:data||new Date().toISOString().split("T")[0],secao,orgao:orgao||null,page,size,total:results.length,results,
      searchUrl:url,
      linkDireto:"https://www.in.gov.br/leiturajornal?data="+(data||new Date().toISOString().split("T")[0])+"&secao="+secao};
    if(results.length>0)globalThis._douCache.set(cacheKey,{ts:Date.now(),data:resp});
    g.json(resp);
  }catch(E){g.status(500).json({ok:false,message:E.message})}
}),
e.get("/api/dou/destaques",async(A,g)=>{
  try{
    globalThis._douDestCache=globalThis._douDestCache||{ts:0,data:null};
    if(globalThis._douDestCache.data&&Date.now()-globalThis._douDestCache.ts<1800000)return g.json(globalThis._douDestCache.data);
    const orgaos=["Minist\\xE9rio da Educa\\xE7\\xE3o","FNDE","INEP","CAPES","CNE"];
    const allResults=[];
    for(const org of orgaos){
      try{
        const params=new URLSearchParams({q:org,exactDate:"mes",sortType:"0",delta:"5",s:"0"});
        const url="https://www.in.gov.br/consulta/-/buscar/dou?"+params.toString();
        const r=await fetch(url,{
          headers:{"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:"text/html,application/xhtml+xml",Cookie:"COOKIE_SUPPORT=true; GUEST_LANGUAGE_ID=pt_BR"},
          signal:AbortSignal.timeout(10000)});
        if(r.ok){
          const html=await r.text();
          const jm=html.match(/"jsonArray"\\s*:\\s*(\\[[^\\]]*\\])/);
          if(jm){
            try{const items=JSON.parse(jm[1]);
              items.slice(0,3).forEach(i=>allResults.push({
                title:i.title||"",href:i.urlTitle?"https://www.in.gov.br/web/dou/-/"+i.urlTitle:"",
                abstract:(i.content||"").replace(/<[^>]+>/g,"").replace(/\\s+/g," ").trim().substring(0,200),
                date:i.pubDate||"",section:(i.pubName||"").toLowerCase(),
                orgao:org,artType:i.artType||""}));}catch{}
          }
        }
      }catch{}
    }
    const resp={ok:true,atualizado:new Date().toISOString(),total:allResults.length,destaques:allResults};
    if(allResults.length>0)globalThis._douDestCache={ts:Date.now(),data:resp};
    g.json(resp);
  }catch(E){g.status(500).json({ok:false,message:E.message})}
}),
`;
    source = source.replace(DOU_MARKER, douRoutes + DOU_MARKER);
    console.log('[bootstrap] DOU enhanced routes patch applied');
  }
})();

// ── 5. AI "Explicar Norma" route ─────────────────────────────────────────────
(function _patchAIExplicar() {
  const AI_MARKER = 'e.get("/api/dou/search",async(A,g)=>';
  if (!source.includes(AI_MARKER)) {
    console.warn('[bootstrap] AI explicar — marker not found, skipping');
  } else {
    const aiRoute = `
e.post("/api/ai/explicar-norma",async(A,g)=>{
  try{
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)return g.status(503).json({ok:false,message:"Chave de IA não configurada"});
    const{titulo,ementa,tipo,link,contexto}=A.body||{};
    if(!titulo)return g.status(400).json({ok:false,message:"Título obrigatório"});

    globalThis._aiRateLimit=globalThis._aiRateLimit||{ts:0,count:0};
    const rl=globalThis._aiRateLimit;const now=Date.now();
    if(now-rl.ts>60000){rl.ts=now;rl.count=0;}
    rl.count++;
    if(rl.count>10)return g.status(429).json({ok:false,message:"Muitas requisições. Aguarde um minuto."});

    const cacheKey="ai-exp:"+titulo.substring(0,80)+"|"+(contexto||"").substring(0,30);
    globalThis._aiExpCache=globalThis._aiExpCache||new Map();
    if(globalThis._aiExpCache.size>500){const keys=[...globalThis._aiExpCache.keys()];for(let i=0;i<100;i++)globalThis._aiExpCache.delete(keys[i]);}
    const cached=globalThis._aiExpCache.get(cacheKey);
    if(cached&&Date.now()-cached.ts<86400000)return g.json(cached.data);

    const systemPrompt=\`Você é uma diretora de escola pública brasileira, experiente, acolhedora e prática. Você explica leis e normas para outras diretoras.

REGRAS ABSOLUTAS:
- Escreva como uma diretora conversando com outra diretora
- Frases curtas e palavras simples
- Se usar termo técnico, explique na hora entre parênteses
- Considere escolas em comunidades quilombolas, ribeirinhas, rurais, com poucos recursos
- Traga exemplos reais (distância, transporte, falta de estrutura)
- Nada de linguagem jurídica ou texto com "cara de IA"
- Não invente regra que não existe
- Se algo depende da prefeitura ou secretaria, diga claramente

FORMATO DA RESPOSTA (use exatamente esta estrutura JSON):
{
  "situacao": "vigente | revogada | alterada | parcialmente revogada",
  "situacaoExplicada": "explicação simples do status, ex: Essa lei ainda vale hoje...",
  "blocos": [
    {
      "tema": "título curto do bloco",
      "oQueDiz": "o que a lei diz, bem simples",
      "naPratica": "o que isso quer dizer no dia a dia da escola",
      "podeFazer": ["o que a escola pode fazer"],
      "naoPodeFazer": ["o que a escola NÃO pode fazer"],
      "responsabilidade": "quem é responsável (separar União, estado, município, secretaria, escola, direção, professor)",
      "exemplo": "exemplo real como se fosse situação da escola",
      "alerta": "erro comum ou risco"
    }
  ],
  "regrasDoJogo": [
    {
      "regra": "descrição curta e direta da regra ou obrigação",
      "consequencia": "o que acontece se não cumprir"
    }
  ],
  "cuidadosDiretora": ["lista do que eu como diretora preciso cuidar"],
  "errosComuns": ["erros que podem dar problema"],
  "dicasPraticas": ["dicas práticas do dia a dia"]
}\`;

    const userMsg=\`Analise e explique esta norma/lei de forma simples e prática para o dia a dia da escola:

Título: \${titulo}
\${tipo?"Tipo: "+tipo:""}
\${ementa?"Ementa/Resumo: "+ementa:""}
\${link?"Link oficial: "+link:""}
\${contexto?"Contexto adicional: "+contexto:""}

Retorne APENAS o JSON no formato especificado, sem markdown, sem backticks, sem texto extra.\`;

    const model=process.env.OPENAI_MODEL||"gpt-4o-mini";
    const resp=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body:JSON.stringify({model,messages:[{role:"system",content:systemPrompt},{role:"user",content:userMsg}],temperature:0.7,max_tokens:3000}),
      signal:AbortSignal.timeout(60000)
    });
    if(!resp.ok){const err=await resp.text();throw new Error("OpenAI error: "+resp.status+" "+err.substring(0,200));}
    const data=await resp.json();
    const raw=data.choices?.[0]?.message?.content||"";
    let parsed;
    try{
      const cleaned=raw.replace(/^\`\`\`json?\\n?/,"").replace(/\\n?\`\`\`$/,"").trim();
      parsed=JSON.parse(cleaned);
    }catch{parsed={blocos:[{tema:"Explicação",oQueDiz:raw}],situacao:"",situacaoExplicada:"",cuidadosDiretora:[],errosComuns:[],dicasPraticas:[]};}
    const result={ok:true,titulo,explicacao:parsed,modelo:model};
    globalThis._aiExpCache.set(cacheKey,{ts:Date.now(),data:result});
    g.json(result);
  }catch(E){console.error("[ai-explicar]",E.message);g.status(500).json({ok:false,message:E.message})}
}),
`;
    source = source.replace(AI_MARKER, aiRoute + AI_MARKER);
    console.log('[bootstrap] AI explicar-norma route applied');
  }
})();

// ── CONSED + UNDIME news scraping ────────────────────────────────────────────
(function patchNoticiasExtras() {
  const NOTICIAS_MARKER = 'e.get("/api/noticias-educacao"';
  if (!source.includes(NOTICIAS_MARKER)) {
    console.warn('[bootstrap] noticias-educacao marker not found, adding CONSED/UNDIME as separate route');
  }

  const extraNewsRoute = `
e.get("/api/noticias-extras",async(A,g)=>{
  try{
    const limit=Math.min(parseInt(String(A.query.limit||"20")),50);
    const cache=globalThis._noticiasExtrasCache;
    if(cache&&Date.now()-cache.ts<600000){const d=cache.data;return g.json({...d,noticias:d._all.slice(0,limit),total:d._all.length});}

    async function scrapeConsed(){
      try{
        const r=await fetch("https://www.consed.org.br",{
          headers:{"User-Agent":"Mozilla/5.0 (compatible; EducBot/1.0)","Accept":"text/html"},
          signal:AbortSignal.timeout(12000)});
        if(!r.ok)return[];
        const h=await r.text();
        const items=[];
        const links=[...new Set([...h.matchAll(/href="(https:\\/\\/www\\.consed\\.org\\.br\\/noticia\\/[^"]+)"/g)].map(m=>m[1]))];
        for(const url of links){
          const slug=url.split("/noticia/")[1]||"";
          const idx=h.indexOf(url);
          let title="";
          if(idx>-1){const chunk=h.substring(idx,idx+800);const tm=chunk.match(/class="title"[^>]*>([^<]+)/);if(tm)title=tm[1].trim();}
          if(!title||title.length<10) title=slug.replace(/-/g," ").replace(/^./,c=>c.toUpperCase());
          if(title.length>15&&!items.find(x=>x.titulo===title)){
            items.push({titulo:title,url,fonte:"CONSED",categoria:"Secretarias Estaduais",data:new Date().toISOString().slice(0,7)});
          }
        }
        return items.slice(0,15);
      }catch{return[];}
    }

    async function scrapeUndime(){
      try{
        const r=await fetch("https://undime.org.br/noticia/",{
          headers:{"User-Agent":"Mozilla/5.0 (compatible; EducBot/1.0)","Accept":"text/html"},
          signal:AbortSignal.timeout(12000)});
        if(!r.ok)return[];
        const h=await r.text();
        const links=[...new Set([...h.matchAll(/\\/noticia\\/(\\d{2})-(\\d{2})-(\\d{4})-(\\d{2})-(\\d{2})-([a-z0-9-]+)/g)].map(m=>m[0]))];
        return links.slice(0,15).map(l=>{
          const dm=l.match(/\\/noticia\\/(\\d{2})-(\\d{2})-(\\d{4})/);
          const date=dm?dm[3]+"-"+dm[2]+"-"+dm[1]:"";
          const slug=l.replace(/^\\/noticia\\/\\d{2}-\\d{2}-\\d{4}-\\d{2}-\\d{2}-/,"").replace(/-/g," ");
          const title=slug.charAt(0).toUpperCase()+slug.slice(1);
          return{titulo:title,url:"https://undime.org.br"+l,fonte:"UNDIME",categoria:"Dirigentes Municipais",data:date||new Date().toISOString().slice(0,7)};
        });
      }catch{return[];}
    }

    const[consed,undime]=await Promise.allSettled([scrapeConsed(),scrapeUndime()]);
    const all=[...(consed.value||[]),...(undime.value||[])];
    all.sort((a,b)=>(b.data||"").localeCompare(a.data||""));
    const result={ok:true,noticias:all.slice(0,limit),total:all.length,fontes:["CONSED","UNDIME"],_all:all};
    globalThis._noticiasExtrasCache={ts:Date.now(),data:result};
    g.json({ok:true,noticias:all.slice(0,limit),total:all.length,fontes:["CONSED","UNDIME"]});
  }catch(E){g.status(500).json({ok:false,noticias:[],total:0,error:E.message})}
}),
`;
  source = source.replace(NOTICIAS_MARKER, extraNewsRoute + NOTICIAS_MARKER);
  console.log('[bootstrap] CONSED/UNDIME noticias-extras route applied');
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
