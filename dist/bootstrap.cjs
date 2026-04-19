'use strict';
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const os = require('os');
const Module = require('module');

function loadDotEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;

      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (!key) continue;

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      if (typeof process.env[key] === 'undefined') {
        process.env[key] = val;
      }
    }

    const hasDb = !!(process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL);
    console.log(`[bootstrap] .env loaded (db configured: ${hasDb})`);
  } catch (err) {
    console.warn('[bootstrap] Failed to load .env:', err.message);
  }
}

loadDotEnvFile();

// Prefer PostgreSQL in all environments when a DB URL is available.
if (!process.env.RAILWAY_DATABASE_URL && process.env.DATABASE_URL) {
  process.env.RAILWAY_DATABASE_URL = process.env.DATABASE_URL;
}
if (!process.env.DATABASE_URL && process.env.RAILWAY_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.RAILWAY_DATABASE_URL;
}
if ((process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL) && process.env.SQLITE_DATABASE_URL && !process.env.ALLOW_SQLITE_FALLBACK) {
  delete process.env.SQLITE_DATABASE_URL;
  console.log('[bootstrap] SQLite fallback env disabled (PostgreSQL configured)');
}

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

// ── 3a1. Patch: inject dados.gov.br/SIGPC API key headers in OLINDA fetches ─
// Supports multiple env names so deployment can use whichever is already set.
const _SIGPC_HEADERS_OLD = 'Xhe={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",Accept:"application/json","Accept-Language":"pt-BR,pt;q=0.9"},';
const _SIGPC_HEADERS_NEW = 'Xhe=(()=>{let h={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",Accept:"application/json","Accept-Language":"pt-BR,pt;q=0.9"},k=process.env.DADOS_GOV_API_KEY||process.env.SIGPC_API_KEY||process.env.OLINDA_API_KEY||process.env.DADOSGOVBR_API_KEY||"";if(k){h["x-api-key"]=k,h["X-API-Key"]=k,h["chave-api-dados-abertos"]=k,h.app_token=k,h.Authorization=/^Bearer\\s/i.test(k)?k:`Bearer ${k}`;}return h})(),';
const _sigpcHeaderPatched = source.replace(_SIGPC_HEADERS_OLD, _SIGPC_HEADERS_NEW);
if (_sigpcHeaderPatched !== source) {
  source = _sigpcHeaderPatched;
  console.log('[bootstrap] SIGPC API key header patch applied');
} else {
  console.warn('[bootstrap] SIGPC API key header patch NOT applied — anchor not found');
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

// ── 3c1b. Patch: adiciona bloco saude em /api/equipamentos-publicos ─────────
// Lê saude-contatos-priorizados.json (quando disponível) e retorna resumo,
// top contatos e pronto socorro mais próximo no mesmo payload da API municipal.
const _EQUIP_START = 'e.get("/api/equipamentos-publicos/:coMunicipio",async(A,g)=>{';
const _EQUIP_END = '});let c={},d=360*60*1e3;';
const _EQUIP_ROUTE =
  'e.get("/api/equipamentos-publicos/:coMunicipio",async(A,g)=>{'+
    'let{coMunicipio:E}=A.params;'+
    'if(!E||!/^[\\d]{6,7}$/.test(E))return g.status(400).json({ok:!1,error:"C\\xF3digo de munic\\xEDpio inv\\xE1lido"});'+
    'let v=E.length===7?E.slice(0,6):E,x="72814|72837|72839|72858",w=()=>{'+
      'let T={disponivel:!1,fonte:"saude-contatos-priorizados.json",atualizado_em:null,referencia_proximidade:null,resumo:null,pronto_socorro_mais_proximo:null,top_contatos:[],dados_correspondem_municipio:!1};'+
      'try{'+
        'let I=require("fs"),D=require("path"),B=D.resolve(process.cwd(),process.env.SAUDE_CONTATOS_OUTPUT_JSON||"saude-contatos-priorizados.json");'+
        'if(!I.existsSync(B))return T;'+
        'let N=JSON.parse(I.readFileSync(B,"utf8")),R=String(N&&N.filtros&&N.filtros.codigo_municipio||"").replace(/\\D/g,""),M=String(E||"").replace(/\\D/g,""),L=M.length===7?M.slice(0,6):M;'+
        'T.disponivel=!0;'+
        'T.atualizado_em=N.generated_at||null;'+
        'T.referencia_proximidade=N.referencia_proximidade||null;'+
        'T.resumo=N.resumo||null;'+
        'T.pronto_socorro_mais_proximo=N.pronto_socorro_mais_proximo||null;'+
        'T.top_contatos=Array.isArray(N.priorizados_geral)?N.priorizados_geral.slice(0,5):[];'+
        'T.dados_correspondem_municipio=R?R===M||R===L:!0;'+
      '}catch(I){T.erro=I.message}'+
      'return T;'+
    '},T=w();'+
    // CNES API fallback when local file not available OR doesn't match municipality
    'if(!T.disponivel||!T.dados_correspondem_municipio){'+
      // reset so we build fresh from CNES for this municipality
      'T={disponivel:!1,fonte:"CNES-API",atualizado_em:null,referencia_proximidade:null,resumo:null,pronto_socorro_mais_proximo:null,top_contatos:[],dados_correspondem_municipio:!1};'+
      'try{'+
        // fetch UBS (tipo 1=Posto Saúde, 2=Centro Saúde), Pronto Atendimento (tipo 73 — UPAs são subset), Hospital (tipo 5) in parallel
        'let _base="https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_municipio="+v;'+
        'let _sig=AbortSignal.timeout(14e3);'+
        'let _hdrs={"User-Agent":"ChegoAContaDiretora/1.0","Accept":"application/json"};'+
        'let [_r1,_r2,_r3,_r4]=await Promise.all(['+
          'fetch(_base+"&codigo_tipo_unidade=1&limit=100",{signal:_sig,headers:_hdrs}).then(r=>r.ok?r.json():null).catch(()=>null),'+
          'fetch(_base+"&codigo_tipo_unidade=2&limit=100",{signal:_sig,headers:_hdrs}).then(r=>r.ok?r.json():null).catch(()=>null),'+
          'fetch(_base+"&codigo_tipo_unidade=73&limit=50",{signal:_sig,headers:_hdrs}).then(r=>r.ok?r.json():null).catch(()=>null),'+
          'fetch(_base+"&codigo_tipo_unidade=5&limit=30",{signal:_sig,headers:_hdrs}).then(r=>r.ok?r.json():null).catch(()=>null)'+
        ']);'+
        // nome_fantasia = nome real da unidade (ex: "UBS CENTRO"), nome_razao_social = entidade mantenedora (ex: "Prefeitura de...")
        'let _mapEst=(arr,tipo)=>(Array.isArray(arr)?arr:[]).map(_est=>({tipo,nome:_est.nome_fantasia||_est.nome_razao_social,bairro:_est.bairro_estabelecimento||null,endereco:(_est.endereco_estabelecimento&&_est.numero_estabelecimento)?_est.endereco_estabelecimento+", "+_est.numero_estabelecimento:(_est.endereco_estabelecimento||null),telefone:_est.numero_telefone_estabelecimento||null,latitude:_est.latitude_estabelecimento_decimo_grau?parseFloat(_est.latitude_estabelecimento_decimo_grau):null,longitude:_est.longitude_estabelecimento_decimo_grau?parseFloat(_est.longitude_estabelecimento_decimo_grau):null,distancia_km:null}));'+
        'let _ubs=[..._mapEst((_r1&&_r1.estabelecimentos)||[],"UBS"),..._mapEst((_r2&&_r2.estabelecimentos)||[],"UBS")];'+
        // Tipo 73 do CNES = "Pronto Atendimento" (categoria ampla). UPA é um subtipo: só rotular como UPA quando o nome realmente contém "UPA" como palavra
        'let _upa=(Array.isArray(_r3&&_r3.estabelecimentos)?_r3.estabelecimentos:[]).map(_est=>{var _n=String(_est.nome_fantasia||_est.nome_razao_social||"").toUpperCase();var _isUpa=/\\bUPA\\b/.test(_n)&&!/PRONTO[- ]ATENDIMENTO/.test(_n);return {tipo:_isUpa?"UPA":"PRONTO_ATENDIMENTO",nome:_est.nome_fantasia||_est.nome_razao_social,bairro:_est.bairro_estabelecimento||null,endereco:(_est.endereco_estabelecimento&&_est.numero_estabelecimento)?_est.endereco_estabelecimento+", "+_est.numero_estabelecimento:(_est.endereco_estabelecimento||null),telefone:_est.numero_telefone_estabelecimento||null,latitude:_est.latitude_estabelecimento_decimo_grau?parseFloat(_est.latitude_estabelecimento_decimo_grau):null,longitude:_est.longitude_estabelecimento_decimo_grau?parseFloat(_est.longitude_estabelecimento_decimo_grau):null,distancia_km:null};});'+
        // filter hospitals by name: only those with "pronto socorro" count as PS
        'let _hosp=((_r4&&_r4.estabelecimentos)||[]);'+
        'let _ps=_hosp.filter(h=>/pronto[- ]socorro/.test(String(h.nome_fantasia||h.nome_razao_social||"").toLowerCase())).map(h=>({tipo:"PRONTO_SOCORRO",nome:h.nome_fantasia||h.nome_razao_social,bairro:h.bairro_estabelecimento||null,endereco:(h.endereco_estabelecimento&&h.numero_estabelecimento)?h.endereco_estabelecimento+", "+h.numero_estabelecimento:(h.endereco_estabelecimento||null),telefone:h.numero_telefone_estabelecimento||null,latitude:h.latitude_estabelecimento_decimo_grau?parseFloat(h.latitude_estabelecimento_decimo_grau):null,longitude:h.longitude_estabelecimento_decimo_grau?parseFloat(h.longitude_estabelecimento_decimo_grau):null,distancia_km:null}));'+
        'if(_ubs.length>0||_upa.length>0||_ps.length>0){'+
          'T.disponivel=!0;'+
          'T.dados_correspondem_municipio=!0;'+
          'T.fonte="CNES-API";'+
          'T.atualizado_em=new Date().toISOString();'+
          'T.pronto_socorro_mais_proximo=_ps.length>0?_ps[0]:null;'+
          'T.top_contatos=[..._upa,..._ubs].slice(0,8);'+
          'T.resumo={total_unidades:_ubs.length+_upa.length+_ps.length};'+
        '}'+
      '}catch(_ce){console.warn("[equipamentos] CNES fallback erro:",_ce.message);}'+
    '}'+
    // ONGs from CNEAS (local file or API fallback)
    'let _ongsResult={disponivel:!1,entidades:[],fonte:"ongs-contatos.json",atualizado_em:null};'+
    'try{'+
      'const _oFs=require("fs"),_oPath=require("path").resolve(process.cwd(),process.env.ONG_CONTATOS_OUTPUT_JSON||"ongs-contatos.json");'+
      'if(_oFs.existsSync(_oPath)){'+
        'const _oData=JSON.parse(_oFs.readFileSync(_oPath,"utf8"));'+
        'const _oMun=String(_oData&&_oData.filtros&&_oData.filtros.codigo_municipio||"").replace(/\\D/g,"");'+
        'const _oMun6=_oMun.length===7?_oMun.slice(0,6):_oMun;'+
        'const _oMatch=!_oMun||_oMun===E||_oMun6===v||_oMun===v;'+
        'if(_oMatch){_ongsResult={disponivel:!0,fonte:"ongs-contatos.json",atualizado_em:_oData.generated_at||null,resumo:_oData.resumo||null,entidades:Array.isArray(_oData.entidades)?_oData.entidades.slice(0,15):[],dados_correspondem_municipio:!0};}'+
      '}'+
    '}catch(_ofe){}'+
    'if(!_ongsResult.disponivel){'+
      'try{'+
        'if(!globalThis._cneasRid){'+
          'const _pkgR=await fetch("https://dados.gov.br/api/3/action/package_show?id=cneas--cadastro-nacional-de-entidades-de-assistencia-social",{signal:AbortSignal.timeout(10e3),headers:{"Accept":"application/json","User-Agent":"ChegoAContaDiretora/1.0"}});'+
          'if(_pkgR.ok){const _pkg=await _pkgR.json();const _res=(_pkg&&_pkg.result&&_pkg.result.resources||[]).find(r=>r.datastore_active===!0)||(_pkg&&_pkg.result&&_pkg.result.resources||[])[0];if(_res)globalThis._cneasRid=_res.id;}'+
        '}'+
        'if(globalThis._cneasRid){'+
          'const _flt=JSON.stringify({CO_MUNICIPIO:v});'+
          'const _cUrl="https://dados.gov.br/api/3/action/datastore_search?resource_id="+encodeURIComponent(globalThis._cneasRid)+"&filters="+encodeURIComponent(_flt)+"&limit=50";'+
          'const _cR=await fetch(_cUrl,{signal:AbortSignal.timeout(14e3),headers:{"Accept":"application/json","User-Agent":"ChegoAContaDiretora/1.0"}});'+
          'if(_cR.ok){'+
            'const _cD=await _cR.json();'+
            'const _recs=(_cD&&_cD.result&&_cD.result.records)||[];'+
            'const _nA=a=>{const s=String(a||"").toLowerCase();if(s.includes("assist"))return"Assist\\xEAncia Social";if(s.includes("sa\\xFAde")||s.includes("saude"))return"Sa\\xFAde";if(s.includes("educa"))return"Educa\\xE7\\xE3o";return String(a||"").trim()||null};'+
            'const _ents=_recs.map(r=>({nome:r.NO_ENTIDADE||r.NM_ENTIDADE||r.DS_RAZAO_SOCIAL||null,area:_nA(r.DS_AREA_ATUACAO||r.NO_AREA_ATUACAO||null),telefone:r.NU_TELEFONE||r.DS_TELEFONE||null,email:(String(r.DS_EMAIL||r.NO_EMAIL||"").includes("@"))?String(r.DS_EMAIL||r.NO_EMAIL||"").trim():null,cnpj:String(r.NU_CNPJ||r.CD_CNPJ||"").replace(/\\D/g,"")||null,tem_cebas:!1,possui_contato:!!(r.NU_TELEFONE||r.DS_TELEFONE||(String(r.DS_EMAIL||"").includes("@")&&r.DS_EMAIL))})).filter(e=>e.nome);'+
            '_ents.sort((a,b)=>(b.possui_contato?1:0)-(a.possui_contato?1:0));'+
            '_ongsResult={disponivel:!0,fonte:"CNEAS-API",atualizado_em:new Date().toISOString(),resumo:{total_entidades:_ents.length,total_com_contato:_ents.filter(e=>e.possui_contato).length},entidades:_ents.slice(0,15),dados_correspondem_municipio:!0};'+
          '}'+
        '}'+
      '}catch(_onge){console.warn("[equipamentos] ONGs CNEAS erro:",_onge.message);}'+
    '}'+
    // School-centric proximity reference: when ?inep= is provided, override
    // referencia_proximidade with the school's coords from censo_escolas (latest year).
    'try{'+
      'const _epPool=globalThis._pgPool;'+
      'if(_epPool&&A.query&&A.query.inep&&/^[0-9]{6,12}$/.test(String(A.query.inep))){'+
        'const _ie=String(A.query.inep);'+
        'const _ir=await _epPool.query("SELECT latitude,longitude FROM censo_escolas WHERE co_entidade=$1 AND latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY ano DESC NULLS LAST LIMIT 1",[_ie]);'+
        'if(_ir&&_ir.rows&&_ir.rows[0]){'+
          'const _la=Number(_ir.rows[0].latitude),_lo=Number(_ir.rows[0].longitude);'+
          'if(Number.isFinite(_la)&&Number.isFinite(_lo)){'+
            'T.referencia_proximidade={latitude:_la,longitude:_lo,fonte:"censo_escolas",inep:_ie};'+
          '}'+
        '}'+
      '}'+
    '}catch(_se){console.warn("[equipamentos] escola coords lookup erro:",_se.message);}'+
    // FUNAI CTL/CR data from funai-coordenacoes.json
    'let _funaiResult={disponivel:!1,ctls:[],cr:null,fonte:"funai-coordenacoes.json",atualizado_em:null};'+
    'try{'+
      'const _fFs=require("fs"),_fPath=require("path").resolve(process.cwd(),process.env.FUNAI_OUTPUT_JSON||"funai-coordenacoes.json");'+
      'if(_fFs.existsSync(_fPath)){'+
        'const _fData=JSON.parse(_fFs.readFileSync(_fPath,"utf8"));'+
        'const _fAt=_fData.generated_at||null;'+
        'const _fMun=_fData.by_municipio&&(_fData.by_municipio[v]||_fData.by_municipio[E]);'+
        'if(_fMun&&(_fMun.ctls&&_fMun.ctls.length>0||_fMun.cr)){'+
          '_funaiResult={disponivel:!0,ctls:_fMun.ctls||[],cr:_fMun.cr||null,fonte:"funai-coordenacoes.json",atualizado_em:_fAt};'+
        '}else{_funaiResult.atualizado_em=_fAt;}'+
      '}'+
    '}catch(_fe){console.warn("[equipamentos] FUNAI lookup erro:",_fe.message);}'+
    'try{'+
      'let I="https://servicodados.ibge.gov.br/api/v1/pesquisas/10079/periodos/2013/indicadores/"+x+"/resultados/"+v,D=await fetch(I,{signal:AbortSignal.timeout(8e3),headers:{"User-Agent":"ChegoAContaDiretora/1.0"}});'+
      'if(!D.ok)throw new Error("IBGE HTTP "+D.status);'+
      'let B=await D.json(),N={};'+
      'for(let R of B)N[R.id]=R&&R.res&&R.res[0]&&R.res[0].res?R.res[0].res["2013"]??null:null;'+
      'return g.json({ok:!0,co_municipio:E,ibge_fonte:"IBGE MUNIC Assist\\xEAncia Social 2013",suas_counts:{cras:{total:N[72814]??null,label:"CRAS",descricao:"Centro de Refer\\xEAncia da Assist\\xEAncia Social"},creas:{total:N[72837]??null,label:"CREAS",descricao:"Centro de Refer\\xEAncia Especializado de Assist\\xEAncia Social"},centro_pop:{total:N[72839]??null,label:"Centro POP",descricao:"Centro de Refer\\xEAncia para Pop. em Situa\\xE7\\xE3o de Rua"},abrigos:{total:N[72858]??null,label:"Abrigos / Casa Lar",descricao:"Servi\\xE7os de acolhimento institucional"}},saude:T,saude_pronto_socorro_mais_proximo:T.pronto_socorro_mais_proximo||null,ongs:_ongsResult,funai:_funaiResult,links:[{nome:"Mapa SUAS (MDS)",url:"https://mapas.mds.gov.br/mapas/app/painel-suas/"},{nome:"CNES (sa\\xFAde)",url:"https://cnes.datasus.gov.br/"},{nome:"Dados abertos SUAS",url:"https://dados.gov.br/dataset/unidades-de-atendimento-da-assistencia-social"},{nome:"CadSUAS",url:"https://cadsuas.mds.gov.br/"}]});'+
    '}catch(I){'+
      'return g.json({ok:!1,co_municipio:E,error:I.message,suas_counts:{},saude:T,saude_pronto_socorro_mais_proximo:T.pronto_socorro_mais_proximo||null,ongs:_ongsResult,funai:_funaiResult,links:[{nome:"Mapa SUAS (MDS)",url:"https://mapas.mds.gov.br/mapas/app/painel-suas/"},{nome:"CNES (sa\\xFAde)",url:"https://cnes.datasus.gov.br/"}]});'+
    '}'+
  '});';

const _equipStartIdx = source.indexOf(_EQUIP_START);
if (_equipStartIdx !== -1) {
  const _equipEndIdx = source.indexOf(_EQUIP_END, _equipStartIdx);
  if (_equipEndIdx !== -1) {
    source = source.slice(0, _equipStartIdx) + _EQUIP_ROUTE + source.slice(_equipEndIdx + 3);
    console.log('[bootstrap] equipamentos-publicos + bloco saude patch applied');
  } else {
    console.warn('[bootstrap] equipamentos-publicos patch NOT applied — end marker not found');
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

// ── 3c2b. Patch: /sw.js route — Service Worker com header Service-Worker-Allowed ──
// O Service Worker precisa ser servido com o header Service-Worker-Allowed: /
// para que seu scope cubra a raiz do site. O middleware estático não adiciona esse header.
const _SW_ANCHOR = 't.use("/dashboard",(n,i)=>i.redirect(302,"/")),';
const _swPublicDir = JSON.stringify(path.join(distDir, 'public'));
const _SW_ROUTE = `t.get("/sw.js",function(_rq,_rs){` +
  `var _swp=require("path").join(${_swPublicDir},"sw.js");` +
  `_rs.setHeader("Content-Type","application/javascript");` +
  `_rs.setHeader("Service-Worker-Allowed","/");` +
  `_rs.setHeader("Cache-Control","no-store, no-cache, must-revalidate");` +
  `try{_rs.send(require("fs").readFileSync(_swp,"utf8"));}` +
  `catch(_e){_rs.status(500).end("sw not found");}` +
`}),`;
const _swPatched = source.indexOf(_SW_ANCHOR) !== -1
  ? source.replace(_SW_ANCHOR, _SW_ROUTE + _SW_ANCHOR)
  : null;
if (_swPatched) {
  source = _swPatched;
  console.log('[bootstrap] /sw.js route patch applied');
} else {
  console.warn('[bootstrap] /sw.js patch NOT applied — anchor not found');
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

// ── 3c4. Patch: /api/ongs/:coMunicipio endpoint ──────────────────────────────
// Reads ongs-contatos.json when available and municipality matches;
// otherwise queries the CNEAS CKAN API at dados.gov.br in real time.
// Returns up to 15 entities with nome, area, telefone, email, tem_cebas.
const _ONGS_API_ANCHOR = 'e.get("/api/health",(A,g)=>{g.status(200).json({ok:!0,ts:Date.now()})}),';
const _ONGS_API_ROUTE =
  'e.get("/api/ongs/:coMunicipio",async(A,g)=>{'+
    'try{'+
      'const E=A.params.coMunicipio;'+
      'if(!E||!/^\\d{6,7}$/.test(E))return g.status(400).json({ok:!1,error:"C\\xF3digo de munic\\xEDpio inv\\xE1lido"});'+
      'const v=E.length===7?E.slice(0,6):E;'+
      'let _r={disponivel:!1,entidades:[],fonte:"ongs-contatos.json",atualizado_em:null};'+
      'try{'+
        'const _oFs=require("fs"),_oPath=require("path").resolve(process.cwd(),process.env.ONG_CONTATOS_OUTPUT_JSON||"ongs-contatos.json");'+
        'if(_oFs.existsSync(_oPath)){'+
          'const _d=JSON.parse(_oFs.readFileSync(_oPath,"utf8"));'+
          'const _m=String(_d&&_d.filtros&&_d.filtros.codigo_municipio||"").replace(/\\D/g,"");'+
          'const _m6=_m.length===7?_m.slice(0,6):_m;'+
          'if(!_m||_m===E||_m6===v||_m===v){'+
            '_r={disponivel:!0,fonte:"ongs-contatos.json",atualizado_em:_d.generated_at||null,resumo:_d.resumo||null,entidades:Array.isArray(_d.entidades)?_d.entidades.slice(0,15):[],dados_correspondem_municipio:!0};'+
          '}'+
        '}'+
      '}catch(_e){}'+
      'if(!_r.disponivel){'+
        'if(!globalThis._cneasRid){'+
          'try{'+
            'const _pr=await fetch("https://dados.gov.br/api/3/action/package_show?id=cneas--cadastro-nacional-de-entidades-de-assistencia-social",{signal:AbortSignal.timeout(10e3),headers:{"Accept":"application/json","User-Agent":"ChegoAContaDiretora/1.0"}});'+
            'if(_pr.ok){const _pd=await _pr.json();const _res=(_pd&&_pd.result&&_pd.result.resources||[]).find(r=>r.datastore_active===!0)||(_pd&&_pd.result&&_pd.result.resources||[])[0];if(_res)globalThis._cneasRid=_res.id;}'+
          '}catch(_pe){}'+
        '}'+
        'if(globalThis._cneasRid){'+
          'try{'+
            'const _fl=JSON.stringify({CO_MUNICIPIO:v});'+
            'const _cu="https://dados.gov.br/api/3/action/datastore_search?resource_id="+encodeURIComponent(globalThis._cneasRid)+"&filters="+encodeURIComponent(_fl)+"&limit=50";'+
            'const _cr=await fetch(_cu,{signal:AbortSignal.timeout(14e3),headers:{"Accept":"application/json","User-Agent":"ChegoAContaDiretora/1.0"}});'+
            'if(_cr.ok){'+
              'const _cd=await _cr.json();'+
              'const _recs=(_cd&&_cd.result&&_cd.result.records)||[];'+
              'const _nA=a=>{const s=String(a||"").toLowerCase();if(s.includes("assist"))return"Assist\\xEAncia Social";if(s.includes("sa\\xFAde")||s.includes("saude"))return"Sa\\xFAde";if(s.includes("educa"))return"Educa\\xE7\\xE3o";return String(a||"").trim()||null};'+
              'const _ents=_recs.map(r=>({nome:r.NO_ENTIDADE||r.NM_ENTIDADE||r.DS_RAZAO_SOCIAL||null,area:_nA(r.DS_AREA_ATUACAO||r.NO_AREA_ATUACAO||null),telefone:r.NU_TELEFONE||r.DS_TELEFONE||null,email:(String(r.DS_EMAIL||r.NO_EMAIL||"").includes("@"))?String(r.DS_EMAIL||r.NO_EMAIL||"").trim():null,cnpj:String(r.NU_CNPJ||r.CD_CNPJ||"").replace(/\\D/g,"")||null,tem_cebas:!1,possui_contato:!!(r.NU_TELEFONE||r.DS_TELEFONE||(String(r.DS_EMAIL||"").includes("@")&&r.DS_EMAIL))})).filter(e=>e.nome);'+
              '_ents.sort((a,b)=>(b.possui_contato?1:0)-(a.possui_contato?1:0));'+
              '_r={disponivel:!0,fonte:"CNEAS-API",atualizado_em:new Date().toISOString(),resumo:{total_entidades:_ents.length,total_com_contato:_ents.filter(e=>e.possui_contato).length},entidades:_ents.slice(0,15),dados_correspondem_municipio:!0};'+
            '}'+
          '}catch(_ae){console.warn("[ongs-api] CNEAS erro:",_ae.message);}'+
        '}'+
      '}'+
      'return g.json({ok:!0,co_municipio:E,..._r});'+
    '}catch(_ge){console.error("[ongs-api] erro:",_ge.message);return g.status(500).json({ok:!1,error:_ge.message,entidades:[]});}'+
  '}),';
if (source.indexOf(_ONGS_API_ANCHOR) !== -1) {
  source = source.replace(_ONGS_API_ANCHOR, _ONGS_API_ANCHOR + _ONGS_API_ROUTE);
  console.log('[bootstrap] /api/ongs/:coMunicipio endpoint patch applied');
} else {
  console.warn('[bootstrap] /api/ongs patch NOT applied — anchor not found');
}

// ── 3c4b. Patch: expose pg pool in globalThis for injected routes ─────────────
// The server bundle (index.cjs) creates a pg Pool in variable 'vm'.
// Inject globalThis._pgPool = vm so injected routes can query the database.
const _PG_POOL_ANCHOR = 'vm.on("error",t=>{console.error("[pg] pool error:",t.message)});';
const _PG_POOL_INSERT = _PG_POOL_ANCHOR + 'globalThis._pgPool=vm;';
if (source.includes(_PG_POOL_ANCHOR) && !source.includes('globalThis._pgPool=vm')) {
  source = source.replace(_PG_POOL_ANCHOR, _PG_POOL_INSERT);
  console.log('[bootstrap] pg pool exposed in globalThis._pgPool');
} else if (source.includes('globalThis._pgPool=vm')) {
  console.log('[bootstrap] pg pool globalThis already patched');
} else {
  console.warn('[bootstrap] pg pool exposure patch NOT applied — anchor not found');
}

// ── 3c5. Patch: /api/ondh-municipio/:coIbge endpoint ─────────────────────────
// Queries ondh_denuncias table in PostgreSQL and returns aggregated data.
// If the table doesn't exist, returns {ok:false, mensagem:"Dados não disponíveis"}.
const _ONDH_API_ANCHOR = _ONGS_API_ANCHOR;
const _ONDH_API_ROUTE =
  'e.get("/api/ondh-municipio/:coIbge",async(A,g)=>{'+
    'try{'+
      'const E=A.params.coIbge;'+
      'if(!E||!/^\\d{6,7}$/.test(E))return g.status(400).json({ok:!1,mensagem:"C\\xF3digo IBGE inv\\xE1lido"});'+
      'const _db=globalThis._pgPool||null;'+
      'if(!_db)return g.json({ok:!1,mensagem:"Banco de dados n\\xE3o dispon\\xEDvel. Configure DATABASE_URL."});'+
      // Check if table exists
      'const _te=await _db.query("SELECT 1 FROM information_schema.tables WHERE table_name=\'ondh_denuncias\' LIMIT 1").catch(()=>({rows:[]}));'+
      'if(!_te.rows||!_te.rows.length)return g.json({ok:!1,mensagem:"Tabela ondh_denuncias n\\xE3o encontrada. Execute o script de importa\\xE7\\xE3o."});'+
      // Total
      'const _tot=await _db.query("SELECT COALESCE(SUM(quantidade),0)::int AS total FROM ondh_denuncias WHERE co_ibge=$1",[E]).catch(()=>({rows:[{total:0}]}));'+
      'const total=(_tot.rows[0]&&_tot.rows[0].total)||0;'+
      'if(!total)return g.json({ok:!1,mensagem:"Sem dados de direitos humanos para este munic\\xEDpio. Execute o script de importa\\xE7\\xE3o ONDH."});'+
      // Por canal
      'const _pc=await _db.query("SELECT canal, COALESCE(SUM(quantidade),0)::int AS total FROM ondh_denuncias WHERE co_ibge=$1 GROUP BY canal ORDER BY total DESC LIMIT 10",[E]).catch(()=>({rows:[]}));'+
      // Por violação (top 5)
      'const _pv=await _db.query("SELECT COALESCE(tp_violacao,ds_especie_violacao,\'N\\xE3o informado\') AS tipo, COALESCE(SUM(quantidade),0)::int AS total FROM ondh_denuncias WHERE co_ibge=$1 GROUP BY tipo ORDER BY total DESC LIMIT 5",[E]).catch(()=>({rows:[]}));'+
      // Por grupo vulnerável (top 5)
      'const _pg=await _db.query("SELECT COALESCE(grupo_vulneravel,\'N\\xE3o informado\') AS grupo, COALESCE(SUM(quantidade),0)::int AS total FROM ondh_denuncias WHERE co_ibge=$1 GROUP BY grupo ORDER BY total DESC LIMIT 5",[E]).catch(()=>({rows:[]}));'+
      // Evolução semestral
      'const _ps=await _db.query("SELECT COALESCE(semestre,\'?\') AS semestre, COALESCE(SUM(quantidade),0)::int AS total FROM ondh_denuncias WHERE co_ibge=$1 AND semestre IS NOT NULL GROUP BY semestre ORDER BY semestre ASC LIMIT 20",[E]).catch(()=>({rows:[]}));'+
      'return g.json({ok:!0,co_ibge:E,total,por_canal:_pc.rows,por_violacao:_pv.rows,por_grupo_vulneravel:_pg.rows,evolucao_semestral:_ps.rows});'+
    '}catch(_e){console.error("[ondh-api] erro:",_e.message);return g.status(500).json({ok:!1,mensagem:"Erro interno: "+_e.message});}'+
  '}),';

if (source.indexOf(_ONDH_API_ANCHOR) !== -1) {
  source = source.replace(_ONDH_API_ANCHOR, _ONDH_API_ANCHOR + _ONDH_API_ROUTE);
  console.log('[bootstrap] /api/ondh-municipio/:coIbge endpoint patch applied');
} else {
  console.warn('[bootstrap] /api/ondh-municipio patch NOT applied — anchor not found');
}

// ── 3c5b. Patch: /api/contexto-suas/:coMunicipio endpoint ────────────────────
// Fetches mapa-social data and returns {ok, total, contagens} for ctxSuasData UI block.
(function _patchContextoSuas() {
  const _SUAS_ANCHOR = _ONGS_API_ANCHOR;
  const _TIPO_LABELS = {
    CRAS: 'CRAS', CREAS: 'CREAS', CAPS: 'CAPS',
    CONSELHO_TUTELAR: 'Conselho Tutelar',
    CONSELHO_ASSISTENCIA: 'Conselho de Assist. Social',
    ACOLHIMENTO: 'Acolhimento', CONVIVENCIA: 'Convivência',
    CENTRO_POP: 'Centro Pop', CENTRO_DIA: 'Centro-Dia',
    CMDCA: 'CMDCA', REPUBLICA: 'República', REDE_PARCERIA: 'Rede de Parceria'
  };
  const _SUAS_ROUTE =
    'e.get("/api/contexto-suas/:coMunicipio",async(A,g)=>{' +
      'try{' +
        'const co=A.params.coMunicipio;' +
        'if(!co||!/^\\d{6,7}$/.test(co))return g.status(400).json({ok:false,erro:"C\\xF3digo inv\\xE1lido"});' +
        'const _port=process.env.PORT||5000;' +
        // Mapa Social — equipamentos SUAS
        'const _ms=await fetch("http://localhost:"+_port+"/api/mapa-social/"+co,{signal:AbortSignal.timeout(12000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});' +
        'const _LABELS={CRAS:"CRAS",CREAS:"CREAS",CAPS:"CAPS",CONSELHO_TUTELAR:"Conselho Tutelar",CONSELHO_ASSISTENCIA:"Conselho de Assist. Social",ACOLHIMENTO:"Acolhimento",CONVIVENCIA:"Conviv\\xEAncia",CENTRO_POP:"Centro Pop",CENTRO_DIA:"Centro-Dia",CMDCA:"CMDCA",REPUBLICA:"Rep\\xFAblica",REDE_PARCERIA:"Rede de Parceria"};' +
        'const _counts={};' +
        '((_ms&&_ms.equipamentos)||[]).forEach(function(eq){var t=eq.tipo||"OUTRO";_counts[t]=(_counts[t]||0)+1;});' +
        'const contagens=Object.keys(_counts).map(function(t){return{tipo:t,label:_LABELS[t]||t,total:_counts[t]};}).sort(function(a,b){return b.total-a.total;});' +
        // Bolsa Familia
        'let bf=null;' +
        'try{' +
          'const _bfKey=process.env.PORTAL_TRANSPARENCIA_KEY||"";' +
          'if(_bfKey&&co.length===7){' +
            'const _now=new Date();const _months=[];' +
            'for(let _i=1;_i<=6;_i++){const _d=new Date(_now.getFullYear(),_now.getMonth()-_i,1);_months.push(String(_d.getFullYear())+String(_d.getMonth()+1).padStart(2,"0"));}' +
            'const _bfRes=await Promise.all(_months.map(function(_m){return fetch("https://api.portaldatransparencia.gov.br/api-de-dados/novo-bolsa-familia-por-municipio?mesAno="+_m+"&codigoIbge="+co+"&pagina=1",{headers:{"chave-api-dados":_bfKey},signal:AbortSignal.timeout(8000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})}));' +
            'const _bfSerie=_bfRes.map(function(r,i){const rec=Array.isArray(r)&&r[0]?r[0]:null;return rec?{mes:_months[i],familias:rec.quantidadeBeneficiados,valor:rec.valor}:null;}).filter(Boolean).reverse();' +
            'if(_bfSerie.length>0){const _last=_bfSerie[_bfSerie.length-1];bf={familias:_last.familias,valor:_last.valor,media:Math.round(_last.valor/_last.familias),mes:_last.mes,serie:_bfSerie};}' +
          '}' +
        '}catch(_bfe){}' +
        // BPC
        'let bpc=null;' +
        'try{' +
          'const _bpcKey=process.env.PORTAL_TRANSPARENCIA_KEY||"";' +
          'if(_bpcKey&&co.length===7){' +
            'const _now2=new Date();const _months2=[];' +
            'for(let _i=1;_i<=5;_i++){const _d=new Date(_now2.getFullYear(),_now2.getMonth()-_i,1);_months2.push(String(_d.getFullYear())+String(_d.getMonth()+1).padStart(2,"0"));}' +
            'const _bpcRes=await Promise.all(_months2.map(function(_m){return fetch("https://api.portaldatransparencia.gov.br/api-de-dados/bpc-por-municipio?mesAno="+_m+"&codigoIbge="+co+"&pagina=1",{headers:{"chave-api-dados":_bpcKey},signal:AbortSignal.timeout(8000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})}));' +
            'const _bpcSerie=_bpcRes.map(function(r,i){const rec=Array.isArray(r)&&r[0]?r[0]:null;return rec?{mes:_months2[i],beneficiados:rec.quantidadeBeneficiados,valor:rec.valor}:null;}).filter(Boolean).reverse();' +
            'if(_bpcSerie.length>0){const _last=_bpcSerie[_bpcSerie.length-1];bpc={beneficiados:_last.beneficiados,valor:_last.valor,media:Math.round(_last.valor/_last.beneficiados),mes:_last.mes,serie:_bpcSerie};}' +
          '}' +
        '}catch(_bpce){}' +
        // CadSUAS — unidades detalhadas via API pública MDS
        'let cadsuas=null;' +
        'try{' +
          'const _ibge6=co.length===7?co.slice(0,6):co;' +
          'const _crasRes=await fetch("https://aplicacoes.mds.gov.br/sagi/servicos/misocial?q_ibge="+_ibge6+"&tipo_equip=1&output=json",{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(8000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});' +
          'if(Array.isArray(_crasRes)&&_crasRes.length>0){' +
            'cadsuas={unidades:_crasRes.slice(0,10).map(function(u){return{tipo:u.tipo_equip_label||"CRAS",nome:u.nom_unidade||u.nom_municipio||"",endereco:u.dsc_endereco||"",bairro:u.nom_bairro||"",telefone:u.num_telefone||"",email:u.dsc_email||"",horario:u.dsc_horario||"",status:u.dsc_situacao||""};})};' +
          '}' +
        '}catch(_cse){}' +
        'return g.json({ok:true,co_municipio:co,total:(_ms&&_ms.total)||0,contagens:contagens,equipamentos:(_ms&&_ms.equipamentos)||[],bf:bf,bpc:bpc,cadsuas:cadsuas,fonte:(_ms&&_ms.fonte)||"Mapa Social / MDS",atualizado_em:(_ms&&_ms.atualizado_em)||new Date().toISOString()});' +
      '}catch(_e){console.error("[ctx-suas] erro:",_e.message);return g.status(500).json({ok:false,erro:"Erro interno"});}' +
    '}),';

  if (source.indexOf(_SUAS_ANCHOR) !== -1 && !source.includes('/api/contexto-suas/')) {
    source = source.replace(_SUAS_ANCHOR, _SUAS_ANCHOR + _SUAS_ROUTE);
    console.log('[bootstrap] /api/contexto-suas/:coMunicipio endpoint patch applied');
  } else if (source.includes('/api/contexto-suas/')) {
    console.log('[bootstrap] /api/contexto-suas already applied');
  } else {
    console.warn('[bootstrap] /api/contexto-suas patch NOT applied — anchor not found');
  }
})();

// ── 3c6. Patch: /api/escola/:inep/funai endpoint ──────────────────────────────
// Returns FUNAI CTL/CR data for the escola's municipality + escola indigenous flags.
// Conditions for "presença indígena": IN_EDUCACAO_INDIGENA=1, TP_LOCALIZACAO_DIFERENCIADA>0,
// qt_mat_bas_indigena>0, or municipality mapped to a FUNAI CTL/CR.
const _FUNAI_API_ANCHOR = _ONGS_API_ANCHOR;
const _FUNAI_API_ROUTE =
  'e.get("/api/escola/:inep/funai",async(A,g)=>{'+
    'try{'+
      'const _inep=String(A.params.inep||"").replace(/\\D/g,"");'+
      'if(!_inep||_inep.length!==8)return g.status(400).json({ok:!1,mensagem:"INEP inv\\xE1lido"});'+
      'const _db=globalThis._pgPool||null;'+
      // Get escola data from DB
      'let _esc=null;'+
      'if(_db){'+
        'const _q=await _db.query('+
          '"SELECT co_municipio,in_educacao_indigena,tp_localizacao_diferenciada '+
          'FROM censo_escolas WHERE co_entidade=$1 ORDER BY ano DESC LIMIT 1",'+
          '[_inep]'+
        ').catch((e)=>{console.warn("[funai-api] DB query error:",e.message);return{rows:[]};});'+
        '_esc=_q.rows&&_q.rows[0]||null;'+
      '}'+
      // Normalize municipality code
      'const _rawMun=String(_esc&&_esc.co_municipio||"").replace(/\\D/g,"");'+
      'const _munCod=_rawMun.length===7?_rawMun.slice(0,6):_rawMun;'+
      // Load FUNAI CTL/CR from JSON file
      'let _ctls=[],_cr=null,_funaiAt=null;'+
      'try{'+
        'const _fFs=require("fs"),_fPath=require("path").resolve(process.cwd(),process.env.FUNAI_OUTPUT_JSON||"funai-coordenacoes.json");'+
        'if(_fFs.existsSync(_fPath)){'+
          'const _fData=JSON.parse(_fFs.readFileSync(_fPath,"utf8"));'+
          '_funaiAt=_fData.generated_at||null;'+
          'const _fMun=_munCod&&_fData.by_municipio&&(_fData.by_municipio[_munCod]||_fData.by_municipio[_rawMun]);'+
          'if(_fMun){_ctls=_fMun.ctls||[];_cr=_fMun.cr||null;}'+
        '}'+
      '}catch(_fe){console.warn("[funai-api] JSON erro:",_fe.message);}'+
      // Evaluate conditions (qt_mat_bas_indigena from SQLite censo_escola_historico)
      'const _edInd=Number(_esc&&_esc.in_educacao_indigena)||0;'+
      'const _tpLoc=Number(_esc&&_esc.tp_localizacao_diferenciada)||0;'+
      'let _qtInd=0;'+
      'try{'+
        'if(typeof fn==="function"){'+
          'const _sR=fn("SELECT (dados_json->>\'QT_MAT_BAS_INDIGENA\') AS q FROM censo_escola_historico WHERE co_entidade=? ORDER BY ano DESC LIMIT 1",[_inep]);'+
          '_qtInd=Number(Array.isArray(_sR)&&_sR[0]&&_sR[0].q||0)||0;'+
        '}'+
      '}catch(_qe){/* sqlite qt_mat_bas_indigena optional */}'+
      'const _temFunai=_ctls.length>0||!!_cr;'+
      'const _temPresenca=_edInd===1||_tpLoc===2||_qtInd>0||_temFunai;'+
      'return g.json({'+
        'ok:!0,'+
        'inep:_inep,'+
        'municipio:{codigo:_munCod,nome:null,uf:null},'+
        'flags:{in_educacao_indigena:_edInd,tp_localizacao_diferenciada:_tpLoc,qt_mat_bas_indigena:_qtInd},'+
        'tem_presenca_indigena:_temPresenca,'+
        'funai:{disponivel:_temFunai,ctls:_ctls,cr:_cr,atualizado_em:_funaiAt}'+
      '});'+
    '}catch(_e){console.error("[funai-api] erro:",_e.message);return g.status(500).json({ok:!1,mensagem:"Erro interno: "+_e.message});}'+
  '}),';

if (source.indexOf(_FUNAI_API_ANCHOR) !== -1) {
  if (!source.includes('/api/escola/:inep/funai')) {
    source = source.replace(_FUNAI_API_ANCHOR, _FUNAI_API_ANCHOR + _FUNAI_API_ROUTE);
    console.log('[bootstrap] /api/escola/:inep/funai endpoint patch applied');
  } else {
    console.log('[bootstrap] /api/escola/:inep/funai already present — skipping');
  }
} else {
  console.warn('[bootstrap] /api/escola/:inep/funai patch NOT applied — anchor not found');
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

// ── 3f2. Patch: add bloco saúde in Equipamentos Públicos accordion (Dashboard-v30.js) ──
// Injects a health (CNES) section into the accordion, showing pronto socorro +
// top UBS/UPA contacts from Ra.saude (the new API field we added earlier).
//
// ANCHOR: the ", e.jsxs("p"..." that is the footnote in the Fragment children array.
// It starts with the comma separator, placed RIGHT AFTER the CadUnico IIFE invocation.
// The block is inserted BEFORE this anchor and carries its own leading ", " separator.
// This avoids a double })() that occurred in v1 of this patch.
const dashboardV30AssetPath = path.join(distDir, 'public/assets/Dashboard-v30.js');
const _SAUDE_FE_ANCHOR = ', e.jsxs("p", { style: { fontSize: "10px", color: "#6b8a74", marginTop: 10, marginBottom: 6 }, children: [Ke?.ok && Ke.total > 0 &&';
const _SAUDE_FE_BLOCK =
  // starts with ', ' = comma separator after the previous (CadUnico) item
  // ends with ')()' = IIFE close+invoke, no trailing comma (anchor provides it)
  ', Ra.saude&&Ra.saude.disponivel&&(()=>{' +
    'const _S=Ra.saude;' +
    'const _PS=_S.pronto_socorro_mais_proximo;' +
    'const _TC=Array.isArray(_S.top_contatos)?_S.top_contatos:[];' +
    'const _tipoRank={UPA:0,PRONTO_ATENDIMENTO:1,PRONTO_SOCORRO:2,UBS:3};' +
    'const _TCOrdered=[..._TC].sort((a,b)=>((_tipoRank[a.tipo]??99)-(_tipoRank[b.tipo]??99))||String(a.nome||"").localeCompare(String(b.nome||""),"pt-BR"));' +
    'const _tipoCounts=_TCOrdered.reduce((acc,it)=>(acc[it.tipo]=(acc[it.tipo]||0)+1,acc),{});' +
    'const _tipoLabel=(t)=>({UBS:"UBS / Posto de Sa\\xFAde",UPA:"UPA",PRONTO_ATENDIMENTO:"Pronto Atendimento",PRONTO_SOCORRO:"Pronto Socorro"}[t]||t||"Unidade de Sa\\xFAde");' +
    'const _tipoDot=(t)=>({UBS:"#1565c0",UPA:"#c62828",PRONTO_ATENDIMENTO:"#ef6c00",PRONTO_SOCORRO:"#d32f2f"}[t]||"#1565c0");' +
    'const _tipoBg=(t)=>({UBS:"#e3f2fd",UPA:"#fff3e0",PRONTO_ATENDIMENTO:"#fff8e1",PRONTO_SOCORRO:"#ffebee"}[t]||"#e3f2fd");' +
    'const _tipoBorder=(t)=>({UBS:"#90caf9",UPA:"#ffcc80",PRONTO_ATENDIMENTO:"#ffe082",PRONTO_SOCORRO:"#ef9a9a"}[t]||"#90caf9");' +
    'const _tipoTxt=(t)=>({UBS:"#0d47a1",UPA:"#e65100",PRONTO_ATENDIMENTO:"#ad6800",PRONTO_SOCORRO:"#b71c1c"}[t]||"#0d47a1");' +
    'return e.jsxs("div",{style:{marginTop:14},children:[' +
      // section title
      'e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10},children:[' +
        'e.jsx("p",{style:{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#0d47a1",margin:0},children:"Sa\\xFAde \u2014 Unidades Pr\\xF3ximas (CNES)"}),' +
        '_S.resumo&&e.jsxs("span",{style:{fontSize:9,color:"#1565c0",background:"#e3f2fd",borderRadius:20,padding:"2px 8px",fontWeight:600},children:[_S.resumo.total_unidades," unidades"]})' +
      ']}),' +
      // Pronto socorro card (red, prominent)
      '_PS&&e.jsxs("div",{style:{borderRadius:12,border:"2px solid #ef9a9a",background:"#ffebee",padding:"12px 14px",marginBottom:10,borderLeft:"4px solid #d32f2f"},children:[' +
        'e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6},children:[' +
          'e.jsxs("p",{style:{fontWeight:700,fontSize:12,color:"#b71c1c",margin:0,lineHeight:1.3},children:[' +
            'e.jsx("span",{style:{fontSize:9,fontWeight:800,color:"#d32f2f",background:"#ffcdd2",borderRadius:8,padding:"1px 6px",marginRight:6,verticalAlign:"middle"},' +
            'children:"PRONTO SOCORRO"}),' +
            '_PS.nome' +
          ']}),' +
          '_PS.latitude&&_PS.longitude&&e.jsxs("a",{href:"https://www.google.com/maps?q="+_PS.latitude+","+_PS.longitude,' +
            'target:"_blank",rel:"noopener noreferrer",' +
            'style:{fontSize:10,color:"#1a73e8",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap",flexShrink:0,display:"flex",alignItems:"center",gap:2},' +
            'children:[' +
              'e.jsx("svg",{width:"10",height:"10",viewBox:"0 0 24 24",fill:"#1a73e8",children:e.jsx("path",{d:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"})}),' +
              '"Maps"' +
            ']})' +
        ']}),' +
        '_PS.bairro&&e.jsxs("p",{style:{fontSize:11,color:"#c62828",margin:"0 0 3px"},children:[_PS.endereco||"",_PS.endereco&&_PS.numero?" n\\xBA "+_PS.numero:"",_PS.bairro?" \\u2014 "+_PS.bairro:""]}),' +
        '_PS.telefone&&e.jsxs("p",{style:{fontSize:11,color:"#b71c1c",margin:"0 0 3px",display:"flex",alignItems:"center",gap:4},children:[' +
          'e.jsx("svg",{width:11,height:11,viewBox:"0 0 24 24",fill:"none",stroke:"#b71c1c",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58A16 16 0 0 0 14 15.65l.95-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"})}),' +
          'e.jsx("a",{href:"tel:"+_PS.telefone.replace(/\\D/g,""),style:{color:"#b71c1c",textDecoration:"none",fontWeight:600},children:_PS.telefone})' +
        ']}),' +
        '_PS.email&&e.jsxs("p",{style:{fontSize:11,color:"#b71c1c",margin:"0 0 3px",display:"flex",alignItems:"center",gap:4},children:[' +
          '"\\u2709\\uFE0F ",' +
          'e.jsx("a",{href:"mailto:"+_PS.email,style:{color:"#b71c1c",textDecoration:"none",fontWeight:600},children:_PS.email})' +
        ']}),' +
        '_PS.distancia_km!=null&&e.jsxs("p",{style:{fontSize:10,color:"#c62828",margin:"3px 0 0",fontStyle:"italic"},children:["\\uD83D\\uDCCD "+_PS.distancia_km.toFixed(2)+" km da escola"]})' +
      ']}),' +
      // top contacts grid (UBS + UPA)
      '_TC.length>0&&e.jsxs("div",{style:{marginTop:4},children:[' +
        'e.jsx("p",{style:{fontSize:10,fontWeight:700,color:"#0d47a1",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6},children:"Unidades pr\\xF3ximas por tipo"}),' +
        'e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:8},children:' +
          '_TCOrdered.map(function(_c,_i){' +
            'const _showTypeHeader=_i===0||_TCOrdered[_i-1].tipo!==_c.tipo;' +
            'const _dot=_tipoDot(_c.tipo);const _bg=_tipoBg(_c.tipo);const _bd=_tipoBorder(_c.tipo);const _txt=_tipoTxt(_c.tipo);' +
            'const _mapsUrl=_c.latitude&&_c.longitude?"https://www.google.com/maps?q="+_c.latitude+","+_c.longitude:null;' +
            'return e.jsxs(e.Fragment,{children:[' +
              '_showTypeHeader&&e.jsxs("p",{style:{gridColumn:"1 / -1",fontSize:10,fontWeight:700,color:_txt,textTransform:"uppercase",letterSpacing:"0.05em",margin:"4px 0 0"},children:[_tipoLabel(_c.tipo)," (",_tipoCounts[_c.tipo]||0,")"]}),' +
              'e.jsxs("div",{style:{background:"#fff",border:"1.5px solid "+_bd,borderRadius:12,padding:"10px 12px",borderLeft:"4px solid "+_dot},children:[' +
              'e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:4},children:[' +
                'e.jsxs("p",{style:{fontWeight:700,fontSize:11,color:_txt,margin:0,lineHeight:1.3},children:[' +
                  'e.jsx("span",{style:{fontSize:8,fontWeight:800,color:_dot,background:_bg,borderRadius:6,padding:"1px 5px",marginRight:4,verticalAlign:"middle"},children:_tipoLabel(_c.tipo)}),' +
                  '_c.nome' +
                ']}),' +
                '_mapsUrl&&e.jsxs("a",{href:_mapsUrl,target:"_blank",rel:"noopener noreferrer",style:{fontSize:9,color:"#1a73e8",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap",flexShrink:0,display:"flex",alignItems:"center",gap:2},children:[' +
                  'e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 24 24",fill:"#1a73e8",children:e.jsx("path",{d:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"})}),' +
                  '"Maps"' +
                ']})' +
              ']}),' +
              '(_c.bairro||_c.endereco)&&e.jsx("p",{style:{fontSize:10,color:"#555",margin:"0 0 2px"},children:[_c.endereco,_c.endereco&&_c.bairro?" \\u2014 ":null,_c.bairro].filter(Boolean).join("")}),' +
              '_c.telefone?e.jsxs("p",{style:{fontSize:10,color:"#555",margin:"0 0 2px",display:"flex",alignItems:"center",gap:3},children:[' +
                '"\\uD83D\\uDCDE ",' +
                'e.jsx("a",{href:"tel:"+_c.telefone.replace(/\\D/g,""),style:{color:_txt,textDecoration:"none",fontWeight:600},children:_c.telefone})' +
              ']}):e.jsx("p",{style:{fontSize:9,color:"#aaa",margin:"0 0 2px",fontStyle:"italic"},children:"Telefone n\\xE3o cadastrado"}),' +
              '_c.distancia_km!=null&&e.jsx("p",{style:{fontSize:9,color:"#888",margin:"2px 0 0",fontStyle:"italic"},children:"\\uD83D\\uDCCD "+_c.distancia_km.toFixed(2)+" km"})' +
            ']})' +
            ']},_i);' +
          '})' +
        '})' +
      ']}),' +
      // footer note for saude
      'e.jsxs("p",{style:{fontSize:10,color:"#1565c0",margin:"8px 0 0",lineHeight:1.4},children:["Fonte: CNES / Minist\\xE9rio da Sa\\xFAde. ",_S.atualizado_em&&e.jsxs("span",{children:["Atualizado em ",new Date(_S.atualizado_em).toLocaleDateString("pt-BR"),"."]})," Dados p\\xF3dem estar desatualizados."]})' +
    ']});' +
  '})()';
if (fs.existsSync(dashboardV30AssetPath)) {
  let dashV30Source = fs.readFileSync(dashboardV30AssetPath, 'utf8');
  let dashV30Changed = false;
  // Undo v1 bad injection (started with `})()` prefix — caused double closure)
  const _SAUDE_FE_BAD_MARKER = '})(), Ra.saude&&Ra.saude.disponivel&&';
  if (dashV30Source.includes(_SAUDE_FE_BAD_MARKER)) {
    const _badStart = dashV30Source.indexOf(_SAUDE_FE_BAD_MARKER);
    const _badEnd = dashV30Source.indexOf('\n, ', _badStart);
    if (_badEnd !== -1) {
      dashV30Source = dashV30Source.slice(0, _badStart) + dashV30Source.slice(_badEnd + 3);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 bad saude v1 patch undone');
    }
  }
  // Apply correct injection
  if (!dashV30Source.includes(', Ra.saude&&Ra.saude.disponivel&&')) {
    const _anchorIdx = dashV30Source.indexOf(_SAUDE_FE_ANCHOR);
    if (_anchorIdx !== -1) {
      dashV30Source = dashV30Source.slice(0, _anchorIdx) + _SAUDE_FE_BLOCK + dashV30Source.slice(_anchorIdx);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 saude block patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 saude block patch NOT applied — anchor not found');
    }
  } else {
    console.log('[bootstrap] Dashboard-v30 saude block patch already applied');
  }

  // ── ONGs block: injected after saúde, before footnote paragraph ──────────
  const _ONGS_FE_BLOCK =
    ', Ra.ongs&&Ra.ongs.disponivel&&Ra.ongs.entidades&&Ra.ongs.entidades.length>0&&(()=>{' +
      'const _O=Ra.ongs;' +
      'const _oEnts=Array.isArray(_O.entidades)?_O.entidades:[];' +
      'const _oAreaStyle=area=>{' +
        'const s=String(area||"").toLowerCase();' +
        'if(s.includes("assist"))return{bg:"#e8f5e9",border:"#a5d6a7",txt:"#2e7d32",dot:"#2e7d32"};' +
        'if(s.includes("sa\\xFAde")||s.includes("saude"))return{bg:"#e3f2fd",border:"#90caf9",txt:"#1565c0",dot:"#1565c0"};' +
        'if(s.includes("educa"))return{bg:"#fff3e0",border:"#ffcc80",txt:"#e65100",dot:"#f57c00"};' +
        'return{bg:"#f5f5f5",border:"#bdbdbd",txt:"#616161",dot:"#9e9e9e"};' +
      '};' +
      'return e.jsxs("div",{style:{marginTop:14},children:[' +
        'e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10},children:[' +
          'e.jsx("p",{style:{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#2e7d32",margin:0},children:"ONGs e Entidades de Assist\\xEAncia Social (CNEAS)"}),' +
          'e.jsxs("span",{style:{fontSize:9,color:"#2e7d32",background:"#e8f5e9",borderRadius:20,padding:"2px 8px",fontWeight:600},children:[_oEnts.length," entidades"]})' +
        ']}),' +
        'e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:8},children:' +
          '_oEnts.slice(0,15).map(function(_ong,_oi){' +
            'const _ac=_oAreaStyle(_ong.area);' +
            'return e.jsxs("div",{style:{background:"#fff",border:"1.5px solid "+_ac.border,borderRadius:12,padding:"10px 12px",borderLeft:"4px solid "+_ac.dot},children:[' +
              'e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:4},children:[' +
                'e.jsxs("p",{style:{fontWeight:700,fontSize:11,color:_ac.txt,margin:0,lineHeight:1.3},children:[' +
                  '_ong.area&&e.jsx("span",{style:{fontSize:8,fontWeight:800,color:_ac.dot,background:_ac.bg,borderRadius:6,padding:"1px 5px",marginRight:4,verticalAlign:"middle"},children:_ong.area}),' +
                  '_ong.nome' +
                ']}),' +
                '_ong.tem_cebas&&e.jsx("span",{style:{fontSize:8,fontWeight:800,color:"#6a1b9a",background:"#f3e5f5",borderRadius:8,padding:"1px 6px",whiteSpace:"nowrap",flexShrink:0},children:"CEBAS"})' +
              ']}),' +
              '_ong.telefone?e.jsxs("p",{style:{fontSize:10,color:"#555",margin:"0 0 2px",display:"flex",alignItems:"center",gap:3},children:[' +
                '"\\uD83D\\uDCDE ",' +
                'e.jsx("a",{href:"tel:"+_ong.telefone.replace(/\\D/g,""),style:{color:_ac.txt,textDecoration:"none",fontWeight:600},children:_ong.telefone})' +
              ']}):null,' +
              '_ong.email?e.jsxs("p",{style:{fontSize:10,color:"#555",margin:"0 0 2px",display:"flex",alignItems:"center",gap:3},children:[' +
                '"\\u2709\\uFE0F ",' +
                'e.jsx("a",{href:"mailto:"+_ong.email,style:{color:_ac.txt,textDecoration:"none"},children:_ong.email})' +
              ']}):null,' +
              '!_ong.telefone&&!_ong.email&&e.jsx("p",{style:{fontSize:9,color:"#aaa",margin:"0 0 2px",fontStyle:"italic"},children:"Contato n\\xE3o cadastrado"})' +
            ']},_oi);' +
          '})' +
        '}),' +
        'e.jsxs("p",{style:{fontSize:10,color:"#2e7d32",margin:"8px 0 0",lineHeight:1.4},children:["Fonte: CNEAS / MDS. ",_O.atualizado_em&&e.jsxs("span",{children:["Atualizado em ",new Date(_O.atualizado_em).toLocaleDateString("pt-BR"),"."]})," Dados p\\xF3dem estar desatualizados."]})' +
      ']});' +
    '})()'
  ;
  if (!dashV30Source.includes(', Ra.ongs&&Ra.ongs.disponivel&&')) {
    const _ongsAnchorIdx = dashV30Source.indexOf(_SAUDE_FE_ANCHOR);
    if (_ongsAnchorIdx !== -1) {
      dashV30Source = dashV30Source.slice(0, _ongsAnchorIdx) + _ONGS_FE_BLOCK + dashV30Source.slice(_ongsAnchorIdx);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 ONGs block patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 ONGs block patch NOT applied — anchor not found');
    }
  } else {
    console.log('[bootstrap] Dashboard-v30 ONGs block patch already applied');
  }

  // ── FUNAI block: Presença Indígena — injected before footnote, after ONGs ──
  // Condition: municipality has CTL/CR (Ra.funai.disponivel) OR school has indigenous
  // flags (G.in_educacao_indigena, G.tp_localizacao_diferenciada) OR indigenous
  // enrollments (V.matriculas.por_raca.indigena > 0).
  const _FUNAI_FE_BLOCK =
    ', (Ra&&Ra.funai&&Ra.funai.disponivel||(typeof G!=="undefined"&&G&&(Number(G.in_educacao_indigena||0)===1||Number(G.tp_localizacao_diferenciada||0)===2))||(V&&V.matriculas&&V.matriculas.por_raca&&(V.matriculas.por_raca.indigena||0)>0))&&(()=>{' +
      'const _F=Ra&&Ra.funai||{disponivel:!1,ctls:[],cr:null};' +
      'const _ctls=Array.isArray(_F.ctls)?_F.ctls:[];' +
      'const _cr=_F.cr||null;' +
      'const _qtInd=(V&&V.matriculas&&V.matriculas.por_raca&&V.matriculas.por_raca.indigena)||0;' +
      'const _edInd=typeof G!=="undefined"&&G?Number(G.in_educacao_indigena||0):0;' +
      'const _tpLoc=typeof G!=="undefined"&&G?Number(G.tp_localizacao_diferenciada||0):0;' +
      'return e.jsxs("div",{style:{marginTop:14},children:[' +
        // section header
        'e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10},children:[' +
          'e.jsx("p",{style:{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#7b3f00",margin:0},' +
          'children:"Presen\\xE7a Ind\\xEDgena \\u2014 FUNAI"}),' +
          'e.jsx("span",{style:{fontSize:9,color:"#7b3f00",background:"#fef3e2",borderRadius:20,padding:"2px 8px",fontWeight:600},' +
          'children:"Censo Escolar / FUNAI"})' +
        ']}),' +
        // indigenous context badges (always show when block is visible)
        'e.jsxs("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10},children:[' +
          '_edInd===1&&e.jsx("span",{style:{fontSize:10,fontWeight:700,color:"#7b3f00",background:"#fef3e2",border:"1px solid #f4c06c",borderRadius:20,padding:"3px 10px"},children:"Escola Ind\\xEDgena (Censo)"}),' +
          '_tpLoc===2&&e.jsx("span",{style:{fontSize:10,fontWeight:700,color:"#5d4037",background:"#efebe9",border:"1px solid #bcaaa4",borderRadius:20,padding:"3px 10px"},children:"Terra Ind\\xEDgena (Localiza\\xE7\\xE3o)"}),' +
          '_qtInd>0&&e.jsxs("span",{style:{fontSize:10,fontWeight:700,color:"#4e342e",background:"#efebe9",border:"1px solid #bcaaa4",borderRadius:20,padding:"3px 10px"},children:[_qtInd.toLocaleString("pt-BR")," mat. ind\\xEDgenas"]})' +
        ']}),' +
        // CTLs section
        '_ctls.length>0&&e.jsxs("div",{style:{marginBottom:10},children:[' +
          'e.jsx("p",{style:{fontSize:10,fontWeight:700,color:"#7b3f00",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6},children:"Coordena\\xE7\\xF5es T\\xE9cnicas Locais (CTL)"}),' +
          'e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",gap:8},children:' +
            '_ctls.slice(0,5).map(function(_ctl,_ci){' +
              'return e.jsxs("div",{style:{background:"#fff",border:"1.5px solid #f4c06c",borderRadius:12,padding:"10px 12px",borderLeft:"4px solid #e65100"},children:[' +
                'e.jsx("p",{style:{fontWeight:700,fontSize:11,color:"#bf360c",margin:"0 0 4px",lineHeight:1.3},children:[' +
                  'e.jsx("span",{style:{fontSize:8,fontWeight:800,color:"#e65100",background:"#fbe9e7",borderRadius:6,padding:"1px 5px",marginRight:4,verticalAlign:"middle"},children:"CTL"}),' +
                  '_ctl.nome||"CTL"' +
                '].filter(Boolean)}),' +
                '(_ctl.municipio_nome||_ctl.uf)&&e.jsxs("p",{style:{fontSize:10,color:"#5d4037",margin:"0 0 2px"},children:[' +
                  '"\\uD83D\\uDCCD ",_ctl.municipio_nome||"",_ctl.municipio_nome&&_ctl.uf?" \u2014 ":"",_ctl.uf||""' +
                ']}),' +
                '_ctl.endereco&&e.jsx("p",{style:{fontSize:10,color:"#6d4c41",margin:"0 0 2px"},children:"\\uD83C\\uDFE2 "+_ctl.endereco}),' +
                '_ctl.municipios_atendidos&&e.jsx("p",{style:{fontSize:9,color:"#8d6e63",margin:"2px 0 0",fontStyle:"italic",lineHeight:1.3},children:"Atende: "+_ctl.municipios_atendidos.slice(0,120)+((_ctl.municipios_atendidos.length||0)>120?"...":"")})' +
              ']},_ci);' +
            '})' +
          '})' +
        ']}),' +
        // CR section
        '_cr&&e.jsxs("div",{style:{marginBottom:10},children:[' +
          'e.jsx("p",{style:{fontSize:10,fontWeight:700,color:"#7b3f00",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6},children:"Coordena\\xE7\\xE3o Regional (CR)"}),' +
          'e.jsxs("div",{style:{background:"#fff",border:"1.5px solid #bcaaa4",borderRadius:12,padding:"12px 14px",borderLeft:"4px solid #7b3f00"},children:[' +
            'e.jsx("p",{style:{fontWeight:700,fontSize:12,color:"#4e342e",margin:"0 0 4px"},children:[' +
              'e.jsx("span",{style:{fontSize:9,fontWeight:800,color:"#7b3f00",background:"#efebe9",borderRadius:6,padding:"1px 6px",marginRight:5,verticalAlign:"middle"},children:"CR"}),' +
              '_cr.nome' +
            '].filter(Boolean)}),' +
            '(_cr.municipio_sede||_cr.uf)&&e.jsxs("p",{style:{fontSize:11,color:"#5d4037",margin:"0 0 3px"},children:["\\uD83D\\uDCCD Sede: ",_cr.municipio_sede||"",_cr.municipio_sede&&_cr.uf?" \u2014 ":"",_cr.uf||""]}),' +
            '_cr.abrangencia&&e.jsx("p",{style:{fontSize:10,color:"#6d4c41",margin:"0 0 2px",lineHeight:1.4},children:"Abrang\\xEAncia: "+_cr.abrangencia.slice(0,200)+((_cr.abrangencia.length||0)>200?"...":"")})' +
          ']})' +
        ']}),' +
        // no CTL/CR but school flags show
        '!_ctls.length&&!_cr&&(_edInd===1||_tpLoc===2||_qtInd>0)&&e.jsx("p",{style:{fontSize:10,color:"#8d6e63",fontStyle:"italic",margin:"0 0 6px",lineHeight:1.4},' +
        'children:"Coordena\\xE7\\xE3o T\\xE9cnica Local (CTL) e/ou Coordena\\xE7\\xE3o Regional (CR) da FUNAI n\\xE3o mapeadas para este munic\\xEDpio na base atual. Execute o script sync-funai.mjs para atualizar os dados."}),' +
        // footer
        'e.jsxs("p",{style:{fontSize:10,color:"#8d6e63",margin:"6px 0 0",lineHeight:1.4},children:[' +
          '"Fonte: Censo Escolar INEP",_F.disponivel&&_F.atualizado_em&&e.jsxs("span",{children:[" / FUNAI (atualizado em ",new Date(_F.atualizado_em).toLocaleDateString("pt-BR"),")"]}),".",' +
          'e.jsx("a",{href:"https://www.gov.br/funai/pt-br/atuacao/presenca-indigena",target:"_blank",rel:"noopener noreferrer",style:{color:"#7b3f00",marginLeft:4,textDecoration:"underline"},children:"Saiba mais sobre a FUNAI \\u2197"})' +
        ']})' +
      ']});' +
    '})()'
  ;
  const _funaiBlockPresent = dashV30Source.includes(', (Ra&&Ra.funai&&Ra.funai.disponivel') && dashV30Source.includes('tp_localizacao_diferenciada||0)===2');
  if (!_funaiBlockPresent) {
    // Remove old ===1 block if present before re-injecting with ===2
    if (dashV30Source.includes(', (Ra&&Ra.funai&&Ra.funai.disponivel')) {
      dashV30Source = dashV30Source.replace(/, \(Ra&&Ra\.funai&&Ra\.funai\.disponivel[^)]+\)\(\)\)/s, '');
    }
    const _funaiAnchorIdx = dashV30Source.indexOf(_SAUDE_FE_ANCHOR);
    if (_funaiAnchorIdx !== -1) {
      dashV30Source = dashV30Source.slice(0, _funaiAnchorIdx) + _FUNAI_FE_BLOCK + dashV30Source.slice(_funaiAnchorIdx);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 FUNAI block patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 FUNAI block patch NOT applied — anchor not found');
    }
  } else {
    console.log('[bootstrap] Dashboard-v30 FUNAI block patch already applied');
  }

  // ── Gov.br Services tab: new "Serviços gov.br" tab in Suporte Institucional ──
  const _GOVSERV_IDCHECK = 'servicos-gov';
  if (!dashV30Source.includes(_GOVSERV_IDCHECK)) {
    // 1. Add tab button to the tabs array
    const _GOVSERV_TAB_OLD = '{ id: "sistemas", label: "Sistemas" }].map';
    const _GOVSERV_TAB_NEW = '{ id: "sistemas", label: "Sistemas" }, { id: "servicos-gov", label: "Servi\\xE7os gov.br" }].map';
    if (dashV30Source.includes(_GOVSERV_TAB_OLD)) {
      dashV30Source = dashV30Source.replace(_GOVSERV_TAB_OLD, _GOVSERV_TAB_NEW);
      console.log('[bootstrap] Dashboard-v30 gov.br services tab button patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 gov.br services tab button anchor NOT found');
    }

    // 2. Inject tab content before the closing ] of the tab panel children array
    // Anchor: unique string at the very end of the "sistemas" tab content
    const _GOVSERV_ANCHOR = ', B2)) })] });';
    const _govServData =
      '[{id:9340,nome:"Solicitar aumento da velocidade da conex\\xE3o do PBLE",' +
      'desc:"Garante \\xE0 unidade educacional o direito ao aumento da velocidade de internet escolar (PBLE/ProInfo).",' +
      'url:"https://www.gov.br/pt-br/servicos/solicitar-aumento-da-velocidade-da-conexao-do-pble",programa:"PBLE"},' +
      '{id:9925,nome:"Solicitar a\\xE7\\xF5es de infraestrutura educacional (PAR)",' +
      'desc:"O Plano de A\\xE7\\xF5es Articuladas (PAR) viabiliza obras, mobili\\xE1rio e equipamentos para a rede p\\xFAblica de ensino.",' +
      'url:"https://www.gov.br/pt-br/servicos/solicitar-acoes-de-infraestrutura-educacional-obras-mobiliario-e-equipamentos",programa:"PAR"},' +
      '{id:9930,nome:"Solicitar ades\\xE3o \\xE0s atas de Registro de Pre\\xE7os Nacional (RPN)",' +
      'desc:"Permite ao gestor utilizar atas de compras do FNDE, reduzindo custos e burocracia nas aquisi\\xE7\\xF5es escolares.",' +
      'url:"https://www.gov.br/pt-br/servicos/solicitar-utilizacao-adesao-as-atas-de-registro-de-precos-nacional-rpn",programa:"Compras"},' +
      '{id:10025,nome:"Solicitar livros do PNLD pela Reserva T\\xE9cnica",' +
      'desc:"Escolas benefici\\xE1rias do PNLD podem solicitar livros dispon\\xEDveis na Reserva T\\xE9cnica do FNDE.",' +
      'url:"https://www.gov.br/pt-br/servicos/solicitar-livros-da-reserva-tecnica",programa:"PNLD"},' +
      '{id:12620,nome:"Solicitar Ades\\xE3o \\xE0 Conta Cart\\xE3o PNAE",' +
      'desc:"Aderir \\xE0 Conta Cart\\xE3o PNAE \\u2014 maior transpar\\xEAncia e controle na movimenta\\xE7\\xE3o dos recursos de alimenta\\xE7\\xE3o escolar.",' +
      'url:"https://www.gov.br/pt-br/servicos/solicitar-adesao-a-conta-cartao-pnae",programa:"PNAE"},' +
      '{id:12780,nome:"Realizar assinatura eletr\\xF4nica de documentos no FNDE",' +
      'desc:"Cadastro para assinar eletronicamente documentos em processos administrativos do FNDE (pessoa f\\xEDsica).",' +
      'url:"https://www.gov.br/pt-br/servicos/realizar-assinatura-eletronica-de-documentos",programa:"FNDE Digital"},' +
      '{id:12920,nome:"Solicitar Pagamento Retroativo de Parcela Retida do PNAE",' +
      'desc:"Ap\\xF3s regulariza\\xE7\\xE3o da inadimpl\\xEAncia com o PNAE, solicitar libera\\xE7\\xE3o de parcelas retidas junto ao FNDE.",' +
      'url:"https://www.gov.br/pt-br/servicos/solicitar-pagamento-retroativo-de-parcela-retida-do-pnae",programa:"PNAE"},' +
      '{id:9328,nome:"Alterar domic\\xEDlio banc\\xE1rio no cadastro do PNAE",' +
      'desc:"Indicar ag\\xEAncia banc\\xE1ria para recebimento do repasse dos recursos do PNAE. O FNDE abre a conta corrente na Caixa Econ\\xF4mica Federal.",' +
      'url:"https://www.gov.br/pt-br/servicos/alterar-domicilio-bancario-no-cadastro-do-pnae",programa:"PNAE"},' +
      '{id:9339,nome:"Solicitar Revers\\xE3o de Dedu\\xE7\\xE3o \\u2014 Saldo Excedente PNAE",' +
      'desc:"Evitar ou reverter a dedu\\xE7\\xE3o do saldo acima de 15% do total de recursos do PNAE em 31 de dezembro, apresentando justificativa.",' +
      'url:"https://www.gov.br/pt-br/servicos/solicitar-analise-de-justificativa-do-saldo-excedente-de-30-na-conta-especifica-do-pnae",programa:"PNAE"},' +
      '{id:10027,nome:"Escolher livros e materiais do PNLD",' +
      'desc:"Sistema para que as escolas participantes do PNLD registrem as obras que ir\\xE3o receber nos pr\\xF3ximos anos. Acesso via senha do(a) gestor(a).",' +
      'url:"https://www.gov.br/pt-br/servicos/escolher-materiais-do-PNLD",programa:"PNLD"},' +
      '{id:10119,nome:"Obter apoio financeiro para internet banda larga na escola",' +
      'desc:"O Programa Educa\\xE7\\xE3o Conectada (PIEC/MEC) apoia a universaliza\\xE7\\xE3o do acesso \\xE0 internet de alta velocidade nas escolas p\\xFAblicas.",' +
      'url:"https://www.gov.br/pt-br/servicos/obter-apoio-financeiro-para-instalacao-de-internet-banda-larga-na-escola-publica",programa:"PIEC"}]';

    const _govServContent =
      'aa==="servicos-gov"&&(()=>{' +
      'const _gsd=' + _govServData + ';' +
      'const _gpc={' +
        '"PNLD":{bg:"#dbeafe",bd:"#93c5fd",txt:"#1d4ed8"},' +
        '"PNAE":{bg:"#fef3c7",bd:"#fcd34d",txt:"#92400e"},' +
        '"PAR":{bg:"#d1fae5",bd:"#6ee7b7",txt:"#065f46"},' +
        '"PBLE":{bg:"#ccfbf1",bd:"#5eead4",txt:"#0f766e"},' +
        '"FNDE Digital":{bg:"#f3e8ff",bd:"#c084fc",txt:"#6b21a8"},' +
        '"Compras":{bg:"#fce7f3",bd:"#f9a8d4",txt:"#9d174d"},' +
        '"PIEC":{bg:"#e0f2fe",bd:"#7dd3fc",txt:"#0369a1"}' +
      '};' +
      'return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:10},children:[' +
        'e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4},children:[' +
          'e.jsx("p",{style:{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.07em",color:"#1f6b45",margin:0},' +
          'children:"Servi\\xE7os FNDE \\u2014 Portal gov.br"}),' +
          'e.jsx("a",{href:"https://www.servicos.gov.br/servicos?q=fnde",target:"_blank",rel:"noopener noreferrer",' +
          'style:{fontSize:10,color:"#1f6b45",background:"#e8f5ee",borderRadius:20,padding:"3px 10px",fontWeight:600,textDecoration:"none"},' +
          'children:"Ver todos \\u2197"})' +
        ']}),' +
        'e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:10},' +
        'children:_gsd.map(function(_sv,_si){' +
          'const _c=_gpc[_sv.programa]||{bg:"#e8f5ee",bd:"#b8dfc8",txt:"#1f6b45"};' +
          'return e.jsxs("div",{style:{background:"#fff",border:"1.5px solid "+_c.bd,borderRadius:12,padding:"12px 14px",borderLeft:"4px solid "+_c.bd,display:"flex",flexDirection:"column",gap:7},children:[' +
            'e.jsxs("div",{style:{display:"flex",gap:5,alignItems:"center"},children:[' +
              'e.jsx("span",{style:{fontSize:9,fontWeight:800,color:_c.txt,background:_c.bg,borderRadius:6,padding:"2px 7px"},children:_sv.programa}),' +
              'e.jsx("span",{style:{fontSize:9,color:"#6b7785",background:"#f1f5f9",borderRadius:6,padding:"2px 6px"},children:"FNDE"})' +
            ']}),' +
            'e.jsx("p",{style:{fontSize:12,fontWeight:700,color:"#1a2e2a",margin:0,lineHeight:1.35},children:_sv.nome}),' +
            'e.jsx("p",{style:{fontSize:11,color:"#6b7785",margin:0,lineHeight:1.4,flexGrow:1},children:_sv.desc}),' +
            'e.jsx("a",{href:_sv.url,target:"_blank",rel:"noopener noreferrer",' +
            'style:{fontSize:11,fontWeight:700,color:_c.txt,background:_c.bg,borderRadius:20,padding:"5px 12px",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4,width:"fit-content"},' +
            'children:"Acessar servi\\xE7o \\u2197"})' +
          ']},_si);' +
        '})}),' +
        'e.jsx("p",{style:{fontSize:10,color:"#6b7785",margin:0,lineHeight:1.4},' +
        'children:"Fonte: API de Servi\\xE7os \\u2014 gov.br/conecta. Servi\\xE7os p\\xFAblicos gratuitos prestados pelo FNDE."})' +
      ']});' +
      '})()';

    const _GOVSERV_NEW = ', B2)) }), ' + _govServContent + '] });';
    if (dashV30Source.includes(_GOVSERV_ANCHOR)) {
      dashV30Source = dashV30Source.replace(_GOVSERV_ANCHOR, _GOVSERV_NEW);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 gov.br services tab content patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 gov.br services tab content anchor NOT found');
    }
  } else {
    console.log('[bootstrap] Dashboard-v30 gov.br services tab already applied');
  }

  // ── Extension: add 4 more FNDE/MEC services to the existing govserv tab ──
  // Runs even if the base patch is already applied (adds services 9328/9339/10027/10119)
  const _GOVSERV_EXT_MARKER = 'id:9328,';
  if (dashV30Source.includes('servicos-gov') && !dashV30Source.includes(_GOVSERV_EXT_MARKER)) {
    const _EXT_GSD_ANCHOR = 'solicitar-pagamento-retroativo-de-parcela-retida-do-pnae",programa:"PNAE"}]';
    const _EXT_GSD_NEW =
      'solicitar-pagamento-retroativo-de-parcela-retida-do-pnae",programa:"PNAE"},' +
      '{id:9328,nome:"Alterar domic\\xEDlio banc\\xE1rio no cadastro do PNAE",' +
      'desc:"Indicar ag\\xEAncia banc\\xE1ria para recebimento do repasse dos recursos do PNAE. O FNDE abre a conta corrente na Caixa Econ\\xF4mica Federal.",' +
      'url:"https://www.gov.br/pt-br/servicos/alterar-domicilio-bancario-no-cadastro-do-pnae",programa:"PNAE"},' +
      '{id:9339,nome:"Solicitar Revers\\xE3o de Dedu\\xE7\\xE3o \\u2014 Saldo Excedente PNAE",' +
      'desc:"Evitar ou reverter a dedu\\xE7\\xE3o do saldo acima de 15% do total de recursos do PNAE em 31 de dezembro, apresentando justificativa.",' +
      'url:"https://www.gov.br/pt-br/servicos/solicitar-analise-de-justificativa-do-saldo-excedente-de-30-na-conta-especifica-do-pnae",programa:"PNAE"},' +
      '{id:10027,nome:"Escolher livros e materiais do PNLD",' +
      'desc:"Sistema para que as escolas participantes do PNLD registrem as obras que ir\\xE3o receber nos pr\\xF3ximos anos. Acesso via senha do(a) gestor(a).",' +
      'url:"https://www.gov.br/pt-br/servicos/escolher-materiais-do-PNLD",programa:"PNLD"},' +
      '{id:10119,nome:"Obter apoio financeiro para internet banda larga na escola",' +
      'desc:"O Programa Educa\\xE7\\xE3o Conectada (PIEC/MEC) apoia a universaliza\\xE7\\xE3o do acesso \\xE0 internet de alta velocidade nas escolas p\\xFAblicas.",' +
      'url:"https://www.gov.br/pt-br/servicos/obter-apoio-financeiro-para-instalacao-de-internet-banda-larga-na-escola-publica",programa:"PIEC"}]';
    if (dashV30Source.includes(_EXT_GSD_ANCHOR)) {
      dashV30Source = dashV30Source.replace(_EXT_GSD_ANCHOR, _EXT_GSD_NEW);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 govserv extension: 4 new services added to _gsd');
    }
    // Also add PIEC color to _gpc
    const _EXT_GPC_ANCHOR = '"Compras":{bg:"#fce7f3",bd:"#f9a8d4",txt:"#9d174d"}}';
    const _EXT_GPC_NEW = '"Compras":{bg:"#fce7f3",bd:"#f9a8d4",txt:"#9d174d"},"PIEC":{bg:"#e0f2fe",bd:"#7dd3fc",txt:"#0369a1"}}';
    if (dashV30Source.includes(_EXT_GPC_ANCHOR)) {
      dashV30Source = dashV30Source.replace(_EXT_GPC_ANCHOR, _EXT_GPC_NEW);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 govserv extension: PIEC color added to _gpc');
    }
  } else if (dashV30Source.includes(_GOVSERV_EXT_MARKER)) {
    console.log('[bootstrap] Dashboard-v30 govserv extension already applied');
  }

  // ── Extension 2: add certidão + assinatura digital services (IDs 788, 790, 10443) ──
  const _GOVSERV_EXT2_MARKER = 'id:10443,';
  if (dashV30Source.includes('id:10119,') && !dashV30Source.includes(_GOVSERV_EXT2_MARKER)) {
    const _EXT2_GSD_ANCHOR = 'banda-larga-na-escola-publica",programa:"PIEC"}]';
    const _EXT2_GSD_NEW =
      'banda-larga-na-escola-publica",programa:"PIEC"},' +
      '{id:788,nome:"Emitir Certid\\xE3o de Antecedentes Criminais",' +
      'desc:"Emita gratuitamente a CAC (Pol\\xEDcia Federal) para verificar registros de decis\\xE3o condenat\\xF3ria transitada em julgado. Necess\\xE1ria na contrata\\xE7\\xE3o de funcion\\xE1rios e volunt\\xE1rios da escola.",' +
      'url:"https://www.gov.br/pt-br/servicos/emitir-certidao-de-antecedentes-criminais",programa:"Gov.br"},' +
      '{id:790,nome:"Validar Certid\\xE3o de Antecedentes Criminais",' +
      'desc:"Verifique a autenticidade da Certid\\xE3o de Antecedentes Criminais emitida pela Pol\\xEDcia Federal. Garante que a certid\\xE3o apresentada por um candidato \\xE9 leg\\xEDtima.",' +
      'url:"https://www.gov.br/pt-br/servicos/validar-certidao-de-antecedentes-criminais",programa:"Gov.br"},' +
      '{id:10443,nome:"Validar e assinar documentos digitais (RFB)",' +
      'desc:"Valide a autenticidade e assine documentos digitais emitidos com c\\xF3digo de valida\\xE7\\xE3o pela Receita Federal. Aceito como substituto de reconhecimento de firma para documentos digitais.",' +
      'url:"https://www.gov.br/pt-br/servicos/validar-e-assinar-documentos-digitais",programa:"Gov.br"}]';
    if (dashV30Source.includes(_EXT2_GSD_ANCHOR)) {
      dashV30Source = dashV30Source.replace(_EXT2_GSD_ANCHOR, _EXT2_GSD_NEW);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 govserv ext2: 3 certidão/assinatura services added');
    }
    // Add Gov.br color to _gpc
    const _EXT2_GPC_ANCHOR = '"PIEC":{bg:"#e0f2fe",bd:"#7dd3fc",txt:"#0369a1"}}';
    const _EXT2_GPC_NEW = '"PIEC":{bg:"#e0f2fe",bd:"#7dd3fc",txt:"#0369a1"},"Gov.br":{bg:"#e2e8f0",bd:"#94a3b8",txt:"#334155"}}';
    if (dashV30Source.includes(_EXT2_GPC_ANCHOR)) {
      dashV30Source = dashV30Source.replace(_EXT2_GPC_ANCHOR, _EXT2_GPC_NEW);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 govserv ext2: Gov.br color added to _gpc');
    }
  } else if (dashV30Source.includes(_GOVSERV_EXT2_MARKER)) {
    console.log('[bootstrap] Dashboard-v30 govserv ext2 already applied');
  }

  // ── ONDH card: state + handler + expandable card (Direitos Humanos) ─────────
  const _ONDH_STATE_ANCHOR = '[ctxSuasOpen, setCtxSuasOpen] = F.useState(false), smReady = F.useRef(false);';
  const _ONDH_STATE_INSERT = '[ctxSuasOpen, setCtxSuasOpen] = F.useState(false), [ctxOndhData, setCtxOndhData] = F.useState(null), [ctxOndhLoading, setCtxOndhLoading] = F.useState(false), [ctxOndhOpen, setCtxOndhOpen] = F.useState(false), smReady = F.useRef(false);';

  // State patch: idempotent guard on state variable declaration
  if (!dashV30Source.includes('[ctxOndhData, setCtxOndhData]')) {
    if (dashV30Source.includes(_ONDH_STATE_ANCHOR)) {
      dashV30Source = dashV30Source.replace(_ONDH_STATE_ANCHOR, _ONDH_STATE_INSERT);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 ONDH state patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 ONDH state patch NOT applied — anchor not found');
    }
  } else {
    console.log('[bootstrap] Dashboard-v30 ONDH state already applied');
  }

  // Handler patch: idempotent guard on function name
  if (!dashV30Source.includes('openCtxOndh = () =>')) {
    const _ONDH_HANDLER_ANCHOR = 'setCtxSuasLoading(false); }).catch(() => { setCtxSuasData({ ok: false }); setCtxSuasLoading(false); });\n        }\n      }, _ = {';
    const _ONDH_HANDLER_INSERT =
      'setCtxSuasLoading(false); }).catch(() => { setCtxSuasData({ ok: false }); setCtxSuasLoading(false); });\n        }\n      }, openCtxOndh = () => {\n' +
      '        const n = !ctxOndhOpen;\n' +
      '        setCtxOndhOpen(n);\n' +
      '        if (n && a && !ctxOndhData && !ctxOndhLoading) {\n' +
      '          setCtxOndhLoading(true);\n' +
      '          fetch("/api/ondh-municipio/"+a).then((g) => g.json()).then((g) => { setCtxOndhData(g); setCtxOndhLoading(false); }).catch(() => { setCtxOndhData({ ok: false }); setCtxOndhLoading(false); });\n' +
      '        }\n' +
      '      }, _ = {';
    if (dashV30Source.includes(_ONDH_HANDLER_ANCHOR)) {
      dashV30Source = dashV30Source.replace(_ONDH_HANDLER_ANCHOR, _ONDH_HANDLER_INSERT);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 ONDH handler patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 ONDH handler patch NOT applied — anchor not found');
    }
  } else {
    console.log('[bootstrap] Dashboard-v30 ONDH handler already applied');
  }

  // Deduplication guard: remove duplicate ONDH card if it exists (from prior bad patch)
  const _ONDH_DEDUP_SEARCH = '\ne.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #ce93d8"';
  const _ONDH_SUPORTE_SEARCH = '\ne.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #d4c4f5"';
  const _ce93d8Count = (dashV30Source.match(/1\.5px solid #ce93d8/g) || []).length;
  if (_ce93d8Count > 1) {
    const _firstIdx = dashV30Source.indexOf('1.5px solid #ce93d8');
    const _secondIdx = dashV30Source.indexOf('1.5px solid #ce93d8', _firstIdx + 1);
    const _dupStart = dashV30Source.lastIndexOf(_ONDH_DEDUP_SEARCH, _secondIdx);
    const _suporteStart = dashV30Source.indexOf(_ONDH_SUPORTE_SEARCH, _secondIdx);
    if (_dupStart >= 0 && _suporteStart > _dupStart) {
      dashV30Source = dashV30Source.slice(0, _dupStart) + dashV30Source.slice(_suporteStart);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 ONDH duplicate card removed');
    } else {
      console.warn('[bootstrap] Dashboard-v30 ONDH dedup could not find boundaries');
    }
  }

  // Card patch: idempotent guard on ONDH card border color (unique to ONDH card)
  if (!dashV30Source.includes('1.5px solid #ce93d8')) {
    // Card: inject ONDH card after the SUAS card closing, before the Suporte Institucional card
    const _ONDH_CARD_ANCHOR = 'C\\xF3digo IBGE n\\xE3o dispon\\xEDvel para esta escola." })\n  ]})\n]}),\ne.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #d4c4f5", background: "#f9f6ff" },';
    const _ONDH_CARD =
      // SUAS card closing (same as anchor start) + ONDH card + Suporte Institucional opening (same as anchor end)
      'C\\xF3digo IBGE n\\xE3o dispon\\xEDvel para esta escola." })\n  ]})\n]}),\n' +
      'e.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #ce93d8", background: "#fdf4ff" }, children: [\n' +
      '  e.jsxs("button", { onClick: openCtxOndh, style: { width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }, children: [\n' +
      '    e.jsx("div", { style: { width: 38, height: 38, borderRadius: 12, background: "#e1bee7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: e.jsx("span", { style: { fontSize: 20 }, children: "\\uD83E\\uDEF3" }) }),\n' +
      '    e.jsxs("div", { style: { flex: 1 }, children: [\n' +
      '      e.jsx("p", { style: { fontWeight: 700, fontSize: "13px", color: "#4a148c", margin: 0 }, children: "Direitos Humanos \\u2014 ONDH" }),\n' +
      '      e.jsx("p", { style: { fontSize: "11px", color: "#6a1b9a", margin: 0 }, children: "Den\\xFAncias Disque 100, Ligue 180 e App DH Brasil por munic\\xEDpio" })\n' +
      '    ]}),\n' +
      '    e.jsx("span", { style: { fontSize: "16px", color: "#6a1b9a", transform: ctxOndhOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }, children: "\\u25BE" })\n' +
      '  ]}),\n' +
      '  ctxOndhOpen && e.jsxs("div", { style: { padding: "0 18px 16px", borderTop: "1px solid #e1bee7" }, children: [\n' +
      '    ctxOndhLoading && e.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: "#6a1b9a", fontSize: 13 }, children: [e.jsx(Ie, { className: "w-4 h-4 animate-spin" }), " Consultando dados da ONDH..."] }),\n' +
      '    !ctxOndhLoading && ctxOndhData && ctxOndhData.ok && (() => {\n' +
      '      const _od = ctxOndhData;\n' +
      '      return e.jsxs(e.Fragment, { children: [\n' +
      '        e.jsxs("div", { style: { marginTop: 14, marginBottom: 12 }, children: [\n' +
      '          e.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, children: [\n' +
      '            e.jsx("p", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#4a148c", margin: 0 }, children: "Den\\xFAncias registradas \\u2014 ONDH" }),\n' +
      '            e.jsxs("span", { style: { fontSize: 9, color: "#6a1b9a", background: "#e1bee7", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }, children: [(_od.total||0).toLocaleString("pt-BR"), " total"] })\n' +
      '          ]}),\n' +
      '          e.jsxs("div", { style: { background: "#f3e5f5", border: "1px solid #ce93d8", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }, children: [\n' +
      '            e.jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#4a148c", margin: "0 0 2px", textTransform: "uppercase" }, children: "Total de Den\\xFAncias" }),\n' +
      '            e.jsx("p", { style: { fontSize: 28, fontWeight: 800, color: "#4a148c", margin: 0, lineHeight: 1 }, children: (_od.total||0).toLocaleString("pt-BR") })\n' +
      '          ]})\n' +
      '        ]}),\n' +
      '        _od.por_canal && _od.por_canal.length > 0 && e.jsxs("div", { style: { marginBottom: 12 }, children: [\n' +
      '          e.jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#4a148c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }, children: "Por Canal" }),\n' +
      '          e.jsx("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: _od.por_canal.map(function(_c, _ci) {\n' +
      '            return e.jsxs("div", { style: { background: "#f3e5f5", border: "1px solid #ce93d8", borderRadius: 8, padding: "6px 10px", fontSize: 11 }, children: [\n' +
      '              e.jsx("span", { style: { fontWeight: 700, color: "#4a148c" }, children: _c.canal || "Desconhecido" }),\n' +
      '              e.jsxs("span", { style: { color: "#6a1b9a", marginLeft: 4 }, children: ["\\u2014 ", (_c.total||0).toLocaleString("pt-BR")] })\n' +
      '            ]}, _ci);\n' +
      '          }) })\n' +
      '        ]}),\n' +
      '        _od.por_violacao && _od.por_violacao.length > 0 && e.jsxs("div", { style: { marginBottom: 12 }, children: [\n' +
      '          e.jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#4a148c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }, children: "Principais Tipos de Viola\\xE7\\xE3o (Top 5)" }),\n' +
      '          e.jsx("div", { style: { display: "flex", gap: 5, flexWrap: "wrap" }, children: _od.por_violacao.slice(0, 5).map(function(_v, _vi) {\n' +
      '            return e.jsxs("span", { style: { background: "#ede7f6", border: "1px solid #b39ddb", borderRadius: 6, padding: "3px 9px", fontSize: 10, color: "#4527a0", fontWeight: 600 }, children: [_v.tipo || _v.violacao || "Tipo", ": ", (_v.total||0).toLocaleString("pt-BR")] }, _vi);\n' +
      '          }) })\n' +
      '        ]}),\n' +
      '        _od.por_grupo_vulneravel && _od.por_grupo_vulneravel.length > 0 && e.jsxs("div", { style: { marginBottom: 12 }, children: [\n' +
      '          e.jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#4a148c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }, children: "Grupos Vulner\\xE1veis (Top 5)" }),\n' +
      '          e.jsx("div", { style: { display: "flex", gap: 5, flexWrap: "wrap" }, children: _od.por_grupo_vulneravel.slice(0, 5).map(function(_g, _gi) {\n' +
      '            return e.jsxs("span", { style: { background: "#fce4ec", border: "1px solid #f48fb1", borderRadius: 6, padding: "3px 9px", fontSize: 10, color: "#880e4f", fontWeight: 600 }, children: [_g.grupo || "Grupo", ": ", (_g.total||0).toLocaleString("pt-BR")] }, _gi);\n' +
      '          }) })\n' +
      '        ]}),\n' +
      '        _od.evolucao_semestral && _od.evolucao_semestral.length > 0 && e.jsxs("div", { style: { marginBottom: 12 }, children: [\n' +
      '          e.jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#4a148c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }, children: "Evolu\\xE7\\xE3o Semestral" }),\n' +
      '          e.jsx("div", { style: { display: "flex", gap: 4, alignItems: "flex-end", flexWrap: "wrap" }, children: _od.evolucao_semestral.slice(-8).map(function(_s, _si, _arr) {\n' +
      '            const _prev = _arr[_si - 1];\n' +
      '            const _arrow = _prev ? (_s.total > _prev.total ? "\\u2191" : _s.total < _prev.total ? "\\u2193" : "\\u2192") : null;\n' +
      '            const _arrowColor = _arrow === "\\u2191" ? "#c62828" : "#2e7d32";\n' +
      '            return e.jsxs("div", { style: { textAlign: "center" }, children: [\n' +
      '              e.jsx("div", { style: { fontSize: 12, fontWeight: 700, color: "#4a148c" }, children: (_s.total||0).toLocaleString("pt-BR") }),\n' +
      '              _arrow && e.jsx("span", { style: { fontSize: 10, color: _arrowColor, fontWeight: 700 }, children: _arrow }),\n' +
      '              e.jsx("div", { style: { fontSize: 9, color: "#9c4dcc", marginTop: 2 }, children: _s.semestre })\n' +
      '            ]}, _si);\n' +
      '          }) })\n' +
      '        ]}),\n' +
      '        e.jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, marginBottom: 8 }, children: [\n' +
      '          e.jsx("a", { href: "https://dados.gov.br/dados/conjuntos-dados/ouvidoria-nacional-de-direitos-humanos-ondh", target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, fontWeight: 700, color: "#4a148c", background: "#e1bee7", padding: "4px 12px", borderRadius: 20, border: "1px solid #ce93d8", textDecoration: "none" }, children: "Dados ONDH \\u2197" }),\n' +
      '          e.jsx("a", { href: "https://observadh.mdh.gov.br", target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, fontWeight: 700, color: "#4a148c", background: "#e1bee7", padding: "4px 12px", borderRadius: 20, border: "1px solid #ce93d8", textDecoration: "none" }, children: "ObservaDH \\u2197" })\n' +
      '        ]}),\n' +
      '        e.jsx("p", { style: { fontSize: 10, color: "#6a1b9a", margin: "4px 0 0", lineHeight: 1.4 }, children: "Fonte: ONDH / MDH \\u2014 Disque 100, Ligue 180 e App DH Brasil. Dados a partir de 2020." })\n' +
      '      ]\n' +
      '      });\n' +
      '    })(),\n' +
      '    !ctxOndhLoading && ctxOndhData && !ctxOndhData.ok && e.jsx("p", { style: { fontSize: 12, color: "#888", padding: "12px 0" }, children: "Dados de direitos humanos n\\xE3o dispon\\xEDveis para este munic\\xEDpio. Execute o script de importa\\xE7\\xE3o ONDH para habilitar." }),\n' +
      '    !ctxOndhLoading && !ctxOndhData && !a && e.jsx("p", { style: { fontSize: 12, color: "#888", padding: "12px 0" }, children: "C\\xF3digo IBGE n\\xE3o dispon\\xEDvel para esta escola." })\n' +
      '  ]})\n' +
      ']}),\n' +
      'e.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #d4c4f5", background: "#f9f6ff" },';

    if (dashV30Source.includes(_ONDH_CARD_ANCHOR)) {
      dashV30Source = dashV30Source.replace(_ONDH_CARD_ANCHOR, _ONDH_CARD);
      dashV30Changed = true;
      console.log('[bootstrap] Dashboard-v30 ONDH card patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 ONDH card patch NOT applied — anchor not found');
    }
  } else {
    console.log('[bootstrap] Dashboard-v30 ONDH card already applied');
  }

  if (dashV30Changed) {
    fs.writeFileSync(dashboardV30AssetPath, dashV30Source, 'utf8');
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
e.get("/api/secretaria-municipal/ia",async(A,g)=>{
  try{
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)return g.status(503).json({ok:false,message:"Chave de IA n\xE3o configurada"});
    const municipio=String(A.query.municipio||"").trim();
    const uf=String(A.query.uf||"").trim().toUpperCase();
    if(!municipio||uf.length!==2)return g.status(400).json({ok:false,message:"Munic\xEDpio e UF obrigat\xF3rios"});
    globalThis._smeIaCache=globalThis._smeIaCache||new Map();
    const cacheKey="sme-ia:"+municipio.toLowerCase()+":"+uf;
    const cached=globalThis._smeIaCache.get(cacheKey);
    if(cached&&Date.now()-cached.ts<86400000)return g.json(cached.data);
    const model=process.env.OPENAI_MODEL||"gpt-4o-mini";
    // ── helpers (no regex literals to avoid template-literal escape issues) ──
    function _snip(html,maxN){
      const out=[];
      const pts=html.split('class="result__snippet"');
      for(let ii=1;ii<pts.length&&out.length<maxN;ii++){
        const st=pts[ii].indexOf('>'),en=pts[ii].indexOf('</a>');
        if(st>=0&&en>st){
          const s=pts[ii].substring(st+1,en).replace(new RegExp('<[^>]+>','g'),'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
          if(s&&s.length>15)out.push(s);
        }
      }
      return out;
    }
    function _urls(html,maxN){
      const out=[];
      const pts=html.split('class="result__url"');
      for(let ii=1;ii<pts.length&&out.length<maxN;ii++){
        const st=pts[ii].indexOf('>'),en=pts[ii].indexOf('</a>');
        if(st>=0&&en>st){
          const u=pts[ii].substring(st+1,en).replace(new RegExp('<[^>]+>','g'),'').trim();
          if(u&&u.length>5)out.push(u);
        }
      }
      return out;
    }
    function _emails(txt){
      const found=[];
      const pts=txt.split('@');
      for(let ii=1;ii<pts.length;ii++){
        const bef=pts[ii-1],aft=pts[ii];
        let loc='';
        for(let j=bef.length-1;j>=0&&j>=bef.length-64;j--){const c=bef[j];if((c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')||c==='.'||c==='_'||c==='-'||c==='+'){loc=c+loc;}else break;}
        let dom='',dot=false;
        for(let j=0;j<aft.length&&j<64;j++){const c=aft[j];if((c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')||c==='-'||c==='.'){if(c==='.')dot=true;dom+=c;}else break;}
        if(loc.length>=2&&dom.length>=4&&dot){const em=loc+'@'+dom;if(!found.includes(em))found.push(em);}
      }
      return found;
    }
    function _cleanHtml(h){
      return h.replace(new RegExp('<script[^>]*>[\\s\\S]*?<\\/script>','gi'),' ')
               .replace(new RegExp('<style[^>]*>[\\s\\S]*?<\\/style>','gi'),' ')
               .replace(new RegExp('<[^>]+>','g'),' ')
               .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\\s+/g,' ');
    }
    // ── Step 1: two DDG searches in parallel ─────────────────────────────────
    const UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
    const q1=encodeURIComponent("Secretaria Municipal de Educa\xE7\xE3o "+municipio+" "+uf+" respons\xE1vel secret\xE1rio email telefone endere\xE7o");
    const q2=encodeURIComponent("SEMED "+municipio+" "+uf+" secretar email contato site prefeitura");
    const [ddgR1,ddgR2]=await Promise.allSettled([
      fetch("https://html.duckduckgo.com/html/?q="+q1,{headers:{"User-Agent":UA,"Accept":"text/html"},signal:AbortSignal.timeout(10000)}),
      fetch("https://html.duckduckgo.com/html/?q="+q2,{headers:{"User-Agent":UA,"Accept":"text/html"},signal:AbortSignal.timeout(10000)})
    ]);
    let allSnips=[],allEmails=[],siteUrl="";
    for(const r of [ddgR1,ddgR2]){
      if(r.status!=="fulfilled"||!r.value.ok)continue;
      const html=await r.value.text();
      allSnips=[...allSnips,..._snip(html,6)];
      allEmails=[...allEmails,..._emails(html)];
      if(!siteUrl){const us=_urls(html,5);const pref=us.find(u=>u.includes('gov.br')||u.includes('prefeitura')||u.toLowerCase().includes(municipio.toLowerCase().substring(0,5)));if(pref)siteUrl=pref;}
    }
    // deduplicate snippets
    const seen=new Set();
    allSnips=allSnips.filter(s=>{if(seen.has(s))return false;seen.add(s);return true;}).slice(0,10);
    allEmails=[...new Set(allEmails)].filter(e=>e.includes('.')).slice(0,5);
    // ── Step 2: try to scrape prefeitura/SEMED page ───────────────────────────
    let prefText="";
    const smeSlug=municipio.toLowerCase().replace(/\s+/g,'').replace(new RegExp('[^a-z0-9]','g'),'');
    const ufL=uf.toLowerCase();
    const candidates=[];
    if(siteUrl){const base=(siteUrl.startsWith('http')?siteUrl:'https://'+siteUrl).replace(/\\/+$/,'');candidates.push(base+'/secretaria-municipal-de-educacao/',base+'/semed/',base+'/educacao/');}
    candidates.push('https://'+smeSlug+'.'+ufL+'.gov.br/secretaria-municipal-de-educacao/','https://www.'+smeSlug+'.'+ufL+'.gov.br/semed/');
    for(const url of candidates.slice(0,5)){
      if(prefText)break;
      try{
        const pr=await fetch(url,{headers:{"User-Agent":UA},signal:AbortSignal.timeout(6000)});
        if(!pr.ok)continue;
        const ph=await pr.text();
        const pt=_cleanHtml(ph);
        if(pt.length>200){prefText=pt.substring(0,3000);allEmails=[...new Set([...allEmails,..._emails(ph)])].slice(0,8);break;}
      }catch(_){}
    }
    // ── Step 3: build context and call OpenAI ────────────────────────────────
    const ctxParts=[];
    if(allSnips.length>0)ctxParts.push("=== TRECHOS DA WEB ===\\n"+allSnips.join("\\n\\n"));
    if(allEmails.length>0)ctxParts.push("=== E-MAILS ENCONTRADOS ===\\n"+allEmails.join(", "));
    if(prefText)ctxParts.push("=== CONTE\xDADO DO SITE DA PREFEITURA ===\\n"+prefText.substring(0,1500));
    const snippetText=ctxParts.join("\\n\\n");
    const systemPrompt="Voc\xEA extrai dados de contato de secretarias municipais de educa\xE7\xE3o brasileiras a partir de trechos da web. Alguns trechos podem ter OCR ou espa\xE7os extras — corrija-os. Responda APENAS com JSON v\xE1lido.";
    const jsonSchema="\\n\\nRetorne APENAS este JSON:\\n{\\n  \\"nome\\": \\"nome da secretaria\\",\\n  \\"titular\\": \\"nome completo do(a) secret\xE1rio(a) — corrija OCR se necess\xE1rio\\",\\n  \\"tel\\": \\"telefone com DDD (formato (XX) XXXXX-XXXX)\\",\\n  \\"email\\": \\"e-mail — prefira institucional; corrija espa\xE7os de OCR (ex: semed b ujaru@gmail → semedbujaru@gmail.com)\\",\\n  \\"foco\\": \\"endere\xE7o completo com CEP\\",\\n  \\"horario\\": \\"hor\xE1rio de atendimento\\",\\n  \\"site\\": \\"URL do site oficial\\",\\n  \\"paginaFonte\\": \\"URL de onde os dados foram encontrados\\"\\n}\\n\\nUse \\"\\" para campos n\xE3o encontrados. N\xE3o invente.";
    const userMsg=snippetText
      ? "Dados encontrados sobre a SME de "+municipio+" - "+uf+":\\n\\n"+snippetText+jsonSchema
      : "Informe os dados de contato da Secretaria Municipal de Educa\xE7\xE3o de "+municipio+" - "+uf+", Brasil."+jsonSchema;
    const resp=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body:JSON.stringify({model,messages:[{role:"system",content:systemPrompt},{role:"user",content:userMsg}],temperature:0.1,max_tokens:600}),
      signal:AbortSignal.timeout(30000)
    });
    if(!resp.ok){const err=await resp.text();throw new Error("OpenAI error: "+resp.status+" "+err.substring(0,200));}
    const data=await resp.json();
    const raw=data.choices?.[0]?.message?.content||"{}";
    let parsed2;
    try{const cleaned2=raw.replace(/^\`\`\`json?\\n?/,"").replace(/\\n?\`\`\`$/,"").trim();parsed2=JSON.parse(cleaned2);}catch{parsed2={};}
    const result2={ok:true,dados:{sigla:"SME",nome:parsed2.nome||("Secretaria Municipal de Educa\xE7\xE3o de "+municipio),titular:parsed2.titular||"",tel:parsed2.tel||"",email:parsed2.email||"",foco:parsed2.foco||"",horario:parsed2.horario||"",site:parsed2.site||"",paginaFonte:parsed2.paginaFonte||"",maps:""},_ia:true};
    globalThis._smeIaCache.set(cacheKey,{ts:Date.now(),data:result2});
    g.json(result2);
  }catch(E){console.error("[sme-ia]",E.message);g.status(500).json({ok:false,message:E.message})}
}),
e.get("/api/cee/ia",async(A,g)=>{
  try{
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)return g.status(503).json({ok:false});
    const uf=String(A.query.uf||"").trim().toUpperCase();
    if(uf.length!==2)return g.status(400).json({ok:false});
    globalThis._ceeIaCache=globalThis._ceeIaCache||new Map();
    const cacheKey="cee-ia:"+uf;
    const cached=globalThis._ceeIaCache.get(cacheKey);
    if(cached&&Date.now()-cached.ts<86400000)return g.json(cached.data);
    const _SN={AC:"Acre",AL:"Alagoas",AM:"Amazonas",AP:"Amapá",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",MG:"Minas Gerais",MS:"Mato Grosso do Sul",MT:"Mato Grosso",PA:"Pará",PB:"Paraíba",PE:"Pernambuco",PI:"Piauí",PR:"Paraná",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RO:"Rondônia",RR:"Roraima",RS:"Rio Grande do Sul",SC:"Santa Catarina",SE:"Sergipe",SP:"São Paulo",TO:"Tocantins"};
    const stateName=_SN[uf]||uf;
    const ceeBase="http://www.cee."+uf.toLowerCase()+".gov.br";
    const [r1,r2,r3]=await Promise.all([
      fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent('presidente "Conselho Estadual de Educação" '+stateName+' CEE 2024 2025'),{headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"pt-BR"},signal:AbortSignal.timeout(8000)}).then(r=>r.text()).catch(()=>""),
      fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent("site:cee."+uf.toLowerCase()+".gov.br presidente composicao 2025"),{headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"pt-BR"},signal:AbortSignal.timeout(8000)}).then(r=>r.text()).catch(()=>""),
      fetch(ceeBase,{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(8000)}).then(r=>r.text()).catch(()=>""),
    ]);
    function _snipC(html,maxN){const out=[];const pts=html.split('class="result__snippet"');for(let ii=1;ii<pts.length&&out.length<maxN;ii++){const st=pts[ii].indexOf('>'),en=pts[ii].indexOf('</a>');if(st>=0&&en>st){const s=pts[ii].substring(st+1,en).replace(new RegExp('<[^>]+>','g'),'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();if(s&&s.length>10)out.push(s)}}return out;}
    const snippets=[..._snipC(r1,6),..._snipC(r2,4)].join(" | ");
    const ceeText=r3.replace(new RegExp('<style[^>]*>[\\s\\S]*?</style>','gi'),'').replace(new RegExp('<script[^>]*>[\\s\\S]*?</script>','gi'),'').replace(new RegExp('<[^>]+>','g'),' ').replace(/&nbsp;/g,' ').replace(/\\s+/g,' ').substring(0,2000);
    const ceeResp=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",temperature:0.1,response_format:{type:"json_object"},
        messages:[{role:"user",content:"Extraia dados do Conselho Estadual de Educação (CEE-"+uf+") do "+stateName+", Brasil. BUSCAS: "+snippets+" PÁGINA CEE: "+ceeText+" Retorne JSON: {presidente: nome completo do presidente ATUAL 2024-2025 ou vazio, tel: telefone do CEE, email: email institucional, endereco: endereço completo, site: URL oficial}. Se não tiver certeza do presidente atual, retorne string vazia. Não invente."}]
      }),signal:AbortSignal.timeout(15000)
    }).then(r=>r.json()).catch(()=>null);
    let ceeD={};
    try{ceeD=JSON.parse(ceeResp?.choices?.[0]?.message?.content||"{}");}catch(e){}
    const ceeResult={ok:true,dados:ceeD,_ia:true};
    globalThis._ceeIaCache.set(cacheKey,{data:ceeResult,ts:Date.now()});
    g.json(ceeResult);
  }catch(e){g.json({ok:false,erro:String(e)});}
}),
e.get("/api/see/ia",async(A,g)=>{
  try{
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)return g.status(503).json({ok:false});
    const uf=String(A.query.uf||"").trim().toUpperCase();
    if(uf.length!==2)return g.status(400).json({ok:false});
    globalThis._seeIaCache=globalThis._seeIaCache||new Map();
    const cacheKey="see-ia:"+uf;
    const cached=globalThis._seeIaCache.get(cacheKey);
    if(cached&&Date.now()-cached.ts<86400000)return g.json(cached.data);
    const _SN2={AC:"Acre",AL:"Alagoas",AM:"Amazonas",AP:"Amapá",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",MG:"Minas Gerais",MS:"Mato Grosso do Sul",MT:"Mato Grosso",PA:"Pará",PB:"Paraíba",PE:"Pernambuco",PI:"Piauí",PR:"Paraná",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RO:"Rondônia",RR:"Roraima",RS:"Rio Grande do Sul",SC:"Santa Catarina",SE:"Sergipe",SP:"São Paulo",TO:"Tocantins"};
    const stateName2=_SN2[uf]||uf;
    const [s1,s2]=await Promise.all([
      fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent("secretário secretária educação "+stateName2+" 2025 governo"),{headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"pt-BR"},signal:AbortSignal.timeout(8000)}).then(r=>r.text()).catch(()=>""),
      fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent("secretaria estadual educação "+stateName2+" titular secretário 2024 2025"),{headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"pt-BR"},signal:AbortSignal.timeout(8000)}).then(r=>r.text()).catch(()=>""),
    ]);
    function _snipS(html,maxN){const out=[];const pts=html.split('class="result__snippet"');for(let ii=1;ii<pts.length&&out.length<maxN;ii++){const st=pts[ii].indexOf('>'),en=pts[ii].indexOf('</a>');if(st>=0&&en>st){const s=pts[ii].substring(st+1,en).replace(new RegExp('<[^>]+>','g'),'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();if(s&&s.length>10)out.push(s)}}return out;}
    const seeSnips=[..._snipS(s1,6),..._snipS(s2,5)].join(" | ");
    const seeResp=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",temperature:0.1,response_format:{type:"json_object"},
        messages:[{role:"user",content:"Extraia dados do(a) Secretário(a) de Educação do estado "+stateName2+" ("+uf+"), Brasil. BUSCAS: "+seeSnips+" Retorne JSON: {nome: nome completo do secretário(a) ATUAL 2024-2025 ou vazio, email: email institucional, tel: telefone, site: site oficial da secretaria, estado: "+stateName2+"}. Se não tiver certeza, retorne nome string vazia. Não invente."}]
      }),signal:AbortSignal.timeout(15000)
    }).then(r=>r.json()).catch(()=>null);
    let seeD={};
    try{seeD=JSON.parse(seeResp?.choices?.[0]?.message?.content||"{}");}catch(e){}
    const seeResult={ok:true,dados:seeD,_ia:true};
    globalThis._seeIaCache.set(cacheKey,{data:seeResult,ts:Date.now()});
    g.json(seeResult);
  }catch(e){g.json({ok:false,erro:String(e)});}
}),
e.get("/api/cme/ia",async(A,g)=>{
  try{
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)return g.status(503).json({ok:false});
    const municipio=String(A.query.municipio||"").trim();
    const uf=String(A.query.uf||"").trim().toUpperCase();
    if(!municipio||uf.length!==2)return g.status(400).json({ok:false});
    globalThis._cmeIaCache=globalThis._cmeIaCache||new Map();
    const cacheKey="cme-ia:"+municipio.toLowerCase()+":"+uf;
    const cached=globalThis._cmeIaCache.get(cacheKey);
    if(cached&&Date.now()-cached.ts<86400000)return g.json(cached.data);
    const _hdrs={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36","Accept-Language":"pt-BR,pt;q=0.9","Accept":"text/html,application/xhtml+xml,*/*;q=0.8"};
    const _ddg=q=>fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent(q),{headers:_hdrs,signal:AbortSignal.timeout(9000)}).then(r=>r.text()).catch(()=>"");
    const [d1,d2,d3]=await Promise.all([
      _ddg("CME Conselho Municipal Educação "+municipio+" "+uf+" presidente presidenta 2024 2025"),
      _ddg("CME "+municipio+" "+uf+" composição portaria diario oficial presidente"),
      _ddg("site:*.gov.br CME "+municipio+" "+uf+" Educação")
    ]);
    function _snip(h,n){const o=[];const p=h.split('class="result__snippet"');for(let i=1;i<p.length&&o.length<n;i++){const s=p[i].indexOf('>'),e=p[i].indexOf('</a>');if(s>=0&&e>s){const t=p[i].substring(s+1,e).replace(new RegExp('<[^>]+>','g'),'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();if(t&&t.length>10)o.push(t)}}return o;}
    function _urls(h,n){const o=[];const p=h.split('class="result__url"');for(let i=1;i<p.length&&o.length<n;i++){const s=p[i].indexOf('>'),e=p[i].indexOf('</a>');if(s>=0&&e>s){const u=p[i].substring(s+1,e).replace(new RegExp('<[^>]+>','g'),'').trim();if(u&&u.length>5)o.push(u)}}return o;}
    function _href(h,n){const o=[];const p=h.split('class="result__a"');for(let i=1;i<p.length&&o.length<n;i++){const m=p[i].match(/href="([^"]+)"/);if(m&&m[1]&&!m[1].includes('duckduckgo'))o.push(m[1]);}return o;}
    const snips=[..._snip(d1,5),..._snip(d2,4),..._snip(d3,3)].join(" | ");
    const topUrls=[..._href(d1,2),..._href(d2,1)].filter(u=>u.startsWith('http'));
    const pageTexts=await Promise.all(topUrls.slice(0,2).map(u=>fetch(u,{headers:_hdrs,signal:AbortSignal.timeout(7000)}).then(r=>r.ok?r.text():"").catch(()=>"")));
    function _clean(h){return h.replace(new RegExp('<style[^>]*>[\\s\\S]*?</style>','gi'),'').replace(new RegExp('<script[^>]*>[\\s\\S]*?</script>','gi'),'').replace(new RegExp('<[^>]+>','g'),' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\\s+/g,' ').trim().substring(0,2500);}
    const pageContent=pageTexts.map(_clean).filter(t=>t.length>50).join(" ||| ").substring(0,4000);
    const urls=[..._urls(d1,3),..._urls(d2,2)].join(", ");
    const resp=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",temperature:0.1,response_format:{type:"json_object"},
        messages:[{role:"system",content:"Voce extrai dados de conselhos municipais de educacao do Brasil a partir de textos de paginas web. Seja preciso: so retorne presidente se encontrar nome completo explicitamente mencionado como presidente ou presidenta do CME. Nunca invente."},{role:"user",content:"Extraia dados do CME (Conselho Municipal de Educacao) de "+municipio+"-"+uf+". TRECHOS DE BUSCA: "+snips+" CONTEUDO DAS PAGINAS: "+pageContent+" URLS ENCONTRADAS: "+urls+". Retorne JSON com: presidente (nome completo de quem preside o CME, ou vazio), tel, email, endereco, site (URL do CME), encontrado (true so se achou ao menos presidente ou contato oficial confiaveis)."}]
      }),signal:AbortSignal.timeout(20000)
    }).then(r=>r.json()).catch(()=>null);
    let dados={};
    try{dados=JSON.parse(resp?.choices?.[0]?.message?.content||"{}");}catch(e){}
    const result={ok:true,dados,_ia:true,municipio,uf};
    globalThis._cmeIaCache.set(cacheKey,{data:result,ts:Date.now()});
    g.json(result);
  }catch(e){g.json({ok:false,erro:String(e)});}
}),
e.get("/api/cacs/ia",async(A,g)=>{
  try{
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)return g.status(503).json({ok:false});
    const municipio=String(A.query.municipio||"").trim();
    const uf=String(A.query.uf||"").trim().toUpperCase();
    if(!municipio||uf.length!==2)return g.status(400).json({ok:false});
    globalThis._cacsIaCache=globalThis._cacsIaCache||new Map();
    const cacheKey="cacs-ia:"+municipio.toLowerCase()+":"+uf;
    const cached=globalThis._cacsIaCache.get(cacheKey);
    if(cached&&Date.now()-cached.ts<86400000)return g.json(cached.data);
    const _hdrs2={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36","Accept-Language":"pt-BR,pt;q=0.9","Accept":"text/html,application/xhtml+xml,*/*;q=0.8"};
    const _ddg2=q=>fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent(q),{headers:_hdrs2,signal:AbortSignal.timeout(9000)}).then(r=>r.text()).catch(()=>"");
    const [a1,a2,a3]=await Promise.all([
      _ddg2("CACS FUNDEB "+municipio+" "+uf+" presidente presidenta composição 2024 2025"),
      _ddg2("CACS-FUNDEB "+municipio+" "+uf+" portaria diario oficial composição"),
      _ddg2("site:*.gov.br CACS FUNDEB "+municipio+" "+uf)
    ]);
    function _snipA(h,n){const o=[];const p=h.split('class="result__snippet"');for(let i=1;i<p.length&&o.length<n;i++){const s=p[i].indexOf('>'),e=p[i].indexOf('</a>');if(s>=0&&e>s){const t=p[i].substring(s+1,e).replace(new RegExp('<[^>]+>','g'),'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();if(t&&t.length>10)o.push(t)}}return o;}
    function _urlsA(h,n){const o=[];const p=h.split('class="result__url"');for(let i=1;i<p.length&&o.length<n;i++){const s=p[i].indexOf('>'),e=p[i].indexOf('</a>');if(s>=0&&e>s){const u=p[i].substring(s+1,e).replace(new RegExp('<[^>]+>','g'),'').trim();if(u&&u.length>5)o.push(u)}}return o;}
    function _hrefA(h,n){const o=[];const p=h.split('class="result__a"');for(let i=1;i<p.length&&o.length<n;i++){const m=p[i].match(/href="([^"]+)"/);if(m&&m[1]&&!m[1].includes('duckduckgo'))o.push(m[1]);}return o;}
    const snipsA=[..._snipA(a1,5),..._snipA(a2,4),..._snipA(a3,3)].join(" | ");
    const topUrlsA=[..._hrefA(a1,2),..._hrefA(a2,1)].filter(u=>u.startsWith('http'));
    const pageTextsA=await Promise.all(topUrlsA.slice(0,2).map(u=>fetch(u,{headers:_hdrs2,signal:AbortSignal.timeout(7000)}).then(r=>r.ok?r.text():"").catch(()=>"")));
    function _cleanA(h){return h.replace(new RegExp('<style[^>]*>[\\s\\S]*?</style>','gi'),'').replace(new RegExp('<script[^>]*>[\\s\\S]*?</script>','gi'),'').replace(new RegExp('<[^>]+>','g'),' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\\s+/g,' ').trim().substring(0,2500);}
    const pageContentA=pageTextsA.map(_cleanA).filter(t=>t.length>50).join(" ||| ").substring(0,4000);
    const urlsA=[..._urlsA(a1,3),..._urlsA(a2,2)].join(", ");
    const respA=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",temperature:0.1,response_format:{type:"json_object"},
        messages:[{role:"system",content:"Voce extrai dados do CACS-FUNDEB (Conselho de Acompanhamento e Controle Social do FUNDEB) de municipios brasileiros. So retorne presidente se encontrar nome completo explicitamente mencionado. Nunca invente."},{role:"user",content:"Extraia dados do CACS-FUNDEB de "+municipio+"-"+uf+". TRECHOS DE BUSCA: "+snipsA+" CONTEUDO DAS PAGINAS: "+pageContentA+" URLS ENCONTRADAS: "+urlsA+". Retorne JSON com: presidente (nome completo de quem preside o CACS-FUNDEB, ou vazio), tel, email, endereco, site, encontrado (true so se achou ao menos presidente ou contato oficial confiaveis)."}]
      }),signal:AbortSignal.timeout(20000)
    }).then(r=>r.json()).catch(()=>null);
    let dadosA={};
    try{dadosA=JSON.parse(respA?.choices?.[0]?.message?.content||"{}");}catch(e){}
    const cacsResult={ok:true,dados:dadosA,_ia:true,municipio,uf};
    globalThis._cacsIaCache.set(cacheKey,{data:cacsResult,ts:Date.now()});
    g.json(cacsResult);
  }catch(e){g.json({ok:false,erro:String(e)});}
}),
e.get("/api/cae/ia",async(A,g)=>{
  try{
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey)return g.status(503).json({ok:false});
    const municipio=String(A.query.municipio||"").trim();
    const uf=String(A.query.uf||"").trim().toUpperCase();
    if(!municipio||uf.length!==2)return g.status(400).json({ok:false});
    globalThis._caeIaCache=globalThis._caeIaCache||new Map();
    const cacheKey="cae-ia:"+municipio.toLowerCase()+":"+uf;
    const cached=globalThis._caeIaCache.get(cacheKey);
    if(cached&&Date.now()-cached.ts<86400000)return g.json(cached.data);
    const _hdrs3={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36","Accept-Language":"pt-BR,pt;q=0.9","Accept":"text/html,application/xhtml+xml,*/*;q=0.8"};
    const _ddg3=q=>fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent(q),{headers:_hdrs3,signal:AbortSignal.timeout(9000)}).then(r=>r.text()).catch(()=>"");
    const [e1,e2,e3]=await Promise.all([
      _ddg3("CAE Conselho Alimentação Escolar "+municipio+" "+uf+" presidente presidenta composição 2024 2025"),
      _ddg3("CAE PNAE "+municipio+" "+uf+" portaria diario oficial presidente composição"),
      _ddg3("site:*.gov.br CAE alimentação escolar "+municipio+" "+uf)
    ]);
    function _snipE(h,n){const o=[];const p=h.split('class="result__snippet"');for(let i=1;i<p.length&&o.length<n;i++){const s=p[i].indexOf('>'),e=p[i].indexOf('</a>');if(s>=0&&e>s){const t=p[i].substring(s+1,e).replace(new RegExp('<[^>]+>','g'),'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();if(t&&t.length>10)o.push(t)}}return o;}
    function _urlsE(h,n){const o=[];const p=h.split('class="result__url"');for(let i=1;i<p.length&&o.length<n;i++){const s=p[i].indexOf('>'),e=p[i].indexOf('</a>');if(s>=0&&e>s){const u=p[i].substring(s+1,e).replace(new RegExp('<[^>]+>','g'),'').trim();if(u&&u.length>5)o.push(u)}}return o;}
    function _hrefE(h,n){const o=[];const p=h.split('class="result__a"');for(let i=1;i<p.length&&o.length<n;i++){const m=p[i].match(/href="([^"]+)"/);if(m&&m[1]&&!m[1].includes('duckduckgo'))o.push(m[1]);}return o;}
    const snipsE=[..._snipE(e1,5),..._snipE(e2,4),..._snipE(e3,3)].join(" | ");
    const topUrlsE=[..._hrefE(e1,2),..._hrefE(e2,1)].filter(u=>u.startsWith('http'));
    const pageTextsE=await Promise.all(topUrlsE.slice(0,2).map(u=>fetch(u,{headers:_hdrs3,signal:AbortSignal.timeout(7000)}).then(r=>r.ok?r.text():"").catch(()=>"")));
    function _cleanE(h){return h.replace(new RegExp('<style[^>]*>[\\s\\S]*?</style>','gi'),'').replace(new RegExp('<script[^>]*>[\\s\\S]*?</script>','gi'),'').replace(new RegExp('<[^>]+>','g'),' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\\s+/g,' ').trim().substring(0,2500);}
    const pageContentE=pageTextsE.map(_cleanE).filter(t=>t.length>50).join(" ||| ").substring(0,4000);
    const urlsE=[..._urlsE(e1,3),..._urlsE(e2,2)].join(", ");
    const respE=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",temperature:0.1,response_format:{type:"json_object"},
        messages:[{role:"system",content:"Voce extrai dados do CAE (Conselho de Alimentacao Escolar) de municipios brasileiros. So retorne presidente se encontrar nome completo explicitamente mencionado. Nunca invente."},{role:"user",content:"Extraia dados do CAE de "+municipio+"-"+uf+". TRECHOS DE BUSCA: "+snipsE+" CONTEUDO DAS PAGINAS: "+pageContentE+" URLS ENCONTRADAS: "+urlsE+". Retorne JSON com: presidente (nome completo de quem preside o CAE, ou vazio), tel, email, endereco, site, encontrado (true so se achou ao menos presidente ou contato oficial confiaveis)."}]
      }),signal:AbortSignal.timeout(20000)
    }).then(r=>r.json()).catch(()=>null);
    let dadosE={};
    try{dadosE=JSON.parse(respE?.choices?.[0]?.message?.content||"{}");}catch(e){}
    const caeResult={ok:true,dados:dadosE,_ia:true,municipio,uf};
    globalThis._caeIaCache.set(cacheKey,{data:caeResult,ts:Date.now()});
    g.json(caeResult);
  }catch(e){g.json({ok:false,erro:String(e)});}
}),
`;
    source = source.replace(AI_MARKER, aiRoute + AI_MARKER);
    console.log('[bootstrap] AI explicar-norma + SME IA + CEE IA + SEE IA + CME IA routes applied');
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
          if(idx>-1){const chunk=h.substring(idx,idx+1200);const tm=chunk.match(/class="title"[^>]*>([^<]+)/);if(tm)title=tm[1].trim();}
          if(!title||title.length<10) title=slug.replace(/-/g," ").replace(/^./,c=>c.toUpperCase());
          const dm=slug.match(/(\d{2})-(\d{2})-(\d{4})-/);
          const data=dm?dm[3]+"-"+dm[2]+"-"+dm[1]:new Date().toISOString().slice(0,10);
          if(title.length>15&&!items.find(x=>x.titulo===title)){
            items.push({titulo:title,url,fonte:"CONSED",categoria:"Secretarias Estaduais",data});
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
          return{titulo:title,url:"https://undime.org.br"+l,fonte:"UNDIME",categoria:"Dirigentes Municipais",data:date||new Date().toISOString().slice(0,10)};
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

// ── Contexto Municipal de Saúde ──────────────────────────────────────────────
(function _patchContextoMunicipal() {
  const MARKER = 'e.get("/api/dou/search",async(A,g)=>';
  if (!source.includes(MARKER)) { console.warn('[bootstrap] contexto-municipal — marker not found'); return; }

  const UF_MAP = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'};
  // Previne Brasil: API usa codigos 10,20,30... (multiplos de 10)
  const IND_NOMES = {'10':'Pre-natal (6+ consultas)','20':'Sifilis/HIV na gestacao','30':'Vacinas em dia na gestacao','40':'Hipertensos c/ PA aferida','50':'Diabeticos c/ HbA1c','60':'Citopatologico (colo)','70':'Puericultura em dia','80':'Saude bucal','90':'Aleitamento materno exclusivo','100':'Consulta puerperal'};

  const ufMapJson = JSON.stringify(UF_MAP);
  const indNomesJson = JSON.stringify(IND_NOMES);

  const routeCtx = 'e.get("/api/contexto-municipal/:coMunicipio",async(A,g)=>{\n' +
'  try{\n' +
'    const co=String(A.params.coMunicipio||"");\n' +
'    const co6=co.length===7?co.slice(0,6):co;\n' +
'    if(!co6||!/^\\d{6}$/.test(co6))return g.json({ok:false,erro:"Codigo invalido"});\n' +
'    const ufMap=' + ufMapJson + ';\n' +
'    const indNomes=' + indNomesJson + ';\n' +
'    const uf=ufMap[co6.slice(0,2)]||"";\n' +
'    const BASE="https://apidadosabertos.saude.gov.br";\n' +
'    const _f=async(url)=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(9000)});return r.ok?r.json():null;}catch(fe){return null;}};\n' +
'    const [macroR,previneR,cadastroR,sv1R,sv2R,sv3R,sv4R,cnesHospR]=await Promise.allSettled([\n' +
'      _f(BASE+"/macrorregiao-e-regiao-de-saude/municipio?codigo_municipio="+co6+"&limit=1"),\n' +
'      _f(BASE+"/atencao-primaria/indicador-desempenho-programa-previne-brasil?codigo_municipio="+co6+"&limit=60"),\n' +
'      _f(BASE+"/atencao-primaria/cadastro-vinculado-programa-previne-brasil?codigo_municipio_ibge="+co6+"&limit=50"),\n' +
'      _f(BASE+"/sisvan/estado-nutricional?codigo_municipio="+co6+"&codigo_fase_vida=1&limit=100"),\n' +
'      _f(BASE+"/sisvan/estado-nutricional?codigo_municipio="+co6+"&codigo_fase_vida=2&limit=100"),\n' +
'      _f(BASE+"/sisvan/estado-nutricional?codigo_municipio="+co6+"&codigo_fase_vida=3&limit=80"),\n' +
'      _f(BASE+"/sisvan/estado-nutricional?codigo_municipio="+co6+"&codigo_fase_vida=4&limit=50"),\n' +
'      _f(BASE+"/cnes/estabelecimentos?codigo_municipio="+co6+"&codigo_tipo_unidade=5&limit=20"),\n' +
'    ]);\n' +
'    const macro=(macroR.status==="fulfilled"&&macroR.value&&macroR.value.macrorregiao_regiao_saude_municipios&&macroR.value.macrorregiao_regiao_saude_municipios[0])||null;\n' +
'    const previneAll=(previneR.status==="fulfilled"&&previneR.value&&previneR.value.sisab_indicador_desempenho)||[];\n' +
'    const cadastroAll=(cadastroR.status==="fulfilled"&&cadastroR.value&&cadastroR.value.sisab_cadastro_vinculado)||[];\n' +
'    const cnesHospArr=(cnesHospR.status==="fulfilled"&&cnesHospR.value&&cnesHospR.value.estabelecimentos)||[];\n' +
'    // Previne Brasil: group all quadrimestres per indicator (serie historica dentro de 2024)\n' +
'    const previneValidas=previneAll.filter(function(i){return i.visao_equipe==="validas";});\n' +
'    const indByCode={};\n' +
'    for(const ind of previneValidas){\n' +
'      const k=String(ind.codigo_tipo_indicador);\n' +
'      if(!indByCode[k])indByCode[k]=[];\n' +
'      indByCode[k].push({q:ind.quadrimestre,p:ind.percentual_quadrimestre,n:ind.numerador,d:ind.denominador_utilizador,competencia:ind.competencia||0});\n' +
'    }\n' +
'    const indicadores=Object.entries(indByCode).map(function(entry){\n' +
'      var codigo=entry[0]; var series=entry[1];\n' +
'      series.sort(function(a,b){return a.competencia-b.competencia;});\n' +
'      var latest=series[series.length-1];\n' +
'      return{codigo:Number(codigo),nome:indNomes[codigo]||("Indicador "+codigo),percentual:latest.p,quadrimestre:latest.q,serie:series.map(function(s){return{q:s.q,p:s.p};})};\n' +
'    }).sort(function(a,b){return a.codigo-b.codigo;});\n' +
'    // Equipes (atenção primária)\n' +
'    const teamMap={};\n' +
'    for(const c of cadastroAll){const k=c.sigla_equipe+":"+c.situacao_equipe;if(!teamMap[k]||c.competencia_referencia>teamMap[k].competencia_referencia)teamMap[k]=c;}\n' +
'    const equipes=Object.values(teamMap).map(function(c){return{tipo:c.sigla_equipe,situacao:c.situacao_equipe,pessoas:c.pessoas_vinculadas_equipe_municipio,competencia:c.competencia_referencia};});\n' +
'    // Populacao e cobertura\n' +
'    const firstInd=indicadores[0];\n' +
'    const populacao=(firstInd&&previneValidas[0]&&previneValidas[0].populacao)||(macro&&macro.populacao_estimada_ibge_2022)||null;\n' +
'    const cadastrosTotal=(firstInd&&previneValidas[0]&&previneValidas[0].cadastro)||null;\n' +
'    const coberturaAP=populacao&&cadastrosTotal?Math.round(cadastrosTotal/populacao*100):null;\n' +
'    // CNES hospitais — infraestrutura e especialidades\n' +
'    const CAPS_LABELS={"centro_cirurgico":"Cirurgia","centro_obstetrico":"Obstetricia","centro_neonatal":"Neonatal/UTI Neo","atendimento_hospitalar":"Internacao","servico_apoio":"Servicos de Apoio","atendimento_ambulatorial":"Ambulatorio"};\n' +
'    const hospitais=cnesHospArr.map(function(h){\n' +
'      var caps=[];\n' +
'      var fields=["centro_cirurgico","centro_obstetrico","centro_neonatal","atendimento_hospitalar","servico_apoio","atendimento_ambulatorial"];\n' +
'      for(var i=0;i<fields.length;i++){if(h["estabelecimento_possui_"+fields[i]]===1)caps.push(CAPS_LABELS[fields[i]]);}\n' +
'      return{nome:(h.nome_fantasia||h.nome_razao_social||"").replace(/\\s+/g," ").trim(),esfera:h.descricao_esfera_administrativa||"",gestao:h.tipo_gestao||"",caps:caps};\n' +
'    });\n' +
'    // SISVAN nutricional por faixa\n' +
'    function _svCat(recs,campo){const cats={};for(const r of recs){const v=(r[campo]||"Sem dado").replace(/[\\u00c0-\\u024f]/g,function(c){return c.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");});cats[v]=(cats[v]||0)+1;}return cats;}\n' +
'    function _svImc(recs){const cats={};for(const r of recs){const imc=parseFloat(r.imc||0);const v=imc>=30?"Obesidade":imc>=25?"Sobrepeso":imc>=18.5?"Adequado":imc>0?"Magreza":"Sem dado";cats[v]=(cats[v]||0)+1;}return cats;}\n' +
'    const sv1=(sv1R.status==="fulfilled"&&sv1R.value&&sv1R.value.estados_nutricionais)||[];\n' +
'    const sv2=(sv2R.status==="fulfilled"&&sv2R.value&&sv2R.value.estados_nutricionais)||[];\n' +
'    const sv3=(sv3R.status==="fulfilled"&&sv3R.value&&sv3R.value.estados_nutricionais)||[];\n' +
'    const sv4=(sv4R.status==="fulfilled"&&sv4R.value&&sv4R.value.estados_nutricionais)||[];\n' +
'    const sisvan=[];\n' +
'    if(sv1.length>0)sisvan.push({fase:"Criancas",rotulo:"Criancas",count:sv1.length,categorias:_svCat(sv1,"crianca_imc_x_idade")});\n' +
'    if(sv2.length>0)sisvan.push({fase:"Adolescentes",rotulo:"Adolescentes",count:sv2.length,categorias:_svCat(sv2,"adolescente_imc_x_idade")});\n' +
'    if(sv3.length>0)sisvan.push({fase:"Adultos",rotulo:"Adultos",count:sv3.length,categorias:_svImc(sv3)});\n' +
'    if(sv4.length>0)sisvan.push({fase:"Idosos",rotulo:"Idosos",count:sv4.length,categorias:_svImc(sv4)});\n' +
'    const munNome=(macro&&macro.municipio||"").replace(/^[A-Z]{2}\\s*-\\s*/,"");\n' +
'    // ── Bolsa Familia (Portal da Transparencia) ─────────────────────────────\n' +
'    let bf=null;\n' +
'    try{\n' +
'      const _bfKey=process.env.PORTAL_TRANSPARENCIA_KEY||"";\n' +
'      if(_bfKey&&co.length===7){\n' +
'        const _now=new Date();\n' +
'        const _months=[];\n' +
'        for(let _i=1;_i<=6;_i++){const _d=new Date(_now.getFullYear(),_now.getMonth()-_i,1);_months.push(String(_d.getFullYear())+String(_d.getMonth()+1).padStart(2,"0"));}\n' +
'        const _bfResults=await Promise.all(_months.map(function(_m){return fetch("https://api.portaldatransparencia.gov.br/api-de-dados/novo-bolsa-familia-por-municipio?mesAno="+_m+"&codigoIbge="+co+"&pagina=1",{headers:{"chave-api-dados":_bfKey},signal:AbortSignal.timeout(8000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});}));\n' +
'        const _bfSerie=_bfResults.map(function(r,i){const rec=Array.isArray(r)&&r[0]?r[0]:null;return rec?{mes:_months[i],familias:rec.quantidadeBeneficiados,valor:rec.valor}:null;}).filter(Boolean).reverse();\n' +
'        if(_bfSerie.length>0){const _last=_bfSerie[_bfSerie.length-1];bf={familias:_last.familias,valor:_last.valor,media:Math.round(_last.valor/_last.familias),mes:_last.mes,serie:_bfSerie};}\n' +
'      }\n' +
'    }catch(_bfErr){console.warn("[ctx-mun] bf erro:",String(_bfErr));}\n' +
'    // ── BPC — Beneficio de Prestacao Continuada ───────────────────────────\n' +
'    let bpc=null;\n' +
'    try{\n' +
'      const _bpcKey=process.env.PORTAL_TRANSPARENCIA_KEY||"";\n' +
'      if(_bpcKey&&co.length===7){\n' +
'        const _now=new Date();\n' +
'        const _months=[];\n' +
'        for(let _i=1;_i<=5;_i++){const _d=new Date(_now.getFullYear(),_now.getMonth()-_i,1);_months.push(String(_d.getFullYear())+String(_d.getMonth()+1).padStart(2,"0"));}\n' +
'        const _bpcResults=await Promise.all(_months.map(function(_m){return fetch("https://api.portaldatransparencia.gov.br/api-de-dados/bpc-por-municipio?mesAno="+_m+"&codigoIbge="+co+"&pagina=1",{headers:{"chave-api-dados":_bpcKey},signal:AbortSignal.timeout(8000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});}));\n' +
'        const _bpcSerie=_bpcResults.map(function(r,i){const rec=Array.isArray(r)&&r[0]?r[0]:null;return rec?{mes:_months[i],beneficiados:rec.quantidadeBeneficiados,valor:rec.valor}:null;}).filter(Boolean).reverse();\n' +
'        if(_bpcSerie.length>0){const _last=_bpcSerie[_bpcSerie.length-1];bpc={beneficiados:_last.beneficiados,valor:_last.valor,media:Math.round(_last.valor/_last.beneficiados),mes:_last.mes,serie:_bpcSerie};}\n' +
'      }\n' +
'    }catch(_bpcErr){console.warn("[ctx-mun] bpc erro:",String(_bpcErr));}\n' +
'    // ── Censo 2022 (IBGE SIDRA) — perfil demografico municipal ──────────────\n' +
'    let censo2022=null;\n' +
'    try{\n' +
'      if(co.length===7){\n' +
'        const [_s9955,_s9951]=await Promise.all([\n' +
'          fetch("https://apisidra.ibge.gov.br/values/t/9955/n6/"+co+"/v/all/p/2022",{signal:AbortSignal.timeout(9000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),\n' +
'          fetch("https://apisidra.ibge.gov.br/values/t/9951/n6/"+co+"/v/all/p/2022",{signal:AbortSignal.timeout(9000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})\n' +
'        ]);\n' +
'        const _fv=function(arr,substr){if(!Array.isArray(arr))return null;const r=arr.find(function(x){return x.D2N&&x.D2N.includes(substr)&&x.V&&x.V!=="V"&&x.V!=="Valor"&&x.V!=="..."&&!isNaN(parseFloat(x.V));});return r?parseFloat(r.V):null;};\n' +
'        const _env=_fv(_s9955,"Índice de envelhecimento (Id");\n' +
'        const _imed=_fv(_s9955,"Idade mediana");\n' +
'        const _rsex=_fv(_s9955,"Razão de sexo");\n' +
'        const _p60=_fv(_s9955,"Pessoas de 60 anos");\n' +
'        const _p014=_fv(_s9955,"Pessoas de 0 a 14");\n' +
'        const _hom=_fv(_s9955,"homens");\n' +
'        const _mul=_fv(_s9955,"mulheres");\n' +
'        const _talfab=_fv(_s9951,"Taxa de alfabetização das pessoas de 15");\n' +
'        const _nalfab=_fv(_s9951,"Pessoas de 15 anos ou mais de idade alfabet");\n' +
'        const _t15=_fv(_s9951,"Pessoas de 15 anos ou mais de idade");\n' +
'        if(_env!==null||_talfab!==null){censo2022={indice_envelhecimento:_env,idade_mediana:_imed,razao_sexo:_rsex,pop_60plus:_p60,pop_0_14:_p014,homens:_hom,mulheres:_mul,taxa_alfabetizacao_15plus:_talfab,alfabetizados_15plus:_nalfab,total_15plus:_t15};}\n' +
'      }\n' +
'    }catch(_c22Err){console.warn("[ctx-mun] censo2022 erro:",String(_c22Err));}\n' +
'    // ── Dengue (InfoDengue/Fiocruz) ─────────────────────────────────────────\n' +
'    let dengue=null;\n' +
'    try{\n' +
'      if(co.length===7){\n' +
'        const _yr=new Date().getFullYear();\n' +
'        const [_dngCurr,_dngPrev]=await Promise.all([\n' +
'          fetch("https://info.dengue.mat.br/api/alertcity?geocode="+co+"&disease=dengue&format=json&ew_start=1&ew_end=53&ey_start="+_yr+"&ey_end="+_yr,{signal:AbortSignal.timeout(9000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),\n' +
'          fetch("https://info.dengue.mat.br/api/alertcity?geocode="+co+"&disease=dengue&format=json&ew_start=1&ew_end=53&ey_start="+(_yr-1)+"&ey_end="+(_yr-1),{signal:AbortSignal.timeout(9000)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})\n' +
'        ]);\n' +
'        if(Array.isArray(_dngCurr)&&_dngCurr.length>0){\n' +
'          const _sorted=_dngCurr.slice().sort(function(a,b){return b.SE-a.SE;});\n' +
'          const _atual=_sorted[0];\n' +
'          const _serie=_sorted.slice(0,5).reverse();\n' +
'          const _accCurr=_dngCurr.reduce(function(s,x){return s+x.casos;},0);\n' +
'          const _accPrev=Array.isArray(_dngPrev)?_dngPrev.reduce(function(s,x){return s+x.casos;},0):null;\n' +
'          const _NIVEL={"1":"Verde","2":"Alerta","3":"Alto","4":"Muito Alto"};\n' +
'          dengue={nivel:_atual.nivel,nivel_nome:_NIVEL[String(_atual.nivel)]||"Desconhecido",semana:"SE"+String(_atual.SE).slice(4)+"/"+String(_atual.SE).slice(0,4),casos:_atual.casos,casos_est:Math.round(_atual.casos_est||0),inc100k:Math.round((_atual.p_inc100k||0)*10)/10,rt:Math.round((_atual.Rt||0)*100)/100,p_rt1:Math.round((_atual.p_rt1||0)*100),accum_ano:_accCurr,accum_ano_ant:_accPrev,ano:_yr,serie:_serie.map(function(s){return{se:"SE"+String(s.SE).slice(4),casos:s.casos,nivel:s.nivel,inc100k:Math.round((s.p_inc100k||0)*10)/10};})}\n' +
'        }\n' +
'      }\n' +
'    }catch(_dngErr){console.warn("[ctx-mun] dengue erro:",String(_dngErr));}\n' +
'    // ── Indicadores SUS bulk (saude_indicadores_municipio) ──────────────────\n' +
'    let saude_db=null;\n' +
'    try{\n' +
'      const _pool=globalThis._pgPool;\n' +
'      if(_pool&&co.length===7){\n' +
'        const _qres=await _pool.query("SELECT DISTINCT ON (fonte,indicador) fonte,indicador,ano,valor,denominador,unidade,recorte,metadata FROM saude_indicadores_municipio WHERE co_municipio=$1 AND fonte IN (\'SISAGUA\',\'SINASC\',\'SIM\',\'PNI\',\'SINAN\') ORDER BY fonte,indicador,ano DESC NULLS LAST",[co]);\n' +
'        if(_qres.rows.length>0){\n' +
'          saude_db={};\n' +
'          for(const _r of _qres.rows){\n' +
'            const _f=_r.fonte;if(!saude_db[_f])saude_db[_f]=[];\n' +
'            saude_db[_f].push({indicador:_r.indicador,ano:_r.ano,valor:Number(_r.valor),denominador:_r.denominador!=null?Number(_r.denominador):null,unidade:_r.unidade,recorte:_r.recorte,metadata:_r.metadata});\n' +
'          }\n' +
'        }\n' +
'      }\n' +
'    }catch(_dbErr){console.warn("[ctx-mun] saude_db erro:",String(_dbErr));}\n' +
'    g.json({ok:true,municipio:munNome,uf:uf,regiao_pais:(macro&&macro.regiao_pais)||"",regiao_saude:(macro&&macro.regiao_saude)||"",macrorregiao_saude:(macro&&macro.macrorregiao_saude)||"",populacao:populacao,cadastros_atencao_primaria:cadastrosTotal,cobertura_ap:coberturaAP,equipes_saude:equipes,indicadores_previne:indicadores,hospitais:hospitais,sisvan:sisvan,bf:bf,bpc:bpc,censo2022:censo2022,dengue:dengue,saude_db:saude_db});\n' +
'  }catch(err){console.error("[ctx-mun] erro:",String(err));g.json({ok:false,erro:String(err)});}\n' +
'}),\n';

  source = source.replace(MARKER, routeCtx + MARKER);
  console.log('[bootstrap] contexto-municipal route applied (pre-compile)');
})();

// ── Usage Analytics (runtime patch on index.cjs.gz source) ───────────────────
(function _patchUsageAnalytics() {
  const TRACK_MARKER = 'e.post("/api/analytics/track",';
  const ADMIN_MARKER = 'e.get("/api/admin/usage-analytics",Hr,';
  if (source.includes(TRACK_MARKER) && source.includes(ADMIN_MARKER)) {
    console.log('[bootstrap] usage analytics routes already present');
    return;
  }

  const HELPER_ANCHOR = 'function Tn(t,e){';
  if (!source.includes(HELPER_ANCHOR)) {
    console.warn('[bootstrap] usage analytics helper patch NOT applied — anchor not found');
    return;
  }

  const HELPERS =
    'const adminUsageEvents=[];'+
    'const MAX_ADMIN_USAGE_EVENTS=5000;'+
    'function normalizeUsageEvent(A,g){'+
      'if(!g||typeof g!=="object")throw new Error("evento invalido");'+
      'let E=typeof g.path==="string"&&g.path?g.path:String(A&&A.path||"/").slice(0,200),v=Number(g.hourLocal);'+
      'isNaN(v)&&(v=new Date().getHours());'+
      'return{ts:Date.now(),eventType:String(g.eventType||"interaction").slice(0,32),action:String(g.action||"click").slice(0,24),path:E,label:String(g.label||"").slice(0,120),targetType:String(g.targetType||"geral").slice(0,40),targetId:String(g.targetId||"").slice(0,120),section:String(g.section||"").slice(0,120),hourLocal:Math.max(0,Math.min(23,Math.floor(v))),timezone:String(g.timezone||"").slice(0,64),locationText:String(g.locationText||"nao informado").slice(0,64)}'+
    '}'+
    'function pushUsageEvent(A){adminUsageEvents.push(A);adminUsageEvents.length>MAX_ADMIN_USAGE_EVENTS&&adminUsageEvents.splice(0,adminUsageEvents.length-MAX_ADMIN_USAGE_EVENTS)}'+
    'function aggregateUsageEvents(A){'+
      'let g=Date.now()-(Number(A)||7)*864e5,E=adminUsageEvents.filter(c=>c.ts>=g),v=E.length,x={},w={},T={},I={},D={},B={click:0,view:0,download:0,search:0,other:0};'+
      'for(let c of E){'+
        'let d=c.path||"(sem rota)",f=String(c.hourLocal);x[d]=(x[d]||0)+1,w[f]=(w[f]||0)+1;'+
        'let m=c.locationText||"nao informado";T[m]=(T[m]||0)+1;'+
        'let AKey=c.label||c.targetId||"(sem item)",gKey=c.targetType||"geral";I[gKey]||(I[gKey]={}),I[gKey][AKey]=(I[gKey][AKey]||0)+1;'+
        'let aKey=c.action||"click";aKey==="download"?B.download++:aKey==="view"?B.view++:aKey==="search"?B.search++:aKey==="click"?B.click++:B.other++;'+
        'let sKey=(c.targetType||"geral")+"::"+AKey;D[sKey]||(D[sKey]={targetType:c.targetType||"geral",label:AKey,total:0}),D[sKey].total++'+
      '}'+
      'let N=M=>Object.entries(M).map(([L,te])=>({key:L,total:te})).sort((L,te)=>te.total-L.total);'+
      'let R={};for(let[M,L]of Object.entries(I))R[M]=N(L).slice(0,10).map(te=>({label:te.key,total:te.total}));'+
      'return{totalEvents:v,actions:B,topRoutes:N(x).slice(0,10).map(M=>({path:M.key,total:M.total})),topHours:N(w).slice(0,24).map(M=>({hour:Number(M.key),total:M.total})),topLocations:N(T).slice(0,10).map(M=>({location:M.key,total:M.total})),byTargetType:R,topTargets:Object.values(D).sort((M,L)=>L.total-M.total).slice(0,20)}'+
    '}';

  source = source.replace(HELPER_ANCHOR, HELPERS + HELPER_ANCHOR);

  const LOGIN_ANCHOR = 'e.post("/api/admin/login",(A,g)=>{';
  if (!source.includes(LOGIN_ANCHOR)) {
    console.warn('[bootstrap] usage analytics route patch NOT applied — login anchor not found');
    return;
  }

  const ROUTES =
    'e.post("/api/analytics/track",(A,g)=>{'+
      'try{let E=normalizeUsageEvent(A,A.body);pushUsageEvent(E),g.status(202).json({ok:!0})}catch(E){g.status(400).json({ok:!1,message:E&&E.message||"evento invalido"})}'+
    '}),'+
    'e.get("/api/admin/usage-analytics",Hr,(A,g)=>{'+
      'try{let E=Math.min(Math.max(parseInt(String(A.query.days||"7"),10)||7,1),90),v=aggregateUsageEvents(E);g.json(v)}catch(E){g.status(500).json({message:E&&E.message||"Erro ao carregar analytics"})}'+
    '}),';

  source = source.replace(LOGIN_ANCHOR, ROUTES + LOGIN_ANCHOR);
  console.log('[bootstrap] usage analytics patch applied');
})();

// ── PATCH: inject vaccination calendar events into prazos-educacionais ────────
(function _patchVacinacao() {
  const VACA_MARKER = 'g.json({ok:!0,prazos:x,ano:v})';
  if (!source.includes(VACA_MARKER)) {
    console.warn('[bootstrap] vacinacao patch: marker not found, skipping');
    return;
  }
  const vacinaJson = JSON.stringify([
    { titulo: "Campanha Nacional de Vacinação contra Influenza — Abertura", descricao: "Início da Campanha Nacional. Grupos prioritários: crianças de 6 meses a 5 anos, gestantes, puérperas, idosos ≥60 anos, professores e profissionais de saúde. A escola pode mobilizar famílias e ceder espaço como ponto de apoio.", mes: 3, categoria: "VACINAÇÃO", fonte: "PNI/Ministério da Saúde", urgencia: "alta", url: "https://www.gov.br/saude/pt-br/vacinacao" },
    { titulo: "Campanha Nacional de Vacinação contra Influenza — Dia D", descricao: "Intensificação da campanha. Verificar cobertura vacinal de alunos e mobilizar famílias para a vacinação. Professores e funcionários de escolas são público-alvo prioritário.", mes: 4, categoria: "VACINAÇÃO", fonte: "PNI/Ministério da Saúde", urgencia: "alta", url: "https://www.gov.br/saude/pt-br/vacinacao" },
    { titulo: "Campanha Nacional de Vacinação contra Poliomielite — Dia D", descricao: "Vacinação de crianças menores de 5 anos contra a Poliomielite. Escolas podem ser utilizadas como pontos de vacinação. A diretora pode colaborar com a Secretaria de Saúde para facilitar o acesso das famílias.", mes: 5, categoria: "VACINAÇÃO", fonte: "PNI/Ministério da Saúde", urgencia: "alta", url: "https://www.gov.br/saude/pt-br/vacinacao" },
    { titulo: "Verificação da Carteira de Vacinação — Matrícula", descricao: "Período recomendado para verificar a situação vacinal dos estudantes. A exigência do cartão de vacinação atualizado na matrícula é prevista pelo Estatuto da Criança e do Adolescente (ECA, art. 14). Registrar pendências e orientar responsáveis.", mes: 2, categoria: "VACINAÇÃO", fonte: "PNI/MS — ECA art. 14", urgencia: "media" },
    { titulo: "Campanha Nacional de Multivacinação — Dia D", descricao: "Campanha voltada para crianças menores de 5 anos, para atualização de todas as vacinas do calendário. A escola pode ser parceira na comunicação com as famílias. Verificar cobertura vacinal da comunidade escolar.", mes: 8, categoria: "VACINAÇÃO", fonte: "PNI/Ministério da Saúde", urgencia: "alta", url: "https://www.gov.br/saude/pt-br/vacinacao" },
    { titulo: "Campanha Nacional de Vacinação contra o Sarampo", descricao: "Vacinação de crianças de 1 a 4 anos e adolescentes/adultos sem comprovante de duas doses. O retorno das aulas pós-recesso é momento estratégico para mobilização das famílias. Verificar cobertura vacinal dos alunos.", mes: 10, categoria: "VACINAÇÃO", fonte: "PNI/Ministério da Saúde", urgencia: "alta", url: "https://www.gov.br/saude/pt-br/vacinacao" },
    { titulo: "Vacinação HPV e Meningocócica — Escolas (2ª Fase)", descricao: "Continuidade da vacinação intraescolar contra HPV (meninas 9-14 anos, meninos 11-14 anos) e Meningocócica ACWY (adolescentes). Coordenar com a Secretaria Municipal de Saúde o agendamento das equipes na escola.", mes: 9, categoria: "VACINAÇÃO", fonte: "PNI/Ministério da Saúde", urgencia: "media", url: "https://www.gov.br/saude/pt-br/vacinacao" },
    { titulo: "Vacinação HPV e Meningocócica — Escolas (1ª Fase)", descricao: "Início da vacinação intraescolar contra HPV (meninas 9-14 anos, meninos 11-14 anos) e Meningocócica ACWY (adolescentes 11-14 anos). Articular com a Secretaria Municipal de Saúde o calendário de visitas às escolas e autorizar a vacinação no ambiente escolar.", mes: 3, categoria: "VACINAÇÃO", fonte: "PNI/Ministério da Saúde", urgencia: "media", url: "https://www.gov.br/saude/pt-br/vacinacao" },
    { titulo: "Balanço Anual de Cobertura Vacinal", descricao: "Momento de revisão da situação vacinal dos alunos. Identificar estudantes sem comprovante de vacinação completa e orientar responsáveis antes das matrículas de 2027. O ECA exige apresentação da carteira de vacinação atualizada.", mes: 11, categoria: "VACINAÇÃO", fonte: "PNI/MS — ECA art. 14", urgencia: "informativo" }
  ]);
  source = source.replace(
    VACA_MARKER,
    `const _vacEvts=${vacinaJson};const _allPrazos=[...x,..._vacEvts];g.json({ok:!0,prazos:_allPrazos,ano:v})`
  );
  console.log('[bootstrap] vacinacao patch applied:', JSON.parse(vacinaJson).length, 'eventos');
})();

// ── 3h. Patch: /api/seguranca-municipio/:coIbge — Security data ──
// Primary source: local DB (SINAN violence cases + SIM external-cause deaths).
// Bonus: attempts SINESP/dados.gov.br CKAN API (UF level) — currently returns 401.
const _SEG_MUN_ANCHOR = 'e.get("/api/health",(A,g)=>{g.status(200).json({ok:!0,ts:Date.now()})}),';
const _SEG_MUN_ROUTE =
  'e.get("/api/seguranca-municipio/:coIbge",async(A,g)=>{' +
    'try{' +
      'const E=String(A.params.coIbge||"").replace(/\\D/g,"");' +
      'if(!E||E.length<6)return g.status(400).json({ok:!1,error:"C\\xF3digo IBGE inv\\xE1lido"});' +
      'const _ufMap={11:"RO",12:"AC",13:"AM",14:"RR",15:"PA",16:"AP",17:"TO",21:"MA",22:"PI",23:"CE",24:"RN",25:"PB",26:"PE",27:"AL",28:"SE",29:"BA",31:"MG",32:"ES",33:"RJ",35:"SP",41:"PR",42:"SC",43:"RS",50:"MS",51:"MT",52:"GO",53:"DF"};' +
      'const _uf=_ufMap[parseInt(E.slice(0,2))]||null;' +
      // --- 1. Query local DB for municipal security indicators (SINAN + SIM) ---
      'const _naturezas=[];let _anoRef=null;' +
      'const _pool=globalThis._pgPool;' +
      'if(_pool){' +
        'try{' +
          'const _qr=await _pool.query(' +
            '"SELECT DISTINCT ON (indicador) indicador,valor::numeric AS valor,unidade,ano FROM saude_indicadores_municipio WHERE co_municipio=$1 AND fonte IN(\'SINAN\',\'SIM\') AND indicador IN(\'sinan_violencia_casos\',\'sim_obitos_externos\',\'sim_obitos_total\') ORDER BY indicador,ano DESC NULLS LAST",' +
            '[E]' +
          ');' +
          'const _lmap={sinan_violencia_casos:"Viol\\xEAncia Interpessoal / Autoprovocada (SINAN/MS)",sim_obitos_externos:"\\xD3bitos por Causas Externas (SIM/MS)",sim_obitos_total:"Total de \\xD3bitos \\u2014 todas as causas (SIM/MS)"};' +
          'for(const _r of _qr.rows){' +
            'const _v=parseFloat(_r.valor)||0;' +
            'if(!_anoRef||Number(_r.ano)>Number(_anoRef))_anoRef=_r.ano;' +
            '_naturezas.push({natureza:_lmap[_r.indicador]||_r.indicador,quantidade:Math.round(_v),unidade:_r.unidade||"casos",nivel:"Municipal"});' +
          '}' +
        '}catch(_dbE){console.warn("[seguranca] DB erro:",_dbE.message);}' +
      '}' +
      // --- 2. Try SINESP CKAN (currently 401 — attempt anyway, use if it works) ---
      'let _sinespNat=null;let _sinespAno=null;let _sinespErr=null;' +
      'if(_uf){' +
        'try{' +
          'const _pkgR=await fetch("https://dados.gov.br/api/3/action/package_show?id=sinesp-uf-ano-natureza-por-ocorrencia",{signal:AbortSignal.timeout(8000),headers:{"Accept":"application/json","User-Agent":"ChegoAContaDiretora/1.0"}});' +
          'if(_pkgR.ok){' +
            'const _pkgD=await _pkgR.json();' +
            'const _res=(_pkgD&&_pkgD.result&&_pkgD.result.resources)||[];' +
            'const _act=_res.find(r=>r.datastore_active===true)||_res[0];' +
            'if(_act&&_act.id){' +
              'const _dR=await fetch("https://dados.gov.br/api/3/action/datastore_search?resource_id="+encodeURIComponent(_act.id)+"&filters="+encodeURIComponent(JSON.stringify({UF:_uf}))+"&limit=5000",{signal:AbortSignal.timeout(15000),headers:{"Accept":"application/json","User-Agent":"ChegoAContaDiretora/1.0"}});' +
              'if(_dR.ok){' +
                'const _dD=await _dR.json();' +
                'const _recs=(_dD&&_dD.result&&_dD.result.records)||[];' +
                'if(_recs.length){' +
                  'const _anos=_recs.map(r=>Number(r.ANO||r.ano||r.Ano||0)).filter(n=>n>0);' +
                  '_sinespAno=_anos.length?Math.max(..._anos):null;' +
                  'if(_sinespAno){' +
                    'const _ra=_recs.filter(r=>Number(r.ANO||r.ano||r.Ano||0)===_sinespAno);' +
                    'const _bn={};' +
                    'for(const r of _ra){const _n=String(r.NATUREZA||r.natureza||r.Natureza||r.TIPO_CRIME||r.tipo_crime||"Outros").trim();const _q=Number(r.QTDE||r.qtde||r.QUANTIDADE||r.quantidade||r.OCORRENCIAS||r.ocorrencias||0);_bn[_n]=(_bn[_n]||0)+_q;}' +
                    '_sinespNat=Object.entries(_bn).map(([k,v])=>({natureza:k,quantidade:v,nivel:"UF "+_uf})).sort((a,b)=>b.quantidade-a.quantidade).slice(0,12);' +
                  '}' +
                '}' +
              '}else{_sinespErr="HTTP "+_dR.status;}' +
            '}' +
          '}else{_sinespErr="HTTP "+_pkgR.status;}' +
        '}catch(_se){_sinespErr=_se.message;console.warn("[seguranca] SINESP erro:",_se.message);}' +
      '}' +
      // --- 3. Build response ---
      'const _hasDb=_naturezas.length>0;' +
      'const _hasSinesp=_sinespNat&&_sinespNat.length>0;' +
      'if(!_hasDb&&!_hasSinesp){' +
        'return g.json({ok:!1,co_municipio:E,uf:_uf,error:"Dados de seguran\\xE7a n\\xE3o dispon\\xEDveis no momento",naturezas:[],fonte:"SINAN/MS, SIM/MS, SINESP/SENASP",sinesp_erro:_sinespErr});' +
      '}' +
      'const _allNat=[..._naturezas,...(_sinespNat||[])];' +
      'const _fonte=_hasDb&&_hasSinesp' +
        '?"SINAN/MS e SIM/MS (dados municipais) + SINESP/SENASP via dados.gov.br (UF "+_uf+")"' +
        ':_hasDb' +
          '?"SINAN — Sistema de Informa\\xE7\\xE3o de Agravos de Notifica\\xE7\\xE3o e SIM — Sistema de Informa\\xE7\\xF5es sobre Mortalidade (Minist\\xE9rio da Sa\\xFAde)"' +
          ':"SINESP / Secretaria Nacional de Seguran\\xE7a P\\xFAblica (SENASP) via dados.gov.br";' +
      'const _nota=_hasDb' +
        '?"Dados municipais de SINAN: agravos de viol\\xEAncia interpessoal e autoprovocada notificados. SIM: \\xF3bitos registrados em Declara\\xE7\\xF5es de \\xD3bito. N\\xEDvel: Munic\\xEDpio."+(_hasSinesp?" SINESP UF "+_uf+" ("+_sinespAno+"): boletins de ocorr\\xEAncia policiais registrados.":"")' +
        ':"Dados de ocorr\\xEAncias criminais registradas em boletim de ocorr\\xEAncia. N\\xEDvel estadual (UF "+_uf+").";' +
      'return g.json({ok:!0,co_municipio:E,uf:_uf,ano:_anoRef||_sinespAno,naturezas:_allNat,municipal_db:_hasDb?_naturezas:null,sinesp_uf:_hasSinesp?{ano:_sinespAno,naturezas:_sinespNat}:null,fonte:_fonte,nota:_nota,sinesp_disponivel:_hasSinesp,sinesp_erro:_sinespErr||null});' +
    '}catch(_ge){console.error("[seguranca]",_ge.message);return g.status(500).json({ok:!1,error:_ge.message,naturezas:[],fonte:"SINAN/SIM/SINESP"});}' +
  '}),';
if (source.indexOf(_SEG_MUN_ANCHOR) !== -1) {
  source = source.replace(_SEG_MUN_ANCHOR, _SEG_MUN_ANCHOR + _SEG_MUN_ROUTE);
  console.log('[bootstrap] /api/seguranca-municipio endpoint patch applied (DB-primary + SINESP-bonus)');
} else {
  console.warn('[bootstrap] /api/seguranca-municipio patch NOT applied — anchor not found');
}

// ── 3i. Patch: /api/saude-violencia/:coIbge — DataSUS violence/external causes ──
// Queries apidadosabertos.saude.gov.br for SISVAN data related to the municipality.
// Also provides direct links to DataSUS SIM and SIH.
const _SAUD_VIO_ANCHOR = 'e.get("/api/health",(A,g)=>{g.status(200).json({ok:!0,ts:Date.now()})}),';
const _SAUD_VIO_ROUTE =
  'e.get("/api/saude-violencia/:coIbge",async(A,g)=>{' +
    'try{' +
      'const E=String(A.params.coIbge||"").replace(/\\D/g,"");' +
      'if(!E||E.length<6)return g.status(400).json({ok:!1,error:"C\\xF3digo IBGE inv\\xE1lido"});' +
      'const co6=E.length===7?E.slice(0,6):E;' +
      'const co7=E.length===7?E:E+"0";' +
      'const BASE="https://apidadosabertos.saude.gov.br";' +
      'const _hdr={"User-Agent":"ChegoAContaDiretora/1.0","Accept":"application/json"};' +
      // Fetch CNES for causas externas hospitals (trauma centers) and SISVAN
      'let internacoes=null;let obitos=null;let violencia_notificada=null;' +
      'const _links=[' +
        '{nome:"SIM — Mortalidade por causas externas (DataSUS)",url:"http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sim/cnv/ext10uf.def",desc:"Óbitos por causas externas (CID V01-Y98) por município — Sistema de Informação sobre Mortalidade"},' +
        '{nome:"SIH — Internações por causas externas (DataSUS)",url:"http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sih/cnv/qiuf.def",desc:"Internações hospitalares por causas externas por município — Sistema de Informação Hospitalar"},' +
        '{nome:"SINAN — Violência interpessoal (DataSUS)",url:"http://tabnet.datasus.gov.br/cgi/tabcgi.exe?sinannet/cnv/violebr.def",desc:"Notificações de violência interpessoal e autoprovocada por município"},' +
        '{nome:"Painel de Monitoramento da Violência (SVS/MS)",url:"https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/v/violencia",desc:"Painel de monitoramento da violência do Ministério da Saúde"}' +
      '];' +
      // Try to fetch SISVAN data (child nutrition / violence-related indicators)
      'let sisvanData=null;' +
      'try{' +
        'const _svR=await fetch(BASE+"/sisvan/estado-nutricional?codigo_municipio="+co6+"&codigo_fase_vida=1&limit=50",{signal:AbortSignal.timeout(10000),headers:_hdr});' +
        'if(_svR.ok){const _svD=await _svR.json();const _arr=(_svD&&_svD.estados_nutricionais)||[];if(_arr.length>0){const _comp=_arr.reduce((m,x)=>(!m||x.competencia>m.competencia?x:m),null);sisvanData={competencia:_comp?.competencia,municipio:_comp?.municipio,registros:_arr.length,nota:"Vigilância alimentar e nutricional infantil — SISVAN"};}}' +
      '}catch(_sve){}' +
      'return g.json({ok:!0,co_municipio:E,mensagem:"Dados de internações e óbitos por violência são consultados diretamente no DataSUS (TABNET). As APIs abertas do Ministério da Saúde ainda não disponibilizam esses dados em formato JSON por município.",sisvan:sisvanData,links:_links,fonte:"DataSUS / Ministério da Saúde",nota:"Use os links abaixo para acessar os dados diretamente no sistema TABNET do DataSUS."});' +
    '}catch(_ge){console.error("[saude-violencia]",_ge.message);return g.status(500).json({ok:!1,error:_ge.message,links:[],fonte:"DataSUS"});}' +
  '}),';
if (source.indexOf(_SAUD_VIO_ANCHOR) !== -1) {
  source = source.replace(_SAUD_VIO_ANCHOR, _SAUD_VIO_ANCHOR + _SAUD_VIO_ROUTE);
  console.log('[bootstrap] /api/saude-violencia endpoint patch applied');
} else {
  console.warn('[bootstrap] /api/saude-violencia patch NOT applied — anchor not found');
}

// ── 3i-bis. Patch: /api/saude-municipio/:coIbge ──
// Lazy-ingest CNES (estabelecimentos) + SISVAN (estado nutricional) into Postgres.
// Cache TTL: 30 days per (municipio, fonte). Use ?refresh=1 to force re-ingest.
// Use ?async=1 to return cached data immediately and refresh in background.
// Tables: saude_estabelecimentos, saude_indicadores_municipio, saude_ingestao_log.
const SAUDE_MUN_BASE = 'https://apidadosabertos.saude.gov.br';
const SAUDE_MUN_HDR = { 'User-Agent': 'ChegoAContaDiretora/1.0', 'Accept': 'application/json' };
const SAUDE_MUN_TTL_MS = 30 * 24 * 3600 * 1000;

// CNES — codigo_tipo_unidade → label (https://datasus.saude.gov.br tabela TP_UNID)
const CNES_TIPO_UNIDADE = {
  1: 'POSTO DE SAUDE',
  2: 'CENTRO DE SAUDE / UBS',
  4: 'POLICLINICA',
  5: 'HOSPITAL GERAL',
  7: 'HOSPITAL ESPECIALIZADO',
  15: 'UNIDADE MISTA',
  20: 'PRONTO SOCORRO GERAL',
  21: 'PRONTO SOCORRO ESPECIALIZADO',
  22: 'CONSULTORIO ISOLADO',
  32: 'UNIDADE MOVEL FLUVIAL',
  36: 'CLINICA / CENTRO DE ESPECIALIDADE',
  39: 'UNIDADE SADT (APOIO DIAGNOSE/TERAPIA)',
  40: 'UNIDADE MOVEL TERRESTRE',
  42: 'UNIDADE MOVEL PRE-HOSPITALAR (URGENCIA)',
  43: 'FARMACIA',
  50: 'UNIDADE DE VIGILANCIA EM SAUDE',
  60: 'COOPERATIVA / CESSAO DE TRABALHADORES',
  61: 'CENTRO DE PARTO NORMAL ISOLADO',
  62: 'HOSPITAL DIA ISOLADO',
  67: 'LABORATORIO CENTRAL (LACEN)',
  68: 'CENTRAL DE GESTAO EM SAUDE',
  69: 'CENTRO HEMOTERAPICO / HEMATOLOGICO',
  70: 'CENTRO DE ATENCAO PSICOSSOCIAL (CAPS)',
  71: 'CENTRO DE APOIO A SAUDE DA FAMILIA',
  72: 'UNIDADE DE ATENCAO A SAUDE INDIGENA',
  73: 'PRONTO ATENDIMENTO (UPA)',
  74: 'POLO ACADEMIA DA SAUDE',
  75: 'TELESSAUDE',
  76: 'CENTRAL DE REGULACAO MEDICA DAS URGENCIAS',
  77: 'SERVICO DE ATENCAO DOMICILIAR (HOME CARE)',
  78: 'UNIDADE DE ATENCAO EM REGIME RESIDENCIAL',
  79: 'OFICINA ORTOPEDICA',
  80: 'LABORATORIO DE SAUDE PUBLICA',
  81: 'CENTRAL DE REGULACAO DO ACESSO',
  82: 'CENTRAL DE CAPTACAO/DISTRIB DE ORGAOS',
  83: 'POLO DE PREVENCAO DE DOENCAS / PROMOCAO DE SAUDE',
  84: 'CENTRAL DE ABASTECIMENTO',
  85: 'CENTRO DE IMUNIZACAO',
};
function _cnesTipoLabel(codigo) {
  if (codigo == null) return null;
  return CNES_TIPO_UNIDADE[Number(codigo)] || `TIPO ${codigo}`;
}

async function _saudeIngestCNES(pool, co7, co6) {
  const all = [];
  let offset = 0;
  const limit = 100;
  let pages = 0;
  while (pages < 50) {
    const url = `${SAUDE_MUN_BASE}/cnes/estabelecimentos?codigo_municipio=${co6}&limit=${limit}&offset=${offset}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: SAUDE_MUN_HDR });
    if (!r.ok) break;
    const j = await r.json();
    const arr = (j && j.estabelecimentos) || [];
    if (arr.length === 0) break;
    all.push(...arr);
    if (arr.length < limit) break;
    offset += limit;
    pages++;
  }
  const cli = await pool.connect();
  try {
    await cli.query('BEGIN');
    for (const e of all) {
      const cnes = String(e.codigo_cnes || e.cnes || '').trim();
      if (!cnes) continue;
      await cli.query(
        `INSERT INTO saude_estabelecimentos
           (cnes,nome,tipo_estabelecimento,codigo_tipo_unidade,co_municipio,no_municipio,uf,bairro,endereco,telefone,latitude,longitude,competencia,metadata,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
         ON CONFLICT (cnes) DO UPDATE SET
           nome=EXCLUDED.nome, tipo_estabelecimento=EXCLUDED.tipo_estabelecimento,
           codigo_tipo_unidade=EXCLUDED.codigo_tipo_unidade, co_municipio=EXCLUDED.co_municipio,
           no_municipio=EXCLUDED.no_municipio, uf=EXCLUDED.uf, bairro=EXCLUDED.bairro,
           endereco=EXCLUDED.endereco, telefone=EXCLUDED.telefone,
           latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
           competencia=EXCLUDED.competencia, metadata=EXCLUDED.metadata, updated_at=NOW()`,
        [
          cnes,
          e.nome_fantasia || e.nome_razao_social || '(sem nome)',
          _cnesTipoLabel(e.codigo_tipo_unidade),
          e.codigo_tipo_unidade != null ? Number(e.codigo_tipo_unidade) : null,
          co7,
          e.municipio || null,
          e.uf || null,
          e.bairro_estabelecimento || null,
          (e.endereco_estabelecimento && e.numero_estabelecimento)
            ? `${e.endereco_estabelecimento}, ${e.numero_estabelecimento}`
            : (e.endereco_estabelecimento || null),
          e.numero_telefone_estabelecimento || null,
          e.latitude_estabelecimento_decimo_grau ? Number(e.latitude_estabelecimento_decimo_grau) : null,
          e.longitude_estabelecimento_decimo_grau ? Number(e.longitude_estabelecimento_decimo_grau) : null,
          e.data_atualizacao ? String(e.data_atualizacao) : null,
          JSON.stringify(e),
        ]
      );
    }
    await cli.query(
      `INSERT INTO saude_ingestao_log (co_municipio,fonte,last_fetch,status,registros)
       VALUES ($1,'CNES',NOW(),'ok',$2)
       ON CONFLICT (co_municipio,fonte) DO UPDATE
         SET last_fetch=NOW(), status='ok', registros=$2, erro=NULL`,
      [co7, all.length]
    );
    await cli.query('COMMIT');
    return { fonte: 'CNES', registros: all.length };
  } catch (e) {
    await cli.query('ROLLBACK');
    throw e;
  } finally {
    cli.release();
  }
}

async function _saudeIngestSISVAN(pool, co7, co6) {
  // SISVAN — API aberta retorna observações individuais (não agregadas) e
  // tende a entregar registros mais antigos primeiro. Para indicadores
  // municipais agregados de verdade, é preciso ETL dos CSVs anuais (futuro).
  // Por ora, gravamos: amostra disponível por fase + distribuição categórica
  // do estado nutricional dentro dessa amostra.
  const fases = [
    { codigo: 1, label: 'criancas_menores_5', campos: ['peso_x_idade', 'peso_x_altura', 'crianca_imc_x_idade', 'crianca_altura_x_idade'] },
    { codigo: 2, label: 'criancas_adolescentes_5_19', campos: ['adolescente_imc_x_idade', 'adolescente_altura_x_idade', 'crianca_imc_x_idade', 'crianca_altura_x_idade'] },
    { codigo: 3, label: 'adultos', campos: ['codigo_estado_nutricional_adulto'] },
    { codigo: 4, label: 'idosos', campos: ['codigo_estado_nutricional_idoso'] },
  ];
  let totalIndic = 0;
  const anoAtual = new Date().getFullYear();
  for (const fase of fases) {
    let r;
    try {
      r = await fetch(
        `${SAUDE_MUN_BASE}/sisvan/estado-nutricional?codigo_municipio=${co6}&codigo_fase_vida=${fase.codigo}&limit=200`,
        { signal: AbortSignal.timeout(20000), headers: SAUDE_MUN_HDR }
      );
    } catch (_e) {
      continue;
    }
    if (!r.ok) continue;
    const j = await r.json();
    const arr = (j && j.estados_nutricionais) || [];
    if (arr.length === 0) continue;
    let compMin = '', compMax = '';
    for (const x of arr) {
      const c = String(x.ano_mes_competencia || '');
      if (c && (!compMin || c < compMin)) compMin = c;
      if (c && c > compMax) compMax = c;
    }
    // Indicador: tamanho amostral disponível
    await pool.query(
      `INSERT INTO saude_indicadores_municipio (co_municipio,ano,mes,fonte,indicador,recorte,valor,unidade,metadata)
       VALUES ($1,$2,NULL,'SISVAN','sisvan_amostra_disponivel',$3,$4,'registros',$5)
       ON CONFLICT (co_municipio,ano,COALESCE(mes,0),fonte,indicador,COALESCE(recorte,''))
       DO UPDATE SET valor=EXCLUDED.valor, metadata=EXCLUDED.metadata, updated_at=NOW()`,
      [
        co7,
        anoAtual,
        fase.label,
        arr.length,
        JSON.stringify({ competencia_min: compMin, competencia_max: compMax, fase_codigo: fase.codigo }),
      ]
    );
    totalIndic++;
    // Distribuição categórica por campo
    for (const campo of fase.campos) {
      const counts = {};
      let validos = 0;
      for (const x of arr) {
        const v = x[campo];
        if (v == null || v === '') continue;
        const k = String(v);
        counts[k] = (counts[k] || 0) + 1;
        validos++;
      }
      if (validos === 0) continue;
      for (const [categoria, n] of Object.entries(counts)) {
        const indicador = `sisvan_${campo}`.slice(0, 80);
        const recorte = `${fase.label}__${categoria}`.slice(0, 80);
        await pool.query(
          `INSERT INTO saude_indicadores_municipio (co_municipio,ano,mes,fonte,indicador,recorte,valor,denominador,unidade,metadata)
           VALUES ($1,$2,NULL,'SISVAN',$3,$4,$5,$6,'pct_amostra',$7)
           ON CONFLICT (co_municipio,ano,COALESCE(mes,0),fonte,indicador,COALESCE(recorte,''))
           DO UPDATE SET valor=EXCLUDED.valor, denominador=EXCLUDED.denominador, metadata=EXCLUDED.metadata, updated_at=NOW()`,
          [
            co7,
            anoAtual,
            indicador,
            recorte,
            (n / validos) * 100,
            validos,
            JSON.stringify({ n: n, fase: fase.label, campo: campo, competencia_min: compMin, competencia_max: compMax, nota: 'amostra da API aberta SISVAN — não é agregado oficial municipal' }),
          ]
        );
        totalIndic++;
      }
    }
  }
  await pool.query(
    `INSERT INTO saude_ingestao_log (co_municipio,fonte,last_fetch,status,registros)
     VALUES ($1,'SISVAN',NOW(),'ok',$2)
     ON CONFLICT (co_municipio,fonte) DO UPDATE
       SET last_fetch=NOW(), status='ok', registros=$2, erro=NULL`,
    [co7, totalIndic]
  );
  return { fonte: 'SISVAN', registros: totalIndic };
}

// Derive aggregated indicators from CNES estabelecimentos already in DB.
async function _saudeIngestCNESAgregados(pool, co7) {
  const r = await pool.query(
    `SELECT codigo_tipo_unidade, count(*)::int AS n
     FROM saude_estabelecimentos WHERE co_municipio=$1 GROUP BY codigo_tipo_unidade`,
    [co7]
  );
  const counts = {};
  let total = 0;
  for (const row of r.rows) {
    counts[row.codigo_tipo_unidade] = row.n;
    total += row.n;
  }
  const ano = new Date().getFullYear();
  const indicadores = [
    { ind: 'cnes_total_estabelecimentos', valor: total, recorte: null },
    { ind: 'cnes_ubs_centro_saude', valor: (counts[1] || 0) + (counts[2] || 0), recorte: 'tipo_1_2' },
    { ind: 'cnes_hospital_geral', valor: counts[5] || 0, recorte: 'tipo_5' },
    { ind: 'cnes_hospital_especializado', valor: counts[7] || 0, recorte: 'tipo_7' },
    { ind: 'cnes_pronto_socorro', valor: (counts[20] || 0) + (counts[21] || 0), recorte: 'tipo_20_21' },
    { ind: 'cnes_upa', valor: counts[73] || 0, recorte: 'tipo_73' },
    { ind: 'cnes_caps', valor: counts[70] || 0, recorte: 'tipo_70' },
    { ind: 'cnes_farmacia', valor: counts[43] || 0, recorte: 'tipo_43' },
    { ind: 'cnes_academia_saude', valor: counts[74] || 0, recorte: 'tipo_74' },
    { ind: 'cnes_atencao_indigena', valor: counts[72] || 0, recorte: 'tipo_72' },
  ];
  for (const it of indicadores) {
    await pool.query(
      `INSERT INTO saude_indicadores_municipio (co_municipio,ano,mes,fonte,indicador,recorte,valor,unidade,metadata)
       VALUES ($1,$2,NULL,'CNES',$3,$4,$5,'n',$6)
       ON CONFLICT (co_municipio,ano,COALESCE(mes,0),fonte,indicador,COALESCE(recorte,''))
       DO UPDATE SET valor=EXCLUDED.valor, metadata=EXCLUDED.metadata, updated_at=NOW()`,
      [co7, ano, it.ind, it.recorte, it.valor, JSON.stringify({ contagens_por_tipo: counts })]
    );
  }
  return indicadores.length;
}

async function _saudeIsStale(pool, co7, fonte) {
  const r = await pool.query(
    "SELECT last_fetch, status FROM saude_ingestao_log WHERE co_municipio=$1 AND fonte=$2",
    [co7, fonte]
  );
  if (!r.rows.length) return true;
  if (r.rows[0].status !== 'ok') return true;
  return Date.now() - new Date(r.rows[0].last_fetch).getTime() > SAUDE_MUN_TTL_MS;
}

async function _saudeIngestAll(pool, co7, co6) {
  const results = [];
  for (const [fonte, fn] of [['CNES', _saudeIngestCNES], ['SISVAN', _saudeIngestSISVAN]]) {
    try {
      const r = await fn(pool, co7, co6);
      results.push(r);
      if (fonte === 'CNES') {
        try {
          const n = await _saudeIngestCNESAgregados(pool, co7);
          results.push({ fonte: 'CNES_AGREGADOS', registros: n });
        } catch (ae) {
          console.error('[saude-municipio] CNES_AGREGADOS erro:', ae.message);
        }
      }
    } catch (e) {
      console.error(`[saude-municipio] ${fonte} ingest erro ${co7}:`, e.message);
      try {
        await pool.query(
          `INSERT INTO saude_ingestao_log (co_municipio,fonte,last_fetch,status,erro)
           VALUES ($1,$2,NOW(),'erro',$3)
           ON CONFLICT (co_municipio,fonte) DO UPDATE
             SET last_fetch=NOW(), status='erro', erro=$3`,
          [co7, fonte, e.message]
        );
      } catch (_le) {}
      results.push({ fonte, registros: 0, erro: e.message });
    }
  }
  return results;
}

globalThis._saudeMunHandler = async (A, g) => {
  try {
    const E = String(A.params.coIbge || '').replace(/\D/g, '');
    if (!E || E.length < 6) {
      return g.status(400).json({ ok: false, error: 'Código IBGE inválido' });
    }
    const co7 = E.length === 7 ? E : (E.length === 6 ? E + '0' : E.padEnd(7, '0').slice(0, 7));
    const co6 = co7.slice(0, 6);
    const refresh = A.query.refresh === '1';
    const asyncMode = A.query.async === '1';
    const pool = globalThis._pgPool;
    if (!pool) return g.status(500).json({ ok: false, error: 'DB pool indisponível' });

    const needCNES = refresh || (await _saudeIsStale(pool, co7, 'CNES'));
    const needSISVAN = refresh || (await _saudeIsStale(pool, co7, 'SISVAN'));

    let ingestResults = [];
    if (needCNES || needSISVAN) {
      if (asyncMode) {
        // Fire-and-forget refresh in background
        _saudeIngestAll(pool, co7, co6).catch((e) =>
          console.error('[saude-municipio] bg ingest erro:', e.message)
        );
        ingestResults = [{ fonte: 'CNES', status: 'ingest_iniciado_em_background' }];
      } else {
        ingestResults = await _saudeIngestAll(pool, co7, co6);
      }
    }

    const estabsR = await pool.query(
      `SELECT cnes,nome,tipo_estabelecimento,codigo_tipo_unidade,bairro,endereco,telefone,latitude,longitude,competencia
       FROM saude_estabelecimentos WHERE co_municipio=$1
       ORDER BY codigo_tipo_unidade NULLS LAST, nome`,
      [co7]
    );
    const indicR = await pool.query(
      `SELECT ano,mes,fonte,indicador,recorte,valor,denominador,unidade,metadata
       FROM saude_indicadores_municipio WHERE co_municipio=$1
       ORDER BY fonte,ano DESC,indicador`,
      [co7]
    );
    const logR = await pool.query(
      `SELECT fonte,last_fetch,status,registros,erro FROM saude_ingestao_log WHERE co_municipio=$1`,
      [co7]
    );

    const estabs = estabsR.rows;
    const porTipo = {};
    for (const e of estabs) {
      const t = e.tipo_estabelecimento || 'OUTROS';
      porTipo[t] = (porTipo[t] || 0) + 1;
    }

    g.json({
      ok: true,
      co_municipio: co7,
      estabelecimentos: { total: estabs.length, por_tipo: porTipo, lista: estabs },
      indicadores: indicR.rows,
      ingestao: { log: logR.rows, executou_agora: ingestResults },
      fonte: 'Ministério da Saúde — apidadosabertos.saude.gov.br (CNES, SISVAN)',
    });
  } catch (e) {
    console.error('[saude-municipio]', e.message);
    g.status(500).json({ ok: false, error: e.message });
  }
};

globalThis._saudeBackfillHandler = async (A, g) => {
  try {
    const ids = String(A.query.ids || '').split(',').map((s) => s.trim().replace(/\D/g, '')).filter((s) => s.length >= 6);
    if (!ids.length) return g.status(400).json({ ok: false, error: 'Passe ?ids=co1,co2,...' });
    const pool = globalThis._pgPool;
    if (!pool) return g.status(500).json({ ok: false, error: 'DB pool indisponível' });
    const limited = ids.slice(0, 50);
    g.json({ ok: true, iniciado: limited.length, municipios: limited, modo: 'background' });
    (async () => {
      for (const id of limited) {
        const co7 = id.length === 7 ? id : (id.length === 6 ? id + '0' : id.padEnd(7, '0').slice(0, 7));
        const co6 = co7.slice(0, 6);
        try {
          await _saudeIngestAll(pool, co7, co6);
          console.log(`[saude-backfill] ok ${co7}`);
        } catch (e) {
          console.error(`[saude-backfill] erro ${co7}:`, e.message);
        }
      }
      console.log('[saude-backfill] concluído', limited.length);
    })();
  } catch (e) {
    g.status(500).json({ ok: false, error: e.message });
  }
};

// ── 3i-ter. Admin ETL endpoints (SINASC/SIM/PNI bulk via pysus runner) ──
const { spawn: _etlSpawn } = require('child_process');
const _etlPath = require('path');
const _etlFs = require('fs');
globalThis._saudeEtlJobs = globalThis._saudeEtlJobs || {};

globalThis._saudeEtlRunHandler = async (A, g) => {
  try {
    const adminToken = process.env.ADMIN_TOKEN || '';
    const provided = A.query.token || A.headers['x-admin-token'] || '';
    if (adminToken && provided !== adminToken) return g.status(401).json({ ok: false, error: 'token inválido' });
    const source = String(A.query.source || '').toLowerCase();
    if (!['sinasc', 'sim', 'pni', 'sinan', 'sisagua'].includes(source)) return g.status(400).json({ ok: false, error: 'source deve ser sinasc|sim|pni|sinan|sisagua' });
    const states = String(A.query.states || 'ALL');
    const defaultYears = { pni: '2015-2019', sim: '2020-2024', sinasc: '2018-2022', sinan: '2020-2026', sisagua: '2023-2024' }[source];
    const years = String(A.query.years || defaultYears);
    const coMunicipio = A.query.co_municipio ? String(A.query.co_municipio) : null;
    const diseases = A.query.diseases ? String(A.query.diseases) : null;
    const jobId = `${source}-${Date.now()}`;
    const runner = _etlPath.join(__dirname, 'saude-etl', 'runner.cjs');
    if (!_etlFs.existsSync(runner)) return g.status(500).json({ ok: false, error: 'runner não encontrado' });
    const args = [runner, '--source', source, '--states', states, '--years', years];
    if (coMunicipio) args.push('--co-municipio', coMunicipio);
    if (diseases) args.push('--diseases', diseases);
    const logFile = `/tmp/etl-${jobId}.log`;
    const out = _etlFs.openSync(logFile, 'a');
    const child = _etlSpawn(process.execPath, args, { detached: true, stdio: ['ignore', out, out] });
    child.unref();
    globalThis._saudeEtlJobs[jobId] = { source, states, years, coMunicipio, pid: child.pid, logFile, started: new Date().toISOString(), status: 'running' };
    g.json({ ok: true, jobId, pid: child.pid, source, states, years, coMunicipio, logFile });
  } catch (e) {
    g.status(500).json({ ok: false, error: e.message });
  }
};

globalThis._saudeEtlStatusHandler = async (A, g) => {
  try {
    const pool = globalThis._pgPool;
    if (!pool) return g.status(500).json({ ok: false, error: 'DB pool indisponível' });
    const jobs = Object.entries(globalThis._saudeEtlJobs).map(([id, j]) => {
      let alive = false;
      try { process.kill(j.pid, 0); alive = true; } catch (_) {}
      let tail = '';
      try {
        if (_etlFs.existsSync(j.logFile)) {
          const buf = _etlFs.readFileSync(j.logFile, 'utf8');
          tail = buf.slice(-2000);
        }
      } catch (_) {}
      return { id, ...j, alive, status: alive ? 'running' : 'finished', tail };
    });
    const counts = await pool.query(
      `SELECT fonte, COUNT(*)::int AS rows, COUNT(DISTINCT co_municipio)::int AS municipios,
              MIN(ano)::int AS ano_min, MAX(ano)::int AS ano_max
       FROM saude_indicadores_municipio GROUP BY fonte ORDER BY fonte`
    );
    const runs = await pool.query(
      `SELECT id, fonte, status, parametros, resultado, started_at, finished_at
       FROM saude_etl_runs ORDER BY id DESC LIMIT 30`
    ).catch(() => ({ rows: [] }));
    g.json({ ok: true, jobs, counts: counts.rows, runs: runs.rows });
  } catch (e) {
    g.status(500).json({ ok: false, error: e.message });
  }
};

const _SAUD_MUN_ANCHOR = 'e.get("/api/health",(A,g)=>{g.status(200).json({ok:!0,ts:Date.now()})}),';
const _SAUD_MUN_ROUTE =
  'e.get("/api/saude-municipio/:coIbge",globalThis._saudeMunHandler),' +
  'e.get("/api/saude-backfill",globalThis._saudeBackfillHandler),' +
  'e.post("/api/saude-etl/run",globalThis._saudeEtlRunHandler),' +
  'e.get("/api/saude-etl/run",globalThis._saudeEtlRunHandler),' +
  'e.get("/api/saude-etl/status",globalThis._saudeEtlStatusHandler),';
if (source.indexOf(_SAUD_MUN_ANCHOR) !== -1 && source.indexOf('/api/saude-municipio/') === -1) {
  source = source.replace(_SAUD_MUN_ANCHOR, _SAUD_MUN_ANCHOR + _SAUD_MUN_ROUTE);
  console.log('[bootstrap] /api/saude-municipio + /api/saude-backfill endpoints patch applied');
} else if (source.indexOf('/api/saude-municipio/') !== -1) {
  console.log('[bootstrap] /api/saude-municipio already present');
} else {
  console.warn('[bootstrap] /api/saude-municipio patch NOT applied — anchor not found');
}

// ── 3j. Patch: /api/perfil-socioeconomico/:coIbge — IBGE socioeconomic data ────
// Fetches PIB per capita, population, and Censo 2022 income/poverty from IBGE API.
const _IBGE_SOCIO_ANCHOR = 'e.get("/api/health",(A,g)=>{g.status(200).json({ok:!0,ts:Date.now()})}),';
const _IBGE_SOCIO_ROUTE =
  'e.get("/api/perfil-socioeconomico/:coIbge",async(A,g)=>{' +
    'try{' +
      'const E=String(A.params.coIbge||"").replace(/\\D/g,"");' +
      'if(!E||E.length<6)return g.status(400).json({ok:!1,error:"C\\xF3digo IBGE inv\\xE1lido"});' +
      'const co7=E.length===7?E:null;' +
      'const co6=E.length===7?E.slice(0,6):E;' +
      'const _hdr={"User-Agent":"ChegoAContaDiretora/1.0","Accept":"application/json"};' +
      'const _sig=AbortSignal.timeout(15000);' +
      // PIB per capita (IBGE agregados 5938, variável 37, nível município)
      // Population estimates (6579 / 9324)
      // Censo 2022 rendimento (SIDRA 4711) e extrema pobreza (SIDRA 9952)
      'const [_pibR,_popR,_cen4711R,_cen9952R]=await Promise.allSettled([' +
        'co7?fetch("https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/-1/variaveis/37?localidades=N6["+co7+"]",{signal:_sig,headers:_hdr}).then(r=>r.ok?r.json():null).catch(()=>null):Promise.resolve(null),' +
        'co7?fetch("https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6["+co7+"]",{signal:_sig,headers:_hdr}).then(r=>r.ok?r.json():null).catch(()=>null):Promise.resolve(null),' +
        'co7?fetch("https://apisidra.ibge.gov.br/values/t/4711/n6/"+co7+"/v/93,10041,10042/p/2021",{signal:_sig,headers:_hdr}).then(r=>r.ok?r.json():null).catch(()=>null):Promise.resolve(null),' +
        'co7?fetch("https://apisidra.ibge.gov.br/values/t/9952/n6/"+co7+"/v/all/p/2022",{signal:_sig,headers:_hdr}).then(r=>r.ok?r.json():null).catch(()=>null):Promise.resolve(null)' +
      ']);' +
      'const _pibD=_pibR.status==="fulfilled"?_pibR.value:null;' +
      'const _popD=_popR.status==="fulfilled"?_popR.value:null;' +
      'const _cen4711=_cen4711R.status==="fulfilled"?_cen4711R.value:null;' +
      'const _cen9952=_cen9952R.status==="fulfilled"?_cen9952R.value:null;' +
      // Parse PIB per capita
      'let pib_per_capita=null;let pib_ano=null;' +
      'if(Array.isArray(_pibD)&&_pibD.length>0){' +
        'const _pibItem=_pibD[0];const _pibRes=_pibItem&&_pibItem.resultados&&_pibItem.resultados[0];' +
        'const _pibSer=_pibRes&&_pibRes.series&&_pibRes.series[0];' +
        'if(_pibSer&&_pibSer.serie){' +
          'const _pibEntries=Object.entries(_pibSer.serie).filter(([k,v])=>v&&v!=="-");' +
          'if(_pibEntries.length){const _last=_pibEntries[_pibEntries.length-1];pib_per_capita=Number(_last[1]);pib_ano=Number(_last[0]);if(isNaN(pib_per_capita))pib_per_capita=null;}' +
        '}' +
      '}' +
      // Parse population
      'let populacao=null;let pop_ano=null;' +
      'if(Array.isArray(_popD)&&_popD.length>0){' +
        'const _popItem=_popD[0];const _popRes=_popItem&&_popItem.resultados&&_popItem.resultados[0];' +
        'const _popSer=_popRes&&_popRes.series&&_popRes.series[0];' +
        'if(_popSer&&_popSer.serie){' +
          'const _popEntries=Object.entries(_popSer.serie).filter(([k,v])=>v&&v!=="-");' +
          'if(_popEntries.length){const _last=_popEntries[_popEntries.length-1];populacao=Number(String(_last[1]).replace(/\\./g,""));pop_ano=Number(_last[0]);if(isNaN(populacao))populacao=null;}' +
        '}' +
      '}' +
      // Parse PNAD/Censo rendimento (t/4711: rendimento médio domiciliar per capita)
      'let rendimento_medio=null;let rendimento_ano=null;' +
      'if(Array.isArray(_cen4711)&&_cen4711.length>0){' +
        'const _rm=_cen4711.find(function(x){return x&&x.D2N&&x.D2N.includes("Rendimento médio")&&x.V&&x.V!=="V"&&x.V!=="..."&&!isNaN(parseFloat(x.V));});' +
        'if(_rm){rendimento_medio=parseFloat(_rm.V.replace(/\\./g,"").replace(",","."));rendimento_ano=_rm.D3N?Number(_rm.D3N):null;}' +
      '}' +
      // Parse extrema pobreza (Censo 2022 t/9952)
      'let taxa_extrema_pobreza=null;let pobreza_ano=null;' +
      'if(Array.isArray(_cen9952)&&_cen9952.length>0){' +
        'const _ep=_cen9952.find(function(x){return x&&x.D2N&&(x.D2N.includes("pobreza")&&x.D2N.includes("extrema")||x.D2N.includes("\\xBD salário"))&&x.V&&x.V!=="V"&&x.V!=="..."&&!isNaN(parseFloat(x.V.replace(",",".")));});' +
        'if(_ep){taxa_extrema_pobreza=parseFloat(_ep.V.replace(",","."));pobreza_ano=2022;}' +
      '}' +
      // pib_per_capita currently holds total PIB in Mil Reais (table 5938, var 37)
      // Compute real per capita: total_mil_reais * 1000 / populacao
      'const _pibTotalMilR=pib_per_capita;' +
      'const _pibPC=_pibTotalMilR!==null&&populacao&&populacao>0?Math.round(_pibTotalMilR*1000/populacao):null;' +
      'const _temDados=_pibTotalMilR!==null||populacao!==null||rendimento_medio!==null;' +
      'return g.json({ok:_temDados,co_municipio:E,populacao,populacao_ano:pop_ano,pib_total_mil_reais:_pibTotalMilR,pib_per_capita:_pibPC,pib_ano,rendimento_medio_domiciliar:rendimento_medio,rendimento_ano,taxa_extrema_pobreza,pobreza_ano,fontes:{pib:"IBGE — Produto Interno Bruto dos Munic\\xEDpios, pre\\xE7os correntes (S\\xE9rie "+pib_ano+")",populacao:"IBGE — Estimativas da Popula\\xE7\\xE3o ("+pop_ano+")",rendimento:rendimento_ano?"IBGE — Censo Demogr\\xE1fico 2022 (rendimento domiciliar)":null,pobreza:pobreza_ano?"IBGE — Censo Demogr\\xE1fico 2022":null},links:[{nome:"IBGE Cidades",url:"https://cidades.ibge.gov.br/brasil/"+E+"/pesquisa/38/0"},{nome:"IBGE PIB Municipal",url:"https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9088-produto-interno-bruto-dos-municipios.html"},{nome:"IBGE SIDRA",url:"https://sidra.ibge.gov.br/"}]});' +
    '}catch(_ge){console.error("[ibge-socio]",_ge.message);return g.status(500).json({ok:!1,error:_ge.message,fontes:{},links:[]});}' +
  '}),';
if (source.indexOf(_IBGE_SOCIO_ANCHOR) !== -1) {
  source = source.replace(_IBGE_SOCIO_ANCHOR, _IBGE_SOCIO_ANCHOR + _IBGE_SOCIO_ROUTE);
  console.log('[bootstrap] /api/perfil-socioeconomico endpoint patch applied');
} else {
  console.warn('[bootstrap] /api/perfil-socioeconomico patch NOT applied — anchor not found');
}

// ── 3k. Patch Dashboard-v30.js — add Segurança, Saúde/Violência, IBGE cards ──
// Adds state vars, open handlers, and 3 new accordion cards to the Dashboard.
(function _patchDashboardContextCards() {
  if (!fs.existsSync(dashboardV30AssetPath)) {
    console.warn('[bootstrap] Dashboard-v30 context cards patch: file not found');
    return;
  }
  const _ID_CHECK = 'segOpen, setSegOpen';
  let dashSrc = fs.readFileSync(dashboardV30AssetPath, 'utf8');
  let changed = false;

  // 1. Add state variables for the 3 new cards
  if (!dashSrc.includes(_ID_CHECK)) {
    const _SV_OLD = '[ctxSuasOpen, setCtxSuasOpen] = F.useState(false), smReady';
    const _SV_NEW =
      '[ctxSuasOpen, setCtxSuasOpen] = F.useState(false), ' +
      '[segData, setSegData] = F.useState(null), [segLoading, setSegLoading] = F.useState(false), [segOpen, setSegOpen] = F.useState(false), ' +
      '[saudeViolData, setSaudeViolData] = F.useState(null), [saudeViolLoading, setSaudeViolLoading] = F.useState(false), [saudeViolOpen, setSaudeViolOpen] = F.useState(false), ' +
      '[ibgeSocioData, setIbgeSocioData] = F.useState(null), [ibgeSocioLoading, setIbgeSocioLoading] = F.useState(false), [ibgeSocioOpen, setIbgeSocioOpen] = F.useState(false), ' +
      'smReady';
    if (dashSrc.includes(_SV_OLD)) {
      dashSrc = dashSrc.replace(_SV_OLD, _SV_NEW);
      changed = true;
      console.log('[bootstrap] Dashboard-v30 context cards: state vars patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 context cards: state vars anchor not found');
    }
  }

  // 2. Add open handlers after openCtxSuas
  const _OH_MARKER = 'openSaudeViol = () =>';
  if (!dashSrc.includes(_OH_MARKER)) {
    const _OH_OLD = '}, _ = { conselho_tutelar: { icon: e.jsx(Ya,';
    const _OH_NEW =
      '}, openSeguranca = () => {' +
        'const n = !segOpen; setSegOpen(n);' +
        'if (n && a && !segData && !segLoading) {' +
          'setSegLoading(true);' +
          'fetch(`/api/seguranca-municipio/${a}`).then(g => g.json()).then(g => { setSegData(g); setSegLoading(false); }).catch(() => { setSegData({ ok: false }); setSegLoading(false); });' +
        '}' +
      '}, openSaudeViol = () => {' +
        'const n = !saudeViolOpen; setSaudeViolOpen(n);' +
        'if (n && a && !saudeViolData && !saudeViolLoading) {' +
          'setSaudeViolLoading(true);' +
          'fetch(`/api/saude-violencia/${a}`).then(g => g.json()).then(g => { setSaudeViolData(g); setSaudeViolLoading(false); }).catch(() => { setSaudeViolData({ ok: false }); setSaudeViolLoading(false); });' +
        '}' +
      '}, openIbgeSocio = () => {' +
        'const n = !ibgeSocioOpen; setIbgeSocioOpen(n);' +
        'if (n && a && !ibgeSocioData && !ibgeSocioLoading) {' +
          'setIbgeSocioLoading(true);' +
          'fetch(`/api/perfil-socioeconomico/${a}`).then(g => g.json()).then(g => { setIbgeSocioData(g); setIbgeSocioLoading(false); }).catch(() => { setIbgeSocioData({ ok: false }); setIbgeSocioLoading(false); });' +
        '}' +
      '}, _ = { conselho_tutelar: { icon: e.jsx(Ya,';
    if (dashSrc.includes(_OH_OLD)) {
      dashSrc = dashSrc.replace(_OH_OLD, _OH_NEW);
      changed = true;
      console.log('[bootstrap] Dashboard-v30 context cards: open handlers patch applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 context cards: open handlers anchor not found');
    }
  }

  // 3. Add 3 new accordion cards before the "Suporte Institucional" card
  const _CARD_MARKER = 'seguranca-publica-card';
  if (!dashSrc.includes(_CARD_MARKER)) {
    const _SUPORTE_ANCHOR = 'e.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #d4c4f5", background: "#f9f6ff" }, children: [e.jsxs("button", { onClick: () => on((n) => !n),';
    const _NEW_CARDS =
      // ── Segurança Pública card ──
      'e.jsxs("div", { id: "seguranca-publica-card", style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #ffab91", background: "#fff3e0" }, children: [' +
        'e.jsxs("button", { onClick: openSeguranca, style: { width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }, children: [' +
          'e.jsx("div", { style: { width: 38, height: 38, borderRadius: 12, background: "#ffccbc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: e.jsx(Ue, { size: 18 }) }),' +
          'e.jsxs("div", { style: { flex: 1 }, children: [' +
            'e.jsx("p", { style: { fontWeight: 700, fontSize: "13px", color: "#bf360c", margin: 0 }, children: "Seguran\\xE7a P\\xFAblica do Munic\\xEDpio" }),' +
            'e.jsx("p", { style: { fontSize: "11px", color: "#e64a19", margin: 0 }, children: "Ocorr\\xEAncias criminais por natureza \\u2014 SINESP/SENASP" })' +
          ']}),' +
          'e.jsx("span", { style: { fontSize: "16px", color: "#e64a19", transform: segOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }, children: "\\u25BE" })' +
        ']}),' +
        'segOpen && e.jsxs("div", { style: { padding: "0 18px 16px", borderTop: "1px solid #ffccbc" }, children: [' +
          'segLoading && e.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: "#e64a19", fontSize: 13 }, children: [e.jsx(Ie, { className: "w-4 h-4 animate-spin" }), " Consultando SINESP..."] }),' +
          '!segLoading && segData && segData.ok && segData.naturezas && segData.naturezas.length > 0 && e.jsxs(e.Fragment, { children: [' +
            'e.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 10 }, children: [' +
              'e.jsx("p", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#bf360c", margin: 0 }, children: "Ocorr\\xEAncias por Natureza \\u2014 " + (segData.uf || "") + " (" + (segData.ano || "") + ")" }),' +
              'e.jsx("span", { style: { fontSize: 9, color: "#bf360c", background: "#ffccbc", borderRadius: 20, padding: "2px 8px", fontWeight: 600, whiteSpace: "nowrap" }, children: segData.uf })' +
            ']}),' +
            'e.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8, marginBottom: 10 }, children: segData.naturezas.map(function(n, ni) {' +
              'return e.jsxs("div", { style: { background: "#fff", border: "1.5px solid #ffab91", borderRadius: 10, padding: "10px 12px", borderLeft: "4px solid #e64a19" }, children: [' +
                'e.jsx("p", { style: { fontSize: 20, fontWeight: 800, color: "#bf360c", margin: "0 0 2px", lineHeight: 1 }, children: n.quantidade.toLocaleString("pt-BR") }),' +
                'e.jsx("p", { style: { fontSize: 10, color: "#e64a19", margin: 0, lineHeight: 1.3 }, children: n.natureza })' +
              ']}, ni);' +
            '})}),' +
            'e.jsxs("p", { style: { fontSize: 10, color: "#bf360c", margin: "6px 0 0", lineHeight: 1.4 }, children: ["Fonte: ", segData.fonte, ". ", segData.nota || ""] }),' +
            'e.jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }, children: [' +
              'e.jsx("a", { href: "https://dados.gov.br/dados/conjuntos-dados/sinesp-uf-ano-natureza-por-ocorrencia", target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, fontWeight: 700, color: "#bf360c", background: "#ffccbc", padding: "4px 12px", borderRadius: 20, border: "1px solid #ffab91", textDecoration: "none" }, children: "SINESP dados.gov.br \\u2197" }),' +
              'e.jsx("a", { href: "https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica/sinesp", target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, fontWeight: 700, color: "#bf360c", background: "#ffccbc", padding: "4px 12px", borderRadius: 20, border: "1px solid #ffab91", textDecoration: "none" }, children: "Portal SINESP/SENASP \\u2197" })' +
            ']})' +
          ']}),' +
          '!segLoading && segData && segData.ok && (!segData.naturezas || segData.naturezas.length === 0) && e.jsx("p", { style: { fontSize: 12, color: "#888", padding: "12px 0" }, children: segData.mensagem || "Dados de seguran\\xE7a n\\xE3o dispon\\xEDveis para este munic\\xEDpio." }),' +
          '!segLoading && segData && !segData.ok && e.jsxs("div", { style: { padding: "12px 0" }, children: [' +
            'e.jsx("p", { style: { fontSize: 12, color: "#888", marginBottom: 8 }, children: "Dados SINESP n\\xE3o dispon\\xEDveis no momento." }),' +
            'e.jsx("a", { href: "https://dados.gov.br/dados/conjuntos-dados/sinesp-uf-ano-natureza-por-ocorrencia", target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, fontWeight: 700, color: "#bf360c", background: "#ffccbc", padding: "4px 12px", borderRadius: 20, border: "1px solid #ffab91", textDecoration: "none" }, children: "Acessar SINESP no dados.gov.br \\u2197" })' +
          ']}),' +
          '!segLoading && !segData && !a && e.jsx("p", { style: { fontSize: 12, color: "#888", padding: "12px 0" }, children: "C\\xF3digo IBGE n\\xE3o dispon\\xEDvel para esta escola." })' +
        ']})' +
      ']}),' +
      // ── Saúde e Violência card ──
      'e.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #f48fb1", background: "#fce4ec" }, children: [' +
        'e.jsxs("button", { onClick: openSaudeViol, style: { width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }, children: [' +
          'e.jsx("div", { style: { width: 38, height: 38, borderRadius: 12, background: "#f8bbd0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: e.jsx(ko, { size: 18 }) }),' +
          'e.jsxs("div", { style: { flex: 1 }, children: [' +
            'e.jsx("p", { style: { fontWeight: 700, fontSize: "13px", color: "#880e4f", margin: 0 }, children: "Sa\\xFAde e Viol\\xEAncia no Munic\\xEDpio" }),' +
            'e.jsx("p", { style: { fontSize: "11px", color: "#c2185b", margin: 0 }, children: "Interna\\xE7\\xF5es por causas externas e \\xF3bitos por viol\\xEAncia \\u2014 DataSUS" })' +
          ']}),' +
          'e.jsx("span", { style: { fontSize: "16px", color: "#c2185b", transform: saudeViolOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }, children: "\\u25BE" })' +
        ']}),' +
        'saudeViolOpen && e.jsxs("div", { style: { padding: "0 18px 16px", borderTop: "1px solid #f8bbd0" }, children: [' +
          'saudeViolLoading && e.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: "#c2185b", fontSize: 13 }, children: [e.jsx(Ie, { className: "w-4 h-4 animate-spin" }), " Consultando DataSUS..."] }),' +
          '!saudeViolLoading && saudeViolData && saudeViolData.ok && e.jsxs(e.Fragment, { children: [' +
            'e.jsxs("div", { style: { background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "10px 14px", marginTop: 14, marginBottom: 10 }, children: [' +
              'e.jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#5f4200", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "\\u2139\\uFE0F Como consultar" }),' +
              'e.jsx("p", { style: { fontSize: 11, color: "#7a5200", margin: 0, lineHeight: 1.5 }, children: saudeViolData.mensagem })' +
            ']}),' +
            'saudeViolData.sisvan && e.jsxs("div", { style: { background: "#fff", border: "1.5px solid #f48fb1", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }, children: [' +
              'e.jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#880e4f", margin: "0 0 4px", textTransform: "uppercase" }, children: "SISVAN \\u2014 Vigil\\xE2ncia Nutricional Infantil" }),' +
              'e.jsxs("p", { style: { fontSize: 12, color: "#c2185b", margin: 0 }, children: [saudeViolData.sisvan.registros, " registros \\u2014 compet\\xEAncia ", saudeViolData.sisvan.competencia || "n.d."] }),' +
              'e.jsx("p", { style: { fontSize: 10, color: "#888", margin: "4px 0 0" }, children: saudeViolData.sisvan.nota })' +
            ']}),' +
            'e.jsxs("div", { style: { marginBottom: 10 }, children: [' +
              'e.jsx("p", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#880e4f", marginBottom: 8 }, children: "Acesso direto ao DataSUS (TABNET)" }),' +
              'e.jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: (saudeViolData.links || []).map(function(lk, li) {' +
                'return e.jsxs("a", { href: lk.url, target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, fontWeight: 600, color: "#880e4f", background: "#fff", border: "1px solid #f48fb1", borderRadius: 8, padding: "6px 10px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 2 }, children: [' +
                  'e.jsxs("span", { children: [lk.nome, " \\u2197"] }),' +
                  'e.jsx("span", { style: { fontSize: 10, color: "#c2185b", fontWeight: 400 }, children: lk.desc })' +
                ']}, li);' +
              '})})' +
            ']}),' +
            'e.jsx("p", { style: { fontSize: 10, color: "#c2185b", margin: "6px 0 0", lineHeight: 1.4 }, children: "Fonte: " + (saudeViolData.fonte || "DataSUS / Ministério da Saúde") })' +
          ']}),' +
          '!saudeViolLoading && saudeViolData && !saudeViolData.ok && e.jsx("p", { style: { fontSize: 12, color: "#888", padding: "12px 0" }, children: "Dados de sa\\xFAde e viol\\xEAncia n\\xE3o dispon\\xEDveis para este munic\\xEDpio." }),' +
          '!saudeViolLoading && !saudeViolData && !a && e.jsx("p", { style: { fontSize: 12, color: "#888", padding: "12px 0" }, children: "C\\xF3digo IBGE n\\xE3o dispon\\xEDvel para esta escola." })' +
        ']})' +
      ']}),' +
      // ── Perfil Socioeconômico card ──
      'e.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #a5d6a7", background: "#e8f5e9" }, children: [' +
        'e.jsxs("button", { onClick: openIbgeSocio, style: { width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }, children: [' +
          'e.jsx("div", { style: { width: 38, height: 38, borderRadius: 12, background: "#c8e6c9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: e.jsx(Ct, { size: 18 }) }),' +
          'e.jsxs("div", { style: { flex: 1 }, children: [' +
            'e.jsx("p", { style: { fontWeight: 700, fontSize: "13px", color: "#1b5e20", margin: 0 }, children: "Perfil Socioecon\\xF4mico do Munic\\xEDpio" }),' +
            'e.jsx("p", { style: { fontSize: "11px", color: "#2e7d32", margin: 0 }, children: "PIB per capita, popula\\xE7\\xE3o, renda \\u2014 IBGE" })' +
          ']}),' +
          'e.jsx("span", { style: { fontSize: "16px", color: "#2e7d32", transform: ibgeSocioOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }, children: "\\u25BE" })' +
        ']}),' +
        'ibgeSocioOpen && e.jsxs("div", { style: { padding: "0 18px 16px", borderTop: "1px solid #c8e6c9" }, children: [' +
          'ibgeSocioLoading && e.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: "#2e7d32", fontSize: 13 }, children: [e.jsx(Ie, { className: "w-4 h-4 animate-spin" }), " Consultando IBGE..."] }),' +
          '!ibgeSocioLoading && ibgeSocioData && ibgeSocioData.ok && e.jsxs(e.Fragment, { children: [' +
            'e.jsx("p", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#1b5e20", marginTop: 14, marginBottom: 10 }, children: "Indicadores Socioecon\\xF4micos \\u2014 IBGE" }),' +
            'e.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 10 }, children: [' +
              'ibgeSocioData.populacao != null && e.jsxs("div", { style: { background: "#fff", border: "1px solid #a5d6a7", borderRadius: 10, padding: "10px 12px" }, children: [' +
                'e.jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#1b5e20", margin: "0 0 2px", textTransform: "uppercase" }, children: "Popula\\xE7\\xE3o (" + (ibgeSocioData.populacao_ano || "IBGE") + ")" }),' +
                'e.jsx("p", { style: { fontSize: 20, fontWeight: 800, color: "#2e7d32", margin: 0, lineHeight: 1 }, children: ibgeSocioData.populacao.toLocaleString("pt-BR") })' +
              ']}),' +
              'ibgeSocioData.pib_per_capita != null && e.jsxs("div", { style: { background: "#fff", border: "1px solid #a5d6a7", borderRadius: 10, padding: "10px 12px" }, children: [' +
                'e.jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#1b5e20", margin: "0 0 2px", textTransform: "uppercase" }, children: "PIB per capita (" + (ibgeSocioData.pib_ano || "") + ")" }),' +
                'e.jsxs("p", { style: { fontSize: 20, fontWeight: 800, color: "#2e7d32", margin: 0, lineHeight: 1 }, children: ["R$\\xA0", ibgeSocioData.pib_per_capita.toLocaleString("pt-BR", { maximumFractionDigits: 0 })] })' +
              ']}),' +
              'ibgeSocioData.rendimento_medio_domiciliar != null && e.jsxs("div", { style: { background: "#fff", border: "1px solid #a5d6a7", borderRadius: 10, padding: "10px 12px" }, children: [' +
                'e.jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#1b5e20", margin: "0 0 2px", textTransform: "uppercase" }, children: "Rendimento M\\xE9dio Domiciliar" + (ibgeSocioData.rendimento_ano ? " (" + ibgeSocioData.rendimento_ano + ")" : "") }),' +
                'e.jsxs("p", { style: { fontSize: 20, fontWeight: 800, color: "#2e7d32", margin: 0, lineHeight: 1 }, children: ["R$\\xA0", ibgeSocioData.rendimento_medio_domiciliar.toLocaleString("pt-BR", { maximumFractionDigits: 0 })] })' +
              ']}),' +
              'ibgeSocioData.taxa_extrema_pobreza != null && e.jsxs("div", { style: { background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "10px 12px" }, children: [' +
                'e.jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#5f4200", margin: "0 0 2px", textTransform: "uppercase" }, children: "Taxa de Extrema Pobreza (Censo 2022)" }),' +
                'e.jsxs("p", { style: { fontSize: 20, fontWeight: 800, color: "#e65100", margin: 0, lineHeight: 1 }, children: [ibgeSocioData.taxa_extrema_pobreza.toFixed(1).replace(".", ","), "%"] })' +
              ']})' +
            '].filter(Boolean)}),' +
            'e.jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }, children: (ibgeSocioData.links || []).map(function(lk, li) {' +
              'return e.jsx("a", { href: lk.url, target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, fontWeight: 700, color: "#1b5e20", background: "#c8e6c9", padding: "4px 12px", borderRadius: 20, border: "1px solid #a5d6a7", textDecoration: "none" }, children: lk.nome + " \\u2197" }, li);' +
            '})}),' +
            'e.jsxs("p", { style: { fontSize: 10, color: "#388e3c", margin: "4px 0 0", lineHeight: 1.5 }, children: [' +
              'ibgeSocioData.fontes && ibgeSocioData.fontes.pib && e.jsxs("span", { children: [ibgeSocioData.fontes.pib, ". "] }),' +
              'ibgeSocioData.fontes && ibgeSocioData.fontes.populacao && e.jsxs("span", { children: [ibgeSocioData.fontes.populacao, "."] })' +
            ']})' +
          ']}),' +
          '!ibgeSocioLoading && ibgeSocioData && !ibgeSocioData.ok && e.jsxs("div", { style: { padding: "12px 0" }, children: [' +
            'e.jsx("p", { style: { fontSize: 12, color: "#888", marginBottom: 8 }, children: "Dados socioecon\\xF4micos n\\xE3o dispon\\xEDveis para este munic\\xEDpio." }),' +
            'e.jsx("a", { href: "https://cidades.ibge.gov.br/", target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, fontWeight: 700, color: "#1b5e20", background: "#c8e6c9", padding: "4px 12px", borderRadius: 20, border: "1px solid #a5d6a7", textDecoration: "none" }, children: "IBGE Cidades \\u2197" })' +
          ']}),' +
          '!ibgeSocioLoading && !ibgeSocioData && !a && e.jsx("p", { style: { fontSize: 12, color: "#888", padding: "12px 0" }, children: "C\\xF3digo IBGE n\\xE3o dispon\\xEDvel para esta escola." })' +
        ']})' +
      ']}),' +
      _SUPORTE_ANCHOR;
    const _anchorIdx = dashSrc.indexOf(_SUPORTE_ANCHOR);
    if (_anchorIdx !== -1) {
      dashSrc = dashSrc.slice(0, _anchorIdx) + _NEW_CARDS + dashSrc.slice(_anchorIdx + _SUPORTE_ANCHOR.length);
      changed = true;
      console.log('[bootstrap] Dashboard-v30 context cards: 3 new accordion cards injected');
    } else {
      console.warn('[bootstrap] Dashboard-v30 context cards: Suporte Institucional anchor not found');
    }
  } else {
    console.log('[bootstrap] Dashboard-v30 context cards: already applied');
  }

  // Fix: context cards patch caused occurrence 2 (inner CME) to be a statement inside
  // Bt IIFE #1 without closing occurrence 2's e.jsxs or Bt IIFE #1.
  // This adds the missing `)})()` between the two `]`s in the closing sequence.
  const _BROKEN_CLOSE = '\n      })()] })] });\n';
  const _FIXED_CLOSE  = '\n      })()] })})() ] });\n';
  if (dashSrc.includes(_BROKEN_CLOSE)) {
    dashSrc = dashSrc.replace(_BROKEN_CLOSE, _FIXED_CLOSE);
    changed = true;
    console.log('[bootstrap] Dashboard-v30 context cards: closing-sequence fix applied');
  }

  // ── Sub-patch: fix CNES field name mappings in equip map URL (cnes-fields-v1) ──
  // The compiled SPA fetches CNES directly and uses old field names (O.latitude,
  // O.logradouro, O.numero, O.bairro, O.municipio, O.cep, O.telefone) that don't
  // exist in the current CNES API. Correct names use _estabelecimento suffixes.
  // This caused Maps links to fall back to name-only search → wrong location.
  const _CNES_FIELDS_MARKER = 'O.latitude_estabelecimento_decimo_grau';
  if (!dashSrc.includes(_CNES_FIELDS_MARKER)) {
    const _CNES_OLD = 'const M = O.latitude ? parseFloat(O.latitude) : null, K = O.longitude ? parseFloat(O.longitude) : null, Se = [[O.logradouro, O.numero].filter(Boolean).join(", "), O.bairro, O.municipio, O.cep ? `CEP ${O.cep}` : ""].filter(Boolean).join(" \\u2014 ");\n              r[$].push({ source: "cnes", nome: O.nome_fantasia || O.nome_razao_social || null, endereco: Se || null, telefone: O.telefone || null, lat: M, lon: K, mapsUrl: M && K ? `https://www.google.com/maps?q=${M},${K}` : null });';
    const _CNES_NEW = 'const M = O.latitude_estabelecimento_decimo_grau ? parseFloat(String(O.latitude_estabelecimento_decimo_grau).replace(",", ".")) : null, K = O.longitude_estabelecimento_decimo_grau ? parseFloat(String(O.longitude_estabelecimento_decimo_grau).replace(",", ".")) : null, Se = [[O.endereco_estabelecimento, O.numero_estabelecimento].filter(Boolean).join(", "), O.bairro_estabelecimento, O.municipio_estabelecimento, O.cep_estabelecimento ? `CEP ${O.cep_estabelecimento}` : ""].filter(Boolean).join(" \\u2014 ");\n              r[$].push({ source: "cnes", nome: O.nome_fantasia || O.nome_razao_social || null, endereco: Se || null, telefone: O.numero_telefone_estabelecimento || null, lat: M, lon: K, mapsUrl: (() => { const _q = [(O.nome_fantasia || O.nome_razao_social || "").trim(), Se].filter(Boolean).join(", "); return _q ? `https://www.google.com/maps?q=${encodeURIComponent(_q)}` : M && K ? `https://www.google.com/maps?q=${M},${K}` : null; })() });';
    if (dashSrc.includes(_CNES_OLD)) {
      dashSrc = dashSrc.replace(_CNES_OLD, _CNES_NEW);
      changed = true;
      console.log('[bootstrap] Dashboard-v30 CNES field names fixed (lat/lon/endereco/telefone)');
    } else {
      console.warn('[bootstrap] Dashboard-v30 CNES fields: anchor not found');
    }
  }

  // ── Sub-patch: upgrade CNES mapsUrl to /search/NAME/@LAT,LON,17z (cnes-maps-name-v1) ──
  // Applied separately from cnes-fields-v1 because dashSrc may already have the field fix
  // but still uses the old ?q=LAT,LON format without the establishment name.
  const _CNES_MAPS_OLD = 'mapsUrl: M && K ? `https://www.google.com/maps?q=${M},${K}` : null });';
  const _CNES_MAPS_NEW = 'mapsUrl: (() => { const _q = [(O.nome_fantasia || O.nome_razao_social || "").trim(), Se].filter(Boolean).join(", "); return _q ? `https://www.google.com/maps?q=${encodeURIComponent(_q)}` : M && K ? `https://www.google.com/maps?q=${M},${K}` : null; })() });';
  if (dashSrc.includes(_CNES_MAPS_OLD)) {
    dashSrc = dashSrc.replace(_CNES_MAPS_OLD, _CNES_MAPS_NEW);
    changed = true;
    console.log('[bootstrap] Dashboard-v30 CNES Maps URL: text-search by name+address applied');
  }

  // ── Sub-patch: cnes-maps-addr-v1 — upgrade /search/NAME/@LAT,LON to text-search by address ──
  // Replaces the intermediate /search/NAME/@LAT,LON,17z format (from cnes-maps-name-v1)
  // with a full text query (name + full address) so Google resolves the establishment correctly.
  const _CNES_ADDR_OLD = 'mapsUrl: M && K ? `https://www.google.com/maps/search/${encodeURIComponent((O.nome_fantasia || O.nome_razao_social || "").trim()).replace(/%20/g, "+")}/@${M},${K},17z` : null });';
  const _CNES_ADDR_NEW = 'mapsUrl: (() => { const _q = [(O.nome_fantasia || O.nome_razao_social || "").trim(), Se].filter(Boolean).join(", "); return _q ? `https://www.google.com/maps?q=${encodeURIComponent(_q)}` : M && K ? `https://www.google.com/maps?q=${M},${K}` : null; })() });';
  if (dashSrc.includes(_CNES_ADDR_OLD)) {
    dashSrc = dashSrc.replace(_CNES_ADDR_OLD, _CNES_ADDR_NEW);
    changed = true;
    console.log('[bootstrap] Dashboard-v30 CNES Maps URL upgraded to text-search (name+address)');
  }

  // ── Sub-patch: sanitize OSM name when it contains opening_hours junk (osm-name-clean-v1) ──
  // Some OSM mappers put operating hours into the `name` tag (e.g. "Horário de Funcionamento ...").
  // Prefer name:pt/official_name and reject name strings that look like schedules.
  const _OSM_NAME_OLD = 'r[K].push({ source: "osm", nome: ee.name || ee["name:pt"] || null,';
  const _OSM_NAME_NEW = 'r[K].push({ source: "osm", nome: (() => { const _n = (ee["name:pt"] || ee.name || ee["official_name"] || ee["short_name"] || "").trim(); return _n && !/hor[\\u00e1a]rio|funcionamento|\\d{1,2}\\s*h\\s*[\\u00e0a]s|\\d{1,2}:\\d{2}/i.test(_n) ? _n : null; })(),';
  if (dashSrc.includes(_OSM_NAME_OLD)) {
    dashSrc = dashSrc.replace(_OSM_NAME_OLD, _OSM_NAME_NEW);
    changed = true;
    console.log('[bootstrap] Dashboard-v30 OSM name sanitization applied (drops opening_hours-like names)');
  }

  // ── Sub-patch: sanitize CadUnico CRAS/CREAS nome (same rule as OSM) (cadunico-name-clean-v1) ──
  // The CadUnico-sourced items can also have operating-hours junk in the `nome` field
  // (e.g. Sobral CRAS: "Horário de Funcionamento (Dias Úteis): 8h às 12h e 14h às 18h").
  // Reject those and fall back to the schedule-extracted name (B2).
  const _CADU_NAME_OLD = 'const E2 = String(h?.nome || "").trim() || B2;';
  const _CADU_NAME_NEW = 'const _rawNome = String(h?.nome || "").trim(); const E2 = (_rawNome && !/hor[\\u00e1a]rio|funcionamento|\\d{1,2}\\s*h\\s*[\\u00e0a]s|\\d{1,2}:\\d{2}/i.test(_rawNome)) ? _rawNome : B2;';
  if (dashSrc.includes(_CADU_NAME_OLD)) {
    dashSrc = dashSrc.replace(_CADU_NAME_OLD, _CADU_NAME_NEW);
    changed = true;
    console.log('[bootstrap] Dashboard-v30 CadUnico nome sanitization applied');
  }

  // ── Sub-patch: pass school INEP to /api/equipamentos-publicos so the saude
  //              referencia_proximidade is the school itself (not the centroid). (equip-fetch-inep-v1) ──
  const _EQUIP_FETCH_OLD = 'fetch(`/api/equipamentos-publicos/${a}`)';
  const _EQUIP_FETCH_NEW = 'fetch(`/api/equipamentos-publicos/${a}` + (N && N.escola && N.escola.co_entidade ? `?inep=${encodeURIComponent(N.escola.co_entidade)}` : ``))';
  if (dashSrc.includes(_EQUIP_FETCH_OLD) && !dashSrc.includes(_EQUIP_FETCH_NEW)) {
    dashSrc = dashSrc.replace(_EQUIP_FETCH_OLD, _EQUIP_FETCH_NEW);
    changed = true;
    console.log('[bootstrap] Dashboard-v30 equipamentos fetch now passes ?inep= for school-centric proximity');
  }

  // ── Sub-patch: ordenar cada subcategoria de equipamentos por proximidade (equip-sort-by-proximity-v1) ──
  // Usa Ra.saude.referencia_proximidade (centroide do município ou escola) como ponto de referência.
  // Itens sem lat/lon vão para o final.
  const _SORT_OLD = '          const h = ca[g] || [];';
  const _SORT_NEW = '          const _refPx = Ra && Ra.saude && Ra.saude.referencia_proximidade; const _haver = (n) => { const _la = n.lat != null ? n.lat : n.latitude, _lo = n.lon != null ? n.lon : n.longitude; if (_la == null || _lo == null || !_refPx || _refPx.latitude == null || _refPx.longitude == null) return Infinity; const _R = 6371, _dLa = (_la - _refPx.latitude) * Math.PI / 180, _dLo = (_lo - _refPx.longitude) * Math.PI / 180; const _aa = Math.sin(_dLa/2)*Math.sin(_dLa/2) + Math.cos(_refPx.latitude * Math.PI/180) * Math.cos(_la * Math.PI/180) * Math.sin(_dLo/2)*Math.sin(_dLo/2); return 2 * _R * Math.asin(Math.sqrt(_aa)); }; const h = (ca[g] || []).slice().sort((aa, bb) => _haver(aa) - _haver(bb));';
  if (dashSrc.includes(_SORT_OLD) && !dashSrc.includes('_haver')) {
    dashSrc = dashSrc.replace(_SORT_OLD, _SORT_NEW);
    changed = true;
    console.log('[bootstrap] Dashboard-v30 equipamentos sort by proximity applied');
  }

  // ── Sub-patch: remove CRAS/CREAS from OSM equipamentos to avoid duplication with CadUnico block (cras-dedup-v1) ──
  // CRAS and CREAS were appearing twice: once in the generic OSM/CNES equipamentos block and once in the
  // dedicated CadUnico-sourced "CRAS e CREAS" block below. Strip them from the OSM block so the dedicated
  // section is the single source of truth.
  const _CRAS_DEDUP_OLD = 'Pt({ ...r }), rt(false);';
  const _CRAS_DEDUP_NEW = 'delete r.cras; delete r.creas; Pt({ ...r }), rt(false);';
  if (dashSrc.includes(_CRAS_DEDUP_OLD) && !dashSrc.includes(_CRAS_DEDUP_NEW)) {
    dashSrc = dashSrc.replace(_CRAS_DEDUP_OLD, _CRAS_DEDUP_NEW);
    changed = true;
    console.log('[bootstrap] Dashboard-v30 CRAS/CREAS removed from OSM block (dedup with CadUnico)');
  }

  // ── Sub-patch: remove "Rede socioassistencial / fontes / desatualizados" footer (mds-fonte-removed-v1) ──
  // User requested removal of the whole sources/footer paragraph below the equipment block.
  const _MDS_FOOTER_OLD = ', e.jsxs("p", { style: { fontSize: "10px", color: "#6b8a74", marginTop: 10, marginBottom: 6 }, children: [Ke?.ok && Ke.total > 0 && e.jsx("span", { children: "Rede socioassistencial: Mapa Social MDS. " }), Ra.ibge_fonte && e.jsxs("span", { children: ["Contagens hist\\xF3ricas: ", Ra.ibge_fonte, ". "] }), ca && n > 0 && e.jsx("span", { children: "Sa\\xFAde: CNES/Min. Sa\\xFAde e OpenStreetMap. " }), Pe && (Pe.cras?.length > 0 || Pe.creas?.length > 0) && e.jsx("span", { children: "CRAS/CREAS: CadUnico Brasil. " }), "Dados podem estar desatualizados."] })';
  if (dashSrc.includes(_MDS_FOOTER_OLD)) {
    dashSrc = dashSrc.replace(_MDS_FOOTER_OLD, '');
    changed = true;
    console.log('[bootstrap] Dashboard-v30 MDS/fontes footer removed');
  }

  // ── Sub-patch 3k-i: update segurança card UI for SINAN/SIM data (not SINESP-only) ──
  // Updates subtitle, section header, natureza cards to reflect municipal-level data.
  // ── Sub-patch: clean up "/* segui-v2-sinan */" text that renders visibly in subtitle ──
  if (dashSrc.includes('/* segui-v2-sinan */ Viol')) {
    dashSrc = dashSrc.replace(
      'children: "/* segui-v2-sinan */ Viol\\xEAncia e seguran\\xE7a \\u2014 SINAN/MS, SIM/MS + SINESP"',
      'children: "Viol\\xEAncia e seguran\\xE7a \\u2014 SINAN/MS, SIM/MS + SINESP"'
    );
    changed = true;
    console.log('[bootstrap] Dashboard-v30 seguranca subtitle comment cleaned');
  }

  const _SEG_UI_MARKER = 'SINAN/MS, SIM/MS + SINESP';
  if (!dashSrc.includes(_SEG_UI_MARKER)) {
    let _segChanged = false;
    // 1. Update card subtitle
    const _OLD_SUBTITLE = 'children: "Ocorr\\xEAncias criminais por natureza \\u2014 SINESP/SENASP"';
    const _NEW_SUBTITLE = 'children: "/* ' + _SEG_UI_MARKER + ' */ Viol\\xEAncia e seguran\\xE7a \\u2014 SINAN/MS, SIM/MS + SINESP"';
    if (dashSrc.includes(_OLD_SUBTITLE)) {
      dashSrc = dashSrc.replace(_OLD_SUBTITLE, _NEW_SUBTITLE);
      _segChanged = true;
    }
    // 2. Update section header label: replace "Ocorrências por Natureza — UF (ano)" with dynamic label
    const _OLD_HDR = '"Ocorr\\xEAncias por Natureza \\u2014 " + (segData.uf || "") + " (" + (segData.ano || "") + ")"';
    const _NEW_HDR = '(segData.municipal_db && segData.municipal_db.length > 0 ? "Indicadores de Seguran\\xE7a \\u2014 Municipal (" + (segData.ano || "") + ")" : "Ocorr\\xEAncias por Natureza \\u2014 " + (segData.uf || "") + " (" + (segData.ano || "") + ")")';
    if (dashSrc.includes(_OLD_HDR)) {
      dashSrc = dashSrc.replace(_OLD_HDR, _NEW_HDR);
      _segChanged = true;
    }
    // 3. Update section badge: replace segData.uf with "Municipal" / UF conditional
    const _OLD_BADGE = 'children: segData.uf })';
    const _NEW_BADGE = 'children: segData.municipal_db && segData.municipal_db.length > 0 ? "Municipal" : segData.uf })';
    if (dashSrc.includes(_OLD_BADGE)) {
      dashSrc = dashSrc.replace(_OLD_BADGE, _NEW_BADGE);
      _segChanged = true;
    }
    // 4. Update natureza card to show nivel badge + unidade (replace card body render)
    const _OLD_CARD_BODY =
      'e.jsx("p", { style: { fontSize: 20, fontWeight: 800, color: "#bf360c", margin: "0 0 2px", lineHeight: 1 }, children: n.quantidade.toLocaleString("pt-BR") }),' +
      'e.jsx("p", { style: { fontSize: 10, color: "#e64a19", margin: 0, lineHeight: 1.3 }, children: n.natureza })' +
      ']}, ni);';
    const _NEW_CARD_BODY =
      'e.jsxs("p", { style: { fontSize: 20, fontWeight: 800, color: "#bf360c", margin: "0 0 2px", lineHeight: 1 }, children: [n.quantidade.toLocaleString("pt-BR"), n.unidade ? e.jsx("span", { style: { fontSize: 10, fontWeight: 400, color: "#e64a19", marginLeft: 4 }, children: n.unidade }) : null] }),' +
      'e.jsx("p", { style: { fontSize: 10, color: "#e64a19", margin: "0 0 3px", lineHeight: 1.3 }, children: n.natureza }),' +
      'n.nivel && e.jsx("span", { style: { fontSize: 9, background: n.nivel === "Municipal" ? "#ffe0b2" : "#fff3e0", color: "#bf360c", borderRadius: 10, padding: "1px 7px", fontWeight: 600 }, children: n.nivel })' +
      ']}, ni);';
    if (dashSrc.includes(_OLD_CARD_BODY)) {
      dashSrc = dashSrc.replace(_OLD_CARD_BODY, _NEW_CARD_BODY);
      _segChanged = true;
    }
    if (_segChanged) {
      changed = true;
      console.log('[bootstrap] Dashboard-v30 seguranca card UI v2 (SINAN/SIM labels) applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 seguranca card UI v2: some anchors not found');
    }
  }

  // ── Sub-patch: REMOVE PNAD Contínua cards from Perfil Socioeconômico (pnad-removed-v1) ──
  // PNAD Contínua só publica em nível UF, não município. Removidos os cards e referências
  // a pedido do usuário. O Censo 2022 (rendimento_medio_domiciliar e taxa_extrema_pobreza)
  // já cobre o espaço com dados em nível municipal.
  if (dashSrc.includes('pnad_desocupacao')) {
    // 1. Reverter subtitle do card
    dashSrc = dashSrc.replace(
      'children: "PIB per capita, popula\\xE7\\xE3o, renda e emprego \\u2014 IBGE/PNAD Cont\\xEDnua"',
      'children: "PIB per capita, popula\\xE7\\xE3o, renda \\u2014 IBGE"'
    );
    // 2. Remover bloco dos dois cards PNAD do grid
    //    De `]}),ibgeSocioData.pnad_desocupacao ...` até `pnad_uf_nome] })]})].filter(Boolean)`
    //    Preservando `]})].filter(Boolean)`.
    const _pnadStart = dashSrc.indexOf(',ibgeSocioData.pnad_desocupacao != null');
    const _pnadEndAnchor = '"UF \\u2014 ", ibgeSocioData.pnad_uf_nome] })]})].filter(Boolean)';
    const _pnadEndIdx = dashSrc.indexOf(_pnadEndAnchor, _pnadStart);
    if (_pnadStart > 0 && _pnadEndIdx > _pnadStart) {
      const _pnadEnd = _pnadEndIdx + _pnadEndAnchor.length;
      dashSrc = dashSrc.slice(0, _pnadStart) + '].filter(Boolean)' + dashSrc.slice(_pnadEnd);
    } else {
      console.warn('[bootstrap] pnad-removed: card block anchors not found');
    }
    // 3. Reverter footnote (remover span do PNAD e voltar pontuação do populacao)
    dashSrc = dashSrc.replace(
      'ibgeSocioData.fontes.populacao, ". "] }),ibgeSocioData.fontes && ibgeSocioData.fontes.pnad && e.jsxs("span", { children: [ibgeSocioData.fontes.pnad, "."] })',
      'ibgeSocioData.fontes.populacao, "."] })'
    );
    changed = true;
    console.log('[bootstrap] Dashboard-v30 PNAD Contínua cards REMOVED from Perfil Socioeconômico');
  }

  // ── Sub-patch: fix SI accordion IIFE missing return (causes blank when expanded) ──
  // The Bt && (() => { e.jsxs(...) })() pattern inside the SI card never returned
  // its JSX, so the accordion showed nothing. Adding 'return' before e.jsxs fixes it.
  const _SI_RETURN_MARKER = 'si-iife-return-v1';
  if (!dashSrc.includes(_SI_RETURN_MARKER)) {
    const _OLD_SI_IIFE = 'Bt && (() => {\ne.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #d4c4f5"';
    const _NEW_SI_IIFE = 'Bt && (() => { /* ' + _SI_RETURN_MARKER + ' */\nreturn e.jsxs("div", { style: { borderRadius: "16px", overflow: "hidden", border: "1.5px solid #d4c4f5"';
    if (dashSrc.includes(_OLD_SI_IIFE)) {
      dashSrc = dashSrc.replace(_OLD_SI_IIFE, _NEW_SI_IIFE);
      changed = true;
      console.log('[bootstrap] Dashboard-v30 SI accordion IIFE return fix applied');
    } else {
      console.warn('[bootstrap] Dashboard-v30 SI accordion IIFE return fix: anchor not found');
    }
  }

  if (changed) {
    fs.writeFileSync(dashboardV30AssetPath, dashSrc, 'utf8');
  }
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
