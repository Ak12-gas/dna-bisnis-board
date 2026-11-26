/* === FILE: src/core/providers.js === */
import { exposeFn } from './state.js';

var AI_ABORT = null;
var AI_TIMEOUT = 45000;

export var GROQ_STORE = "dna_groq_api_key";

export var PROVIDERS = {
  groq:   {base:"https://api.groq.com/openai/v1", keyStore:"dna_groq_api_key"},
  gemini: {base:"https://generativelanguage.googleapis.com/v1beta/openai", keyStore:"dna_gemini_api_key"},
  custom: {base:"", keyStore:"dna_custom_api_key", baseStore:"dna_custom_base"}
};

export var MODEL_LIST_CACHE = {};

export function getGroqKey(){
  try { return (localStorage.getItem(GROQ_STORE) || "").trim(); }
  catch(e){ return ""; }
}

export function isAbort(x){ return !!(x && (x.aborted || x.name === "AbortError")); }

export function aiBusy(ctl){
  AI_ABORT = ctl || null;
  var b = document.getElementById("aiCancel");
  if(b) b.hidden = !ctl;
}

export function abortAI(){
  if(!AI_ABORT) return false;
  AI_ABORT.canceled = true;
  AI_ABORT.abort();
  return true;
}

export function cancelAI(){
  var had = abortAI();
  if(BB.dir) BB.dir.cancel = true;
  var b = document.getElementById("aiCancel");
  if(b) b.hidden = true;
  toast(had ? "Dibatalkan." : "Tidak ada permintaan AI yang berjalan.");
}

export async function fetchWithTimeout(url, opts, ms){
  opts = opts || {};
  var ctl = new AbortController();
  var t = setTimeout(function(){ ctl.timedOut = true; ctl.abort(); }, ms || AI_TIMEOUT);
  aiBusy(ctl);
  try {
    return await fetch(url, Object.assign({}, opts, {signal:ctl.signal}));
  } catch(e){
    if(ctl.timedOut || ctl.canceled){
      var err = new Error(ctl.timedOut ? "Permintaan AI timeout setelah 45 detik." : "Permintaan AI dibatalkan.");
      err.aborted = true;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
    if(AI_ABORT === ctl) aiBusy(null);
  }
}

export function allChatModels(activeIds){
  return (activeIds || []).filter(function(id){
    if(!id || DEAD_MODELS[id]) return false;
    if(/whisper|tts|embed|guard|moderation/i.test(id)) return false;
    if(/vision|-vl/i.test(id)) return false;
    return true;
  });
}

export function rankTextModels(ids, profile, avoid){
  var ranked = resolveModels(profile || "deep", ids, avoid);
  var skip = [].concat(avoid || []);
  var fallback = allChatModels(ids).filter(function(id){
    return ranked.indexOf(id) < 0 && skip.indexOf(id) < 0;
  });
  return ranked.concat(fallback);
}

export function rankVisionModels(ids){
  return resolveModels("vision", ids);
}

export function setProviderStatus(id, mode, txt){
  var el = $(id);
  if(!el) return;
  el.className = "kstat" + (mode === "warn" ? " warn" : mode === "err" ? " err" : "");
  el.textContent = txt;
}

export function providerBase(id){
  var p = PROVIDERS[id];
  if(!p) throw new Error("Penyedia tidak dikenal: " + id);
  if(id !== "custom") return p.base;
  var b = "";
  try { b = (localStorage.getItem(p.baseStore) || "").trim(); } catch(e){}
  return b.replace(/\/+$/, "");
}

export function providerKey(id){
  var p = PROVIDERS[id];
  if(!p) throw new Error("Penyedia tidak dikenal: " + id);
  try { return (localStorage.getItem(p.keyStore) || "").trim(); }
  catch(e){ return ""; }
}

export function normalizeModelId(id){
  return String(id || "").replace(/^models\//, "");
}

export function responseHeaders(resp){
  var headers = {};
  if(resp && resp.headers && typeof resp.headers.forEach === "function"){
    resp.headers.forEach(function(v, k){ headers[k] = v; });
  } else {
    headers = (resp && resp.headers) || {};
  }
  return headers;
}

export function providerHttpError(providerId, resp, detail){
  var msg = resp.status === 401
    ? "API Key " + providerId + " tidak valid (401)."
    : "Penyedia " + providerId + " merespons HTTP " + resp.status;
  if(detail) msg += ": " + String(detail).replace(/\s+/g, " ").trim().slice(0, 300);
  var err = new Error(msg);
  err.status = resp.status;
  err.headers = responseHeaders(resp);
  if(resp.status === 429) err.code = "rate_limited";
  return err;
}

export async function llmCall(providerId, opts){
  opts = opts || {};
  var base = providerBase(providerId);
  if(!base) throw new Error("Basis URL penyedia kustom belum diisi. Isi dulu di kotak 'Sambungkan AI'.");
  var key = providerKey(providerId);
  /* ponytail: penyedia kustom boleh tanpa kunci (server lokal/open-weight). */
  if(!key && providerId !== "custom") throw new Error("API Key " + providerId + " belum diisi. Tempel di kotak 'Sambungkan AI'.");
  var model = normalizeModelId(opts.model);
  var messages = opts.messages || [];
  if(opts.images && opts.images.length){
    var urls = await Promise.all(opts.images.map(blobToDataURL));
    var parts = function(head){
      return [{type:"text", text:head || ""}].concat(urls.map(function(u){
        return {type:"image_url", image_url:{url:u}};
      }));
    };
    var last = messages[messages.length - 1];
    if(last && last.role === "user"){
      messages = messages.map(function(m, i){
        if(i !== messages.length - 1) return m;
        var head = typeof m.content === "string" ? m.content : String(m.content || "");
        return {role:m.role, content:parts(head)};
      });
    } else {
      messages = messages.concat([{role:"user", content:parts("")}]);
    }
  }
  /* ponytail: satu estimasi per permintaan; data URL gambar sudah dibuang estTokens. */
  var budgetEst = estTokens(JSON.stringify(messages), opts.maxTokens != null ? opts.maxTokens : 3500);
  /* === T3 HOOK === */ if(typeof BUDGET !== "undefined" && !opts.budgetPrepared) model = (await BUDGET.prepare(providerId, [model], JSON.stringify(messages), opts.maxTokens != null ? opts.maxTokens : 3500))[0];
  var useJsonMode = !!opts.json && (providerId !== "groq" || supportsJsonMode(model));
  var body = {
    model: model,
    messages: messages,
    temperature: opts.temperature != null ? opts.temperature : 0.45,
    max_tokens: opts.maxTokens != null ? opts.maxTokens : 3500
  };
  if(useJsonMode) body.response_format = {type:"json_object"};
  var reason = opts.reasoning != null ? opts.reasoning : (providerId === "gemini" ? "none" : null);
  if(reason != null && supportsReasoning(model, reason)) body.reasoning_effort = reason;
  /* === T3 HOOK === */ if(typeof BUDGET !== "undefined") BUDGET.reserve(providerId, model, budgetEst);

  var reqHeaders = {"Content-Type":"application/json"};
  if(key) reqHeaders["Authorization"] = "Bearer " + key;
  var req = function(){
    return fetchWithTimeout(base + "/chat/completions", {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify(body)
    });
  };
  var resp = await req();
  /* === T3 HOOK === */ if(typeof BUDGET !== "undefined") BUDGET.observe(providerId, model, resp, budgetEst);
  if(!resp.ok && useJsonMode && resp.status === 400){
    delete body.response_format;
    resp = await req();
    /* === T3 HOOK === */ if(typeof BUDGET !== "undefined") BUDGET.observe(providerId, model, resp, budgetEst);
  }
  if(!resp.ok){
    var raw = await resp.text().catch(function(){ return ""; });
    var parsed = {};
    try { parsed = JSON.parse(raw); } catch(e){}
    var detail = (parsed && parsed.error && parsed.error.message) || (parsed && parsed.message) || raw;
    throw providerHttpError(providerId, resp, detail);
  }
  var j = await resp.json().catch(function(){ return {}; });
  var msg = j && j.choices && j.choices[0] && j.choices[0].message;
  var content = msg ? msg.content : "";
  var text = typeof content === "string" ? content
    : (Array.isArray(content) ? content.map(function(p){ return p && p.text ? p.text : ""; }).join("") : "");
  return {text:text, headers:responseHeaders(resp), usage:(j && j.usage) || null};
}

export async function listModels(providerId, force, baseOverride, keyOverride){
  var base = baseOverride || providerBase(providerId);
  if(!base) throw new Error("Basis URL penyedia kustom belum diisi. Isi dulu di kotak 'Sambungkan AI'.");
  if(!force && MODEL_LIST_CACHE[providerId]) return MODEL_LIST_CACHE[providerId];
  var key = keyOverride || providerKey(providerId);
  /* ponytail: kustom tanpa kunci tetap boleh membaca /models. */
  if(!key && providerId !== "custom") throw new Error("API Key " + providerId + " belum diisi. Tempel di kotak 'Sambungkan AI'.");
  var headers = {};
  if(key) headers["Authorization"] = "Bearer " + key;
  var resp = await fetchWithTimeout(base + "/models", {headers: headers});
  if(!resp.ok) throw providerHttpError(providerId, resp);
  var j = await resp.json().catch(function(){ return {}; });
  var out = [];
  (j && Array.isArray(j.data) ? j.data : []).forEach(function(m){
    if(!m || !m.id || m.active === false) return;
    var id = normalizeModelId(m.id);
    if(id && out.indexOf(id) < 0) out.push(id);
  });
  MODEL_LIST_CACHE[providerId] = out;
  return out;
}

export function initProviderUI(){
  var gk = "";
  try { gk = (localStorage.getItem(PROVIDERS.gemini.keyStore) || "").trim(); } catch(e){}
  var gi = $("geminiKey");
  if(gi) gi.value = "";
  if(gk) setProviderStatus("geminiStat", "ok", "✅ Kunci Gemini tersimpan (disembunyikan).");
  else setProviderStatus("geminiStat", "warn", "Opsional. Tanpa kunci Gemini, aplikasi tetap memakai Groq.");

  var cb = "", ck = "";
  try {
    cb = (localStorage.getItem(PROVIDERS.custom.baseStore) || "").trim();
    ck = (localStorage.getItem(PROVIDERS.custom.keyStore) || "").trim();
  } catch(e){}
  var bi = $("customBase"), ki = $("customKey");
  if(bi) bi.value = cb;
  if(ki) ki.value = "";
  if(cb) setProviderStatus("customStat", "ok", ck
    ? "✅ Penyedia kustom tersimpan (kunci disembunyikan)."
    : "✅ Penyedia kustom tersimpan tanpa kunci.");
  else setProviderStatus("customStat", "warn", "Kosong secara default. Kunci opsional; Basis URL saja cukup untuk server lokal.");
}

export async function saveProviderKey(providerId){
  if(!PROVIDERS[providerId]) return;
  var keyEl = $(providerId === "gemini" ? "geminiKey" : "customKey");
  var statId = providerId === "gemini" ? "geminiStat" : "customStat";
  var btn = $(providerId === "gemini" ? "saveGeminiKey" : "saveCustomKey");
  var k = keyEl ? keyEl.value.trim() : "";
  var base = "";
  if(providerId === "custom"){
    var be = $("customBase");
    base = be ? be.value.trim().replace(/\/+$/, "") : "";
  }
  var keylessCustom = providerId === "custom" && !k && !!base;
  if(!k && !keylessCustom){
    var stored = "";
    try { stored = String(localStorage.getItem(PROVIDERS[providerId].keyStore) || "").trim(); } catch(e){}
    if(stored){
      setProviderStatus(statId, "ok", "✅ Kunci " + providerId + " tersimpan (disembunyikan). Isi field untuk mengganti.");
      toast("Kunci " + providerId + " lama tetap dipakai.");
      return;
    }
    try {
      localStorage.removeItem(PROVIDERS[providerId].keyStore);
      if(providerId === "custom") localStorage.removeItem(PROVIDERS.custom.baseStore);
    } catch(e){}
    delete MODEL_LIST_CACHE[providerId];
    setProviderStatus(statId, "warn", providerId === "gemini"
      ? "Kunci Gemini dihapus. Tetap memakai Groq."
      : "Penyedia kustom dihapus.");
    toast("Kunci " + providerId + " dihapus.");
    return;
  }
  if(providerId === "custom"){
    var parsedBase = null, localLoopback = false;
    try {
      parsedBase = new URL(base);
      localLoopback = parsedBase.hostname === "localhost" ||
        parsedBase.hostname === "127.0.0.1" || parsedBase.hostname === "[::1]";
    } catch(e){}
    if(!parsedBase || (parsedBase.protocol !== "https:" &&
      !(parsedBase.protocol === "http:" && localLoopback))){
      setProviderStatus(statId, "err", "Provider kustom wajib memakai HTTPS; HTTP hanya diizinkan untuk localhost.");
      toast("Basis URL kustom harus HTTPS atau localhost.");
      return;
    }
  }
  if(btn) btn.disabled = true;
  setProviderStatus(statId, "warn", "Memeriksa model " + providerId + "…");
  try {
    var list = await listModels(providerId, true,
      providerId === "custom" ? base : null,
      k);
    try {
      if(k) localStorage.setItem(PROVIDERS[providerId].keyStore, k);
      else localStorage.removeItem(PROVIDERS[providerId].keyStore);
      if(providerId === "custom") localStorage.setItem(PROVIDERS.custom.baseStore, base);
    } catch(e){}
    MODEL_LIST_CACHE[providerId] = list;
    setProviderStatus(statId, "ok", keylessCustom
      ? "✅ Penyedia kustom tersimpan tanpa kunci (model: " + list.length + ")."
      : "✅ Kunci " + providerId + " tersimpan (model: " + list.length + ").");
    toast(keylessCustom ? "Penyedia kustom tersimpan tanpa kunci!" : "Kunci " + providerId + " tersimpan!");
    keyModalClose();
  } catch(x){
    setProviderStatus(statId, "err", "❌ Gagal menyimpan kunci " + providerId + ": " + (x && x.message || "tidak valid."));
    toast("Gagal memeriksa kunci " + providerId + ".");
  } finally {
    if(btn) btn.disabled = false;
  }
}

export function activeProvider(){
  if(providerKey("groq")) return "groq";
  if(providerKey("gemini")) return "gemini";
  if(providerBase("custom")) return "custom";
  return null;
}

export function aiKeyTersimpan(){ return !!activeProvider(); }

export function syncKeyButton(){
  var b = $("openKeys");
  if(b){
    /* Tombol tetap tersedia agar pengguna dapat mengganti/memeriksa provider
       tanpa harus menghapus API key yang sudah tersimpan terlebih dahulu. */
    b.style.display = "";
    b.textContent = activeProvider() ? "🔑 Kelola AI" : "🔑 Kunci AI";
  }
}

export function keyModalOpen(){
  if(!$("keyModal")) return;
  openModal("keyModal", {labelledby:"keyTitle"});
  var first = $("groqKey"); if(first) first.focus();
}

export function keyModalClose(){
  if(!$("keyModal")) return;
  closeModal("keyModal");
  ["groqKey","geminiKey","customKey"].forEach(function(id){
    var e = $(id); if(e) e.value = "";
  });
  syncKeyButton();
}

export function hapusAIKunci(){
  try {
    localStorage.removeItem(GROQ_STORE);
    localStorage.removeItem(PROVIDERS.gemini.keyStore);
    localStorage.removeItem(PROVIDERS.custom.keyStore);
    localStorage.removeItem(PROVIDERS.custom.baseStore);
  } catch(e){}
  DEAD_MODELS = {};
  MODEL_LIST_CACHE = {};
  ["groqKey","geminiKey","customKey"].forEach(function(id){
    var e = $(id); if(e) e.value = "";
  });
  setProviderStatus("keyStat", "warn", "⚠️ Belum ada API key. Masukkan API key Groq di sini untuk mulai.");
  setProviderStatus("geminiStat", "warn", "Opsional. Tanpa kunci Gemini, aplikasi tetap memakai Groq.");
  setProviderStatus("customStat", "warn", "Kosong secara default. Kunci opsional; Basis URL saja cukup untuk server lokal.");
  toast("Semua kunci AI dihapus.");
  syncKeyButton();
}

export function initKeyUI(){
  var k = getGroqKey();
  var g = $("groqKey");
  if(g) g.value = "";
  if(k){
    setProviderStatus("keyStat", "ok", "✅ API key tersimpan (disembunyikan). Isi field untuk mengganti.");
  } else {
    setProviderStatus("keyStat", "warn", "⚠️ Belum ada API key. Masukkan API key Groq di sini untuk mulai.");
  }
}

export async function aiCall(prompt, opts, asJson){
  /* ponytail: satu pintu AI — penyedia aktif dipilih sekali, llmCall yang memutuskan HTTP/Budget. */
  opts = opts || {};
  var prov = activeProvider();
  if(!prov){
    if(typeof keyModalOpen === "function") keyModalOpen();
    throw new Error("Belum ada provider AI aktif. Tempel API key di 'Sambungkan AI'.");
  }
  var imgs = (opts.images || []).filter(Boolean);
  var useVision = imgs.length > 0;
  var tier = opts.modelTier;
  var profile = useVision ? "vision"
    : (tier === "complex" || !tier || !Array.isArray(MODEL_PROFILES[tier]) ? "deep" : tier);
  var explicit = !!(opts.models && Array.isArray(opts.models) && opts.models.length);
  var models = explicit ? opts.models : await listModels(prov).catch(function(){ return []; });
  var candidates = explicit ? models.filter(function(id){ return !!id && !DEAD_MODELS[id]; })
    : (useVision ? rankVisionModels(models) : rankTextModels(models, profile));
  if(opts.preferSearch && !useVision && !explicit){
    var searchM = resolveModels("search", models);
    if(searchM.length) candidates = searchM.concat(candidates.filter(function(id){ return searchM.indexOf(id) < 0; }));
  }
  /* === T3 HOOK === */ if(typeof BUDGET !== "undefined") candidates = await BUDGET.prepare(prov, candidates, prompt, opts.maxTokens != null ? opts.maxTokens : 3500);
  if(useVision && !candidates.length) throw new Error("vision_unavailable");
  if(!candidates.length){
    candidates = models.filter(function(id){ return !!id && !DEAD_MODELS[id]; });
  }
  if(!candidates.length) throw new Error("Tidak ada model aktif yang tersedia di provider " + prov + ".");

  var sysMsg = asJson
    ? "Kamu adalah konsultan bisnis & branding senior Indonesia dengan penguasaan mendalam terhadap pasar, merek nasional, dan strategi kompetitif. Jawab HANYA dalam format JSON valid sesuai instruksi, selalu gunakan Bahasa Indonesia yang natural dan profesional, tanpa teks pengantar dan tanpa blok markdown."
    : "Kamu adalah konsultan branding senior dan analis visual Indonesia. Jawab akurat, faktual, dan dalam Bahasa Indonesia.";
  var messages = [{role:"system", content:sysMsg}, {role:"user", content:prompt}];
  var lastErr = null;
  for(var i = 0; i < Math.min(4, candidates.length); i++){
    console.debug("[DNA] aiCall memakai model " + candidates[i] + " pada " + prov);
    try {
      var r = await llmCall(prov, {
        model: candidates[i], messages: messages, images: imgs,
        json: asJson, temperature: opts.temp, maxTokens: opts.maxTokens,
        reasoning: opts.reasoning, budgetPrepared: true
      });
      return asJson ? parseJSON(r.text) : {text: r.text};
    } catch(e){
      if(isAbort(e)) throw e;
      lastErr = e;
      if(e && (e.code === "rate_limited" || e.status === 401)) break;
    }
  }
  if(lastErr && lastErr.code === "rate_limited") throw new Error("Batas request " + prov + " tercapai sementara. Lanjut setelah reset.");
  if(lastErr && lastErr.status === 401) throw new Error("API Key " + prov + " tidak valid. Periksa kembali key Anda.");
  throw lastErr || new Error("Semua model " + prov + " gagal merespons.");
}

exposeFn({
  AI_ABORT: {get:()=>AI_ABORT, set:v=>{AI_ABORT=v}},
  AI_TIMEOUT: {get:()=>AI_TIMEOUT, set:v=>{AI_TIMEOUT=v}},
  GROQ_STORE: {get:()=>GROQ_STORE, set:v=>{GROQ_STORE=v}},
  PROVIDERS: {get:()=>PROVIDERS, set:v=>{PROVIDERS=v}},
  MODEL_LIST_CACHE: {get:()=>MODEL_LIST_CACHE, set:v=>{MODEL_LIST_CACHE=v}},
  getGroqKey: {get:()=>getGroqKey, set:v=>{getGroqKey=v}},
  isAbort: {get:()=>isAbort, set:v=>{isAbort=v}},
  aiBusy: {get:()=>aiBusy, set:v=>{aiBusy=v}},
  abortAI: {get:()=>abortAI, set:v=>{abortAI=v}},
  cancelAI: {get:()=>cancelAI, set:v=>{cancelAI=v}},
  fetchWithTimeout: {get:()=>fetchWithTimeout, set:v=>{fetchWithTimeout=v}},
  allChatModels: {get:()=>allChatModels, set:v=>{allChatModels=v}},
  rankTextModels: {get:()=>rankTextModels, set:v=>{rankTextModels=v}},
  rankVisionModels: {get:()=>rankVisionModels, set:v=>{rankVisionModels=v}},
  setProviderStatus: {get:()=>setProviderStatus, set:v=>{setProviderStatus=v}},
  providerBase: {get:()=>providerBase, set:v=>{providerBase=v}},
  providerKey: {get:()=>providerKey, set:v=>{providerKey=v}},
  normalizeModelId: {get:()=>normalizeModelId, set:v=>{normalizeModelId=v}},
  responseHeaders: {get:()=>responseHeaders, set:v=>{responseHeaders=v}},
  providerHttpError: {get:()=>providerHttpError, set:v=>{providerHttpError=v}},
  llmCall: {get:()=>llmCall, set:v=>{llmCall=v}},
  listModels: {get:()=>listModels, set:v=>{listModels=v}},
  initProviderUI: {get:()=>initProviderUI, set:v=>{initProviderUI=v}},
  saveProviderKey: {get:()=>saveProviderKey, set:v=>{saveProviderKey=v}},
  activeProvider: {get:()=>activeProvider, set:v=>{activeProvider=v}},
  aiKeyTersimpan: {get:()=>aiKeyTersimpan, set:v=>{aiKeyTersimpan=v}},
  syncKeyButton: {get:()=>syncKeyButton, set:v=>{syncKeyButton=v}},
  keyModalOpen: {get:()=>keyModalOpen, set:v=>{keyModalOpen=v}},
  keyModalClose: {get:()=>keyModalClose, set:v=>{keyModalClose=v}},
  hapusAIKunci: {get:()=>hapusAIKunci, set:v=>{hapusAIKunci=v}},
  initKeyUI: {get:()=>initKeyUI, set:v=>{initKeyUI=v}},
  aiCall: {get:()=>aiCall, set:v=>{aiCall=v}}
});

document.addEventListener("click", function(ev){
  var b = ev.target && ev.target.closest ? ev.target.closest("button[data-psave], button#toggleCustom") : null;
  if(!b) return;
  if(b.dataset && b.dataset.psave) saveProviderKey(b.dataset.psave);
  else if(b.id === "toggleCustom"){
    var box = $("customBox");
    if(box) box.hidden = !box.hidden;
  }
});

document.addEventListener("click", function(ev){
  var b = ev.target && ev.target.closest ? ev.target.closest("button#openKeys, button#keyClose, button#clearKeys") : null;
  if(!b) return;
  if(b.id === "openKeys") keyModalOpen();
  else if(b.id === "clearKeys") hapusAIKunci();
  else keyModalClose();
});

$("saveKey").onclick = async function(){
  var k = $("groqKey").value.trim(), btn = this;
  delete MODEL_LIST_CACHE["groq"];
  DEAD_MODELS = {};
  if(!k){
    if(getGroqKey()){
      setProviderStatus("keyStat", "ok", "✅ API key tersimpan (disembunyikan). Isi field untuk mengganti.");
      toast("API key lama tetap dipakai.");
      return;
    }
    try { localStorage.removeItem(GROQ_STORE); } catch(e){}
    setProviderStatus("keyStat", "warn", "⚠️ Belum ada API key. Tempel API key Groq untuk memakai AI.");
    toast("API key dihapus.");
    return;
  }
  btn.disabled = true;
  setProviderStatus("keyStat", "warn", "Memeriksa API key & model aktif…");
  try {
    var models = await listModels("groq", true, undefined, k);
    var ranked = rankTextModels(models);
    try { localStorage.setItem(GROQ_STORE, k); } catch(e){}
    var best = ranked[0] || models[0] || "-";
    setProviderStatus("keyStat", "ok", "✅ API key tersimpan (model aktif: " + best + ").");
    toast("API key Groq tersimpan!");
    keyModalClose();
  } catch(x){
    if(/401|tidak valid/i.test(String(x && x.message || x))){
      setProviderStatus("keyStat", "err", "❌ " + (x.message || "API key tidak valid."));
    } else {
      try { localStorage.setItem(GROQ_STORE, k); } catch(e){}
      setProviderStatus("keyStat", "ok", "✅ API key tersimpan.");
    }
  }
  btn.disabled = false;
};
