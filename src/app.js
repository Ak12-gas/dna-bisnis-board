/* === FILE: src/app.js === */
/* ponytail: impor samping-efek memasang bridge; boot tail tetap satu urutan seperti versi satu file. */
import './util/dom.js';
import './util/color.js';
import './util/text.js';
import './data/brand-db.js';
import './core/state.js';
import './core/budget.js';
import './core/providers.js';
import './core/agents.js';
import './ui/board.js';
import './ui/panel.js';
import './ui/modals.js';
import './ui/export.js';
import './ui/dev.js';

/* === BOOT FUNCTIONS: dipindah utuh dari satu file === */
function t10Boot(){
  if(document.getElementById("t10Panel")){ t10Render(); return; }
  if(!document.getElementById("t10Toggle")) document.body.insertAdjacentHTML("beforeend",
    '<button type="button" id="t10Toggle" class="t10Toggle" data-html2canvas-ignore aria-controls="t10Panel" aria-expanded="false" style="margin:12px;padding:6px 10px;font-size:13px">Panel Tim</button>');
  document.body.insertAdjacentHTML("beforeend",
    '<section id="t10Panel" data-html2canvas-ignore style="margin:12px;padding:12px;border:1px solid #bbb">' +
    t10PanelHTML() + '</section>');
  document.addEventListener("click", t10Click);
  t10Render();
}

function t11Boot(){
  if(BB.__t11Booted) return;
  BB.__t11Booted = true;
  if(MODEL_PROFILES && Array.isArray(MODEL_PROFILES.critic) && !MODEL_PROFILES.critic.some(function(rx){ return rx.test("gemini"); })) MODEL_PROFILES.critic.push(/gemini/i);
  var base = t10Render;
  t10Render = function(){ base.apply(this, arguments); t11Decorate(); };
  document.addEventListener("input", t11Layer1);
  document.addEventListener("click", t11Click);
  t11Layer1();
  t10Render();
}

function t12Boot(){
  var row = document.querySelector(".top .row");
  if(row && !document.getElementById("t12Save")) row.insertAdjacentHTML("beforeend",
    '<button type="button" id="t12Save" data-html2canvas-ignore>💾 Simpan progres</button>' +
    '<button type="button" id="t12Load" data-html2canvas-ignore>📂 Muat progres</button>' +
    '<button type="button" id="draftReset" data-html2canvas-ignore>♻ Reset draft</button>' +
    '<input type="file" id="t12File" accept="application/json,.json" hidden data-html2canvas-ignore>');
  var fileInput = document.getElementById("t12File");
  if(fileInput && fileInput.addEventListener) fileInput.addEventListener("change", function(ev){
    var fs = ev && ev.target && ev.target.files;
    if(fs && fs[0]) t12Load(fs[0]);
  });
  document.addEventListener("click", t12Click);
  var _t12Render = t10Render;
  t10Render = function(){
    var r = _t12Render.apply(this, arguments);
    var panel = document.getElementById("t10Panel");
    if(t12Quota(BB && BB.qa && BB.qa.reason) || (panel && t12Quota(panel.textContent))) t12Nudge();
    return r;
  };
  if(typeof setInterval === "function") setInterval(function(){
    var body = document.body && document.body.textContent;
    if(t12Quota(body) || t12Quota(BB && BB.qa && BB.qa.reason)) t12Nudge();
  }, 2000);
  if(!_t12Toast){
    _t12Toast = toast;
    toast = function(m){
      var code = m && typeof m === "object" ? (m.code || m.status) : "";
      if(t12Quota(code) || t12Quota(m)){
        t12Nudge();
        return _t12Toast("Kuota gratis habis, lanjutkan setelah reset. Simpan progres untuk melanjutkan nanti.");
      }
      return _t12Toast(m);
    };
  }
}

function t13Boot(){
  var s = t13State();
  if(!s) return;
  try {
    var v = localStorage.getItem(T13_OPEN_KEY);
    s.openOnly = v === "1" || String(v == null ? "" : v).toLowerCase() === "true";
  } catch(e){ s.openOnly = false; }
  if(!MODEL_PROFILES.providers) MODEL_PROFILES.providers = {};
  if(!MODEL_PROFILES.providers.gemini) MODEL_PROFILES.providers.gemini = [/gemini/i];
  var _t13Resolve = resolveModels;
  resolveModels = function(profile, activeIds, avoid){
    var out = _t13Resolve(profile, activeIds, avoid);
    if(!t13Open() || !Array.isArray(out)) return out;
    var pats = MODEL_PROFILES.providers && MODEL_PROFILES.providers.gemini;
    if(!Array.isArray(pats)) return out;
    return out.filter(function(id){
      for(var i=0; i<pats.length; i++) if(pats[i].test(id)) return false;
      return true;
    });
  };
  var _t13List = listModels;
  listModels = function(providerId){
    if(t13Open() && providerId === "gemini") return Promise.reject(new Error("Gemini dimatikan oleh saklar Open-weight saja."));
    return _t13List.apply(this, arguments);
  };
  var _t13Pick = pickModel;
  pickModel = async function(profile, prompt, maxTokens, avoid){
    var s = t13State();
    if(!s) return _t13Pick.apply(this, arguments);
    if(t13SlotFor(profile) && t13CustomReady()){
      try {
        var ids = await listModels("custom");
        var m = resolveModels(profile, ids || [], avoid)[0];
        if(m){ s.route = {provider:"custom", model:m}; return m; }
      } catch(e){}
    }
    s.route = null;
    return _t13Pick.apply(this, arguments);
  };
  var _t13LLM = llmCall;
  llmCall = function(providerId, opts){
    var s = t13State();
    if(!s) return _t13LLM.apply(this, arguments);
    if(t13Open() && providerId === "gemini") return Promise.reject(new Error("Gemini dimatikan oleh saklar Open-weight saja."));
    var target = providerId, route = s.route;
    s.route = null;
    if(route && route.provider === "custom" && providerId === "groq" && opts && opts.model === route.model){
      target = "custom";
    }
    if(s.currentAgent) s.used[s.currentAgent] = {provider:target, model:opts && opts.model};
    return _t13LLM.call(this, target, opts);
  };
  var _t13Vision = t9VisionProvider;
  t9VisionProvider = async function(){
    var s = t13State();
    if(!s) return _t13Vision.apply(this, arguments);
    if((t13Open() || t13SlotFor("vision")) && t13CustomReady()){
      try {
        var ids = await listModels("custom");
        var m = resolveModels("vision", ids || [])[0];
        if(m){
          var picked = {providerId:"custom", model:m};
          s.used["logo-inspector"] = picked;
          return picked;
        }
      } catch(e){}
    }
    if(t13Open()) return null;
    var v = await _t13Vision.apply(this, arguments);
    if(v && v.providerId) s.used["logo-inspector"] = {providerId:v.providerId, model:v.model};
    return v;
  };
  var _t13QA = t11PickQA;
  t11PickQA = async function(){
    var s = t13State();
    if(!s) return _t13QA.apply(this, arguments);
    if(t13SlotFor("critic") && t13CustomReady()){
      try {
        var ids = await listModels("custom");
        var m = resolveModels("critic", ids || [])[0];
        if(m){
          var picked = {provider:"custom", model:m};
          s.used.qa = picked;
          return picked;
        }
      } catch(e){}
    }
    var q = await _t13QA.apply(this, arguments);
    if(q && q.provider) s.used.qa = {provider:q.provider, model:q.model};
    return q;
  };
  var _t13Panel = t10PanelHTML;
  t10PanelHTML = function(){
    var html = _t13Panel.apply(this, arguments);
    if(html.indexOf('id="t13ToggleOpen"') < 0) html = String(html).replace(/<\/div>/, '</div>' + t13ControlsHTML());
    return html;
  };
  document.addEventListener("click", t13Click);
  var _t13Run = runAgent;
  runAgent = async function(id){
    var s = t13State();
    if(!s) return _t13Run.apply(this, arguments);
    s.currentAgent = id;
    try { return await _t13Run.apply(this, arguments); }
    finally { s.currentAgent = null; }
  };
  if(typeof t10Render === "function") t10Render();
}

function t14Boot(){
  if(!t14Dev()) return;
  var p = document.getElementById("t14Panel");
  if(!p){
    p = document.createElement("div");
    p.id = "t14Panel";
    p.setAttribute("data-html2canvas-ignore", "");
    p.innerHTML = t14PanelHTML();
    document.body.appendChild(p);
  }
  document.addEventListener("click", t14Click);
}

function t15Boot(){
  if(!t15Dev()) return;
  var p = document.getElementById("t15Panel");
  if(!p){
    p = document.createElement("div");
    p.id = "t15Panel";
    p.setAttribute("data-html2canvas-ignore", "");
    p.innerHTML = t15PanelHTML();
    document.body.appendChild(p);
  }
  document.addEventListener("click", t15Click);
  t15Render();
}

/* === BOOT TAIL: urutan terkunci === */
initKeyUI();
initProviderUI();
initBudgetUI();
syncKeyButton();
if(!aiKeyTersimpan()) keyModalOpen();
initBB(); /* === T5 HOOK: boot === */
loadDraft();
/* === T6 HOOK: boot === */
BB.flags.t6 = true;
/* === T7 HOOK: boot === */
BB.flags.t7 = true;
/* === T8 HOOK: boot === */
BB.flags.t8 = true;
/* === T9 HOOK: agents === */
t9Agents();
/* === T9 HOOK: boot === */
BB.flags.t9 = true;
sync();
restoreBlobs();
initMic();
BB.dir = BB.dir || {status:"IDLE", current:"", cancel:false, approval:"", reason:"", gen:0, researching:false};
t10Boot();
BB.qa = BB.qa || {busy:false, reason:"", model:"", layer1:{}, flags:{}};
BB.qa.layer1 = BB.qa.layer1 || {};
BB.qa.flags = BB.qa.flags || {};
defAgent("qa", {
  role:"penilai konsistensi lintas kotak DNA bisnis",
  persona:"Kritisi hasil tim tanpa mengarang fakta dan tanpa mengubah isi kotak.",
  reads:["comp","segmen","user","meja","positioning","tagline","nama","warna","kunci"],
  writes:[],
  rules:["BX:kompetitor","BX:segmen","BX:user","BX:meja","BX:positioning","BX:tagline","BX:nama","BX:warna","MKT","RUB"],
  model:{profile:"critic", temp:0, maxTokens:600, reasoning:"none"},
  schema:{bendera:"array objek {kotak,catatan}"},
  validate:t11QAValidate
});
t11Boot();
t12Boot();
t13Boot();
t14Boot();
t15Boot();
