/* === FILE: src/core/state.js === */
/* ponytail: satu objek state + accessor live; selector tak berkualifikasi tetap bekerja lintas modul. */
export const S = {
  prevC: {},
  nxtDone: {},
  OK: ["tagline","nama","warna","font","logobg","kunci","web"],
  OPT: {},
  posDasar: "",
  tagSim: "",
  jamVal: "",
  jamAna: "",
  CP: {m:"warna", slot:0, v:[]},
  lastFont: "",
  customFont: null,
  userOpts: [],
  uBusy: false,
  posOpts: [],
  posAuto: false,
  conf: {},
  started: {kompetitor:true},
  comp: null,
  compFile: null,
  cLogoU: null,
  files: {},
  cur: null,
  logo: null,
  vcol: {},
  act: null,
  sP: null,
  markSVG: "",
  markConcept: "",
  markBusy: false,
  DEAD_MODELS: {},
  MAX_IMG: 5 * 1024 * 1024,
  MAX_PDF: 10 * 1024 * 1024,
  MAX_FONT: 2 * 1024 * 1024,
  DRAFT_KEY: "dna_board_draft_v1",
  saveTimer: null,
  T12_VERSION: 1,
  T12_MAX: 2 * 1024 * 1024,
  _t12Toast: null,
  T13_OPEN_KEY: "dna_openonly",
  MODEL_PROFILES: {
    deep:     [/gpt-oss-120b/i, /qwen3/i, /gpt-oss-20b/i],
    fast:     [/gpt-oss-20b/i, /gpt-oss-120b/i],
    creative: [/qwen3/i, /gpt-oss-120b/i, /gpt-oss-20b/i],
    search:   [/compound/i, /gpt-oss-120b/i],
    critic:   [/qwen3/i, /gpt-oss-120b/i],
    vision:   [/vision|-vl|gemini/i],
    capabilities: {
      json: [/llama-3/i, /llama-4/i, /gpt-oss/i, /gemma/i, /mixtral/i]
    },
    reasoning: {
      "none":   [/gemini/i],
      "low":    [/gpt-oss/i],
      "medium": [/gpt-oss/i],
      "high":   [/gpt-oss/i]
    }
  },
  BB: {
    brief:"", jam:"", comp:null, pain:[], gain:[], segmen:"", segmen_skor:null,
    nama_kompetitor:"", compDraft:{}, /* === T6 HOOK: state === */
    /* === T7 HOOK: state === */ posDraft:{},
    /* === T8 HOOK: state === */ verbalDraft:{}, visualDraft:{},
    /* === T9 HOOK: state === */ logoDraft:{}, logoInfo:{}, markConcept:"",
    user:{}, meja:[], positioning:"", tagline:"", nama:"", kunci:"", web:"",
    tags:[], warna:{}, font:"", logobg:{}, markSVG:"", conf:{}, notes:{}, flags:{},
    __t5:false
  },
  BB_FIELDS: (function(){
    var map = {
      tagline:["tagline"], nama:["nama"], kompetitor:["comp","name"],
      positioning:["positioning"], segmen:["segmen"], kunci:["kunci"], web:["web"],
      font:["font"], filf:["filf"], filw:["warna","filosofi"],
      c1:["warna","c1"], c2:["warna","c2"],
      bg1:["logobg","bg1"], bg2:["logobg","bg2"], bg3:["logobg","bg3"],
      usertitle:["user","usertitle"], usersub:["user","usersub"], usia:["user","usia"]
    };
    for(var i=1; i<=5; i++){
      map["pain"+i] = ["pain", i-1];
      map["gain"+i] = ["gain", i-1];
    }
    for(var j=1; j<=7; j++) map["meja"+j] = ["meja", j-1];
    return map;
  })(),
  IDB: {
    db:null, opening:null,
    open:function(){
      if(this.db) return Promise.resolve();
      if(this.opening) return this.opening;
      this.opening = new Promise(function(res, rej){
        if(!window.indexedDB){ rej(new Error("IndexedDB tidak tersedia.")); return; }
        var r = indexedDB.open("dna-files", 1);
        r.onupgradeneeded = function(){ r.result.createObjectStore("files"); };
        r.onsuccess = function(){ IDB.db = r.result; res(); };
        r.onerror = function(){ rej(r.error); };
      });
      return this.opening;
    },
    put:function(k, v){
      return this.open().then(function(){ return new Promise(function(res, rej){
        var tx = IDB.db.transaction("files", "readwrite");
        tx.objectStore("files").put(v, k);
        tx.oncomplete = res;
        tx.onerror = function(){ rej(tx.error); };
      }); });
    },
    get:function(k){
      return this.open().then(function(){ return new Promise(function(res, rej){
        var q = IDB.db.transaction("files", "readonly").objectStore("files").get(k);
        q.onsuccess = function(){ res(q.result); };
        q.onerror = function(){ rej(q.error); };
      }); });
    },
    del:function(k){
      return this.open().then(function(){ return new Promise(function(res, rej){
        var tx = IDB.db.transaction("files", "readwrite");
        tx.objectStore("files").delete(k);
        tx.oncomplete = res;
        tx.onerror = function(){ rej(tx.error); };
      }); });
    }
  }
};

export function exposeState(keys){
  keys.forEach(function(k){
    Object.defineProperty(globalThis, k, {configurable:true, get:function(){ return S[k]; }, set:function(v){ S[k] = v; }});
  });
}

export function exposeFn(map){
  Object.keys(map).forEach(function(k){
    Object.defineProperty(globalThis, k, {configurable:true, get:map[k].get, set:map[k].set || function(){}});
  });
}

export function resolveModels(profile, activeIds, avoid){
  var pats = MODEL_PROFILES[profile];
  if(!pats || !Array.isArray(pats) || !Array.isArray(activeIds)) return [];
  var skip = [].concat(avoid || []);
  var out = [];
  pats.forEach(function(rx){
    activeIds.forEach(function(id){
      if(!id || out.indexOf(id) >= 0) return;
      if(skip.indexOf(id) >= 0 || DEAD_MODELS[id]) return;
      if(rx.test(id)) out.push(id);
    });
  });
  return out;
}

export function supportsReasoning(modelId, value){
  var rules = MODEL_PROFILES.reasoning;
  if(!modelId || !rules) return false;
  var keys = value == null ? Object.keys(rules) : [value];
  for(var i=0;i<keys.length;i++){
    var pats = rules[keys[i]];
    if(!pats || !Array.isArray(pats)) continue;
    for(var j=0;j<pats.length;j++){
      if(pats[j].test(modelId)) return true;
    }
  }
  return false;
}

export function supportsJsonMode(modelId){
  var pats = MODEL_PROFILES.capabilities && MODEL_PROFILES.capabilities.json;
  if(!modelId || !pats || !Array.isArray(pats)) return false;
  for(var i=0;i<pats.length;i++){
    if(pats[i].test(modelId)) return true;
  }
  return false;
}

export function BB_FIELD(id){ return BB_FIELDS[id] || null; }

export function BB_GET(path){
  var cur = BB;
  for(var i=0; i<path.length; i++){
    if(cur == null) return "";
    cur = cur[path[i]];
  }
  return cur == null ? "" : cur;
}

export function BB_SET(path, val){
  var cur = BB;
  for(var i=0; i<path.length-1; i++){
    if(cur[path[i]] == null || typeof cur[path[i]] !== "object") cur[path[i]] = typeof path[i+1] === "number" ? [] : {};
    cur = cur[path[i]];
  }
  cur[path[path.length-1]] = val;
}

export function BBVAL(id){
  var path = BB_FIELD(id);
  return path ? (BB_GET(path) || "") : "";
}

export function BBHEX(id, fallback){
  var v = String(BBVAL(id)).trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
}

export function BB_SYNC_NODE(n, id){
  if(!n || (n.tagName === "INPUT" && n.type === "file")) return null;
  var v = (n.tagName === "INPUT" || n.tagName === "TEXTAREA") ? n.value : String(n.textContent || "");
  var path = BB_FIELD(id);
  if(path){ BB_SET(path, v); return path; }
  if(id === "brief"){ BB.brief = v; return ["brief"]; }
  var m = /^bp([1-8])$/.exec(id || "");
  if(m && typeof BPK !== "undefined" && BPK[m[1]-1]){
    path = ["user","persona",BPK[m[1]-1]];
    BB_SET(path, v);
    return path;
  }
  return null;
}

export function initBB(){
  BB.conf = conf;
  BB.comp = comp;
  BB.__t5 = true;
  var nodes = document.querySelectorAll ? document.querySelectorAll('[data-f]') : [];
  for(var i=0; i<nodes.length; i++){
    var n = nodes[i];
    if(n && n.getAttribute) BB_SYNC_NODE(n, n.getAttribute("data-f"));
  }
  if(document.getElementById){
    BB_SYNC_NODE(document.getElementById("brief"), "brief");
    for(var j=1; j<=8; j++) BB_SYNC_NODE(document.getElementById("bp"+j), "bp"+j);
  }
}

export function bridgeInput(e){
  var t = e && e.target;
  var n = t && t.closest ? t.closest('[data-f]') : null;
  if(n){ BB_SYNC_NODE(n, n.getAttribute("data-f")); return; }
  if(t && t.id) BB_SYNC_NODE(t, t.id);
}

export function blobToDataURL(b){
  return new Promise(function(res, rej){
    if(typeof b === "string"){ res(b); return; }
    var r = new FileReader();
    r.onload = function(){ res(r.result); };
    r.onerror = rej;
    r.readAsDataURL(b);
  });
}

export function validateFile(f){
  if(!f) return;
  if(/^image\//.test(f.type) && f.size > MAX_IMG) throw new Error("Gambar melebihi 5MB.");
  if(f.type === "application/pdf" && f.size > MAX_PDF) throw new Error("PDF melebihi 10MB.");
  if(/\.(ttf|otf|woff2?)$/i.test(f.name) && f.size > MAX_FONT) throw new Error("Font melebihi 2MB.");
}

export function idbStore(k, f){ IDB.put(k, f).catch(function(){}); }

export function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 800);
}

export function saveDraft(){
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(t12Snapshot())); } catch(e){ /* kuota / mode pribadi */ }
}

export function loadDraft(){
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if(!raw) return false;
    var data = JSON.parse(raw);
    if(!data || !data.bb) return false;
    var ok = t12Restore(data);
    if(ok) toast("Draft dipulihkan.");
    return ok;
  } catch(e){ return false; }
}

export function resetDraft(){
  if(typeof window !== "undefined" && typeof window.confirm === "function" &&
     !window.confirm("Mulai sesi baru? Draft board saat ini akan dihapus, tetapi API key tetap tersimpan.")) return false;
  clearTimeout(saveTimer);
  saveTimer = null;
  try { localStorage.removeItem(DRAFT_KEY); } catch(e){}
  /* Reset memory juga, bukan hanya storage; jika tidak, state lama bisa tersimpan
     kembali oleh listener input/click sebelum pengguna memulai sesi baru. */
  if(typeof window !== "undefined" && window.location && typeof window.location.reload === "function"){
    window.location.reload();
    return true;
  }
  toast("Draft dihapus.");
  return true;
}

export function t12Sanitize(v, depth, seen){
  depth = depth || 0;
  seen = seen || [];
  if(depth > 6) return null;
  if(v === null || typeof v !== "object"){
    if(typeof v === "string" && /^data:[^;]+;base64,/.test(v)) return null;
    return v;
  }
  if(seen.indexOf(v) > -1) return null;
  seen.push(v);
  if(Array.isArray(v)){
    var arr = v.map(function(x){ return t12Sanitize(x, depth + 1, seen); });
    seen.pop();
    return arr;
  }
  var out = {};
  Object.keys(v).forEach(function(k){
    if(/key|token|secret|password|credential/i.test(k)) return;
    var x = t12Sanitize(v[k], depth + 1, seen);
    if(x !== null && x !== undefined) out[k] = x;
  });
  seen.pop();
  return out;
}

export function t12Fields(){
  var o = {}, nodes = document.querySelectorAll ? document.querySelectorAll("[data-f]") : [];
  for(var i = 0; i < nodes.length; i++){
    var n = nodes[i];
    if(!n || n.tagName === "INPUT") continue;
    var id = n.getAttribute && n.getAttribute("data-f");
    if(id) o[id] = String(n.textContent || "");
  }
  return o;
}

export function t12Switches(){
  var o = {};
  try {
    var open = localStorage.getItem("dna_openonly");
    if(open !== null) o.openonly = (open === "1" || String(open).toLowerCase() === "true");
    var b = localStorage.getItem("dna_budget_v1");
    if(b){ var parsed = t12Sanitize(JSON.parse(b), 0, []); if(parsed) o.budget = parsed; }
  } catch(e){}
  return o;
}

export function t12Snapshot(){
  return {
    v: T12_VERSION, date: new Date().toISOString(),
    bb: t12Sanitize(BB, 0, []), fields: t12Fields(),
    conf: t12Sanitize(conf, 0, []), started: t12Sanitize(started, 0, []),
    nxtDone: t12Sanitize(nxtDone, 0, []), comp: t12Sanitize(comp, 0, []),
    cur: cur || null, switches: t12Switches()
  };
}

export async function t12Save(){
  try {
    var snap = t12Snapshot();
    await saveBlob("DNA-Bisnis-Progres-" + String(snap.date).slice(0, 10) + ".json",
      new Blob([JSON.stringify(snap, null, 2)], {type:"application/json"}));
    toast("Progres tersimpan.");
  } catch(e){
    toast("Gagal menyimpan progres: " + String((e && e.message) || e || "galat."));
  }
}

export function t12Valid(data){
  if(!data || typeof data !== "object" || data.v !== T12_VERSION) return false;
  var bb = data.bb;
  return !!(bb && typeof bb === "object" &&
    bb.qa && typeof bb.qa === "object" && bb.qa.layer1 && typeof bb.qa.layer1 === "object" &&
    bb.qa.flags && typeof bb.qa.flags === "object" && bb.notes && typeof bb.notes === "object" &&
    bb.flags && typeof bb.flags === "object" && data.fields && typeof data.fields === "object" &&
    data.conf && typeof data.conf === "object" && data.started && typeof data.started === "object" &&
    data.nxtDone && typeof data.nxtDone === "object");
}

export function t12Restore(data){
  if(!t12Valid(data)){
    toast("Format progres tidak lengkap.");
    return false;
  }
  try {
    var bb = t12Sanitize(data.bb, 0, []), f = t12Sanitize(data.fields, 0, []);
    if(!bb || typeof bb !== "object" || !f || typeof f !== "object") throw new Error("Format progres tidak valid.");
    Object.keys(BB).forEach(function(k){ delete BB[k]; });
    Object.keys(bb).forEach(function(k){ BB[k] = bb[k]; });
    /* ponytail: default init ada di BB.dir = BB.dir || {...}; guard ini menutup progres lama/pihak ketiga tanpa bb.dir. */
    if(!BB.dir || typeof BB.dir !== "object") BB.dir = {status:"IDLE", current:"", cancel:false, approval:"", reason:"", gen:0, researching:false};
    Object.keys(f).forEach(function(k){
      if(/^[a-z0-9_]+$/i.test(k)) t8FillField(k, String(f[k] == null ? "" : f[k]));
    });
    var c = t12Sanitize(data.conf, 0, []) || {}, s = t12Sanitize(data.started, 0, []) || {};
    var n = t12Sanitize(data.nxtDone, 0, []) || {};
    Object.keys(conf).forEach(function(k){ delete conf[k]; });
    Object.keys(c).forEach(function(k){ conf[k] = c[k]; });
    Object.keys(started).forEach(function(k){ delete started[k]; });
    Object.keys(s).forEach(function(k){ started[k] = s[k]; });
    Object.keys(nxtDone).forEach(function(k){ delete nxtDone[k]; });
    Object.keys(n).forEach(function(k){ nxtDone[k] = n[k]; });
    var rc = t12Sanitize(data.comp, 0, []);
    comp = rc && typeof rc === "object" ? rc : null;
    cur = data.cur || null;
    BB.conf = conf; BB.comp = comp; BB.__t5 = true;
    logo = null; compFile = null; cLogoU = null; files = {};
    var sw = t12Sanitize(data.switches, 0, []) || {};
    try {
      if(sw.openonly !== undefined) localStorage.setItem("dna_openonly", sw.openonly ? "1" : "0");
      if(sw.budget) localStorage.setItem("dna_budget_v1", JSON.stringify(sw.budget));
    } catch(e){}
    if(typeof sync === "function") sync();
    if(typeof applyLock === "function") applyLock();
    if(typeof t10Render === "function") t10Render();
    if(typeof t11Layer1 === "function") t11Layer1();
    var active = BX && BX[first()];
    toast("Progres dimuat. Kotak aktif: " + (active ? active.n : "semua") + ".");
    return true;
  } catch(e){
    toast("Gagal memuat progres: " + String((e && e.message) || e || "galat."));
    return false;
  }
}

export async function t12Load(file){
  try {
    if(!file || typeof file.text !== "function") throw new Error("File progres tidak valid.");
    if((file.size || 0) > T12_MAX) throw new Error("File terlalu besar (maksimal 2 MB).");
    var txt = await file.text();
    if(String(txt).length > T12_MAX) throw new Error("File terlalu besar (maksimal 2 MB).");
    t12Restore(JSON.parse(txt));
  } catch(e){
    toast("Gagal memuat progres: " + String((e && e.message) || e || "galat."));
  }
}

export function t12Click(ev){
  var t = ev && ev.target;
  if(!t || !t.closest) return;
  var btn = t.closest("#t12Save,#t12Load,#draftReset");
  if(!btn || !btn.id) return;
  if(btn.id === "draftReset") return resetDraft();
  if(btn.id === "t12Save") return t12Save();
  if(btn.id === "t12Load"){
    var f = document.getElementById("t12File");
    if(f && f.click) f.click();
  }
}

export function t12Quota(msg){
  var s = String(msg == null ? "" : msg);
  if(/Batas kuota lokal tersimpan/.test(s)) return false;
  return /quota_exhausted|rate_limited|Batas kuota tercapai|Kuota[^.]{0,40}habis|Terlalu sering, coba sebentar lagi/i.test(s);
}

export function t12Nudge(){
  var b = document.getElementById("t12Save");
  if(b && b.classList) b.classList.add("t12Nudge");
  var panel = document.getElementById("t10Panel");
  if(panel && panel.insertAdjacentHTML && !/Simpan progres untuk melanjutkan nanti/.test(String(panel.textContent || ""))){
    panel.insertAdjacentHTML("beforeend", '<div class="t12Quota">Kuota gratis habis, lanjutkan setelah reset. Simpan progres untuk melanjutkan nanti.</div>');
  }
}

export function t13State(){
  if(!BB || typeof BB !== "object") return null;
  if(!BB.t13 || typeof BB.t13 !== "object"){
    var on = false;
    try {
      var v = localStorage.getItem(T13_OPEN_KEY);
      on = v === "1" || String(v == null ? "" : v).toLowerCase() === "true";
    } catch(e){}
    BB.t13 = {openOnly:on, custom:{vision:false, critic:false, text:false}, used:{}, route:null, currentAgent:null};
  }
  return BB.t13;
}

export function t13Open(){
  var s = t13State();
  if(s) return !!s.openOnly;
  try {
    var v = localStorage.getItem(T13_OPEN_KEY);
    return v === "1" || String(v == null ? "" : v).toLowerCase() === "true";
  } catch(e){ return false; }
}

export function t13CustomReady(){
  try { return !!providerBase("custom"); } catch(e){ return false; }
}

export function t13SlotFor(profile){
  var s = t13State();
  if(!s || !s.custom) return false;
  if(profile === "vision") return !!s.custom.vision;
  if(profile === "critic") return !!s.custom.critic;
  return !!s.custom.text;
}

export function t13ControlsHTML(){
  var s = t13State() || {openOnly:false, custom:{}, used:{}};
  var agents = Object.keys(s.used || {}).map(function(id){
    var u = s.used[id] || {}, p = u.providerId || u.provider || "-";
    return '<div class="t13agent">' + t13Esc(id) + ": " + t13Esc(p) + " · " + t13Esc(u.model || "-") + '</div>';
  }).join("");
  var slots = ["vision","critic","text"].map(function(k){
    var label = k === "text" ? "semua teks" : k;
    var on = s.custom && s.custom[k] ? " on" : "";
    return '<button type="button" id="t13Slot_' + k + '" class="t13Btn t13Slot' + on + '" data-slot="' + k +
      '" data-html2canvas-ignore>' + label + '</button>';
  }).join(" ");
  return '<div class="t13ctl" data-html2canvas-ignore>' +
    '<button type="button" id="t13ToggleOpen" class="t13Btn' + (s.openOnly ? " on" : "") +
    '" data-html2canvas-ignore>Open-weight saja: ' + (s.openOnly ? "aktif" : "mati") + '</button> ' +
    slots + '</div><div class="t13agents" data-html2canvas-ignore>' + agents + '</div>';
}

export function t13Click(ev){
  var t = ev && ev.target;
  if(!t || !t.closest) return;
  var b = t.closest("#t13ToggleOpen,.t13Slot");
  if(!b) return;
  var s = t13State();
  if(!s) return;
  if(b.id === "t13ToggleOpen"){
    s.openOnly = !s.openOnly;
    try { localStorage.setItem(T13_OPEN_KEY, s.openOnly ? "1" : "0"); } catch(e){}
  } else if(b.classList && b.classList.contains("t13Slot") && b.getAttribute){
    var k = b.getAttribute("data-slot");
    if(k === "vision" || k === "critic" || k === "text") s.custom[k] = !s.custom[k];
  } else return;
  if(typeof t10Render === "function") t10Render();
}

/* ponytail: OK.forEach dipindah ke ui/board.js agar berjalan setelah scaffold .bx dibuat. */

document.addEventListener("input", scheduleSave);
document.addEventListener("click", scheduleSave);

exposeState(["prevC", "nxtDone", "OK", "OPT", "posDasar", "tagSim", "jamVal", "jamAna", "CP", "lastFont", "customFont", "userOpts", "uBusy", "posOpts", "posAuto", "conf", "started", "comp", "compFile", "cLogoU", "files", "cur", "logo", "vcol", "act", "sP", "markSVG", "markConcept", "markBusy", "DEAD_MODELS", "MAX_IMG", "MAX_PDF", "MAX_FONT", "DRAFT_KEY", "saveTimer", "T12_VERSION", "T12_MAX", "_t12Toast", "T13_OPEN_KEY", "MODEL_PROFILES", "BB", "BB_FIELDS", "IDB"]);
exposeFn({
  resolveModels: {get:()=>resolveModels, set:v=>{resolveModels=v}},
  supportsReasoning: {get:()=>supportsReasoning, set:v=>{supportsReasoning=v}},
  supportsJsonMode: {get:()=>supportsJsonMode, set:v=>{supportsJsonMode=v}},
  BB_FIELD: {get:()=>BB_FIELD, set:v=>{BB_FIELD=v}},
  BB_GET: {get:()=>BB_GET, set:v=>{BB_GET=v}},
  BB_SET: {get:()=>BB_SET, set:v=>{BB_SET=v}},
  BBVAL: {get:()=>BBVAL, set:v=>{BBVAL=v}},
  BBHEX: {get:()=>BBHEX, set:v=>{BBHEX=v}},
  BB_SYNC_NODE: {get:()=>BB_SYNC_NODE, set:v=>{BB_SYNC_NODE=v}},
  initBB: {get:()=>initBB, set:v=>{initBB=v}},
  bridgeInput: {get:()=>bridgeInput, set:v=>{bridgeInput=v}},
  blobToDataURL: {get:()=>blobToDataURL, set:v=>{blobToDataURL=v}},
  validateFile: {get:()=>validateFile, set:v=>{validateFile=v}},
  idbStore: {get:()=>idbStore, set:v=>{idbStore=v}},
  scheduleSave: {get:()=>scheduleSave, set:v=>{scheduleSave=v}},
  saveDraft: {get:()=>saveDraft, set:v=>{saveDraft=v}},
  loadDraft: {get:()=>loadDraft, set:v=>{loadDraft=v}},
  resetDraft: {get:()=>resetDraft, set:v=>{resetDraft=v}},
  t12Sanitize: {get:()=>t12Sanitize, set:v=>{t12Sanitize=v}},
  t12Fields: {get:()=>t12Fields, set:v=>{t12Fields=v}},
  t12Switches: {get:()=>t12Switches, set:v=>{t12Switches=v}},
  t12Snapshot: {get:()=>t12Snapshot, set:v=>{t12Snapshot=v}},
  t12Save: {get:()=>t12Save, set:v=>{t12Save=v}},
  t12Valid: {get:()=>t12Valid, set:v=>{t12Valid=v}},
  t12Restore: {get:()=>t12Restore, set:v=>{t12Restore=v}},
  t12Load: {get:()=>t12Load, set:v=>{t12Load=v}},
  t12Click: {get:()=>t12Click, set:v=>{t12Click=v}},
  t12Quota: {get:()=>t12Quota, set:v=>{t12Quota=v}},
  t12Nudge: {get:()=>t12Nudge, set:v=>{t12Nudge=v}},
  t13State: {get:()=>t13State, set:v=>{t13State=v}},
  t13Open: {get:()=>t13Open, set:v=>{t13Open=v}},
  t13CustomReady: {get:()=>t13CustomReady, set:v=>{t13CustomReady=v}},
  t13SlotFor: {get:()=>t13SlotFor, set:v=>{t13SlotFor=v}},
  t13ControlsHTML: {get:()=>t13ControlsHTML, set:v=>{t13ControlsHTML=v}},
  t13Click: {get:()=>t13Click, set:v=>{t13Click=v}}
});
