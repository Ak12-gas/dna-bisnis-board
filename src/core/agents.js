/* === FILE: src/core/agents.js === */
import { exposeFn } from './state.js';

/* === AGENT FRAMEWORK (T5): state === */
export var AGENTS = {};

export var AGENT_CACHE = {};

/* === AGENT FRAMEWORK (T5) === */
export function defAgent(id, spec){
  if(!id || typeof id !== "string") throw new Error("id agen harus berupa teks.");
  if(AGENTS[id]) throw new Error("Agen " + id + " sudah terdaftar.");
  if(!spec || typeof spec !== "object") throw new Error("Spec agen tidak valid.");
  ["role","persona","writes","model","schema","validate"].forEach(function(k){
    if(spec[k] === undefined || spec[k] === null) throw new Error("Spec agen " + id + " kehilangan " + k + ".");
  });
  ["reads","writes","rules"].forEach(function(k){
    if(!Array.isArray(spec[k])) throw new Error("Spec agen " + id + ": " + k + " harus array.");
  });
  if(typeof spec.validate !== "function") throw new Error("Spec agen " + id + ": validate harus fungsi.");
  if(!spec.model || typeof spec.model !== "object" ||
     typeof MODEL_PROFILES !== "object" || !Array.isArray(MODEL_PROFILES[spec.model.profile])){
    throw new Error("Profil model agen " + id + " tidak dikenal.");
  }
  AGENTS[id] = {
    role: String(spec.role), persona: String(spec.persona),
    reads: spec.reads.slice(), writes: spec.writes.slice(), rules: spec.rules.slice(),
    model: JSON.parse(JSON.stringify(spec.model)), schema: spec.schema, validate: spec.validate
  };
  return AGENTS[id];
}

export function resolveRuleText(rule){
  var r = String(rule == null ? "" : rule);
  if(r === "MKT") return MKT;
  if(r === "RUB") return RUB;
  if(r.indexOf("BX:") === 0){
    var key = r.slice(3), found = null;
    for(var i=0; i<BX.length; i++) if(BX[i].k === key){ found = BX[i].r; break; }
    if(found === null) throw new Error("Aturan BX tidak dikenal: " + key);
    return found;
  }
  return r;
}

export function digestValue(v){
  if(v == null) return "";
  if(typeof v === "object"){
    try { return JSON.stringify(v); } catch(e){ return String(v); }
  }
  return String(v);
}

export function clipDigest(s, max){
  s = String(s == null ? "" : s);
  return s.length > max ? s.slice(0, Math.max(0, max - 1)) + "…" : s;
}

export function digestBB(bb, reads){
  var parts = [], total = 0;
  (reads || []).forEach(function(path){
    if(total >= 1600) return;
    var cur = bb, ok = true;
    String(path).split(".").forEach(function(k){
      if(cur == null || typeof cur !== "object"){ ok = false; return; }
      cur = cur[k];
    });
    var v = ok ? digestValue(cur) : "";
    var line = clipDigest(String(path) + ": " + v, Math.min(240, 1600 - total));
    parts.push(line);
    total += line.length + 1;
  });
  return clipDigest(parts.join("\n"), 1600);
}

export function hashStr(s){
  var h = 2166136261, str = String(s == null ? "" : s);
  for(var i=0; i<str.length; i++){
    h ^= str.charCodeAt(i);
    h = (Math.imul ? Math.imul(h, 16777619) : (h * 16777619)) >>> 0;
  }
  return (h >>> 0).toString(10);
}

export function agentCacheKey(id, digest, instr){
  return hashStr(String(id) + "\u0000" + String(digest == null ? "" : digest) + "\u0000" + String(instr == null ? "" : instr));
}

export function buildPrompt(agent, bb, instr){
  var lines = [];
  lines.push("Kamu adalah " + agent.role + ". " + agent.persona);
  lines.push("");
  lines.push("ATURAN:");
  (agent.rules || []).forEach(function(rule){ lines.push(resolveRuleText(rule)); });
  lines.push("");
  lines.push("RINGKASAN STATE:");
  lines.push(digestBB(bb || BB, agent.reads || []));
  lines.push("");
  lines.push("INSTRUKSI:");
  lines.push(String(instr == null ? "" : instr));
  lines.push("");
  lines.push("Schema JSON: " + JSON.stringify(agent.schema || {}));
  lines.push("Jawab HANYA JSON sesuai schema, Bahasa Indonesia.");
  return lines.join("\n");
}

export function setBBPath(bb, path, value){
  var cur = bb || BB;
  var keys = String(path == null ? "" : path).split(".");
  for(var i=0; i<keys.length-1; i++){
    var k = keys[i];
    if(!k) continue;
    if(cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length-1]] = value;
  return cur;
}

export async function pickModel(profile, prompt, maxTokens, avoid){
  var prov = activeProvider();
  if(!prov){
    if(typeof keyModalOpen === "function") keyModalOpen();
    throw new Error("Belum ada provider AI aktif. Tempel API key di 'Sambungkan AI'.");
  }
  var models = await listModels(prov);
  var candidates = rankTextModels(models, profile, avoid);
  if(!candidates.length) throw new Error("Tidak ada model aktif yang cocok untuk profil " + profile + ".");
  if(typeof BUDGET !== "undefined" && BUDGET && typeof BUDGET.prepare === "function"){
    candidates = await BUDGET.prepare(prov, candidates, String(prompt == null ? "" : prompt), maxTokens);
  }
  if(!candidates || !candidates.length) throw new Error("Kuota model habis, lanjutkan setelah reset.");
  console.debug("[DNA] pickModel memakai model " + candidates[0] + " pada " + prov);
  return candidates[0];
}

export async function runAgent(id, instr, opts){
  opts = opts || {};
  var spec = AGENTS[id];
  if(!spec) throw new Error("Agen tidak terdaftar: " + id);
  var key = agentCacheKey(id, digestBB(BB, spec.reads), instr);
  if(!opts.force && AGENT_CACHE[key]){
    var cached = AGENT_CACHE[key];
    BB.notes[id] = {model:cached.model, percobaan:cached.percobaan || 0, alasan:"cache", pelanggaran:[]};
    return {out:cached.out, errs:[], model:cached.model};
  }
  var baseInstr = String(instr == null ? "" : instr);
  var prompt = buildPrompt(spec, BB, baseInstr);
  var lastModel = null, lastErrs = [], lastAlasan = "validasi", attempts = 0, ok = false, out = null;
  for(var attempt=1; attempt<=3; attempt++){
    attempts = attempt;
    var model = await pickModel(spec.model.profile, prompt, spec.model.maxTokens, []);
    lastModel = model;
    try {
      var res = await llmCall(activeProvider(), {
        model: model,
        messages: [{role:"user", content:prompt}],
        json: true,
        temperature: spec.model.temp,
        maxTokens: spec.model.maxTokens,
        reasoning: spec.model.reasoning, budgetPrepared: true
      });
      out = parseJSON(res && res.text);
    } catch(e){
      if(e && e.code === "invalid_json"){
        lastErrs = [String(e.message || "JSON tidak valid.")];
        lastAlasan = "invalid_json";
        prompt = buildPrompt(spec, BB, baseInstr + "\nPerbaiki JSON sebelumnya. Pelanggaran: " + lastErrs.join(" | "));
        continue;
      }
      if(e && e.code === "rate_limited" && e.retryAfterMs && attempt < 3){
        await new Promise(function(resolve){ setTimeout(resolve, e.retryAfterMs); });
        continue;
      }
      throw e;
    }
    lastErrs = spec.validate(out, BB) || [];
    if(!Array.isArray(lastErrs)) lastErrs = [String(lastErrs)];
    if(!lastErrs.length){ ok = true; lastAlasan = "ok"; break; }
    lastAlasan = "validasi";
    prompt = buildPrompt(spec, BB, baseInstr + "\nPerbaiki JSON sebelumnya. Pelanggaran: " + lastErrs.join(" | "));
  }
  BB.notes[id] = {model:lastModel, percobaan:attempts, alasan:lastAlasan, pelanggaran:lastErrs.slice()};
  if(ok){
    (spec.writes || []).forEach(function(w){
      var parts = String(w).split("."), val = out;
      for(var i=0; i<parts.length; i++){
        if(val == null) break;
        val = val[parts[i]];
      }
      if(val !== undefined) setBBPath(BB, w, val);
    });
    AGENT_CACHE[key] = {out:out, errs:[], model:lastModel, percobaan:attempts};
    return {out:out, errs:[], model:lastModel};
  }
  return {out:null, errs:lastErrs, model:lastModel};
}

export function positioningViolations(out, bb){
  var errs = [];
  var s = out && typeof out.positioning === "string" ? out.positioning.trim() : "";
  if(!s){ errs.push("Positioning wajib berupa teks tidak kosong."); return errs; }
  if(s.split(/\s+/).length > 9) errs.push("Positioning maksimal 9 kata.");
  if(/,/.test(s)) errs.push("Positioning tidak boleh mengandung koma.");
  var names = [];
  if(bb && bb.nama) names.push(String(bb.nama));
  if(bb && bb.comp && bb.comp.name) names.push(String(bb.comp.name));
  names.forEach(function(n){
    if(n && s.toLowerCase().indexOf(n.toLowerCase()) !== -1){
      errs.push("Positioning tidak boleh menyebut nama brand atau kompetitor.");
    }
  });
  if(/wanita|pria|ibu|anak|konsumen|pelanggan|audiens|target|karir/i.test(s)){
    errs.push("Positioning tidak boleh menyebut audiens.");
  }
  return errs;
}

/* === AGENT TASKS (T6) === */
export var T7_PERSONA = ["gender","pekerjaan","lifestyle","harapan","performa"];

export async function inspectLogoImage(imgBlob, brandName){
  if(!imgBlob) return null;
  /* === T9 HOOK: inspectLogoImage === */ if(BB.flags && BB.flags.t9) return inspectLogoAgent(imgBlob, brandName);
  try {
    var r = await aiCall(
      'Perhatikan gambar logo yang diunggah untuk brand "' + brandName + '". Ekstrak informasi visualnya secara teliti. Jawab HANYA JSON dengan key: ' +
      'teks_utama (nama brand yang tertulis di logo), ' +
      'tagline_di_logo (salin PERSIS teks slogan/tagline kecil yang tertulis di logo jika ada, mis. "Kenikmatan dalam Kesederhanaan"; isi "" jika tidak ada slogan pada gambar logo), ' +
      'deskripsi_visual (2 kalimat singkat tentang ikon, bentuk, dan kesan kategori bisnis logo ini).',
      {images: [imgBlob]},
      true
    );
    return r;
  } catch(e){
    return null;
  }
}

export var t11Fixers = {
  pain: async function(){ var a = await mkPain(); for(var i=1; i<=5; i++) t8FillField("pain"+i, a[i-1]); },
  gain: async function(){ var a = await mkGain(); for(var i=1; i<=5; i++) t8FillField("gain"+i, a[i-1]); },
  segmen: async function(){ await segmentAgent(); t8FillField("segmen", BB.segmen); },
  user: async function(){ var r = await mkUser(""); applyUser(r); ["usertitle","usia","usersub"].forEach(function(k){ t8FillField(k, (k === "usertitle" || k === "usia") ? String(r[k] || "").toUpperCase() : r[k]); }); },
  meja: async function(){ await arenaAgent(); var m = BB.meja || []; for(var i=1; i<=7; i++) if(m[i-1]) t8FillField("meja"+i, m[i-1]); },
  positioning: async function(){ var a = await posRec(""); t8FillField("positioning", a[0].t); },
  tagline: function(flag){ return verbalRec("tagline", flag); },
  nama: function(flag){ return verbalRec("nama", flag); },
  kunci: function(flag){ return verbalRec("kunci", flag); },
  warna: function(flag){ return visualRec("warna", flag, true); },
  font: function(flag){ return visualRec("font", flag, true); }
};

export function t6Hex(v){ return /^#[0-9a-f]{6}$/i.test(String(v == null ? "" : v).trim()); }

export function t6List5(v){
  if(!Array.isArray(v) || v.length !== 5) return false;
  return v.every(function(x){
    var s = String(x == null ? "" : x).trim();
    return !!s && s.split(/\s+/).length <= 9;
  });
}

export function competitorFactsViolations(out, bb){
  var f = out && out.compDraft && out.compDraft.fakta;
  if(!f || typeof f !== "object") return ["Fakta kompetitor wajib berupa objek."];
  var errs = [];
  ["entitas","model_bisnis","produk_utama","rentang_harga","c1","c2","font","kunci_asli"].forEach(function(k){
    if(!String(f[k] == null ? "" : f[k]).trim()) errs.push("Fakta " + k + " wajib diisi.");
  });
  ["c1","c2"].forEach(function(k){
    if(String(f[k] == null ? "" : f[k]).trim() && !t6Hex(f[k])) errs.push(k + " wajib hex enam digit.");
  });
  if(typeof f.tagline_asli_ditemukan !== "boolean") errs.push("tagline_asli_ditemukan wajib boolean.");
  return errs;
}

export function voicePainViolations(out, bb){
  return t6List5(out && out.pain) ? [] : ["Pain wajib tepat 5 butir tidak kosong, maksimal 9 kata."];
}

export function voiceGainViolations(out, bb){
  var g = out && out.gain;
  if(!t6List5(g)) return ["Gain wajib tepat 5 butir tidak kosong, maksimal 9 kata."];
  var errs = [], seen = {}, p = (bb && Array.isArray(bb.pain)) ? bb.pain : [];
  g.forEach(function(x, i){
    var s = String(x).trim(), k = s.toLowerCase();
    if(seen[k]) errs.push("Gain tidak boleh duplikat.");
    seen[k] = true;
    if(p[i] && k === String(p[i]).trim().toLowerCase()) errs.push("Gain " + (i+1) + " menyalin pain nomor sama.");
  });
  return errs;
}

export function competitorCoreViolations(out, bb){
  var d = out && out.compDraft && out.compDraft.core;
  if(!d || typeof d !== "object") return ["Inti DNA kompetitor wajib berupa objek."];
  var errs = [];
  ["pain","gain"].forEach(function(k){ if(!t6List5(d[k])) errs.push(k + " wajib array 5 teks."); });
  if(!Array.isArray(d.meja) || d.meja.length !== 7 || !d.meja.every(function(x){ return !!String(x == null ? "" : x).trim(); })) errs.push("meja wajib array 7 teks.");
  ["gender","usertitle","usia","usersub","segmen"].forEach(function(k){ if(!String(d[k] == null ? "" : d[k]).trim()) errs.push(k + " wajib diisi."); });
  try {
    var q = segScore(d.segmen_skor, null);
    if(!q || !q.rows || q.rows.length !== 7) errs.push("Skor segmen wajib tepat tujuh indikator.");
  } catch(e){ errs.push(e.message); }
  return errs;
}

export function competitorIdentViolations(out, bb){
  var d = out && out.compDraft && out.compDraft.ident;
  if(!d || typeof d !== "object") return ["Identitas kompetitor wajib berupa objek."];
  var errs = [];
  var s = String(d.positioning == null ? "" : d.positioning).trim();
  if(!s) errs.push("positioning wajib diisi.");
  else {
    if(s.split(/\s+/).length > 9) errs.push("positioning maksimal 9 kata.");
    if(/,/.test(s)) errs.push("positioning tidak boleh mengandung koma.");
  }
  if(!String(d.tagline == null ? "" : d.tagline).trim()) errs.push("tagline wajib diisi.");
  if(!t6Hex(d.c1) || !t6Hex(d.c2)) errs.push("c1/c2 wajib hex enam digit.");
  if(String(d.kunci == null ? "" : d.kunci).trim().split(/\s+/).length !== 2) errs.push("kunci wajib tepat 2 kata.");
  return errs;
}

export async function caAgent(b, m, n){
  if(!n){ m.textContent = "Isi nama kompetitor dulu."; return; }
  b.disabled = true;
  try {
    BB.nama_kompetitor = n;
    var logoCols = null, logoInfo = null, logoVisual = "";
    if(cLogoU){
      m.textContent = "Membaca warna pixel & teks tagline pada logo yang diunggah…";
      logoCols = await extractLogoColors(cLogoU);
      if(compFile && compFile.type.indexOf("image/") === 0){
        logoInfo = await inspectLogoImage(compFile, n);
        if(logoInfo && logoInfo.deskripsi_visual) logoVisual = logoInfo.deskripsi_visual;
      }
    }
    var logoTagline = (logoInfo && logoInfo.tagline_di_logo) ? String(logoInfo.tagline_di_logo).trim() : "";

    m.textContent = "Memverifikasi profil, tagline asli & model bisnis " + n + " di Indonesia…";
    var pFact = 'Verifikasi fakta asli brand "' + n + '" di Indonesia. Jangan mengarang dan jangan mencampurkan bisnis pengguna.' +
      (logoTagline ? '\nTeks tagline pada logo unggahan: "' + logoTagline + '".' : '') +
      (logoVisual ? '\nHasil pembacaan visual logo: ' + logoVisual : '') +
      (logoCols ? '\nWarna pixel logo: ' + logoCols.c1 + ' dan ' + logoCols.c2 + '.' : '') +
      '\nCek tagline/slogan resmi; bila tidak yakin, isi tagline_asli="" dan tagline_asli_ditemukan=false.';
    var rf = await runAgent("competitor", pFact);
    if(!rf || !rf.out || !rf.out.compDraft || !rf.out.compDraft.fakta){
      var fn = BB.notes.competitor || {}, fp = fn.pelanggaran && fn.pelanggaran.length ? ": " + fn.pelanggaran.join(" | ") : "";
      throw new Error("Riset fakta kompetitor tidak lengkap" + fp + ".");
    }
    var fakta = rf.out.compDraft.fakta;

    var dbHit = lookupBrandDB(n), factObj;
    if(dbHit){
      var realTag = logoTagline || dbHit.tagline || "";
      factObj = {
        entitas:dbHit.entitas, model_bisnis:dbHit.model, produk_utama:dbHit.produk,
        rentang_harga:dbHit.harga, c1:(logoCols && logoCols.c1) || dbHit.c1,
        c2:(logoCols && logoCols.c2) || dbHit.c2, font:dbHit.font,
        tagline_asli:realTag, tagline_asli_ditemukan:!!realTag, kunci_asli:dbHit.kunci,
        web:dbHit.web, instagram:dbHit.ig, kompetitor_langsung:dbHit.kompetitor,
        kompetitor_web:dbHit.kompetitor_web, kompetitor_ig:dbHit.kompetitor_ig,
        sumber:"Database Brand Nasional Terverifikasi"
      };
    } else {
      factObj = Object.assign({}, fakta);
      if(logoCols){ factObj.c1 = logoCols.c1; factObj.c2 = logoCols.c2; }
      if(logoTagline){ factObj.tagline_asli = logoTagline; factObj.tagline_asli_ditemukan = true; }
      else {
        factObj.tagline_asli = String(factObj.tagline_asli || "").trim();
        factObj.tagline_asli_ditemukan = !!factObj.tagline_asli;
      }
      factObj.sumber = "Riset & Verifikasi AI" + (logoVisual ? " + Analisa Logo" : "");
    }
    BB.compDraft.fakta = factObj;

    var faktaRingkas = (factObj.entitas ? factObj.entitas + " — " : "") +
      (factObj.model_bisnis || "") +
      (factObj.rentang_harga ? " | Harga: " + factObj.rentang_harga : "") +
      (logoCols ? " | Warna Logo: " + logoCols.c1 + " & " + logoCols.c2 : "");

    var caErr = function(id, label){
      var nt = BB.notes[id] || {};
      var pel = nt.pelanggaran && nt.pelanggaran.length ? ": " + nt.pelanggaran.join(" | ") : "";
      return new Error(label + pel + ".");
    };
    var baseFactPrompt = 'Susun DNA Bisnis Board milik kompetitor "' + n + '" HANYA dari fakta terverifikasi berikut (DILARANG menyimpang):\n' +
      '- Entitas & Model Bisnis Asli: ' + faktaRingkas + '\n' +
      '- Produk Utama Asli: ' + (factObj.produk_utama || "-") + '\n' +
      '- Kategori Asli: ' + (factObj.kunci_asli || "-") + '\n' +
      '- Kompetitor Utama Terverifikasi: ' + (factObj.kompetitor_langsung || "-") + '\n' +
      (factObj.tagline_asli_ditemukan ? '- Tagline Asli WAJIB dipertahankan persis: "' + factObj.tagline_asli + '"\n' : '- Tagline resmi tidak ditemukan; buat rekomendasi hashtag camelCase maks 4 kata diawali # diakhiri !\n') +
      (logoVisual ? '- Analisa Visual Logo: ' + logoVisual + '\n' : '');

    m.textContent = "Riset tahap 1/2: pain, gain, segmen, user, meja…";
    var pCore = baseFactPrompt +
      '\nKerjakan untuk brand "' + n + '" dalam 100% Bahasa Indonesia: pain (5 kekhawatiran nyata konsumen, maks 9 kata), gain (5 value unggul mirror pain, maks 9 kata), segmen_skor (objek dengan key PERSIS harga/higienitas/kemasan/iklan/tempat/angle/dayabeli, tiap {"skor":1-5,"alasan":"fakta singkat"}), segmen (ATAS/BAWAH), gender (WANITA atau PRIA), usertitle (diawali gender lalu pekerjaan/profil, mis. WANITA KARIR), usia ("USIA XX - XX TAHUN"), usersub (3 bagian dipisah koma), dan meja (7 forum nyata). Jangan memakai label panjang, jangan memakai markdown, dan jangan membungkus segmen_skor dalam array atau key lain.';
    var rc = await runAgent("competitor-core", pCore);
    if(!rc || !rc.out || !rc.out.compDraft || !rc.out.compDraft.core) throw caErr("competitor-core", "Inti DNA kompetitor tidak lengkap");
    var core = rc.out.compDraft.core;
    core.usertitle = withGender(core.usertitle, core.gender);

    m.textContent = "Riset tahap 2/2: positioning, tagline, kata kunci, identitas…";
    var taglineInstr = factObj.tagline_asli_ditemukan
      ? 'tagline WAJIB sama persis dengan "' + factObj.tagline_asli + '" tanpa hashtag; hashtag berisi 5 tag kampanye relevan'
      : 'tagline tidak ditemukan; buat rekomendasi hashtag camelCase maks 4 kata diawali # diakhiri !; hashtag berisi 5 tag kampanye relevan';
    var pIdent = baseFactPrompt +
      '\nHasil tahap inti: ' + JSON.stringify({gain:core.gain, segmen:core.segmen, usertitle:core.usertitle, usia:core.usia, usersub:core.usersub}) +
      '\nKerjakan untuk brand "' + n + '" dalam 100% Bahasa Indonesia: positioning (jenis produk + keunggulan + teritori, maks 9 kata, tanpa koma, tanpa menyebut brand atau audiens) beserta dasar, ' + taglineInstr +
      ', kunci (tepat 2 kata dari kategori asli), kompetitor, kompetitor_web, kompetitor_ig, c1, c2, font, web, instagram, keyakinan ("tinggi" atau "sedang"), catatan (1 kalimat ringkasan validasi).';
    var ri = await runAgent("competitor-ident", pIdent);
    if(!ri || !ri.out || !ri.out.compDraft || !ri.out.compDraft.ident) throw caErr("competitor-ident", "DNA kompetitor tidak lengkap");
    var r = Object.assign({}, core, ri.out.compDraft.ident, factObj);
    BB.compDraft.dna = r;
    if(dbHit && factObj.kompetitor_langsung) r.kompetitor = factObj.kompetitor_langsung;
    if(factObj.tagline_asli_ditemukan && factObj.tagline_asli){
      r.tagline = factObj.tagline_asli;
      r.tagline_asli_ditemukan = true;
    } else {
      r.tagline_asli_ditemukan = false;
    }
    if(logoCols){ r.c1 = logoCols.c1; r.c2 = logoCols.c2; }
    else if(dbHit){ r.c1 = dbHit.c1; r.c2 = dbHit.c2; }
    if(dbHit){
      r.segmen = dbHit.segmen;
      r.keyakinan = "tinggi";
      r.catatan = "Tervalidasi dari " + factObj.sumber + (logoCols ? " & ekstraksi warna pixel logo unggahan." : ".");
    }
    r.fakta_bisnis = faktaRingkas;
    r._seg = segScore(r.segmen_skor, dbHit ? dbHit.segmen : null);
    r.segmen = r._seg.seg;
    comp = {name:n, dna:r, logo:cLogoU};
    BB.comp = comp;
    fld("kompetitor").textContent = n.toUpperCase();
    renderC(r);
    sync();
    (BB.notes.competitor = BB.notes.competitor || {}).verifikasi = dbHit ? "terverifikasi: Database Brand Nasional" : "belum terverifikasi";
    m.textContent = "Selesai (" + factObj.sumber + "). Segmen kompetitor: " + r.segmen + ". Tekan Kunci Kompetitor untuk lanjut.";
  } catch(x){
    m.textContent = "Gagal: " + ((x && x.message) || x);
  }
  b.disabled = false;
}

export async function mkPainAgent(){
  var n = (comp && comp.name) || BB.nama_kompetitor || "kompetitor";
  var dna = (comp && comp.dna) || {};
  var fb = dna.fakta_bisnis ? " (" + dna.fakta_bisnis + ")" : "";
  var brief = ($("brief") && $("brief").value) || BB.brief || "";
  var instr = 'Brand pengguna akan MENCONGKEL kompetitor "' + n + '"' + fb + '. ' + PG() +
    '\nAnalisa 5 pain konsumen ' + n + ' berdasarkan model bisnis aslinya, urut dari yang paling menyakitkan.' +
    '\nKonteks bisnis pengguna: ' + brief +
    '\nRingkasan DNA ' + n + ': ' + JSON.stringify({fakta:dna.fakta_bisnis, positioning:dna.positioning, user:dna.usertitle, segmen:dna.segmen, kunci:dna.kunci});
  var r = await runAgent("voice-pain", instr);
  if(!r || !r.out || !Array.isArray(r.out.pain) || r.out.pain.length !== 5) throw new Error("Analisa pain tidak lengkap, coba lagi.");
  return r.out.pain.slice(0, 5);
}

export async function mkGainAgent(){
  var n = (comp && comp.name) || BB.nama_kompetitor || "kompetitor";
  var dna = (comp && comp.dna) || {};
  var fb = dna.fakta_bisnis ? " (" + dna.fakta_bisnis + ")" : "";
  var ff = [1,2,3,4,5].map(function(i){ return fld("pain"+i).textContent.trim(); });
  var pn = ff.every(function(x){ return !!x; }) ? ff
    : (Array.isArray(BB.pain) && BB.pain.length === 5 && BB.pain.every(function(x){ return !!String(x || "").trim(); }))
      ? BB.pain.slice(0, 5) : ff;
  BB.pain = pn;
  var instr = PG() + '\nBerikut PAIN pelanggan kompetitor "' + n + '"' + fb + ':\n' +
    pn.map(function(x, i){ return (i+1) + ". " + x; }).join("\n") +
    '\nBuat 5 GAIN mirror/lawan dari tiap pain, urut sejajar nomor, berisi harapan pelanggan yang belum terpenuhi sekaligus value unggul brand pengguna.';
  var r = await runAgent("voice-gain", instr);
  if(!r || !r.out || !Array.isArray(r.out.gain) || r.out.gain.length !== 5) throw new Error("Analisa gain tidak lengkap, coba lagi.");
  return r.out.gain.slice(0, 5);
}

/* === AGENT TASKS (T7) === */
export function t7Words(s){ return String(s == null ? "" : s).trim().split(/\s+/).filter(Boolean); }

export function t7English(s){ return /\b(gender|age|job|lifestyle|habit|dream|best|performance|work|daily|with|and|the|for|you)\b/i.test(String(s == null ? "" : s)); }

export function segmentViolations(out, bb){
  var sk = out && out.segmen_skor, errs = [];
  if(!sk || typeof sk !== "object") return ["Skor segmen wajib berupa objek."];
  var keys = Object.keys(sk), sum = 0, n = 0;
  keys.forEach(function(k){
    var x = sk[k], v = Number(x && x.skor);
    if(RK.indexOf(k) < 0) errs.push("Indikator " + k + " tidak dikenal.");
    if(v >= 1 && v <= 5){ n++; sum += v; } else errs.push("Skor " + k + " wajib 1-5.");
    if(!String((x && x.alasan) || "").trim()) errs.push("Alasan skor " + k + " wajib diisi.");
  });
  if(keys.length !== RK.length || n !== RK.length) errs.push("Skor segmen wajib tepat tujuh indikator.");
  if(n === RK.length && bb && bb.comp && bb.comp.dna){
    var target = seg(bb.comp.dna.segmen), avg = sum / n;
    if(target === "ATAS" && avg < 3) errs.push("Rata-rata skor minimal 3,0 untuk segmen ATAS.");
    if(target === "BAWAH" && avg >= 3) errs.push("Rata-rata skor di bawah 3,0 untuk segmen BAWAH.");
  }
  return errs;
}

export function personaUserViolations(out, bb){
  var u = out && out.user;
  if(!u || typeof u !== "object") return ["User persona wajib berupa objek."];
  var errs = [], P = u.persona || {};
  T7_PERSONA.forEach(function(k){
    if(!String(P[k] == null ? "" : P[k]).trim()) errs.push("Komponen persona " + k + " wajib diisi.");
  });
  ["usertitle","usia"].forEach(function(k){
    if(!String(u[k] == null ? "" : u[k]).trim()) errs.push(k + " wajib diisi.");
  });
  var sub = String(u.usersub == null ? "" : u.usersub).trim();
  if(t7Words(sub).length > 14) errs.push("Usersub maksimal 14 kata.");
  if(sub.split(",").length !== 3) errs.push("Usersub wajib tiga bagian dipisah koma.");
  if(t7English(sub) || t7English(u.usertitle)) errs.push("Persona wajib 100% Bahasa Indonesia.");
  return errs;
}

export function personaOptionsViolations(out, bb){
  var ops = out && out.opsi, errs = [], seen = {};
  if(!Array.isArray(ops) || ops.length !== 5) errs.push("Opsi persona wajib tepat lima.");
  else ops.forEach(function(x){
    var a = String((x && x.usertitle) || "").trim(), b = String((x && x.usia) || "").trim(),
        c = String((x && x.usersub) || "").trim(), k = a + "|" + b + "|" + c;
    if(!a || !b || !c) errs.push("Opsi persona tidak lengkap.");
    if(t7Words(c).length > 14) errs.push("Opsi usersub maksimal 14 kata.");
    if(seen[k]) errs.push("Opsi persona tidak boleh duplikat.");
    seen[k] = 1;
  });
  return errs;
}

export function arenaViolations(out, bb){
  var m = out && out.meja;
  if(!Array.isArray(m) || m.length !== 7) return ["Meja wajib tepat tujuh butir."];
  var errs = [], target = bb && bb.segmen ? seg(bb.segmen) : "";
  var tabu = { ATAS:/kaki lima|miskin|pengemis/i, BAWAH:/eksekutif|direktur|mewah|premium|golf/i };
  m.forEach(function(x, i){
    var s = String(x == null ? "" : x).trim();
    if(!s) errs.push("Meja " + (i+1) + " wajib diisi.");
    if(t7Words(s).length > 8) errs.push("Meja " + (i+1) + " maksimal delapan kata.");
    if(tabu[target] && tabu[target].test(s)) errs.push("Meja " + (i+1) + " tidak selaras segmen " + target + ".");
  });
  return errs;
}

export function positioningT7Violations(out, bb){
  var a = out && out.positioning;
  if(!Array.isArray(a) || a.length !== 5) return ["Positioning wajib tepat lima opsi."];
  var errs = [], seen = {};
  a.forEach(function(x){
    var s = String((x && (x.teks || x.positioning || x.t)) || "").trim(), k = s.toLowerCase();
    errs = errs.concat(positioningViolations({positioning:s}, bb));
    if(!/\bTer[a-z]/i.test(s)) errs.push("Positioning wajib memakai pola Ter-.");
    if(!/\b(No\.1|Pertama|Terbaik)\b/i.test(s)) errs.push("Positioning wajib memuat No.1, Pertama, atau Terbaik.");
    if(!/\bdi\s+\S+/i.test(s)) errs.push("Positioning wajib menyebut teritori.");
    if(seen[k]) errs.push("Opsi positioning tidak boleh duplikat.");
    seen[k] = 1;
  });
  return errs;
}

export async function segmentAgent(){
  var bc = BB.comp || comp, dna = bc && bc.dna ? bc.dna : {};
  if(!String(dna.segmen || "").trim()) throw new Error("Segmen kompetitor belum tersedia.");
  var target = seg(dna.segmen);
  var n = (bc && bc.name) || BB.nama_kompetitor || "kompetitor";
  var brief = ($("brief") && $("brief").value) || BB.brief || "";
  var instr = 'Nilai tujuh indikator segmen brand pengguna yang akan mencongkel kompetitor "' + n + '" di segmen ' + target + '.' +
    ' Cerita bisnis pengguna: ' + brief +
    '. Ringkasan kompetitor: ' + JSON.stringify({segmen:target, positioning:dna.positioning, kunci:dna.kunci}) +
    '. Beri objek segmen_skor berisi tujuh indikator dengan skor dan alasan singkat Bahasa Indonesia yang konsisten dengan segmen ' + target + '.';
  var r = await runAgent("segment", instr);
  var sk = r && r.out && r.out.segmen_skor;
  if(!sk || typeof sk !== "object" || !Object.keys(sk).length) throw new Error("Skor segmen tidak lengkap, coba lagi.");
  var q = segScore(sk, target);
  BB.segmen_skor = sk;
  BB.segmen = q.seg;
  fld("segmen").textContent = q.seg;
  window.segInfo = q;
  window.segLast = segTxt(q);
  sync();
  return q;
}

export function t7UserOpt(x){
  return { t:String((x && x.usertitle) || "").toUpperCase().trim(),
           u:String((x && x.usia) || "").toUpperCase().trim(),
           s:String((x && x.usersub) || "").trim() };
}

export function t7MergeUserOpts(keep, ops){
  var cur = t7UserOpt({usertitle:fld("usertitle").textContent, usia:fld("usia").textContent, usersub:fld("usersub").textContent});
  var seen = {}, first = cur.t + "|" + cur.u + "|" + cur.s;
  if(first !== "||") seen[first] = 1;
  userOpts = (keep || []).concat((ops || []).map(t7UserOpt)).filter(function(x){
    var k = x.t + "|" + x.u + "|" + x.s;
    if(!x.t || seen[k]) return false;
    seen[k] = 1;
    return true;
  }).slice(0, 6);
  renderUser();
  return userOpts;
}

export function personaCtx(){
  var bc = BB.comp || comp, n = (bc && bc.name) || BB.nama_kompetitor || "kompetitor";
  var sg = BB.segmen || fld("segmen").textContent.trim() || "BAWAH";
  var brief = ($("brief") && $("brief").value) || BB.brief || "";
  return {n:n, sg:sg, brief:brief};
}

export function personaInstr(instr){
  var c = personaCtx();
  return 'Susun SATU USER SPESIFIK brand pengguna yang akan mencongkel kompetitor "' + c.n + '" pada SEGMEN ' + c.sg + '.' +
    ' Cerita bisnis pengguna: ' + c.brief +
    '. Ringkasan state: ' + JSON.stringify({gain:BB.gain, meja:BB.meja, jam:JAMV()}) + '.' +
    ' Beri SATU objek JSON "user" memuat persona lima komponen (gender, pekerjaan, lifestyle, harapan, performa) serta usertitle, usia, usersub.' +
    ' usertitle dan usia WAJIB huruf kapital; usersub WAJIB tiga bagian berurutan dipisah koma, maksimal 14 kata, 100% Bahasa Indonesia.' +
    (instr ? '\nInstruksi tambahan: ' + instr : '');
}

export function personaOptsInstr(){
  var c = personaCtx(), cur = t7UserOpt({usertitle:fld("usertitle").textContent, usia:fld("usia").textContent, usersub:fld("usersub").textContent});
  return 'Beri LIMA user spesifik berbeda untuk brand pengguna yang akan mencongkel kompetitor "' + c.n + '" pada SEGMEN ' + c.sg + '.' +
    ' Cerita bisnis pengguna: ' + c.brief + '. Hindari: ' + JSON.stringify(cur) + '.' +
    ' Jawab HANYA JSON {"opsi":[{"usertitle":"","usia":"","usersub":""}, ... 5 objek]}.' +
    ' usertitle dan usia huruf kapital; usersub tiga bagian dipisah koma, maksimal 14 kata, 100% Bahasa Indonesia, tanpa duplikat.';
}

export async function personaUser(instr){
  var r = await runAgent("persona", personaInstr(instr));
  if(!r || !r.out || !r.out.user || !String(r.out.user.usertitle || "").trim()){
    var nt = BB.notes.persona || {};
    var pel = nt.pelanggaran && nt.pelanggaran.length ? ": " + nt.pelanggaran.join(" | ") : "";
    throw new Error("User spesifik tidak lengkap" + pel + ".");
  }
  BB.user = r.out.user;
  return r.out;
}

export function personaApply(r, keep){
  var u = r.user || {}, P = Object.assign({}, u.persona || {});
  if(P.harapan && !P.ritual) P.ritual = P.harapan;
  if(P.performa && !P.dampak) P.dampak = P.performa;
  if(P.pekerjaan && !P.problem) P.problem = P.pekerjaan;
  applyUser({persona:P, usertitle:u.usertitle, usia:u.usia, usersub:u.usersub, analisa_jam:u.analisa_jam});
  return r;
}

export async function personaRec(keep, instr){
  var r = await personaUser(instr);
  personaApply(r, keep);
  return r;
}

export async function personaForRec(instr){
  var r = await personaRec([], instr), u = r.user || {};
  return {persona:u.persona, usertitle:u.usertitle, usia:u.usia, usersub:u.usersub, analisa_jam:u.analisa_jam};
}

export async function personaOptsAgent(keep){
  if(uBusy) return userOpts;
  uBusy = true;
  renderUser();
  try {
    var r = await runAgent("persona-options", personaOptsInstr());
    if(!r || !r.out || !r.out.opsi) throw new Error("Opsi user tidak lengkap.");
    t7MergeUserOpts(keep, r.out.opsi);
  } catch(x){
    toast("Gagal: menyusun 5 rekomendasi User — " + ((x && x.message) || x) + ". Lanjut setelah reset.");
  } finally {
    uBusy = false;
    renderUser();
  }
  return userOpts;
}

export async function regenUserAgent(){
  var old = {t:fld("usertitle").textContent.trim(), u:fld("usia").textContent.trim(), s:fld("usersub").textContent.trim()};
  var r = await personaRec([old].concat(userOpts), ($("pp") && $("pp").value.trim()) || "");
  $("pp").value = "";
  files.user = [];
  $("pn").style.display = "none";
  document.querySelectorAll(".bx").forEach(function(x){ x.classList.remove("sel"); });
  var target = document.querySelector('.bx[data-k="user"]');
  if(target) target.scrollIntoView({behavior:"smooth", block:"center"});
  toast("User Spesifik diperbarui dalam Bahasa Indonesia.");
  return r;
}

export async function arenaAgent(){
  BB.jam = JAMV();
  var bc = BB.comp || comp, n = (bc && bc.name) || BB.nama_kompetitor || "kompetitor";
  var us = [fld("usertitle"), fld("usia"), fld("usersub")].map(function(el){
    return el ? String(el.textContent || "").trim() : "";
  }).filter(Boolean).join(" | ");
  var brief = ($("brief") && $("brief").value) || BB.brief || "";
  var instr = MJ() + ' Kompetitor: ' + n + '. Segmen: ' + (BB.segmen || fld("segmen").textContent.trim()) +
    '. User spesifik: ' + (us || "belum diisi") + '. Cerita bisnis pengguna: ' + brief + '.';
  var r = await runAgent("arena", instr);
  var m = r && r.out && r.out.meja;
  if(!Array.isArray(m) || m.length !== 7) throw new Error("Meja perdebatan tidak lengkap, coba lagi.");
  BB.meja = m.slice(0, 7).map(function(x){ return String(x == null ? "" : x).trim(); });
  for(var i=1; i<=7; i++) fld("meja"+i).textContent = BB.meja[i-1];
  sync();
  return BB.meja;
}

export function posInstr(instr){
  var bc = BB.comp || comp, n = (bc && bc.name) || BB.nama_kompetitor || "kompetitor";
  var dna = bc && bc.dna ? bc.dna : {};
  var brief = ($("brief") && $("brief").value) || BB.brief || "";
  return 'Susun LIMA opsi positioning brand pengguna untuk mencongkel kompetitor "' + n + '" pada segmen ' +
    (BB.segmen || fld("segmen").textContent.trim()) + '. ' + POS() +
    ' Pain konsumen ' + n + ': ' + LST("pain", 5) + '. Positioning kompetitor: ' + (dna.positioning || "") +
    '. Cerita bisnis pengguna: ' + brief + '.' +
    (instr ? '\nInstruksi tambahan: ' + instr : '') +
    ' Beri JSON {"positioning":[{"teks":"...","dasar":"jejak asal kata kunci"}, ...lima objek]}.';
}

export async function posRec(instr, force){
  var r = await runAgent("positioning", posInstr(instr), force ? {force:true} : undefined);
  var raw = r && r.out && r.out.positioning;
  if(!Array.isArray(raw)){
    var why = r && r.errs && r.errs.length ? " Alasan: " + r.errs.slice(0, 2).join(" | ") : "";
    throw new Error("Positioning kosong, coba lagi." + why);
  }
  var a = raw.map(function(x){
    return typeof x === "string"
      ? {t:x.trim(), d:""}
      : {t:String((x && (x.teks || x.positioning || x.t)) || "").trim(), d:String((x && (x.dasar || x.d)) || "").trim()};
  }).filter(function(x){ return !!x.t; });
  if(a.length < 5) throw new Error("Positioning kurang dari lima opsi, coba lagi.");
  a = a.slice(0, 5);
  BB.posDraft = a;
  BB.positioning = a[0].t;
  fld("positioning").textContent = a[0].t;
  posDasar = a[0].d;
  posOpts = a.slice(1);
  renderPos();
  sync();
  return a;
}

export async function autoPosAgent(){
  toast("Menyusun rekomendasi Positioning…");
  $("pcnt").textContent = "…";
  try {
    await posRec("");
    toast("Positioning siap. Buka dropdown untuk " + posOpts.length + " opsi lain, lalu kunci.");
  } catch(x){
    renderPos();
    toast("Gagal menyusun Positioning: " + ((x && x.message) || x) + ". Buka ✎ lalu Generate.");
  }
}

export async function regenPosAgent(){
  var old = {t:fld("positioning").textContent.trim(), d:posDasar};
  var r = await posRec(($("pp") && $("pp").value.trim()) || "", true), best = r[0];
  posOpts = [old].concat(r.slice(1), posOpts).filter(function(x, i, a){
    return !!x.t && x.t !== best.t && a.findIndex(function(y){ return y.t === x.t; }) === i;
  }).slice(0, 14);
  fld("positioning").textContent = best.t;
  posDasar = best.d;
  if(conf.positioning){ conf.positioning = false; applyLock(); }
  sync();
  renderPos();
  $("pp").value = "";
  files.positioning = [];
  $("pn").style.display = "none";
  document.querySelectorAll(".bx").forEach(function(x){ x.classList.remove("sel"); });
  var target = document.querySelector('.bx[data-k="positioning"]');
  if(target) target.scrollIntoView({behavior:"smooth", block:"center"});
  toast("Positioning baru terpasang. Kalimat sebelumnya tersimpan di dropdown.");
  return r;
}

/* === AGENT TASKS (T8) === */
export function t8Words(s){ return String(s == null ? "" : s).trim().split(/\s+/).filter(Boolean); }

export function t8English(s){
  var t = String(s == null ? "" : s).replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return /\b(the|and|for|with|you|your|best|work|dream|life|style|job|age|gender|habit|daily|performance|fresh|healthy|taste|delicious|brand|price|quality|super|more|from|this|that)\b/i.test(t);
}

export function t8HashtagWords(s){
  return t8Words(String(s == null ? "" : s).replace(/^#/, "").replace(/!$/, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
}

export function t8Compact(s){ return String(s == null ? "" : s).toLowerCase().replace(/\s+/g, ""); }

export function taglineViolations(out, bb){
  var d = out && out.verbalDraft ? out.verbalDraft : (out || {});
  var errs = [], tg = d.tagline, comp = String((bb && bb.comp && bb.comp.name) || "").trim(), seen = {};
  if(!Array.isArray(tg) || tg.length !== 5) errs.push("Tagline wajib tepat lima opsi.");
  if(Array.isArray(tg)) tg.forEach(function(x){
    var s = String((x && (x.tagline || x.t)) || "").trim(), k = s.toLowerCase();
    if(!/^#/.test(s) || !/!$/.test(s)) errs.push("Tagline wajib diawali # dan diakhiri !.");
    if(t8HashtagWords(s).length > 4) errs.push("Tagline maksimal empat kata.");
    if(t8English(s)) errs.push("Tagline wajib 100% Bahasa Indonesia.");
    if(comp && (k.indexOf(comp.toLowerCase()) > -1 || t8Compact(s).indexOf(t8Compact(comp)) > -1)) errs.push("Tagline tidak boleh menyebut kompetitor.");
    if(seen[k]) errs.push("Tagline tidak boleh duplikat.");
    seen[k] = 1;
  });
  return errs;
}

export function namaViolations(out, bb){
  var d = out && out.verbalDraft ? out.verbalDraft : (out || {});
  var errs = [], nm = d.nama, comp = String((bb && bb.comp && bb.comp.name) || "").trim(), seen = {};
  if(!Array.isArray(nm) || nm.length !== 5) errs.push("Nama wajib tepat lima opsi.");
  if(Array.isArray(nm)) nm.forEach(function(x){
    var s = String((x && (x.nama || x.t)) || "").trim(), k = s.toLowerCase();
    if(!s || t8Words(s).length > 2) errs.push("Nama maksimal dua kata.");
    if(t8English(s)) errs.push("Nama wajib 100% Bahasa Indonesia.");
    if(comp && (k.indexOf(comp.toLowerCase()) > -1 || t8Compact(s).indexOf(t8Compact(comp)) > -1)) errs.push("Nama tidak boleh menyebut kompetitor.");
    if(seen[k]) errs.push("Nama tidak boleh duplikat.");
    seen[k] = 1;
  });
  return errs;
}

export function kunciViolations(out, bb){
  var d = out && out.verbalDraft ? out.verbalDraft : (out || {});
  var errs = [], ku = d.kunci, seen = {};
  if(!Array.isArray(ku) || ku.length !== 5) errs.push("Kunci wajib tepat lima opsi.");
  if(Array.isArray(ku)) ku.forEach(function(x){
    var s = String((x && (x.kunci || x.t)) || "").trim(), k = s.toLowerCase();
    if(t8Words(s).length !== 2) errs.push("Kunci wajib tepat dua kata.");
    if(t8English(s)) errs.push("Kunci wajib 100% Bahasa Indonesia.");
    if(seen[k]) errs.push("Kunci tidak boleh duplikat.");
    seen[k] = 1;
  });
  return errs;
}

export function warnaViolations(out, bb){
  var d = out && out.visualDraft ? out.visualDraft : (out || {});
  var errs = [], W = d.warna, sw = {};
  if(!Array.isArray(W) || W.length !== 5) errs.push("Warna wajib tepat lima opsi.");
  if(Array.isArray(W)) W.forEach(function(x){
    var c1 = String((x && x.c1) || "").trim(), c2 = String((x && x.c2) || "").trim();
    var fw = String((x && x.filw) || "").trim(), k = c1 + "|" + c2 + "|" + fw;
    if(!/^#[0-9a-f]{6}$/i.test(c1) || !/^#[0-9a-f]{6}$/i.test(c2)) errs.push("Warna wajib hex enam digit.");
    if(lumi(c1) >= 0.72 || lumi(c2) >= 0.72) errs.push("Warna terlalu terang untuk teks putih.");
    if(t8Words(fw).length > 20 || !fw) errs.push("Filosofi warna wajib 1-20 kata.");
    if(sw[k]) errs.push("Opsi warna tidak boleh duplikat.");
    sw[k] = 1;
  });
  return errs;
}

export function fontViolations(out, bb){
  var d = out && out.visualDraft ? out.visualDraft : (out || {});
  var errs = [], F = d.font, sf = {};
  if(!Array.isArray(F) || F.length !== 5) errs.push("Font wajib tepat lima opsi.");
  if(Array.isArray(F)) F.forEach(function(x){
    var f = String((x && x.font) || "").trim(), ff = String((x && x.filf) || "").trim(), k = f.toLowerCase();
    if(!f) errs.push("Font wajib diisi.");
    if(t8Words(ff).length > 20 || !ff) errs.push("Filosofi font wajib 1-20 kata.");
    if(sf[k]) errs.push("Opsi font tidak boleh duplikat.");
    sf[k] = 1;
  });
  return errs;
}

export function verbalPart(out, key){
  var d = (out && (out.verbalDraft || out)) || {};
  var a = Array.isArray(d[key]) ? d[key] : [];
  return a.map(function(x){
    var s = String((x && (x[key] || x.t)) || "").trim();
    if(key === "tagline") return {tagline: hashify(s), alasan: "Forum: " + String((x && (x.forum || x.alasan)) || "").trim()};
    if(key === "nama") return {nama: s, alasan: "Level " + (String(x && x.level) === "2" ? "2" : "1") + " · " + String((x && (x.batin || x.alasan)) || "").trim()};
    return {kunci: s};
  }).filter(function(o){ return o[key]; });
}

export function fieldInstr(key){
  /* ponytail: instruksi dasar konstan agar kunci cache stabil; instruksi revisi/QA ditambahkan verbalAgent, aturan domain tetap di rules BX:. */
  return "Buat lima opsi " + key + " yang saling berbeda.";
}

export async function verbalAgent(key, instr, force){
  if(["tagline","nama","kunci"].indexOf(key) < 0) throw new Error("Field verbal tidak dikenal: " + key);
  var text = fieldInstr(key) + (instr ? "\n" + String(instr) : "");
  var r = await runAgent(key, text, force ? {force:true} : undefined);
  if(r.errs && r.errs.length) throw new Error(key + ": " + r.errs.join(" | "));
  var d = r.out && (r.out.verbalDraft || r.out);
  if(!d || !Array.isArray(d[key])) throw new Error(key + ": hasil belum lengkap.");
  return r.out;
}

export async function mkTagsAgent(instr, force){
  var a = verbalPart(await verbalAgent("tagline", instr, force), "tagline");
  if(!a.length) throw new Error("Tagline kosong, coba lagi.");
  return a;
}

export async function mkNamesAgent(instr, force){
  var a = verbalPart(await verbalAgent("nama", instr, force), "nama");
  if(!a.length) throw new Error("Nama brand kosong, coba lagi.");
  return a;
}

export async function kunciOptsAgent(keep){
  var a = verbalPart(await verbalAgent("kunci", ""), "kunci");
  if(!a.length) throw new Error("Kunci kosong, coba lagi.");
  return a;
}

export async function verbalRec(key, instr, force){
  var a = verbalPart(await verbalAgent(key, instr == null ? "" : instr, !!force), key);
  if(!a.length) throw new Error("Hasil verbal kosong untuk " + key + ".");
  var first = a[0], val = first[key];
  t8FillField(key, val);
  if(key === "tagline") tagSim = first.alasan || "";
  var S = OPT[key], seen = {};
  seen[String(val).toLowerCase()] = 1;
  if(S) S.l = a.slice(1).filter(function(o){
    var q = String(o[key] || "").toLowerCase();
    if(!q || seen[q]) return false;
    seen[q] = 1;
    return true;
  }).slice(0, 5);
  sync();
  renderOpts(key);
  return a;
}

export async function t8GenOpts(k, keep){
  if(k !== "kunci" && k !== "warna" && k !== "font") return false;
  var S = OPT[k];
  S.busy = true;
  renderOpts(k);
  try {
    var a = k === "kunci" ? await kunciOptsAgent(keep)
      : k === "warna" ? await warnaOptsAgent(keep) : await fontOptsAgent(keep);
    var seen = {}, cur = curVals(k);
    seen[JSON.stringify(cur)] = 1;
    S.l = (keep || []).concat(a).filter(function(o){
      if(!o) return false;
      var q = JSON.stringify(o);
      if(seen[q]) return false;
      seen[q] = 1;
      return true;
    }).slice(0, 6);
  } catch(x){
    toast("Gagal: " + (x && x.message || x));
  }
  S.busy = false;
  renderOpts(k);
  return true;
}

export async function t8UseRec(k){
  if(k === "kunci"){ await verbalRec("kunci", ""); return true; }
  if(k === "nama"){
    await verbalRec("nama", "Buat lima nama yang berbeda total satu sama lain. Gunakan lima arah berbeda: coined modern, sensorik/emosional, lokal relevan, gabungan dua kata, dan singkat premium. Jangan mengulang nama dari hasil sebelumnya.", true);
    return true;
  }
  if(k === "warna" || k === "font"){ return !!(await visualRec(k, "")); }
  if(k === "web"){ await webAgent(); return true; }
  return false;
}

export async function webAgent(){
  var el = fld("kunci"), v = webFrom(String(el ? el.textContent.trim() : ""));
  t8FillField("web", v);
  if(OPT.web) OPT.web.l = webOpts();
  sync();
  renderOpts("web");
  return v;
}

export function visualPart(out, key){
  var d = (out && (out.visualDraft || out)) || {};
  var a = Array.isArray(d[key]) ? d[key] : [];
  return a.map(function(x){
    if(key === "warna") return {
      c1: String((x && x.c1) || "").trim(), c2: String((x && x.c2) || "").trim(),
      filw: String((x && x.filw) || "").trim()
    };
    return {font: String((x && (x.font || x.t)) || "").trim(), filf: String((x && x.filf) || "").trim()};
  }).filter(function(o){ return key === "warna" ? (o.c1 && o.c2) : o.font; });
}

export async function visualAgent(key, instr, force){
  if(["warna","font"].indexOf(key) < 0) throw new Error("Field visual tidak dikenal: " + key);
  /* ponytail: retry ada di runAgent(); loop luar dulu mengirim 9 panggilan saat validasi gagal. Tambah retry khusus bila ada kegagalan yang tidak tercakup runAgent. */
  var text = fieldInstr(key) + (instr ? "\n" + String(instr) : "");
  var r = await runAgent(key, text, force ? {force:true} : undefined);
  var errs = r.errs || [];
  if(!errs.length){
    var d = r.out && (r.out.visualDraft || r.out);
    if(d && Array.isArray(d[key])) return r.out;
    errs = [key + ": hasil belum lengkap."];
  }
  throw new Error(key + ": " + errs.join(" | "));
}

export async function warnaOptsAgent(keep){
  var a = visualPart(await visualAgent("warna", ""), "warna");
  if(!a.length) throw new Error("Warna kosong, coba lagi.");
  return a;
}

export async function fontOptsAgent(keep){
  var a = visualPart(await visualAgent("font", ""), "font");
  if(!a.length) throw new Error("Font kosong, coba lagi.");
  return a;
}

export async function visualRec(key, instr, force){
  var out = await visualAgent(key, instr == null ? "" : instr, force);
  if(!out) return null;
  var a = visualPart(out, key);
  if(!a.length) throw new Error("Hasil visual kosong untuk " + key + ".");
  var first = a[0];
  Object.keys(first).forEach(function(f){ t8FillField(f, first[f]); });
  if(OPT[key]) OPT[key].l = a.slice(0, 5);
  sync();
  renderOpts(key);
  return a;
}

/* === AGENT TASKS (T9) === */
export function t9HasEvil(s){
  return /script|on[a-z]+\s*=|href|xlink|foreignObject/i.test(String(s == null ? "" : s));
}

export function t9Draft(out){
  return out && typeof out === "object" && out.logoDraft && typeof out.logoDraft === "object" ? out.logoDraft : (out || {});
}

export function t9Info(out){
  return out && typeof out === "object" && out.logoInfo && typeof out.logoInfo === "object" ? out.logoInfo : (out || {});
}

export function logoSVGViolations(out, bb){
  var d = t9Draft(out), errs = [];
  var svg = String(d.svg == null ? "" : d.svg).trim();
  var k = String(d.konsep == null ? "" : d.konsep).trim();
  if(!/<svg[\s\S]*<\/svg>/i.test(svg)) errs.push("SVG logomark wajib berupa elemen svg.");
  else {
    if(svg.length > 8000) errs.push("SVG maksimal 8000 karakter.");
    if((svg.match(/<[a-z]/gi) || []).length > 40) errs.push("SVG maksimal 40 elemen.");
    if(t9HasEvil(svg)) errs.push("SVG tidak boleh memuat skrip, handler, atau tautan.");
    if(typeof cleanSVG === "function" && !cleanSVG(svg)) errs.push("SVG tidak lolos pembersihan.");
  }
  if(!k || k.length > 200) errs.push("Konsep wajib 1-2 kalimat maksimal 200 karakter.");
  else if((k.match(/[.!?]/g) || []).length > 2) errs.push("Konsep maksimal dua kalimat.");
  return errs;
}

export function logoInfoViolations(out, bb){
  var d = t9Info(out), errs = [];
  ["teks_utama","tagline_di_logo","deskripsi_visual"].forEach(function(k){
    if(typeof d[k] !== "string") errs.push(k + " wajib berupa teks.");
  });
  if(String(d.deskripsi_visual == null ? "" : d.deskripsi_visual).length > 300) errs.push("deskripsi_visual maksimal 300 karakter.");
  return errs;
}

export function t9Agents(){
  defAgent("logo-designer", {
    role:"perancang identitas logo brand",
    persona:"Desainer logomark Indonesia yang merancang ikon geometris sederhana, ikonik, dan mudah dikenali.",
    reads:["nama","tagline","warna","kunci","positioning","segmen","user"],
    writes:["logoDraft"],
    rules:["BX:nama","BX:tagline","BX:kunci","BX:positioning","BX:warna","MKT","RUB"],
    model:{profile:"deep", temp:0.55, maxTokens:1200, reasoning:"low"},
    schema:{logoDraft:{svg:"string SVG aman", konsep:"string 1-2 kalimat maksimal 200 karakter"}},
    validate:logoSVGViolations
  });
  defAgent("logo-inspector", {
    role:"pembaca visual logo kompetitor",
    persona:"Analis visual brand yang membaca teks, tagline, dan deskripsi ikon pada gambar logo.",
    reads:["comp"],
    writes:["logoInfo"],
    rules:["MKT"],
    model:{profile:"vision", temp:0.2, maxTokens:700, reasoning:"none"},
    schema:{teks_utama:"string", tagline_di_logo:"string", deskripsi_visual:"string maksimal 300 karakter"},
    validate:logoInfoViolations
  });
}

export function logoInstr(instr){
  /* ponytail: instr diabaikan agar kunci cache runAgent stabil; state masuk lewat buildPrompt/digestBB. Tambah routing per-field bila regen terarah dibutuhkan. */
  return "Rancang SATU logomark vektor ikonik. Jawab HANYA JSON: {\"logoDraft\":{\"svg\":\"...\",\"konsep\":\"...\"}}. " +
    "SVG memakai viewBox=\"0 0 200 200\", 4-9 elemen path/circle/rect, simetris, tanpa teks, gradien, filter, skrip, handler, atau href. " +
    "Gunakan hanya palet warna korporat pada ringkasan state (c1/c2), #FFFFFF, dan versi gelap c1 (dk(c1,.45)). " +
    "konsep berupa 1-2 kalimat Bahasa Indonesia maksimal 200 karakter.";
}

export async function mkMarkAgent(instr){
  var r = await runAgent("logo-designer", logoInstr(instr));
  if(!r || !r.out || !r.out.logoDraft || (r.errs && r.errs.length)){
    throw new Error("Logo ditolak: " + ((r && r.errs && r.errs.join("; ")) || "hasil tidak valid"));
  }
  var d = r.out.logoDraft;
  d.svg = cleanSVG(d.svg);
  if(!d.svg) throw new Error("Logo ditolak: SVG tidak lolos pembersihan.");
  return d;
}

export function t9SetMark(svg, konsep){
  var s = String(svg == null ? "" : svg), k = String(konsep == null ? "" : konsep);
  if(typeof BB !== "undefined" && BB){ BB.markSVG = s; BB.markConcept = k; }
  markSVG = s; markConcept = k;
}

export function t9OpenOnly(){
  try {
    var v = localStorage.getItem("dna_openonly");
    return v === "1" || String(v == null ? "" : v).toLowerCase() === "true";
  } catch(e){ return false; }
}

export async function t9VisionProvider(){
  if(!t9OpenOnly() && providerKey("gemini")){
    try {
      var ids = await listModels("gemini");
      var m = resolveModels("vision", ids)[0];
      if(m) return {providerId:"gemini", model:m};
    } catch(e){}
  }
  if(providerBase("custom")){
    try {
      var ids2 = await listModels("custom");
      var m2 = resolveModels("vision", ids2)[0];
      if(m2) return {providerId:"custom", model:m2};
    } catch(e){}
  }
  return null;
}

export function t9VisionFail(e){
  var msg = String((e && e.message) || e || "Permintaan gagal.");
  toast("Gagal: " + msg + " Lanjut setelah reset.");
  return null;
}

export async function runVisionAgent(blob, brandName){
  if(!blob) return null;
  var p = await t9VisionProvider();
  if(!p){
    toast("Analisis gambar tidak tersedia; lanjut mode teks.");
    return null;
  }
  var spec = AGENTS["logo-inspector"];
  var instr = "Analisis logo " + String(brandName == null ? "" : brandName) + ". " +
    "Ekstrak teks_utama, tagline_di_logo (isi \"\" bila tidak ada), dan deskripsi_visual 2 kalimat singkat.";
  var prompt = buildPrompt(spec, BB, instr);
  for(var attempt=1; attempt<=2; attempt++){
    try {
      var res = await llmCall(p.providerId, {
        model: p.model,
        messages: [{role:"user", content: attempt === 1 ? prompt : prompt + "\nPerbaiki JSON sebelumnya dan jawab HANYA JSON."}],
        images: [blob],
        json: true,
        temperature: spec.model.temp,
        maxTokens: spec.model.maxTokens
      });
      var out;
      try { out = parseJSON(res && res.text); }
      catch(pe){
        if(pe && pe.code === "invalid_json" && attempt === 1) continue;
        throw pe;
      }
      var errs = logoInfoViolations(out, BB) || [];
      if(errs.length) throw new Error(errs.join("; "));
      BB.logoInfo = out;
      return out;
    } catch(e){
      var code = e && (e.code || e.status);
      if(code === 401 || code === 429 || code === "rate_limited" ||
         /kuota|quota|terbatas|401|429/i.test(String(e && e.message || e))){
        return t9VisionFail(e);
      }
      if(attempt === 1 && e && e.code === "invalid_json") continue;
      return t9VisionFail(e);
    }
  }
  return null;
}

export async function inspectLogoAgent(imgBlob, brandName){
  return runVisionAgent(imgBlob, brandName);
}

/* === AGENT TASKS (T11) === */
BB.qa = BB.qa || {busy:false, reason:"", model:"", layer1:{}, flags:{}};
BB.qa.layer1 = BB.qa.layer1 || {};
BB.qa.flags = BB.qa.flags || {};

export function t11Words(s){ return String(s == null ? "" : s).trim().split(/\s+/).filter(Boolean).length; }

export function t11Val(id){
  var v = typeof BBVAL === "function" ? String(BBVAL(id) || "") : "";
  if(v.trim()) return v.trim();
  var el = typeof fld === "function" ? fld(id) : null;
  return String((el && el.textContent) || "").trim();
}

export function t11List(ids){ return ids.map(function(id){ return t11Val(id); }); }

export function t11Layer1(){
  var flags = BB.qa.layer1;
  BX.forEach(function(b){
    var errs = [], s = "", arr = [], i;
    if(b.k === "kompetitor"){
      s = t11Val("kompetitor");
      if(!s) errs.push("Nama kompetitor wajib diisi.");
      var cn = BB.comp && BB.comp.name;
      if(cn && s && s.toLowerCase() !== String(cn).toLowerCase()) errs.push("Nama kompetitor tidak sama dengan hasil riset.");
    } else if(b.k === "pain"){
      arr = t11List([1,2,3,4,5].map(function(n){ return "pain" + n; }));
      if(!t6List5(arr)) errs.push("Pain wajib tepat lima butir tidak kosong, maksimal 9 kata.");
    } else if(b.k === "gain"){
      arr = t11List([1,2,3,4,5].map(function(n){ return "gain" + n; }));
      var gb = {}; Object.keys(BB || {}).forEach(function(k){ gb[k] = BB[k]; }); gb.pain = t11List([1,2,3,4,5].map(function(n){ return "pain" + n; }));
      voiceGainViolations({gain:arr}, gb).forEach(function(e){ errs.push(e); });
    } else if(b.k === "segmen"){
      s = t11Val("segmen");
      if(!/^(ATAS|BAWAH)$/i.test(s)) errs.push("Segmen wajib ATAS atau BAWAH.");
      var cs = BB.comp && ((BB.comp.dna && BB.comp.dna.segmen) || BB.comp.segmen);
      if(cs && s.toUpperCase() !== String(cs).toUpperCase()) errs.push("Segmen brand wajib sama dengan segmen kompetitor.");
    } else if(b.k === "user"){
      ["usertitle","usersub","usia"].forEach(function(id){ if(!t11Val(id)) errs.push("User " + id + " belum terisi."); });
    } else if(b.k === "meja"){
      arr = t11List([1,2,3,4,5,6,7].map(function(n){ return "meja" + n; }));
      if(arr.length !== 7 || arr.some(function(x){ return !x || t11Words(x) > 12; })) errs.push("Meja perdebatan wajib tepat tujuh butir.");
    } else if(b.k === "positioning"){
      positioningViolations({positioning:t11Val("positioning")}, BB).forEach(function(e){ errs.push(e); });
    } else if(b.k === "tagline"){
      s = t11Val("tagline");
      if(!/^#/.test(s) || !/!$/.test(s)) errs.push("Tagline wajib diawali # dan diakhiri !.");
      if(typeof t8HashtagWords === "function" && t8HashtagWords(s).length > 4) errs.push("Tagline maksimal empat kata.");
      if(typeof t8English === "function" && t8English(s)) errs.push("Tagline wajib 100% Bahasa Indonesia.");
    } else if(b.k === "nama"){
      s = t11Val("nama");
      if(!s || t11Words(s) > 2) errs.push("Nama maksimal dua kata.");
      var nc = BB.comp && BB.comp.name;
      if(nc && s && s.toLowerCase().indexOf(String(nc).toLowerCase()) > -1) errs.push("Nama tidak boleh menyebut kompetitor.");
    } else if(b.k === "warna"){
      ["c1","c2"].forEach(function(id){ if(!t6Hex(t11Val(id))) errs.push(id + " wajib hex enam digit."); });
      if(t11Words(t11Val("filw")) > 20) errs.push("Filosofi warna maksimal 20 kata.");
    } else if(b.k === "font"){
      if(!t11Val("font")) errs.push("Font wajib diisi.");
      if(t11Words(t11Val("filf")) > 20) errs.push("Filosofi font maksimal 20 kata.");
    } else if(b.k === "logobg"){
      [1,2,3].forEach(function(n){ if(!t6Hex(t11Val("bg" + n))) errs.push("bg" + n + " wajib hex enam digit."); });
    } else if(b.k === "kunci"){
      if(t11Words(t11Val("kunci")) !== 2) errs.push("Kunci wajib tepat dua kata.");
    } else if(b.k === "web"){
      var want = webFrom(t11Val("kunci"));
      if(t11Val("web").toLowerCase() !== want.toLowerCase()) errs.push("Website wajib " + want + " sesuai kata kunci.");
    }
    flags[b.k] = errs;
  });
}

export function t11Flags(k){
  return (BB.qa.layer1[k] || []).concat(BB.qa.flags[k] || []);
}

export function t11Drop(k, s){
  ["layer1", "flags"].forEach(function(which){
    var a = BB.qa[which][k] || [], j = a.indexOf(s);
    if(j > -1) a.splice(j, 1);
    if(!a.length) delete BB.qa[which][k];
  });
}

export function t11Decorate(){
  var ctl = typeof document !== "undefined" && document.querySelector ? document.querySelector("#t10Panel .t10ctl") : null;
  if(!ctl || !ctl.insertAdjacentHTML) return;
  var summary = BX.map(function(b){
    return b.k + ":" + t11Flags(b.k).length;
  }).join(" · ");
  var html = '<button class="t11Check"' + (BB.qa.busy ? ' disabled' : '') + '>Periksa QA</button>';
  BX.forEach(function(b){
    t11Flags(b.k).forEach(function(flag, i){
      if(t11Fixers[b.k]) html += '<button class="t11Fix" data-box="' + t11Esc(b.k) + '" data-i="' + i + '">Perbaiki ' + t11Esc(b.t) + ': ' + t11Esc(flag) + '</button>';
    });
  });
  html += '<div class="t11Flags">QA kode: ' + t11Esc(summary) +
    (BB.qa.reason ? ' · ' + t11Esc(BB.qa.reason) : (BB.qa.model ? ' · model ' + t11Esc(BB.qa.model) : '')) + '</div>';
  ctl.insertAdjacentHTML("beforeend", html);
}

export function t11QAValidate(out){
  var arr = out && Array.isArray(out.bendera) ? out.bendera : null;
  if(!arr) return ["Daftar bendera QA wajib berupa array."];
  if(arr.length > 20) return ["QA maksimal 20 bendera."];
  var known = {}, errs = [];
  BX.forEach(function(b){ known[b.k] = 1; });
  arr.forEach(function(x){
    if(!known[x && x.kotak]) errs.push("Kotak bendera tidak dikenal.");
    var s = String((x && x.catatan) || "").trim();
    if(!s || s.length > 120) errs.push("Catatan bendera wajib 1-120 karakter.");
  });
  return errs;
}

export function t11Avoid(){
  var out = [];
  Object.keys(BB.notes || {}).forEach(function(id){
    if(id === "qa") return;
    var m = BB.notes[id] && BB.notes[id].model;
    if(m && out.indexOf(m) < 0) out.push(m);
  });
  return out;
}

export async function t11PickQA(){
  var avoid = t11Avoid();
  if(!(MODEL_PROFILES.critic || []).some(function(rx){ return rx.test("gemini"); })) MODEL_PROFILES.critic.push(/gemini/i);
  if(typeof providerKey === "function" && providerKey("gemini") && typeof t9OpenOnly === "function" && !t9OpenOnly()){
    try {
      var ids = await listModels("gemini");
      var c = resolveModels("critic", ids || [], avoid);
      if(c.length) return {provider:"gemini", model:c[0]};
    } catch(e){
      if(e && (e.code === "rate_limited" || e.status === 429)) throw new Error("Kuota Gemini habis. Lanjut setelah reset.");
    }
  }
  if(typeof getGroqKey === "function" && getGroqKey()){
    var ids2 = await listModels("groq");
    var c2 = resolveModels("critic", ids2 || [], avoid);
    if(c2.length) return {provider:"groq", model:c2[0]};
  }
  throw new Error("Tidak ada model penilai yang berbeda. Lanjut setelah reset.");
}

export async function t11Check(){
  if(BB.qa.busy) return;
  BB.qa.busy = true;
  BB.qa.reason = "";
  try {
    var picked = await t11PickQA();
    var spec = AGENTS.qa;
    var instr = "Periksa konsistensi lintas kotak: tagline vs positioning, nama vs kompetitor, warna vs segmen, user vs meja. " +
      "Keluarkan hanya bendera singkat per kotak yang bermasalah.";
    var prompt = buildPrompt(spec, BB, instr);
    var res = await llmCall(picked.provider, {
      model:picked.model, messages:[{role:"user", content:prompt}],
      json:true, temperature:0, maxTokens:600, reasoning:"none"
    });
    var out = parseJSON(res && res.text), errs = t11QAValidate(out) || [];
    if(errs.length) throw new Error("QA: " + errs.join(" | "));
    var flags = BB.qa.flags;
    (out.bendera || []).forEach(function(x){
      var arr = flags[x.kotak] || (flags[x.kotak] = []), s = String(x.catatan).trim();
      if(t11Flags(x.kotak).indexOf(s) < 0) arr.push(s);
    });
    BB.notes.qa = {model:picked.model, percobaan:1, alasan:picked.provider, pelanggaran:[]};
    BB.qa.model = picked.model;
  } catch(e){
    var msg = String((e && e.message) || e || "QA gagal.");
    if((e && (e.code === "rate_limited" || e.status === 429)) || /HTTP 429/.test(msg)) msg = "Kuota habis. Lanjut setelah reset.";
    BB.qa.reason = msg;
  } finally {
    BB.qa.busy = false;
    t10Render();
  }
}

export async function t11Fix(box, i){
  var arr = t11Flags(box), s = arr[i];
  if(!s) return;
  var fixer = t11Fixers[box];
  if(!fixer){
    BB.qa.reason = "Kotak " + box + " tidak punya agen perbaikan.";
    t10Render();
    return;
  }
  var flag = String(s).replace(/[.\s]+$/, "");
  try {
    await fixer(flag);
    t11Drop(box, s);
    t11Layer1();
  } catch(e){
    BB.qa.reason = "Perbaikan gagal: " + String((e && e.message) || e || "agen gagal.");
  }
  t10Render();
}

export function t11Click(ev){
  var t = ev && ev.target;
  if(!t || !t.closest) return;
  var btn = t.closest(".t11Check,.t11Fix");
  if(!btn || !btn.classList) return;
  if(btn.classList.contains("t11Check")) return t11Check();
  if(btn.classList.contains("t11Fix")) return t11Fix(btn.dataset && btn.dataset.box, Number(btn.dataset && btn.dataset.i));
}

/* ponytail: registrasi agen tetap di level modul; defAgent("qa") sengaja di app.js boot tail. */
defAgent("competitor", {
  role: "analis riset pasar kompetitor",
  persona: "Konsultan brand senior yang memverifikasi fakta brand di Indonesia tanpa mengarang.",
  reads: ["brief", "nama_kompetitor"],
  writes: ["compDraft.fakta"],
  rules: ["BX:kompetitor"],
  model: {profile:"search", temp:0.2, maxTokens:1400, reasoning:"low"},
  schema: {compDraft:{fakta:{entitas:"string", model_bisnis:"string", produk_utama:"string", rentang_harga:"string", c1:"hex", c2:"hex", font:"string", tagline_asli:"string", tagline_asli_ditemukan:"boolean", kunci_asli:"2 kata", web:"string", instagram:"string", kompetitor_langsung:"string", kompetitor_web:"string", kompetitor_ig:"string"}}},
  validate: competitorFactsViolations
});

defAgent("competitor-core", {
  role: "perancang inti DNA kompetitor",
  persona: "Strategi branding Indonesia yang menyusun pain, gain, segmen, dan user dari fakta terverifikasi.",
  reads: ["brief", "nama_kompetitor", "compDraft.fakta"],
  writes: ["compDraft.core"],
  rules: ["BX:pain", "BX:gain", "BX:segmen", "RUB"],
  model: {profile:"deep", temp:0.3, maxTokens:1600, reasoning:"low"},
  schema: {compDraft:{core:{pain:"5 string", gain:"5 string", segmen_skor:"7 indikator", segmen:"ATAS/BAWAH", gender:"WANITA/PRIA", usertitle:"string", usia:"string", usersub:"string", meja:"7 string"}}},
  validate: competitorCoreViolations
});

defAgent("competitor-ident", {
  role: "perancang identitas kompetitor",
  persona: "Strategi branding Indonesia yang merangkai positioning, tagline, kata kunci, dan identitas visual dari fakta terverifikasi.",
  reads: ["brief", "nama_kompetitor", "compDraft.fakta", "compDraft.core"],
  writes: ["compDraft.ident"],
  rules: ["BX:positioning", "BX:tagline", "BX:kunci", "BX:warna", "MKT"],
  model: {profile:"deep", temp:0.3, maxTokens:1400, reasoning:"low"},
  schema: {compDraft:{ident:{positioning:"string", dasar:"string", tagline:"string", hashtag:"5 string", kunci:"2 kata", kompetitor:"string", kompetitor_web:"string", kompetitor_ig:"string", c1:"hex", c2:"hex", font:"string", web:"string", instagram:"string", keyakinan:"string", catatan:"string"}}},
  validate: competitorIdentViolations
});

defAgent("voice-pain", {
  role: "peneliti suara konsumen kompetitor",
  persona: "Konsultan branding yang merangkai kekhawatiran nyata konsumen dari sudut produk, layanan, CSR, dan persepsi.",
  reads: ["brief", "nama_kompetitor", "compDraft.fakta"],
  writes: ["pain"],
  rules: ["BX:pain"],
  model: {profile:"deep", temp:0.3, maxTokens:600, reasoning:"medium"},
  schema: {pain:"array 5 string"},
  validate: voicePainViolations
});

defAgent("voice-gain", {
  role: "perancang mirror value brand pengguna",
  persona: "Strategi brand yang menerjemahkan setiap pain kompetitor menjadi harapan dan keunggulan brand pengguna.",
  reads: ["pain", "nama_kompetitor"],
  writes: ["gain"],
  rules: ["BX:gain"],
  model: {profile:"deep", temp:0.3, maxTokens:600, reasoning:"low"},
  schema: {gain:"array 5 string"},
  validate: voiceGainViolations
});

defAgent("segment", {
  role:"analis segmen kompetitor",
  persona:"Strategi branding Indonesia yang membuktikan segmen lewat skor indikator yang jujur.",
  reads:["comp","brief"], writes:["segmen_skor"], rules:["BX:segmen","RUB"],
  model:{profile:"deep", temp:0.15, maxTokens:900, reasoning:"low"},
  schema:{segmen_skor:"7 indikator {skor:1-5, alasan:string}"},
  validate:segmentViolations
});

defAgent("persona", {
  role:"perancang profil pembeli",
  persona:"Konsultan branding Indonesia yang merangkai satu user spesifik dari rumus lima komponen.",
  reads:["comp","gain","segmen"], writes:["user"], rules:["BX:user","MKT","RUB"],
  model:{profile:"deep", temp:0.3, maxTokens:900, reasoning:"low"},
  schema:{user:{persona:{gender:"string",pekerjaan:"string",lifestyle:"string",harapan:"string",performa:"string"},usertitle:"string",usia:"string",usersub:"string"}},
  validate:personaUserViolations
});

defAgent("persona-options", {
  role:"perancang alternatif profil pembeli",
  persona:"Konsultan branding Indonesia yang menyusun lima user spesifik berbeda untuk dibandingkan.",
  reads:["comp","gain","segmen","user"], writes:["opsi"], rules:["BX:user","MKT"],
  model:{profile:"deep", temp:0.3, maxTokens:900, reasoning:"low"},
  schema:{opsi:"5 objek {usertitle,usia,usersub}"},
  validate:personaOptionsViolations
});

defAgent("arena", {
  role:"perancang meja perdebatan pembeli",
  persona:"Peneliti perilaku konsumen Indonesia yang memetakan tujuh tempat berkumpul pembeli.",
  reads:["user","segmen","jam"], writes:["meja"], rules:["BX:meja","MKT"],
  model:{profile:"deep", temp:0.25, maxTokens:700, reasoning:"low"},
  schema:{meja:"7 string maksimal 8 kata"},
  validate:arenaViolations
});

defAgent("positioning", {
  role:"copywriter positioning brand",
  persona:"Strategi branding Indonesia yang merangkai lima positioning pendek dan tajam.",
  reads:["gain","user","meja","jam"], writes:["positioning"], rules:["MKT","BX:positioning"],
  model:{profile:"deep", temp:0.25, maxTokens:900, reasoning:"medium"},
  schema:{positioning:"5 objek {teks,dasar}"},
  validate:positioningT7Violations
});

defAgent("tagline", {
  role:"perancang tagline brand",
  persona:"Copywriter branding Indonesia yang merangkai tagline pendek, mudah diucapkan, dan mengarahkan persepsi forum.",
  reads:["comp","positioning","gain","user","meja"],
  writes:["verbalDraft"],
  rules:["BX:tagline","MKT"],
  model:{profile:"creative", temp:0.85, maxTokens:600, reasoning:"low"},
  schema:{verbalDraft:{tagline:"5 objek {tagline,forum}"}},
  validate:taglineViolations
});

defAgent("nama", {
  role:"perancang nama brand",
  persona:"Copywriter branding Indonesia yang merangkai nama brand pendek dan mudah diingat.",
  reads:["comp","positioning","tagline","user"],
  writes:["verbalDraft"],
  rules:["BX:nama","MKT"],
  model:{profile:"creative", temp:0.85, maxTokens:500, reasoning:"none"},
  schema:{verbalDraft:{nama:"5 objek {nama,level,batin}"}},
  validate:namaViolations
});

defAgent("kunci", {
  role:"perancang kata kunci brand",
  persona:"Strategi branding Indonesia yang merangkum persepsi brand menjadi satu kata kunci dua kata.",
  reads:["positioning","tagline","nama","gain","user"],
  writes:["verbalDraft"],
  rules:["BX:kunci","MKT"],
  model:{profile:"creative", temp:0.85, maxTokens:500, reasoning:"none"},
  schema:{verbalDraft:{kunci:"5 objek {kunci}"}},
  validate:kunciViolations
});

defAgent("warna", {
  role:"perancang warna korporat",
  persona:"Desainer brand Indonesia yang memadukan dua warna korporat kontras dan terbaca.",
  reads:["user","segmen","positioning","nama"],
  writes:["visualDraft"],
  rules:["BX:warna","MKT"],
  model:{profile:"fast", temp:0.3, maxTokens:700, reasoning:"low"},
  schema:{visualDraft:{warna:"5 objek {c1,c2,filw}"}},
  validate:warnaViolations
});

defAgent("font", {
  role:"perancang font brand",
  persona:"Desainer brand Indonesia yang memilih font Google yang cocok dengan karakter brand dan user.",
  reads:["user","segmen","positioning","warna"],
  writes:["visualDraft"],
  rules:["BX:font","MKT"],
  model:{profile:"fast", temp:0.3, maxTokens:600, reasoning:"none"},
  schema:{visualDraft:{font:"5 objek {font,filf}"}},
  validate:fontViolations
});

exposeFn({
  AGENTS: {get:()=>AGENTS, set:v=>{AGENTS=v}},
  AGENT_CACHE: {get:()=>AGENT_CACHE, set:v=>{AGENT_CACHE=v}},
  defAgent: {get:()=>defAgent, set:v=>{defAgent=v}},
  resolveRuleText: {get:()=>resolveRuleText, set:v=>{resolveRuleText=v}},
  digestValue: {get:()=>digestValue, set:v=>{digestValue=v}},
  clipDigest: {get:()=>clipDigest, set:v=>{clipDigest=v}},
  digestBB: {get:()=>digestBB, set:v=>{digestBB=v}},
  hashStr: {get:()=>hashStr, set:v=>{hashStr=v}},
  agentCacheKey: {get:()=>agentCacheKey, set:v=>{agentCacheKey=v}},
  buildPrompt: {get:()=>buildPrompt, set:v=>{buildPrompt=v}},
  setBBPath: {get:()=>setBBPath, set:v=>{setBBPath=v}},
  pickModel: {get:()=>pickModel, set:v=>{pickModel=v}},
  runAgent: {get:()=>runAgent, set:v=>{runAgent=v}},
  positioningViolations: {get:()=>positioningViolations, set:v=>{positioningViolations=v}},
  T7_PERSONA: {get:()=>T7_PERSONA, set:v=>{T7_PERSONA=v}},
  inspectLogoImage: {get:()=>inspectLogoImage, set:v=>{inspectLogoImage=v}},
  t11Fixers: {get:()=>t11Fixers, set:v=>{t11Fixers=v}},
  t6Hex: {get:()=>t6Hex, set:v=>{t6Hex=v}},
  t6List5: {get:()=>t6List5, set:v=>{t6List5=v}},
  competitorFactsViolations: {get:()=>competitorFactsViolations, set:v=>{competitorFactsViolations=v}},
  voicePainViolations: {get:()=>voicePainViolations, set:v=>{voicePainViolations=v}},
  voiceGainViolations: {get:()=>voiceGainViolations, set:v=>{voiceGainViolations=v}},
  competitorCoreViolations: {get:()=>competitorCoreViolations, set:v=>{competitorCoreViolations=v}},
  competitorIdentViolations: {get:()=>competitorIdentViolations, set:v=>{competitorIdentViolations=v}},
  caAgent: {get:()=>caAgent, set:v=>{caAgent=v}},
  mkPainAgent: {get:()=>mkPainAgent, set:v=>{mkPainAgent=v}},
  mkGainAgent: {get:()=>mkGainAgent, set:v=>{mkGainAgent=v}},
  t7Words: {get:()=>t7Words, set:v=>{t7Words=v}},
  t7English: {get:()=>t7English, set:v=>{t7English=v}},
  segmentViolations: {get:()=>segmentViolations, set:v=>{segmentViolations=v}},
  personaUserViolations: {get:()=>personaUserViolations, set:v=>{personaUserViolations=v}},
  personaOptionsViolations: {get:()=>personaOptionsViolations, set:v=>{personaOptionsViolations=v}},
  arenaViolations: {get:()=>arenaViolations, set:v=>{arenaViolations=v}},
  positioningT7Violations: {get:()=>positioningT7Violations, set:v=>{positioningT7Violations=v}},
  segmentAgent: {get:()=>segmentAgent, set:v=>{segmentAgent=v}},
  t7UserOpt: {get:()=>t7UserOpt, set:v=>{t7UserOpt=v}},
  t7MergeUserOpts: {get:()=>t7MergeUserOpts, set:v=>{t7MergeUserOpts=v}},
  personaCtx: {get:()=>personaCtx, set:v=>{personaCtx=v}},
  personaInstr: {get:()=>personaInstr, set:v=>{personaInstr=v}},
  personaOptsInstr: {get:()=>personaOptsInstr, set:v=>{personaOptsInstr=v}},
  personaUser: {get:()=>personaUser, set:v=>{personaUser=v}},
  personaApply: {get:()=>personaApply, set:v=>{personaApply=v}},
  personaRec: {get:()=>personaRec, set:v=>{personaRec=v}},
  personaForRec: {get:()=>personaForRec, set:v=>{personaForRec=v}},
  personaOptsAgent: {get:()=>personaOptsAgent, set:v=>{personaOptsAgent=v}},
  regenUserAgent: {get:()=>regenUserAgent, set:v=>{regenUserAgent=v}},
  arenaAgent: {get:()=>arenaAgent, set:v=>{arenaAgent=v}},
  posInstr: {get:()=>posInstr, set:v=>{posInstr=v}},
  posRec: {get:()=>posRec, set:v=>{posRec=v}},
  autoPosAgent: {get:()=>autoPosAgent, set:v=>{autoPosAgent=v}},
  regenPosAgent: {get:()=>regenPosAgent, set:v=>{regenPosAgent=v}},
  t8Words: {get:()=>t8Words, set:v=>{t8Words=v}},
  t8English: {get:()=>t8English, set:v=>{t8English=v}},
  t8HashtagWords: {get:()=>t8HashtagWords, set:v=>{t8HashtagWords=v}},
  t8Compact: {get:()=>t8Compact, set:v=>{t8Compact=v}},
  taglineViolations: {get:()=>taglineViolations, set:v=>{taglineViolations=v}},
  namaViolations: {get:()=>namaViolations, set:v=>{namaViolations=v}},
  kunciViolations: {get:()=>kunciViolations, set:v=>{kunciViolations=v}},
  warnaViolations: {get:()=>warnaViolations, set:v=>{warnaViolations=v}},
  fontViolations: {get:()=>fontViolations, set:v=>{fontViolations=v}},
  verbalPart: {get:()=>verbalPart, set:v=>{verbalPart=v}},
  fieldInstr: {get:()=>fieldInstr, set:v=>{fieldInstr=v}},
  verbalAgent: {get:()=>verbalAgent, set:v=>{verbalAgent=v}},
  mkTagsAgent: {get:()=>mkTagsAgent, set:v=>{mkTagsAgent=v}},
  mkNamesAgent: {get:()=>mkNamesAgent, set:v=>{mkNamesAgent=v}},
  kunciOptsAgent: {get:()=>kunciOptsAgent, set:v=>{kunciOptsAgent=v}},
  verbalRec: {get:()=>verbalRec, set:v=>{verbalRec=v}},
  t8GenOpts: {get:()=>t8GenOpts, set:v=>{t8GenOpts=v}},
  t8UseRec: {get:()=>t8UseRec, set:v=>{t8UseRec=v}},
  webAgent: {get:()=>webAgent, set:v=>{webAgent=v}},
  visualPart: {get:()=>visualPart, set:v=>{visualPart=v}},
  visualAgent: {get:()=>visualAgent, set:v=>{visualAgent=v}},
  warnaOptsAgent: {get:()=>warnaOptsAgent, set:v=>{warnaOptsAgent=v}},
  fontOptsAgent: {get:()=>fontOptsAgent, set:v=>{fontOptsAgent=v}},
  visualRec: {get:()=>visualRec, set:v=>{visualRec=v}},
  t9HasEvil: {get:()=>t9HasEvil, set:v=>{t9HasEvil=v}},
  t9Draft: {get:()=>t9Draft, set:v=>{t9Draft=v}},
  t9Info: {get:()=>t9Info, set:v=>{t9Info=v}},
  logoSVGViolations: {get:()=>logoSVGViolations, set:v=>{logoSVGViolations=v}},
  logoInfoViolations: {get:()=>logoInfoViolations, set:v=>{logoInfoViolations=v}},
  t9Agents: {get:()=>t9Agents, set:v=>{t9Agents=v}},
  logoInstr: {get:()=>logoInstr, set:v=>{logoInstr=v}},
  mkMarkAgent: {get:()=>mkMarkAgent, set:v=>{mkMarkAgent=v}},
  t9SetMark: {get:()=>t9SetMark, set:v=>{t9SetMark=v}},
  t9OpenOnly: {get:()=>t9OpenOnly, set:v=>{t9OpenOnly=v}},
  t9VisionProvider: {get:()=>t9VisionProvider, set:v=>{t9VisionProvider=v}},
  t9VisionFail: {get:()=>t9VisionFail, set:v=>{t9VisionFail=v}},
  runVisionAgent: {get:()=>runVisionAgent, set:v=>{runVisionAgent=v}},
  inspectLogoAgent: {get:()=>inspectLogoAgent, set:v=>{inspectLogoAgent=v}},
  t11Words: {get:()=>t11Words, set:v=>{t11Words=v}},
  t11Val: {get:()=>t11Val, set:v=>{t11Val=v}},
  t11List: {get:()=>t11List, set:v=>{t11List=v}},
  t11Layer1: {get:()=>t11Layer1, set:v=>{t11Layer1=v}},
  t11Flags: {get:()=>t11Flags, set:v=>{t11Flags=v}},
  t11Drop: {get:()=>t11Drop, set:v=>{t11Drop=v}},
  t11Decorate: {get:()=>t11Decorate, set:v=>{t11Decorate=v}},
  t11QAValidate: {get:()=>t11QAValidate, set:v=>{t11QAValidate=v}},
  t11Avoid: {get:()=>t11Avoid, set:v=>{t11Avoid=v}},
  t11PickQA: {get:()=>t11PickQA, set:v=>{t11PickQA=v}},
  t11Check: {get:()=>t11Check, set:v=>{t11Check=v}},
  t11Fix: {get:()=>t11Fix, set:v=>{t11Fix=v}},
  t11Click: {get:()=>t11Click, set:v=>{t11Click=v}}
});

