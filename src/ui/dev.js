/* === FILE: src/ui/dev.js === */
import { exposeFn } from '../core/state.js';

export var DEV_BRIEFS = [
  {label:"Kopi susu perkotaan", state:{
    brief:{nama:"Kopi Susu Ayu", kategori:"minuman kopi susu", deskripsi:"Kopi susu kekinian untuk pekerja kota menengah atas."},
    nama:"Kopi Susu Ayu", nama_kompetitor:"Kopi Kenangan", nama_brand:"Kopi Susu Ayu",
    produk:"kopi susu", kategori:"minuman", harga:"Rp18.000-Rp28.000",
    comp:{nama:"Kopi Kenangan", segmen:"ATAS", produk_utama:"kopi susu", harga:"Rp20.000-Rp30.000"},
    compDraft:{fakta:{entitas:"PT Kopi Kenangan", model_bisnis:"waralaba", produk_utama:"kopi susu", rentang_harga:"Rp20.000-Rp30.000", c1:"#2E7D32", c2:"#FFFFFF", font:"Poppins", tagline_asli:"Kenangan Manis", tagline_asli_ditemukan:true, kunci_asli:"kopi susu", web:"www.kopikenangan.id", instagram:"@kopikenangan", kompetitor_langsung:"Fore Coffee", kompetitor_web:"www.forecoffee.id", kompetitor_ig:"@forecoffee"}},
    pain:"Antre panjang dan rasa terlalu manis.", gain:"Rasa konsisten dan pesan lewat aplikasi.",
    segmen:"ATAS", segmen_skor:{}, user:{persona:{gender:"perempuan",pekerjaan:"karyawan swasta",lifestyle:"sibuk",harapan:"praktis",performa:"cepat"},usertitle:"pekerja kota",usia:"25-35",usersub:"menengah atas"},
    meja:{}, jam:{}, positioning:"Kopi susu cepat tanpa antre.", tagline:"Cepat, enak, pas.",
    warna:{c1:"#2E7D32",c2:"#FFFFFF"}, kunci:"kopi susu", web:"www.kopisusuayu.id"
  }},
  {label:"Skincare lokal ramah kantong", state:{
    brief:{nama:"Glow Lokal", kategori:"perawatan kulit", deskripsi:"Skincare lokal untuk kulit sensitif dengan harga bersahabat."},
    nama:"Glow Lokal", nama_kompetitor:"Somethinc", nama_brand:"Glow Lokal",
    produk:"serum wajah", kategori:"skincare", harga:"Rp45.000-Rp90.000",
    comp:{nama:"Somethinc", segmen:"BAWAH", produk_utama:"serum", harga:"Rp59.000-Rp129.000"},
    compDraft:{fakta:{entitas:"PT Somethinc Beauty", model_bisnis:"DTC online", produk_utama:"serum niacinamide", rentang_harga:"Rp59.000-Rp129.000", c1:"#F06292", c2:"#FFFFFF", font:"Montserrat", tagline_asli:"Be Your Own Kind of Beautiful", tagline_asli_ditemukan:true, kunci_asli:"serum kulit", web:"www.somethinc.com", instagram:"@somethinc", kompetitor_langsung:"Avoskin", kompetitor_web:"www.avoskinbeauty.com", kompetitor_ig:"@avoskinbeauty"}},
    pain:"Kulit sensitif mudah iritasi.", gain:"Bahan jelas dan harga terjangkau.",
    segmen:"BAWAH", segmen_skor:{}, user:{persona:{gender:"perempuan",pekerjaan:"mahasiswa",lifestyle:"aktif",harapan:"aman",performa:"lembut"},usertitle:"mahasiswa",usia:"19-25",usersub:"menengah bawah"},
    meja:{}, jam:{}, positioning:"Skincare aman untuk kulit sensitif.", tagline:"Lembut tiap hari.",
    warna:{c1:"#F06292",c2:"#FFFFFF"}, kunci:"serum kulit", web:"www.glowlokal.id"
  }},
  {label:"Jasa laundry express", state:{
    brief:{nama:"Bersih Kilat", kategori:"jasa laundry", deskripsi:"Laundry express antar jemput untuk keluarga sibuk."},
    nama:"Bersih Kilat", nama_kompetitor:"LaundryKu", nama_brand:"Bersih Kilat",
    produk:"laundry express", kategori:"jasa", harga:"Rp7.000-Rp12.000 per kg",
    comp:{nama:"LaundryKu", segmen:"ATAS", produk_utama:"laundry express", harga:"Rp9.000-Rp15.000 per kg"},
    compDraft:{fakta:{entitas:"LaundryKu", model_bisnis:"gerai waralaba", produk_utama:"laundry express", rentang_harga:"Rp9.000-Rp15.000", c1:"#1565C0", c2:"#FFFFFF", font:"Inter", tagline_asli:"Bersih Tanpa Ribet", tagline_asli_ditemukan:true, kunci_asli:"laundry kilat", web:"www.laundryku.id", instagram:"@laundryku", kompetitor_langsung:"Klik Laundry", kompetitor_web:"www.kliklaundry.id", kompetitor_ig:"@kliklaundry"}},
    pain:"Cuci sendiri makan waktu.", gain:"Antar jemput tepat waktu.",
    segmen:"ATAS", segmen_skor:{}, user:{persona:{gender:"laki-laki",pekerjaan:"profesional",lifestyle:"sibuk",harapan:"praktis",performa:"tepat waktu"},usertitle:"keluarga sibuk",usia:"30-45",usersub:"menengah atas"},
    meja:{}, jam:{}, positioning:"Laundry antar jemput tanpa ribet.", tagline:"Bersih, cepat, antar.",
    warna:{c1:"#1565C0",c2:"#FFFFFF"}, kunci:"laundry kilat", web:"www.bersihkilat.id"
  }}
];


export function t14State(){
  if(!BB || typeof BB !== "object") return null;
  if(!BB.t14 || typeof BB.t14 !== "object") BB.t14 = {busy:false, error:"", results:[]};
  return BB.t14;
}

export function t14Dev(){
  /* Production builds keep the test harness disabled even if someone adds ?dev=1. */
  var productionBuild = true;
  if(productionBuild) return false;
  var q = "";
  try { q = String(location.search || ""); } catch(e){ q = ""; }
  return /[?&]dev=1(?:[&#]|$)/.test(q);
}

export function t14PanelHTML(){
  return '<div class="t14head" data-html2canvas-ignore>Harness uji model (?dev=1)</div>' +
    '<div class="t14ctl" data-html2canvas-ignore><button type="button" id="t14Run" data-html2canvas-ignore>Uji Model</button> ' +
    '<button type="button" id="t14CopyText" data-html2canvas-ignore>Salin teks</button> ' +
    '<button type="button" id="t14CopyCsv" data-html2canvas-ignore>Salin CSV</button> <span id="t14Status"></span></div>' +
    '<div class="t14results" data-html2canvas-ignore></div>' +
    '<div class="t14note" data-html2canvas-ignore>Hanya untuk pengujian; tidak mengubah papan produksi.</div>';
}

export function t14Click(ev){
  var el = ev && ev.target;
  if(!el || typeof el.closest !== "function") return;
  if(el.closest("#t14Run") && typeof t14Run === "function") t14Run();
  else if(el.closest("#t14CopyText") && typeof t14Copy === "function") t14Copy("text");
  else if(el.closest("#t14CopyCsv") && typeof t14Copy === "function") t14Copy("csv");
}

export function t14Instr(spec){
  return "Berikan jawaban JSON yang valid sesuai schema. " + (spec && spec.role ? "Peran: " + String(spec.role) + "." : "");
}

export function t14Agents(){
  var out = [];
  if(!AGENTS || typeof AGENTS !== "object") return out;
  Object.keys(AGENTS).forEach(function(id){
    var spec = AGENTS[id];
    if(!spec || !spec.model || spec.model.profile === "vision") return;
    out.push({id:id, spec:spec});
  });
  return out;
}

export function t14Quota(e){
  var status = e && (e.status || (e.response && e.response.status));
  var code = e && e.code;
  var msg = String((e && e.message) || e || "");
  return status === 429 || code === "rate_limited" || code === "quota_exhausted" || /kuota habis|rate.?limit|HTTP\s+429/i.test(msg);
}

export function t14Unauthorized(e){
  var status = e && (e.status || (e.response && e.response.status));
  var msg = String((e && e.message) || e || "");
  return status === 401 || /unauthorized|api.?key/i.test(msg);
}

export function t14CellError(e){
  var status = e && (e.status || (e.response && e.response.status));
  var msg = String((e && e.message) || e || "");
  if(status === 404 || /not found|model .*mati|network|fetch failed|failed to fetch/i.test(msg)) return msg || "Model tidak tersedia.";
  return msg || "Galat pada sel ini.";
}

export async function t14Run(){
  var s = t14State();
  if(!s || s.busy) return;
  s.busy = true; s.error = ""; s.results = [];
  if(BB && BB.t13 && BB.t13.route) BB.t13.route = null;
  try {
    var key = typeof getGroqKey === "function" ? getGroqKey() : String(localStorage.getItem("dna_groq_api_key") || "").trim();
    var ids = await listModels("groq", false, undefined, key) || [];
    var agents = t14Agents();
    outer:
    for(var bi = 0; bi < DEV_BRIEFS.length; bi++){
      var brief = DEV_BRIEFS[bi];
      for(var ai = 0; ai < agents.length; ai++){
        var entry = agents[ai], spec = entry.spec;
        var models = resolveModels(spec.model.profile, ids) || [];
        for(var mi = 0; mi < models.length; mi++){
          var model = models[mi];
          var prompt = buildPrompt(spec, brief.state, t14Instr(spec));
          var row = {brief:brief.label, agent:entry.id, model:model, firstPass:false, attempts:0, ms:0, tokens:0, error:""};
          var t0 = performance.now(), violations = [], res = null;
          for(var attempt = 1; attempt <= 3; attempt++){
            row.attempts = attempt;
            try {
              res = await llmCall("groq", {
                model:model, messages:[{role:"user", content:prompt}],
                json:true, temperature:spec.model.temp,
                maxTokens:spec.model.maxTokens || 800, reasoning:spec.model.reasoning
              });
              var out = parseJSON(res && res.text);
              try { violations = spec.validate(out, brief.state) || []; }
              catch(ve){ violations = [String((ve && ve.message) || ve || "Validator gagal.")]; }
              if(!Array.isArray(violations)) violations = [String(violations)];
              if(!violations.length){ row.firstPass = attempt === 1; break; }
              prompt += "\nPerbaiki pelanggaran ini: " + violations.join("; ");
            } catch(e){
              if(t14Quota(e)){ s.error = "Kuota habis. Lanjut setelah reset."; break outer; }
              if(t14Unauthorized(e)){ s.error = "API Key tidak valid. Periksa kunci Groq di pengaturan."; break outer; }
              if(e && e.code === "invalid_json"){
                violations = [String(e.message || "JSON tidak valid.")];
                prompt += "\nPerbaiki JSON sebelumnya. Pelanggaran: " + violations.join("; ");
                continue;
              }
              row.error = t14CellError(e);
              break;
            }
          }
          if(!row.firstPass && !row.error && violations.length) row.error = violations.join("; ");
          row.ms = performance.now() - t0;
          var usage = res && res.usage;
          row.tokens = usage ? ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)) : "—";
          s.results.push(row);
        }
      }
    }
  } catch(e){
    if(t14Quota(e)) s.error = "Kuota habis. Lanjut setelah reset.";
    else if(t14Unauthorized(e)) s.error = "API Key tidak valid. Periksa kunci Groq di pengaturan.";
    else s.error = String((e && e.message) || e);
  } finally {
    s.busy = false;
  }
  if(typeof t14Render === "function") t14Render();
}

export function t14TableHTML(){
  var s = t14State();
  var rows = s ? s.results : [];
  var html = '<table class="t14table"><thead><tr><th>Brief</th><th>Agen</th><th>Model</th><th>Lolos pertama</th><th>Percobaan</th><th>Latensi (ms)</th><th>Token</th><th>Error</th></tr></thead><tbody>';
  if(!rows.length) html += '<tr><td colspan="8">Belum ada hasil. Klik "Uji Model".</td></tr>';
  rows.forEach(function(r){
    html += '<tr><td>' + t14Esc(r.brief) + '</td><td>' + t14Esc(r.agent) + '</td><td>' + t14Esc(r.model) +
      '</td><td>' + (r.firstPass ? "Ya" : "Tidak") + '</td><td>' + t14Esc(r.attempts) + '</td><td>' +
      t14Esc(r.ms) + '</td><td>' + t14Esc(r.tokens) + '</td><td>' + t14Esc(r.error) + '</td></tr>';
  });
  html += '</tbody></table>';
  if(s && s.error) html += '<div class="t14error">' + t14Esc(s.error) + '</div>';
  return html;
}

export function t14Render(){
  var p = document.getElementById("t14Panel");
  if(!p || typeof p.querySelector !== "function") return;
  var box = p.querySelector(".t14results");
  if(box) box.innerHTML = t14TableHTML();
  var st = p.querySelector("#t14Status");
  var s = t14State();
  if(st) st.textContent = s.busy ? "Menjalankan…" : (s.error || "");
}

export async function t14Copy(mode){
  var s = t14State();
  var rows = s ? s.results : [];
  var cols = ["Brief","Agen","Model","Lolos pertama","Percobaan","Latensi (ms)","Token","Error"];
  function cell(r){
    return [r.brief, r.agent, r.model, r.firstPass ? "Ya" : "Tidak", r.attempts, r.ms, r.tokens, r.error];
  }
  function safe(v){ return String(v == null ? "" : v).replace(/[\t\r\n]+/g, " "); }
  var text;
  if(mode === "csv"){
    function q(v){ return '"' + String(v == null ? "" : v).replace(/"/g,'""') + '"'; }
    var lines = [cols.map(q).join(",")];
    rows.forEach(function(r){ lines.push(cell(r).map(q).join(",")); });
    text = lines.join("\n");
  } else {
    var lines2 = [cols.join("\t")];
    rows.forEach(function(r){ lines2.push(cell(r).map(safe).join("\t")); });
    text = lines2.join("\n");
  }
  var wrote = false;
  try {
    if(navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function"){
      await navigator.clipboard.writeText(text);
      wrote = true;
    }
  } catch(e){}
  if(!wrote){
    var p = document.getElementById("t14Panel");
    var ta = p && p.querySelector ? p.querySelector("textarea.t14copy") : null;
    if(!ta){
      ta = document.createElement("textarea");
      ta.className = "t14copy";
      if(p && p.appendChild) p.appendChild(ta);
    }
    ta.value = text;
    if(ta.select) ta.select();
  }
  toast(mode === "csv" ? "CSV siap disalin." : "Teks siap disalin.");
  t14Render();
}

export function t15NewState(){
  var st = {error:"", stopReason:"", report:[], agentsText:""};
  var busy = false;
  Object.defineProperty(st, "busy", {get:function(){ return busy; }, set:function(v){ busy = !!v; }, enumerable:false, configurable:true});
  return st;
}

export function t15State(){
  if(!BB || typeof BB !== "object") return null;
  var d = Object.getOwnPropertyDescriptor(BB, "t15");
  if(!d || d.enumerable || !d.value || typeof d.value !== "object"){
    Object.defineProperty(BB, "t15", {value:t15NewState(), writable:true, enumerable:false, configurable:true});
  }
  return BB.t15;
}

export function t15Dev(){
  /* Production builds keep the Gemini probe disabled even if someone adds ?dev=1. */
  var productionBuild = true;
  if(productionBuild) return false;
  if(typeof t14Dev === "function") return t14Dev();
  var q = "";
  try { q = String(location.search || ""); } catch(e){ q = ""; }
  return /[?&]dev=1(?:[&#]|$)/.test(q);
}

export function t15PanelHTML(){
  return '<div data-html2canvas-ignore><strong>Probe kelayakan Gemini (?dev=1)</strong></div>' +
    '<div data-html2canvas-ignore><label for="t15Image">Gambar (opsional):</label> <input type="file" id="t15Image" accept="image/*" style="display:inline-block"> ' +
    '<button type="button" id="t15Run">Jalankan probe</button> ' +
    '<button type="button" id="t15CopyReport">Salin laporan</button> ' +
    '<button type="button" id="t15CopyAgents">Salin usulan AGENTS.md</button> ' +
    '<span id="t15Status"></span></div>' +
    '<pre id="t15Report" data-html2canvas-ignore></pre>' +
    '<pre id="t15Agents" data-html2canvas-ignore></pre>' +
    '<div data-html2canvas-ignore>Hanya untuk pengujian; tidak mengubah papan produksi.</div>';
}

export function t15Click(ev){
  var el = ev && ev.target;
  if(!el || typeof el.closest !== "function") return;
  if(el.closest("#t15Run") && typeof t15Run === "function") t15Run();
  else if(el.closest("#t15CopyReport") && typeof t15Copy === "function") t15Copy("report");
  else if(el.closest("#t15CopyAgents") && typeof t15Copy === "function") t15Copy("agents");
}

export function t15Key(){
  try { return String(localStorage.getItem("dna_gemini_api_key") || "").trim(); }
  catch(e){ return ""; }
}

export function t15Headers(resp){
  if(typeof responseHeaders === "function") return responseHeaders(resp);
  return (resp && resp.headers) || {};
}

export async function t15Fetch(url, init, key){
  try { return await fetch(url, init); }
  catch(e){
    var msg = t15Redact(String((e && e.message) || e || "Permintaan gagal."), key);
    var err = new Error(msg);
    err.status = (e && (e.status || (e.response && e.response.status))) || 0;
    err.cors = (e && e.name === "TypeError") || /failed to fetch|network/i.test(msg);
    err.headers = t15Headers(e && e.response);
    throw err;
  }
}

export function t15Stop(e, s){
  var status = e && (e.status || (e.response && e.response.status));
  var code = e && e.code;
  var msg = String((e && e.message) || e || "");
  var network = !status;
  if(status === 429 || code === "rate_limited" || (network && /kuota habis|rate.?limit|HTTP\s+429/i.test(msg))){
    s.error = "Kuota habis. Lanjut setelah reset.";
    return true;
  }
  if(status === 401 || (network && /unauthorized|api.?key/i.test(msg))){
    s.error = "API Key Gemini tidak valid.";
    return true;
  }
  return false;
}

export async function t15Message(resp){
  var raw = "";
  try { raw = await resp.text(); } catch(e){}
  var msg = "";
  try {
    var j = JSON.parse(raw);
    msg = (j && j.error && (j.error.message || j.error)) || (j && j.message) || "";
  } catch(e){ msg = raw; }
  msg = String(msg || "").replace(/[\r\n\t]+/g, " ").slice(0, 400);
  return msg || ("HTTP " + ((resp && resp.status) || 0));
}

export function t15ReportText(s){
  var rows = s && Array.isArray(s.report) ? s.report : [];
  if(!rows.length) return "Belum ada hasil. Klik \"Jalankan probe\".";
  var key = t15Key();
  return rows.map(function(r){ return t15Redact(r.label, key) + ": " + t15Redact(r.value, key); }).join("\n");
}

export function t15Render(){
  var p = document.getElementById("t15Panel");
  if(!p || typeof p.querySelector !== "function") return;
  var rep = p.querySelector("#t15Report"), ag = p.querySelector("#t15Agents"), st = p.querySelector("#t15Status");
  var s = t15State();
  if(rep) rep.textContent = t15ReportText(s);
  if(ag) ag.textContent = s ? t15Redact(s.agentsText, t15Key()) : "";
  if(st) st.textContent = s ? (s.busy ? "Menjalankan…" : (s.error || s.stopReason || "")) : "";
}

export async function t15Copy(mode){
  var s = t15State();
  var text = mode === "agents" ? t15Redact(s ? s.agentsText : "", t15Key()) : t15ReportText(s);
  var wrote = false;
  try {
    if(navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function"){
      await navigator.clipboard.writeText(text);
      wrote = true;
    }
  } catch(e){}
  if(!wrote){
    var p = document.getElementById("t15Panel");
    var ta = p && p.querySelector ? p.querySelector("textarea.t15copy") : null;
    if(!ta){
      ta = document.createElement("textarea");
      ta.className = "t15copy";
      ta.setAttribute("data-html2canvas-ignore", "");
      if(p && p.appendChild) p.appendChild(ta);
    }
    ta.value = text;
    if(ta.select) ta.select();
  }
  toast(mode === "agents" ? "Usulan AGENTS.md siap disalin." : "Laporan siap disalin.");
  t15Render();
}

export function t15FileData(file){
  return new Promise(function(resolve, reject){
    var fr = new FileReader();
    fr.onload = function(e){ resolve(String((e && e.target && e.target.result) || "")); };
    fr.onerror = function(){ reject(new Error("Gambar gagal dibaca.")); };
    fr.readAsDataURL(file);
  });
}

export async function t15Run(){
  var s = t15State();
  if(!s || s.busy) return;
  s.busy = true; s.error = ""; s.stopReason = ""; s.report = []; s.agentsText = "";
  t15Render();
  var seen = [];
  try {
    var key = t15Key();
    if(!key){ s.error = "Isi API Key Gemini di kotak 'Sambungkan AI'."; return; }
    var base = PROVIDERS && PROVIDERS.gemini && PROVIDERS.gemini.base;
    if(!base){ s.error = "Basis URL Gemini belum tersedia."; return; }
    var headers = {"Authorization":"Bearer " + key, "Content-Type":"application/json"};
    var input = document.getElementById("t15Image");
    var file = input && input.files && input.files[0];
    var dataURL = "";
    if(file && file.size > 2 * 1024 * 1024){
      s.report.push({label:"Gambar", value:"Gambar terlalu besar (maks 2 MB); vision dilewati."});
      file = null;
    }
    if(file){
      try { dataURL = await t15FileData(file); }
      catch(fe){ s.report.push({label:"Gambar", value:t15Redact(String(fe && fe.message || fe), key)}); }
    }
    var resp, msg, rawIds = [], ids = [], visionIds = [], criticIds = [];
    try { resp = await t15Fetch(base + "/models", {method:"GET", headers:headers}, key); }
    catch(e){
      msg = t15Redact(String(e && e.message || e), key);
      s.report.push({label:"1. Daftar model (/models)", value:msg});
      s.stopReason = "CORS atau jaringan gagal. " + msg + " Lanjut setelah reset.";
      return;
    }
    seen.push(resp);
    if(!resp.ok){
      msg = t15Redact(await t15Message(resp), key);
      s.report.push({label:"1. Daftar model (/models)", value:"HTTP " + resp.status + "; " + msg});
      if(t15Stop({status:resp.status, message:msg}, s)) return;
      return;
    }
    var j = await resp.json().catch(function(){ return {}; });
    (j && Array.isArray(j.data) ? j.data : []).forEach(function(m){
      if(m && m.id && m.active !== false) rawIds.push(String(m.id));
    });
    ids = rawIds.map(function(id){ return typeof normalizeModelId === "function" ? normalizeModelId(id) : String(id).replace(/^models\//, ""); });
    visionIds = typeof resolveModels === "function" ? (resolveModels("vision", ids) || []) : [];
    criticIds = typeof resolveModels === "function" ? (resolveModels("critic", ids) || []) : [];
    var pref = rawIds.filter(function(id){ return /^models\//.test(id); }).length;
    s.report.push({label:"1. Daftar model (/models)", value: t15Redact(
      "HTTP " + resp.status + "; id mentah: " + (rawIds.join(", ") || "(kosong)") +
      "; berprefiks models/: " + pref +
      "; kandidat vision: " + (visionIds.join(", ") || "(kosong)") +
      "; " + (criticIds.length ? "kandidat critic: " + criticIds.join(", ") : "tidak ada kandidat critic pada profil saat ini"), key)});
    var model = ids[0];
    if(!model){
      s.report.push({label:"2. Chat tanpa response_format", value:"Tidak ada model untuk diuji."});
      return;
    }
    var chatBody = {model:model, messages:[{role:"user", content:"Jawab dengan JSON singkat berisi kunci 'status'."}]};
    var firstAnswer = "";
    for(var step = 2; step <= 3; step++){
      var label = step === 2 ? "2. Chat tanpa response_format" : "3. Chat dengan response_format JSON";
      var body = step === 3 ? {model:model, messages:chatBody.messages, response_format:{type:"json_object"}} : chatBody;
      var ans = "";
      try {
        resp = await t15Fetch(base + "/chat/completions", {method:"POST", headers:headers, body:JSON.stringify(body)}, key);
      } catch(e){
        msg = t15Redact(String(e && e.message || e), key);
        s.report.push({label:label, value:msg});
        if(e && e.cors){ s.stopReason = "CORS atau jaringan gagal. " + msg + " Lanjut setelah reset."; return; }
        if(t15Stop(e, s)) return;
        continue;
      }
      seen.push(resp);
      if(!resp.ok){
        msg = t15Redact(await t15Message(resp), key);
        s.report.push({label:label, value:"HTTP " + resp.status + "; " + msg});
        if(t15Stop({status:resp.status, message:msg}, s)) return;
        continue;
      }
      var cj = await resp.json().catch(function(){ return {}; });
      var choice = cj && cj.choices && cj.choices[0];
      ans = choice && choice.message && choice.message.content || (cj && cj.output_text) || "";
      ans = t15Redact(String(ans || ""), key).replace(/[\r\n\t]+/g, " ").slice(0, 400);
      if(step === 2) firstAnswer = ans;
      var val = "HTTP " + resp.status + "; model: " + model + "; jawaban: " + (ans || "(kosong)");
      if(step === 3){
        var fb = "tidak diuji";
        if(firstAnswer){
          try { parseJSON(firstAnswer); fb = "berhasil"; } catch(pe){ fb = "gagal"; }
        }
        val += "; fallback parseJSON pada jawaban sebelumnya: " + fb;
      }
      s.report.push({label:label, value:t15Redact(val, key)});
    }
    var vModel = visionIds[0];
    if(!vModel){
      s.report.push({label:"4. Vision", value:"tidak ada kandidat vision pada profil saat ini."});
    } else if(!dataURL){
      s.report.push({label:"4. Vision", value:"Pilih gambar untuk menguji vision."});
    } else {
      var vbody = {model:vModel, messages:[{role:"user", content:[
        {type:"text", text:"Jelaskan isi gambar ini singkat."},
        {type:"image_url", image_url:{url:dataURL}}
      ]}]};
      try {
        resp = await t15Fetch(base + "/chat/completions", {method:"POST", headers:headers, body:JSON.stringify(vbody)}, key);
        seen.push(resp);
        if(!resp.ok){
          msg = t15Redact(await t15Message(resp), key);
          s.report.push({label:"4. Vision", value:"HTTP " + resp.status + "; " + msg});
          if(t15Stop({status:resp.status, message:msg}, s)) return;
        } else {
          var vj = await resp.json().catch(function(){ return {}; });
          var vc = vj && vj.choices && vj.choices[0];
          var vans = vc && vc.message && vc.message.content || "";
          s.report.push({label:"4. Vision", value:t15Redact("HTTP " + resp.status + "; model: " + vModel +
            "; jawaban: " + (t15Redact(String(vans || ""), key).replace(/[\r\n\t]+/g, " ").slice(0, 400) || "(kosong)") +
            "; relevansi dinilai manual.", key)});
        }
      } catch(e){
        msg = t15Redact(String(e && e.message || e), key);
        s.report.push({label:"4. Vision", value:msg});
        if(e && e.cors){ s.stopReason = "CORS atau jaringan gagal. " + msg + " Lanjut setelah reset."; return; }
        if(t15Stop(e, s)) return;
      }
    }
    var quotaHeaders = [];
    seen.forEach(function(r){
      var h = t15Headers(r);
      Object.keys(h || {}).forEach(function(k){
        if(/ratelimit|quota|remaining/i.test(k)) quotaHeaders.push(k + "=" + t15Redact(h[k], key));
      });
    });
    s.report.push({label:"5. Header sisa kuota", value: quotaHeaders.length ? quotaHeaders.join("; ") :
      "Tidak ada header sisa kuota; Budget Router memakai hitungan lokal."});
    var lim = (BUDGET && BUDGET.limits && BUDGET.limits.gemini) || {};
    function lv(k){ return lim[k] == null ? "tidak diatur" : String(lim[k]); }
    var limitsLine = t15Redact("Gemini: rpm=" + lv("rpm") + ", rpd=" + lv("rpd") + ", tpm=" + lv("tpm") + ", tpd=" + lv("tpd"), key);
    var configured = false;
    try { configured = !!localStorage.getItem(BUDGET_STORE); } catch(e){}
    var limitSource = configured ? "dari konfigurasi lokal Anda" : "bawaan T3, belum diubah";
    s.report.push({label:"6. Batas manual", value:limitsLine + " (" + limitSource + ")"});
    s.agentsText = "Usulan teks untuk AGENTS.md (T15):\n" +
      "Batas Gemini dibaca " + limitSource + " (UI Budget T3 / dna_budget_v1), bukan fakta bawaan aplikasi: " + limitsLine + ".\n" +
      "Nilai di atas dapat diubah pengguna; bila kuota habis, berhenti dan lanjut setelah reset.\n" +
      "Probe T15 bersifat read-only: tidak memanggil BUDGET.prepare/reserve/observe.";
  } finally {
    s.busy = false;
    t15Render();
  }
}



exposeFn({
  DEV_BRIEFS: {get:()=>DEV_BRIEFS, set:v=>{DEV_BRIEFS=v}},
  t14State: {get:()=>t14State, set:v=>{t14State=v}},
  t14Dev: {get:()=>t14Dev, set:v=>{t14Dev=v}},
  t14PanelHTML: {get:()=>t14PanelHTML, set:v=>{t14PanelHTML=v}},
  t14Click: {get:()=>t14Click, set:v=>{t14Click=v}},
  t14Instr: {get:()=>t14Instr, set:v=>{t14Instr=v}},
  t14Agents: {get:()=>t14Agents, set:v=>{t14Agents=v}},
  t14Quota: {get:()=>t14Quota, set:v=>{t14Quota=v}},
  t14Unauthorized: {get:()=>t14Unauthorized, set:v=>{t14Unauthorized=v}},
  t14CellError: {get:()=>t14CellError, set:v=>{t14CellError=v}},
  t14Run: {get:()=>t14Run, set:v=>{t14Run=v}},
  t14TableHTML: {get:()=>t14TableHTML, set:v=>{t14TableHTML=v}},
  t14Render: {get:()=>t14Render, set:v=>{t14Render=v}},
  t14Copy: {get:()=>t14Copy, set:v=>{t14Copy=v}},
  t15NewState: {get:()=>t15NewState, set:v=>{t15NewState=v}},
  t15State: {get:()=>t15State, set:v=>{t15State=v}},
  t15Dev: {get:()=>t15Dev, set:v=>{t15Dev=v}},
  t15PanelHTML: {get:()=>t15PanelHTML, set:v=>{t15PanelHTML=v}},
  t15Click: {get:()=>t15Click, set:v=>{t15Click=v}},
  t15Key: {get:()=>t15Key, set:v=>{t15Key=v}},
  t15Headers: {get:()=>t15Headers, set:v=>{t15Headers=v}},
  t15Fetch: {get:()=>t15Fetch, set:v=>{t15Fetch=v}},
  t15Stop: {get:()=>t15Stop, set:v=>{t15Stop=v}},
  t15Message: {get:()=>t15Message, set:v=>{t15Message=v}},
  t15ReportText: {get:()=>t15ReportText, set:v=>{t15ReportText=v}},
  t15Render: {get:()=>t15Render, set:v=>{t15Render=v}},
  t15Copy: {get:()=>t15Copy, set:v=>{t15Copy=v}},
  t15FileData: {get:()=>t15FileData, set:v=>{t15FileData=v}},
  t15Run: {get:()=>t15Run, set:v=>{t15Run=v}}
});
