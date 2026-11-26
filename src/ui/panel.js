/* === FILE: src/ui/panel.js === */
import { exposeFn } from '../core/state.js';

export var T10_BOX_AGENT = {
  kompetitor:["competitor","competitor-core","competitor-ident"], pain:["voice-pain"], gain:["voice-gain"],
  segmen:["segment"], user:["persona","persona-options"], meja:["arena"], positioning:["positioning"],
  tagline:["tagline"], nama:["nama"], warna:["warna"], font:["font"],
  logobg:[], kunci:["kunci"], web:[]
};

export var T10_APPROVE = {kompetitor:1, positioning:1, nama:1};

/* Pastikan wadah opsi selalu tersedia sebelum tombol kunci mereset pilihan lama. */
OK.forEach(function(k){
  if(!OPT[k] || typeof OPT[k] !== "object") OPT[k] = {l:[], busy:false};
  if(!Array.isArray(OPT[k].l)) OPT[k].l = [];
  OPT[k].busy = !!OPT[k].busy;
});

export var OWL = ["Jenis Produk","Kemasan","Harga","Distribusi","Lokasi Jual","Jam Buka","Metode Bayar","Target Teritori"];

export var BPL = ["Gender","Usia","Pekerjaan / Profil","Gaya Hidup / Kebiasaan","Ritual Harian","Masalah","Solusi","Dampak"];

export var BPK = ["gender","usia","pekerjaan","lifestyle","ritual","problem","solusi","dampak"];


export function openP(k){
  var i = BX.map(function(x){ return x.k; }).indexOf(k);
  if(i > first()){ toast("Selesaikan dulu kotak " + BX[first()].n + ": " + BX[first()].t); return; }
  if(i === first() && !started[k]){ toast("Pilih dulu: Gunakan Rekomendasi atau Prompt Sendiri."); return; }
  cur = k;
  var b = BX[i];
  document.querySelectorAll(".bx").forEach(function(x){ x.classList.toggle("sel", x.dataset.k === k); });
  $("pt").textContent = b.n + ". " + b.t;
  $("prl").textContent = b.r + (k === "kompetitor" ? " Wajib: analisa DNA kompetitor lewat tombol 🔍 di kotak ini." : "");
  $("pp").value = "";
  $("pm").textContent = (k === "segmen" && window.segLast) ? window.segLast : "";
  $("pn").style.display = "block";
  $("own").hidden = (k !== "positioning");
  $("bp").hidden = (k !== "user");
  $("pok").textContent = conf[k] ? "↩ Batalkan Final" : "✔ Konfirmasi Final";
  showF();
}

export async function ai(keys, instr, imKeys, msgEl){
  var s = await getAI();
  var lim = await s.limits().catch(function(){ return {}; });
  var im = [];
  if(lim.images){
    imKeys.forEach(function(k){
      (files[k] || []).forEach(function(f){ if(f.type.indexOf("image/") === 0) im.push(f); });
    });
  }
  var boxes = BX.filter(function(b){ return keys.indexOf(b.k) > -1; });
  var spec = boxes.map(function(b){
    return "## " + b.n + ". " + b.t + " — aturan: " + b.r + "\n" +
      b.f.map(function(f){
        var c = fld(f[0]).textContent.trim();
        return '  "' + f[0] + '": ' + f[1] + (c ? ' (isi sekarang: ' + c + ')' : '');
      }).join("\n");
  }).join("\n");
  var compFacts = (comp && comp.dna && comp.dna.fakta_bisnis) ? (" (" + comp.dna.fakta_bisnis + ")") : "";
  var compSeg = (comp && comp.dna && comp.dna.segmen) ? seg(comp.dna.segmen) : "";
  var p = "Kamu konsultan branding DAN strategi bisnis senior di Indonesia (positioning, pricing, distribusi, perilaku konsumen). Isi DNA Bisnis Board brand pengguna mengikuti aturan tiap poin dalam BAHASA INDONESIA yang jelas dan membumi.\n\nCERITA BISNIS PENGGUNA:\n" +
    $("brief").value + (comp && comp.dna ? "\nANALISA DNA KOMPETITOR YANG DICONGLKEL (" + comp.name + compFacts + ", SEGMEN: " + compSeg + "): " + JSON.stringify({positioning:comp.dna.positioning, segmen:compSeg, user:comp.dna.usertitle, pain:comp.dna.pain, gain:comp.dna.gain}) + "\n" : "") + ctx() + "\n\n" +
    (instr ? "INSTRUKSI PENGGUNA:\n" + instr + "\n\n" : "") + "POIN YANG DIISI:\n" + spec +
    "\n\nJawab HANYA JSON datar dengan key persis di atas, nilai string. WAJIB 100% Bahasa Indonesia, singkat, spesifik." +
    (keys.indexOf("meja") > -1 ? " " + MJ() : "") +
    (keys.indexOf("positioning") > -1 ? " " + POS() : "") +
    ((keys.indexOf("pain") > -1 || keys.indexOf("gain") > -1) && comp ? " " + PG() : "") +
    (keys.indexOf("segmen") > -1 ? ' ATURAN WAJIB SEGMEN APPLE-TO-APPLE: Kompetitor "' + (comp ? comp.name : "") + '" berada di SEGMEN ' + (compSeg || "BAWAH") + '. Brand pengguna WAJIB berada di SEGMEN YANG SAMA (' + (compSeg || "BAWAH") + ') agar apple-to-apple di benak pelanggan (hanya beda Positioning dan User Spesifik). ' + RUB + ' Beri skor tiap indikator yang konsisten dengan segmen ' + (compSeg || "BAWAH") + ' (' + (compSeg === "BAWAH" ? "rata-rata skor di bawah 3,0" : "rata-rata skor minimal 3,0") + '). Tambahkan key segmen_skor (objek berisi harga, higienitas, kemasan, iklan, tempat, angle, dayabeli; masing-masing {"skor":1-5,"alasan":"fakta singkat Bahasa Indonesia"}); segmen_skor berupa objek, bukan string.' : '') +
    (im.length ? "\nGambar terlampir adalah inspirasi dari pengguna." : "");
  var r = await sjImg(s, p, {images: im.slice(0, 6), cache: false});
  var ss = keys.indexOf("segmen") > -1 ? segScore(r.segmen_skor, compSeg) : null;
  if(ss){
    r.segmen = ss.seg;
    window.segLast = segTxt(ss);
    window.segInfo = ss;
  } else if(keys.indexOf("segmen") > -1 && compSeg){
    r.segmen = compSeg;
  }
  boxes.forEach(function(b){
    b.f.forEach(function(f){
      if(r[f[0]] != null) fld(f[0]).textContent = f[0] === "segmen" ? (compSeg || seg(r[f[0]])) : String(r[f[0]]);
    });
  });
  sync();
  var pdf = imKeys.some(function(k){
    return (files[k] || []).some(function(f){ return f.type === "application/pdf"; });
  });
  msgEl.textContent = "Selesai." + (ss ? "\n" + segTxt(ss) : "") + (pdf ? " PDF disimpan sebagai referensi; hanya gambar yang dianalisis." : "");
}

export function er(el, x){
  el.textContent = x && x.code === "not_granted" ? "Izin AI ditolak." :
    x && x.code === "rate_limited" ? "Terlalu sering, coba sebentar lagi." :
    "Gagal: " + (x && x.message || x);
}

export async function mkGain(){
  /* === T6 HOOK: gain === */ return mkGainAgent();
}

export function PG(){
  var n = comp.name;
  var fb = (comp && comp.dna && comp.dna.fakta_bisnis) ? " (" + comp.dna.fakta_bisnis + ")" : "";
  return 'PENTING: Pain dan Gain pada papan ini milik KONSUMEN KOMPETITOR "' + n + '"' + fb + ', bukan konsumen brand pengguna. Pain = rasa khawatir, takut, kecewa konsumen ' + n + ' ditinjau dari: (1) produk, (2) layanan/antrean/outlet, (3) kegiatan sosial/CSR perusahaan, (4) persepsi yang dibentuk brand terhadap konsumennya. Gain = kalimat mirror/lawan dari pain, berisi harapan konsumen ' + n + ' yang belum terpenuhi sekaligus inspirasi value brand pengguna. WAJIB 100% Bahasa Indonesia.';
}

export async function mkPain(){
  /* === T6 HOOK: pain === */ return mkPainAgent();
}

export function ctx(){
  var L = function(p){ return [1,2,3,4,5].map(function(i){ return fld(p+i).textContent.trim(); }).filter(Boolean).join("; "); };
  var n = comp ? comp.name : "kompetitor", pa = L("pain"), ga = L("gain");
  var fb = (comp && comp.dna && comp.dna.fakta_bisnis) ? " (" + comp.dna.fakta_bisnis + ")" : "";
  var us = ["usertitle","usia","usersub"].map(function(x){ return fld(x).textContent.trim(); }).filter(Boolean).join(" | ");
  var sg = fld("segmen").textContent.trim() || (comp && comp.dna ? seg(comp.dna.segmen) : "");
  var mj = [1,2,3,4,5,6,7].map(function(i){ return fld("meja"+i).textContent.trim(); }).filter(Boolean).join("; ");
  return (sg ? " SEGMEN WAJIB (SAMA DENGAN KOMPETITOR): " + sg + "." : "") +
    (us ? " USER SPESIFIK (profil pembeli): " + us + "." : "") +
    (mj ? " MEJA PERDEBATAN: " + mj + "." : "") +
    (jamVal ? " Jam berjualan: " + jamVal + "." : "") +
    (pa ? " PAIN konsumen " + n + fb + ": " + pa + "." : "") +
    (ga ? " GAIN: " + ga + "." : "") +
    ($("brief").value.trim() ? "" : " Pengguna belum mengisi cerita bisnis: simpulkan dari analisa kompetitor, Pain, dan Gain.") + " ";
}

export function OW(){
  return OWL.map(function(l, i){
    var el = $("ow"+(i+1)), v = el ? el.value.trim() : "";
    return v ? l + ": " + v : "";
  }).filter(Boolean).join("; ");
}

export function OWT(){
  var o = OW();
  return o ? ' RENCANA & BAYANGAN OWNER: ' + o + '. Poin-poin ini WAJIB memengaruhi hasil.' : '';
}

export function JAMV(){ var o = $("ow6"); return jamVal || (o && o.value.trim()) || ""; }

export function LST(p, n){
  var r = [];
  for(var i=1; i<=n; i++){
    var el = fld(p+i), v = el ? el.textContent.trim() : "";
    if(v) r.push(v);
  }
  return r.join("; ");
}

export function POSX(){
  var us = [fld("usertitle"), fld("usia"), fld("usersub")].map(function(el){ return el.textContent.trim(); }).filter(Boolean).join(" | ");
  var jam = JAMV();
  return ' LANDASAN POSITIONING: (1) KEUNGGULAN WAKTU dari jam berjualan (' + (jam || "belum diisi") + '); (2) KEUNGGULAN MANFAAT dari Gain terbaik (' + LST("gain", 5) + ') + Kebiasaan User (' + us + '); (3) FORMAT/KEMASAN dari ritual User; (4) JENIS PRODUK; (5) TERITORI; (6) SEGMEN ' + fld("segmen").textContent.trim() + '. Forum pembeli: ' + LST("meja", 7) + '.';
}

export function POS(){
  var n = comp ? comp.name : "kompetitor";
  return 'ATURAN POSITIONING untuk mencongkel ' + n + '. ' + MKT + POSX() + OWT() + ' Jika teritori tidak disebut, gunakan "di Indonesia".';
}

export function MJ(){
  return 'ATURAN MEJA PERDEBATAN: tujuh tempat atau kondisi nyata tempat user spesifik berkumpul dan memperdebatkan "beli ... di mana?" pada jam berjualan (' + (JAMV() || "belum diisi") + '). Selaras dengan Segmen, User Spesifik, Pain, dan Gain. Singkat, maksimal 8 kata per meja, WAJIB 100% Bahasa Indonesia.';
}

export async function mkPos(instr){
  /* === T7 HOOK: mkPos === */ return posRec(instr);
}

export function renderPos(){
  var n = posOpts.length;
  $("pcnt").textContent = n;
  $("plist").innerHTML = posOpts.map(function(o, i){
    return '<button class="po" data-i="'+i+'">' + esc(o.t) + (o.d ? '<br><span style="font-size:12px;opacity:.7">' + esc(o.d) + '</span>' : '') + '</button>';
  }).join("");
  var d = $("posd");
  if(d){ d.textContent = posDasar ? "Dasar: " + posDasar : ""; d.hidden = !posDasar; }
}

export function choosePos(i){
  var c = fld("positioning").textContent.trim(), o = posOpts[i];
  if(!o) return;
  if(c) posOpts[i] = {t:c, d:posDasar};
  else posOpts.splice(i, 1);
  fld("positioning").textContent = o.t;
  posDasar = o.d || "";
  sync();
  renderPos();
  $("plist").hidden = true;
}

export function lockPos(){
  if(!fld("positioning").textContent.trim()){ toast("Positioning masih kosong."); return; }
  conf.positioning = true;
  applyLock();
  toast("Positioning terkunci." + nextHint("positioning"));
  autoAdv("positioning");
}

export async function autoPos(){
  /* === T7 HOOK: autoPos === */ return autoPosAgent();
}

export async function regenPos(){
  /* === T7 HOOK: regenPos === */ return regenPosAgent();
}

export function BP(){
  return BPL.map(function(l, i){
    var el = $("bp"+(i+1)), v = el ? el.value.trim() : "";
    return v ? l + ": " + v : "";
  }).filter(Boolean).join("; ");
}

export async function mkUser(instr){
  /* === T7 HOOK: mkUser === */ return personaForRec(instr);
}

export function applyUser(r){
  var P = r.persona || {};
  BPK.forEach(function(k, i){
    var el = $("bp"+(i+1));
    if(el && !el.value.trim() && P[k]) el.value = String(P[k]);
  });
  fld("usertitle").textContent = withGender(r.usertitle, P.gender);
  fld("usia").textContent = String(r.usia || "").toUpperCase();
  fld("usersub").textContent = String(r.usersub || "");
  if(r.analisa_jam) jamAna = String(r.analisa_jam);
  sync();
}

export async function regenUser(){
  /* === T7 HOOK: regenUser === */ return regenUserAgent();
}

export function renderUser(){
  var b = document.querySelector(".udd"), L = $("ulist");
  if(!b) return;
  b.textContent = uBusy ? "Menyusun 5 rekomendasi…" : (userOpts.length ? "▾ Pilihan lain (" + userOpts.length + ")" : "✨ 5 Rekomendasi");
  b.disabled = uBusy;
  L.innerHTML = userOpts.map(function(o, i){
    return '<button class="uo" data-i="'+i+'"><b>' + esc(o.t) + '</b> · ' + esc(o.u) + '<br>' + esc(o.s) + '</button>';
  }).join("");
}

export function chooseUser(i){
  var o = userOpts[i];
  if(!o) return;
  var c = {t:fld("usertitle").textContent.trim(), u:fld("usia").textContent.trim(), s:fld("usersub").textContent.trim()};
  if(c.t || c.u || c.s) userOpts[i] = c;
  else userOpts.splice(i, 1);
  var gb = $("bp1");
  fld("usertitle").textContent = withGender(o.t, gb ? gb.value : "");
  fld("usia").textContent = o.u;
  fld("usersub").textContent = o.s;
  sync();
  renderUser();
  $("ulist").hidden = true;
}

export async function genUserOpts(keep){
  /* === T7 HOOK: genUserOpts === */ return personaOptsAgent(keep);
}

export function BXof(k){ return BX.filter(function(x){ return x.k === k; })[0]; }

export function curVals(k){
  var o = {};
  BXof(k).f.forEach(function(f){ o[f[0]] = fld(f[0]).textContent.trim(); });
  return o;
}

export function normOpt(b, x){
  var o = {};
  var ok = b.f.every(function(f){
    var v = String(x && x[f[0]] || "").trim();
    if(!v) return false;
    if(/^(c1|c2|bg1|bg2|bg3)$/.test(f[0]) && !/^#[0-9a-f]{6}$/i.test(v)) return false;
    if(f[0] === "kunci" && v.split(/\s+/).length > 2) return false;
    if(f[0] === "web") v = v.toLowerCase();
    o[f[0]] = v;
    return true;
  });
  return ok ? o : null;
}

export function labelOpt(k, o){
  var sw = function(c){ return '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;background:'+c+';box-shadow:0 0 0 1px #ccc"></span> '; };
  var nt = function(t){ return t ? '<br><span style="font-size:12px;opacity:.7">' + esc(t) + '</span>' : ""; };
  if(k === "warna") return sw(o.c1) + esc(o.c1) + " · " + sw(o.c2) + esc(o.c2) + nt(o.filw);
  if(k === "font") return esc(o.font) + nt(o.filf);
  if(k === "logobg") return sw(o.bg1) + esc(o.bg1) + " · " + sw(o.bg2) + esc(o.bg2) + " · " + sw(o.bg3) + esc(o.bg3);
  return esc(o[BXof(k).f[0][0]]) + (o.alasan ? '<br><span style="font-size:12px;opacity:.7">' + esc(o.alasan.length > 110 ? o.alasan.slice(0, 110) + "…" : o.alasan) + '</span>' : "");
}

export function renderOpts(k){
  var S = OPT[k], w = document.querySelector('.owrap[data-k="'+k+'"]');
  if(!w) return;
  var b = w.querySelector(".odd"), L = w.querySelector(".olist");
  b.textContent = S.busy ? "Menyusun 5 opsi…" : (S.l.length ? "▾ Pilihan lain (" + S.l.length + ")" : "✨ 5 Opsi");
  b.disabled = S.busy;
  L.innerHTML = S.l.map(function(o, i){
    return '<button class="oo" data-k="'+k+'" data-i="'+i+'">' + labelOpt(k, o) + '</button>';
  }).join("");
}

export function chooseOpt(k, i){
  var S = OPT[k], o = S.l[i];
  if(!o) return;
  var c = curVals(k);
  if(k === "tagline"){ c.alasan = tagSim; tagSim = o.alasan || ""; }
  if(Object.keys(c).every(function(x){ return x === "alasan" || c[x]; })) S.l[i] = c;
  else S.l.splice(i, 1);
  Object.keys(o).forEach(function(x){ t8FillField(x, o[x]); });
  sync();
  renderOpts(k);
  var L = document.querySelector('.owrap[data-k="'+k+'"] .olist');
  if(L) L.hidden = true;
}

export function KN(){
  return ["positioning","nama","tagline","kunci","font","c1","c2"].map(function(x){
    var el = fld(x), v = el ? el.textContent.trim() : "";
    return v ? x + "=" + v : "";
  }).filter(Boolean).join("; ");
}

export async function genOpts(k, keep){
  /* === T8 HOOK: genOpts === */ if(await t8GenOpts(k, keep)) return;
  var S = OPT[k];
  if(S.busy) return;
  S.busy = true;
  renderOpts(k);
  if(k === "logobg"){
    var cb = JSON.stringify(curVals("logobg"));
    S.l = localBg().filter(function(x){ return JSON.stringify(x) !== cb; }).slice(0, 5);
    S.busy = false;
    renderOpts(k);
    return;
  }
  if(k === "web"){
    S.l = webOpts();
    if(!S.l.length) toast("Belum ada opsi kata kunci lain. Buka kotak Kata Kunci lalu tekan ✨ 5 Opsi.");
    S.busy = false;
    renderOpts(k);
    return;
  }
  if(k === "tagline"){
    try {
      var ta = await mkTags(""), ct = fld("tagline").textContent.trim(), st = {};
      st[ct.toLowerCase()] = 1;
      S.l = (keep || []).concat(ta).filter(function(x){
        var q = x.tagline.toLowerCase();
        if(st[q]) return false;
        st[q] = 1;
        return true;
      }).slice(0, 6);
    } catch(x){
      toast("Gagal menyusun tagline: " + (x && x.message || x));
    }
    S.busy = false;
    renderOpts(k);
    return;
  }
  if(k === "nama"){
    try {
      var na = await mkNames(""), cn = fld("nama").textContent.trim(), sn = {};
      sn[cn.toLowerCase()] = 1;
      S.l = (keep || []).concat(na).filter(function(x){
        var q = x.nama.toLowerCase();
        if(sn[q]) return false;
        sn[q] = 1;
        return true;
      }).slice(0, 6);
    } catch(x){
      toast("Gagal menyusun nama: " + (x && x.message || x));
    }
    S.busy = false;
    renderOpts(k);
    return;
  }
  try {
    var b = BXof(k), n = comp ? comp.name : "kompetitor", s = await getAI();
    var lim = await s.limits().catch(function(){ return {}; });
    var o = {cache:false};
    if(lim.modelTiers && lim.modelTiers.indexOf("complex") > -1) o.modelTier = "complex";
    var cur = curVals(k), spec = b.f.map(function(f){ return '"' + f[0] + '": ' + f[1]; }).join("; ");
    var r = await s.json('Kamu konsultan branding DAN strategi bisnis senior di Indonesia. Beri 5 opsi untuk kotak "' + b.t + '" pada DNA Bisnis Board brand pengguna yang akan mencongkel kompetitor "' + n + '". Aturan kotak: ' + b.r + ' Setiap opsi berupa objek JSON dengan key: ' + spec + '.' + ctx() + ' Isi board: ' + KN() + '. Cerita bisnis: ' + $("brief").value + '. Hindari: ' + JSON.stringify(cur) + '. WAJIB 100% Bahasa Indonesia. Jawab HANYA JSON array berisi 5 objek.', o);
    var a = Array.isArray(r) ? r : (r && Array.isArray(r.opsi) ? r.opsi : []), seen = {};
    seen[JSON.stringify(cur)] = 1;
    S.l = (keep || []).concat(a.map(function(x){ return normOpt(b, x); })).filter(function(x){
      if(!x) return false;
      var q = JSON.stringify(x);
      if(seen[q]) return false;
      seen[q] = 1;
      return true;
    }).slice(0, 6);
  } catch(x){
    toast("Gagal menyusun opsi: " + (x && x.message || x));
  }
  S.busy = false;
  renderOpts(k);
}

export async function mkNames(instr, force){
  /* === T8 HOOK: mkNames === */ if(BB.flags && BB.flags.t8) return mkNamesAgent(instr, force);
  var n = comp ? comp.name : "kompetitor", s = await getAI();
  var lim = await s.limits().catch(function(){ return {}; });
  var o = {cache:false};
  if(lim.modelTiers && lim.modelTiers.indexOf("complex") > -1) o.modelTier = "complex";
  var r = await s.json('Kamu konsultan branding senior dan naming specialist di Indonesia. Susun 5 NAMA BRAND untuk brand pengguna yang akan mencongkel "' + n + '". LEVEL 1: kata/frasa pendek yang terucap di batin user saat momen butuh (mis. BeliKopi, Haus). LEVEL 2: jenis produk + vokal keren atau imbuhan ku/mu/kita/in/aja (mis. Jussy, JusKu, Jus.in).' + ctx() + ' Isi board: ' + KN() + '. Rencana owner: ' + OW() + '. Cerita bisnis: ' + $("brief").value + '. Maksimal 2 kata, tidak menyebut kompetitor.' + (instr ? ' Instruksi tambahan: ' + instr + '.' : '') + ' Jawab HANYA JSON array berisi 5 objek {"nama":"","level":1,"batin":"kalimat batin user Bahasa Indonesia"}.', o);
  var a = Array.isArray(r) ? r : (r && Array.isArray(r.nama) ? r.nama : []);
  a = a.map(function(x){
    var nm = String(x && x.nama || "").trim();
    return nm ? {nama: nm, alasan: "Level " + (String(x.level) === "2" ? "2" : "1") + " · " + String(x.batin || "").trim()} : null;
  }).filter(Boolean);
  if(!a.length) throw new Error("Nama brand kosong, coba lagi.");
  return a;
}

export function setNames(a){
  var c = fld("nama").textContent.trim(), best = a[0].nama, seen = {};
  seen[best.toLowerCase()] = 1;
  OPT.nama.l = (c ? [{nama:c}] : []).concat(a.slice(1), OPT.nama.l).filter(function(x){
    var q = x.nama.toLowerCase();
    if(seen[q]) return false;
    seen[q] = 1;
    return true;
  }).slice(0, 6);
  fld("nama").textContent = best;
  /* === T8 HOOK: setNames === */ if(BB.flags && BB.flags.t8) t8FillField("nama", best);
  sync();
  renderOpts("nama");
}

export async function regenNames(){
  setNames(await mkNames($("pp").value.trim(), true));
  $("pp").value = "";
  files.nama = [];
  $("pn").style.display = "none";
  document.querySelectorAll(".bx").forEach(function(x){ x.classList.remove("sel"); });
  var el = document.querySelector('.bx[data-k="nama"]');
  if(el) el.scrollIntoView({behavior:"smooth", block:"center"});
  toast("Nama brand baru terpasang. Nama sebelumnya tersimpan di dropdown.");
}

export function idx(k){ return BX.map(function(x){ return x.k; }).indexOf(k); }

export function isAdj(a, b){
  var A = document.querySelector('.bx[data-k="'+a+'"]'), B = document.querySelector('.bx[data-k="'+b+'"]');
  if(!A || !B) return false;
  var r = A.getBoundingClientRect(), q = B.getBoundingClientRect();
  return q.top >= r.top - 5 && q.top - r.bottom <= 60;
}

export function nextHint(k){
  var i = idx(k);
  if(i < 0 || i >= BX.length - 1) return "";
  return isAdj(k, BX[i+1].k) ? " Lanjut otomatis ke kotak berikutnya." : " Tekan Lanjut untuk ke kotak berikutnya.";
}

export function autoAdv(k){
  var i = idx(k);
  if(i < 0 || i >= BX.length - 1) return;
  if(isAdj(k, BX[i+1].k)) setTimeout(function(){ if(first() === i + 1) goNext(); }, 900);
}

export function webFrom(k){ return "www." + String(k || "").toLowerCase().replace(/[^a-z0-9]/g, "") + ".id"; }

export function webOpts(){
  var cur = fld("web").textContent.trim().toLowerCase(), seen = {};
  seen[cur] = 1;
  return OPT.kunci.l.map(function(o){ return {web: webFrom(o.kunci)}; }).filter(function(x){
    if(seen[x.web]) return false;
    seen[x.web] = 1;
    return true;
  }).slice(0, 5);
}

export function hashify(t){
  t = String(t || "").trim();
  if(!t) return "";
  /* AI kadang mengembalikan "#Jus Gula!" walaupun diminta camelCase.
     Normalisasi tetap dilakukan meski sudah diawali # agar hasil akhir
     selalu satu token hashtag tanpa spasi. */
  t = t.replace(/^#+/, "").replace(/!+$/, "");
  return "#" + t.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).map(function(w){
    return w[0].toUpperCase() + w.slice(1);
  }).join("") + "!";
}

export async function mkTags(instr, force){
  /* === T8 HOOK: mkTags === */ if(BB.flags && BB.flags.t8) return mkTagsAgent(instr, force);
  var n = comp ? comp.name : "kompetitor", s = await getAI();
  var lim = await s.limits().catch(function(){ return {}; });
  var o = {cache:false};
  if(lim.modelTiers && lim.modelTiers.indexOf("complex") > -1) o.modelTier = "complex";
  var r = await s.json('Kamu konsultan branding senior dan ahli copywriting tagline di Indonesia. Susun 5 TAGLINE untuk brand pengguna yang akan mencongkel "' + n + '". RUMUS TAGLINE: kalimat simpel, MAKSIMAL 4 KATA dalam Bahasa Indonesia, mudah diucapkan customer introvert saat ditanya "kenapa beli brand itu?" di meja perdebatan sehingga mengubah forum (KK > NC > RO > RC).' + ctx() + ' Isi board: ' + KN() + '. Format: hashtag camelCase diawali # dan diakhiri ! (mis. #JusGulaTropicana!). Tidak menyebut kompetitor.' + (instr ? ' Instruksi tambahan: ' + instr + '.' : '') + ' Beri key forum: simulasi 3-4 baris percakapan singkat dalam Bahasa Indonesia dipisah " / ". Jawab HANYA JSON array berisi 5 objek {"tagline":"","forum":""}.', o);
  var a = Array.isArray(r) ? r : (r && Array.isArray(r.tagline) ? r.tagline : []);
  a = a.map(function(x){
    var t = hashify(x && x.tagline);
    return t ? {tagline: t, alasan: "Forum: " + String(x.forum || "").trim()} : null;
  }).filter(Boolean);
  if(!a.length) throw new Error("Tagline kosong, coba lagi.");
  return a;
}

export function setTags(a){
  a = (a || []).map(function(x){
    return x ? {tagline: hashify(x.tagline), alasan: x.alasan || ""} : null;
  }).filter(function(x){ return x && x.tagline; });
  var c = hashify(fld("tagline").textContent.trim()), best = a[0], seen = {};
  if(!best) return;
  seen[best.tagline.toLowerCase()] = 1;
  OPT.tagline.l = (c ? [{tagline:c, alasan:tagSim}] : []).concat(a.slice(1), OPT.tagline.l).filter(function(x){
    var q = x.tagline.toLowerCase();
    if(seen[q]) return false;
    seen[q] = 1;
    return true;
  }).slice(0, 6);
  fld("tagline").textContent = best.tagline;
  tagSim = best.alasan;
  /* === T8 HOOK: setTags === */ if(BB.flags && BB.flags.t8) t8FillField("tagline", best.tagline);
  sync();
  renderOpts("tagline");
}

export async function regenTags(){
  setTags(await mkTags($("pp").value.trim(), true));
  $("pp").value = "";
  files.tagline = [];
  $("pn").style.display = "none";
  document.querySelectorAll(".bx").forEach(function(x){ x.classList.remove("sel"); });
  var el = document.querySelector('.bx[data-k="tagline"]');
  if(el) el.scrollIntoView({behavior:"smooth", block:"center"});
  toast("Tagline baru terpasang. Tagline sebelumnya tersimpan di dropdown.");
}

export function getAI(){
  if(sP) return Promise.resolve(sP);
  var engine = async function(p, o){ return await aiCall(p, o, false); };
  engine.json = async function(p, o){
    try {
      return await aiCall(p, o, true);
    } catch(e){
      if(o && o.images && o.images.length && /vision_unavailable/i.test(String(e && e.message || e))){
        return await aiCall(p, Object.assign({}, o, {images:[]}), true);
      }
      throw e;
    }
  };
  engine.limits = async function(){ return {images:true, modelTiers:["complex"]}; };
  sP = engine;
  return Promise.resolve(sP);
}

export async function sjImg(s, p, o, rt){
  try {
    return await s.json(p, o);
  } catch(e){
    if(e && e.code === "invalid_json" && !rt) return await sjImg(s, p + " Jawab sangat ringkas dan pastikan JSON lengkap.", o, 1);
    throw e;
  }
}

export function useOwn(k){
  started[k] = true;
  applyLock();
  openP(k);
}

export async function useRec(k, retry){
  var b = BX.filter(function(x){ return x.k === k; })[0];
  var el = document.querySelector('.bx[data-k="'+k+'"]');
  var btns = el.querySelectorAll(".choice button");
  btns.forEach(function(x){ x.disabled = true; });
  toast("Menyusun rekomendasi " + b.t + "…");
  try {
    /* === T8 HOOK: useRec === */ var t8done = await t8UseRec(k);
    /* === T8 HOOK: useRec === */ if(!t8done)
    if(k === "pain"){
      var a = await mkPain();
      for(var i=1; i<=5; i++) fld("pain"+i).textContent = a[i-1] || "";
    } else if(k === "gain"){
      var g = await mkGain();
      for(var j=1; j<=5; j++) fld("gain"+j).textContent = g[j-1] || "";
    } else if(k === "logobg"){
      var LB = localBg();
      Object.keys(LB[0]).forEach(function(x){ t8FillField(x, LB[0][x]); });
      OPT.logobg.l = LB.slice(1);
      renderOpts("logobg");
    } else if(k === "web"){
      fld("web").textContent = webFrom(fld("kunci").textContent);
      OPT.web.l = webOpts();
      renderOpts("web");
    } else if(k === "tagline"){
      setTags(await mkTags(""));
    } else if(k === "nama"){
      setNames(await mkNames(""));
    } else if(k === "user"){
      applyUser(await mkUser(""));
      await genUserOpts([]);
    } else if(k === "positioning"){
      /* === T7 HOOK: positioning === */ var mkPos = posRec;
      var rp0 = await mkPos("");
      fld("positioning").textContent = rp0[0].t;
      posDasar = rp0[0].d;
      posOpts = rp0.slice(1);
      renderPos();
    } else {
      /* === T7 HOOK: ai === */ if(k === "segmen"){ await segmentAgent(); } else if(k === "meja"){ await arenaAgent(); } else
      await ai([k], "", ["brief"], {});
    }
    sync();
    started[k] = true;
    if(OK.indexOf(k) > -1 && ["nama","tagline","logobg","web"].indexOf(k) < 0) genOpts(k, OPT[k].l.slice());
    if(boxMiss(b)){
      applyLock();
      openP(k);
      $("pm").textContent = "Rekomendasi belum lengkap atau formatnya belum sesuai. Lengkapi lalu Konfirmasi Final.";
    } else {
      conf[k] = true;
      applyLock();
      if(k === "web"){
        onAll12Done();
      } else {
        toast("✓ " + b.t + " terkunci." + nextHint(k));
        autoAdv(k);
      }
    }
  } catch(x){
    /* ponytail: satu retry gratis untuk kegagalan validator/model; kuota & kunci tidak diulang. */
    var msg = String((x && x.message) || x || "");
    if(isAbort(x)){ toast(msg || "Dibatalkan."); }
    else if(!retry && !/kuota|quota|rate.?limit|HTTP\s+429|API Key/i.test(msg)){
      btns.forEach(function(x){ x.disabled = false; });
      return useRec(k, true);
    }
    toast("Gagal: " + (x && x.message || x));
  }
  btns.forEach(function(x){ x.disabled = false; });
  if(typeof t10SyncBox === "function") t10SyncBox(k);
}

export function t10Status(s, reason){
  BB.dir.status = String(s || "IDLE");
  BB.dir.reason = reason ? String(reason) : "";
  t10Render();
}

export function t10SyncBox(k){
  if(BB.dir && ["RUNNING","READY","QA","RETRY","FALLBACK"].indexOf(BB.dir.status) >= 0){
    BB.dir.current = String(k == null ? "" : k);
  }
  t10Render();
}

export function t10Flag(k){
  if(BB.flags && BB.flags[k]) return BB.flags[k];
  return conf[k] ? "final" : (started[k] ? "draft" : "—");
}

export function t10Notes(k){
  var out = [];
  (T10_BOX_AGENT[k] || []).forEach(function(id){
    var n = BB.notes && BB.notes[id];
    if(!n) return;
    out.push(t10Esc(id) + ": model " + t10Esc(n.model || "—") + ", alasan " +
      t10Esc(n.alasan || "—") + ", percobaan " + t10Esc(n.percobaan == null ? 0 : n.percobaan));
  });
  return out.join(" · ") || "kode";
}

export function t10PanelHTML(){
  var d = BB.dir;
  var rows = BX.map(function(b){
    return '<div class="t10row" data-t10-box="' + t10Esc(b.k) + '"><b>' +
      t10Esc(b.n) + ". " + t10Esc(b.t) + '</b> <span class="t10flag">' +
      t10Esc(t10Flag(b.k)) + '</span><div class="t10note">' + t10Notes(b.k) + '</div></div>';
  }).join("");
  var ni = document.getElementById("t10NameInput"), keepName = ni && ni.value ? String(ni.value) : "";
  var nameOn = d.status === 'AWAIT_USER' && d.current === 'kompetitor' && !conf.kompetitor;
  var approveOn = ["AWAIT_USER","RETRY","FALLBACK"].indexOf(d.status) >= 0 && !nameOn;
  var approveLabel = (d.status === 'AWAIT_USER' && !!T10_APPROVE[d.current]) ? 'Setujui & Lanjut' : 'Lanjut';
  var editOn = approveOn || d.status === 'RETRY' || d.status === 'FALLBACK';
  return '<div class="t10head">Rapat Tim · Auto-pilot</div>' +
    '<div class="t10chip">' + t10Esc(d.status) + ': ' + t10Esc(d.reason || d.current || "siap") + '</div>' +
    '<div class="t10ctl" data-html2canvas-ignore>' +
    '<button class="t10Start">Mulai Auto-pilot</button> ' +
    '<button class="t10Cancel">Batal</button> ' +
    '<button class="t10Approve"' + (approveOn ? '' : ' hidden') + '>' + approveLabel + '</button> ' +
    '<button class="t10Edit"' + (editOn ? '' : ' hidden') + '>Edit</button> ' +
    '<button class="t10Name"' + (nameOn ? '' : ' hidden') + '>Kirim Nama Kompetitor</button> ' +
    '<input id="t10NameInput" aria-label="Nama kompetitor" data-html2canvas-ignore placeholder="Nama kompetitor" value="' + t10Esc(keepName) + '">' +
    '</div><div class="t10rows">' + rows + '</div>';
}

export function t10Render(){
  var p = document.getElementById("t10Panel"), open = BB.t10PanelOpen === true;
  if(p){ p.innerHTML = t10PanelHTML(); p.hidden = !open; }
  var t = document.getElementById("t10Toggle");
  if(t){ t.setAttribute("aria-expanded", open ? "true" : "false"); t.textContent = open ? "Tutup Panel Tim" : "Panel Tim"; }
}

export function t10Busy(){
  return ["RUNNING","AWAIT_USER","RETRY","FALLBACK","QA"].indexOf(BB.dir.status) >= 0;
}

export function t10Stale(gen, fail){
  if(BB.dir.gen !== gen) return true;
  if(BB.dir.cancel){ if(fail) t10Status("FAILED", "Dibatalkan."); return true; }
  return false;
}

export async function t10Research(nama, gen, noLock){
  if(gen == null) gen = BB.dir.gen;
  var n = String(nama == null ? "" : nama).trim() || String(BB.nama_kompetitor || "").trim();
  if(!n) n = String(fld("kompetitor").textContent || "").trim();
  if(!n){
    t10Status("AWAIT_USER", "Isi nama kompetitor lalu tekan Kirim Nama Kompetitor.");
    return false;
  }
  comp = null;
  BB.comp = null;
  await caAgent($("ca"), $("cm"), n);
  if(t10Stale(gen, true)) return false;
  if(!comp || !comp.dna || String(comp.name || "") !== n){
    var msg = ($("cm") && $("cm").textContent) || "Riset kompetitor gagal.";
    t10Status("FAILED", msg);
    return false;
  }
  BB.nama_kompetitor = n;
  fld("kompetitor").textContent = n.toUpperCase();
  /* ponytail: noLock=true dari board — biarkan modal #md/#cr terbuka agar hasil riset bisa dibaca; auto-pilot tetap mengunci. */
  if(noLock) openM();
  if(!noLock){
    var cn = $("cn"), mx = $("mx");
    if(cn) cn.value = n;
    if(mx) mx.disabled = false;
    if(mx && mx.click) mx.click();
    if(t10Stale(gen, true)) return false;
    if(!conf.kompetitor){
      var failMsg = ($("cm") && $("cm").textContent) || "Kunci kompetitor gagal.";
      t10Status("FAILED", failMsg);
      return false;
    }
  }
  t10SyncBox("kompetitor");
  return true;
}

export async function t10Run(){
  if(t10Busy()) return;
  var gen = ++BB.dir.gen;
  BB.dir.cancel = false;
  BB.dir.approval = "";
  t10Status("READY", "Menyiapkan auto-pilot.");
  await t10Loop(first(), gen);
}

export async function t10BoxRun(k, nama){
  if(t10Busy() && BB.dir.status !== "AWAIT_USER") return;
  var b = BX.filter(function(x){ return x.k === k; })[0], gen = ++BB.dir.gen;
  BB.dir.cancel = false; BB.dir.approval = ""; BB.dir.current = k;
  t10Status("RUNNING", "");
  try {
    if(k === "kompetitor"){ if(!await t10Research(nama, gen, true)) return; }
    else await useRec(k);
    if(t10Stale(gen, true)) return;
    if(!conf[k]){ t10Status("AWAIT_USER", "Konfirmasi " + (b ? b.t : k) + " secara manual."); return; }
    if(T10_APPROVE[k]){ BB.dir.approval = k; t10Status("AWAIT_USER", "Setujui " + (b ? b.t : k) + "."); return; }
    t10Status("READY", "");
    if(k === "nama" && !conf.warna){
      /* ponytail: hanya jalur tombol papan; auto-pilot t10Loop sudah menggendong kotak berikutnya. */
      setTimeout(function(){
        if(!conf.nama || conf.warna) return;
        var colorBox = document.querySelector('.bx[data-k="warna"]');
        if(colorBox) colorBox.scrollIntoView({behavior:"smooth", block:"center"});
        t10BoxRun("warna");
      }, 950);
    }
    autoAdv(k);
  } catch(e){ t10Status("FAILED", String((e && e.message) || e || "agen gagal.")); }
}

export async function t10Loop(i, gen){
  if(t10Stale(gen, true)) return;
  t10Status("RUNNING", "");
  while(i < BX.length){
    if(t10Stale(gen, true)) return;
    var k = BX[i].k, b = BX[i];
    if(conf[k]){ i++; continue; }
    BB.dir.current = k;
    if(k === "kompetitor"){
      if(!await t10Research(null, gen)) return;
    } else {
      if(k === "web") t10Status("QA", "Memeriksa hasil sebelum selesai.");
      await useRec(k);
    }
    if(t10Stale(gen, true)) return;
    if(!conf[k]){ t10Status("AWAIT_USER", "Konfirmasi " + b.t + " secara manual."); return; }
    var retry = false;
    (T10_BOX_AGENT[k] || []).forEach(function(id){
      var n = BB.notes && BB.notes[id];
      if(n && n.alasan !== "cache" && Number(n.percobaan) > 1) retry = true;
    });
    if(retry){ t10Status("RETRY", "Periksa " + b.t + ": agen melakukan lebih dari satu percobaan."); return; }
    if(T10_APPROVE[k]){
      BB.dir.approval = k;
      t10Status("AWAIT_USER", "Setujui " + b.t + ".");
      return;
    }
    i++;
  }
  if(t10Stale(gen, true)) return;
  BB.dir.current = "";
  BB.dir.approval = "";
  t10Status("DONE", "Semua 14 entri BX final.");
}

export async function t10Resume(){
  if(BB.dir.cancel){ t10Status("FAILED", "Dibatalkan."); return; }
  var gen = BB.dir.gen;
  BB.dir.approval = "";
  await t10Loop(first(), gen);
}

export async function t10Approve(){
  if(["AWAIT_USER","RETRY","FALLBACK"].indexOf(BB.dir.status) < 0) return;
  BB.dir.approval = "";
  await t10Resume();
}

export function t10Edit(){
  var k = BB.dir.approval || BB.dir.current;
  if(!k) return;
  var b = BX.filter(function(x){ return x.k === k; })[0];
  conf[k] = false;
  BB.dir.approval = "";
  t10Status("FALLBACK", "Edit " + (b ? b.t : k) + " lalu konfirmasi manual.");
  applyLock();
  openP(k);
}

export function t10SubmitName(nama){
  if(BB.dir.researching) return;
  var gen = BB.dir.gen;
  if(BB.dir.cancel){ t10Status("FAILED", "Dibatalkan."); return; }
  BB.dir.researching = true;
  return Promise.resolve(t10Research(nama, gen)).then(function(ok){
    BB.dir.researching = false;
    if(!ok || t10Stale(gen, true)) return;
    return t10Resume();
  }).catch(function(e){
    BB.dir.researching = false;
    t10Status("FAILED", String((e && e.message) || e || "Riset kompetitor gagal."));
  });
}

export function t10Cancel(){
  abortAI();
  BB.dir.cancel = true;
  t10Status("FAILED", "Dibatalkan.");
}

export function t10Click(ev){
  var t = ev && ev.target;
  if(!t || !t.closest) return;
  var btn = t.closest(".t10Toggle,.t10Start,.t10Cancel,.t10Approve,.t10Edit,.t10Name");
  if(!btn || !btn.classList) return;
  if(btn.classList.contains("t10Toggle")){
    BB.t10PanelOpen = BB.t10PanelOpen !== true;
    t10Render();
    return;
  }
  if(btn.classList.contains("t10Start")) t10Run();
  else if(btn.classList.contains("t10Cancel")) t10Cancel();
  else if(btn.classList.contains("t10Approve")) t10Approve();
  else if(btn.classList.contains("t10Edit")) t10Edit();
  else if(btn.classList.contains("t10Name")){
    var input = $("t10NameInput");
    t10SubmitName(input && input.value);
  }
}

$("px").onclick = function(){
  $("pn").style.display = "none";
  document.querySelectorAll(".bx").forEach(function(x){ x.classList.remove("sel"); });
};

$("all").onclick = function(){
  var f = first();
  if(f >= BX.length){ toast("Semua kotak sudah final."); return; }
  var k = BX[f].k;
  if(k === "kompetitor"){
    toast("Mulai dari Riset Kompetitor: isi nama, upload logo, lalu Mulai Riset.");
    openM();
    return;
  }
  useRec(k);
};

$("pgo").onclick = async function(){
  var b = this;
  if(!cur) return;
  b.disabled = true;
  $("pm").textContent = "Memproses…";
  try {
    if(cur === "tagline"){ await regenTags(); b.disabled = false; return; }
    if(cur === "nama"){ await regenNames(); b.disabled = false; return; }
    if(cur === "user"){ await regenUser(); b.disabled = false; return; }
    if(cur === "positioning"){ await regenPos(); b.disabled = false; return; }
    var oldv = OK.indexOf(cur) > -1 ? curVals(cur) : null;
    await ai([cur], $("pp").value, ["brief", cur], $("pm"));
    if(oldv) genOpts(cur, [oldv].concat(OPT[cur].l));
    $("pp").value = "";
    files[cur] = [];
    showF();
  } catch(x){
    er($("pm"), x);
    if($("pm").scrollIntoView) $("pm").scrollIntoView({block:"nearest"});
  }
  b.disabled = false;
};

$("pok").onclick = function(){
  var b = BX.filter(function(x){ return x.k === cur; })[0];
  if(conf[cur]){
    conf[cur] = false;
    applyLock();
    $("pok").textContent = "✔ Konfirmasi Final";
    return;
  }
  var miss = b.f.some(function(f){
    var v = fld(f[0]).textContent.trim();
    return !v ||
      (/^(c1|c2|bg1|bg2|bg3)$/.test(f[0]) && !/^#[0-9a-f]{6}$/i.test(v)) ||
      (f[0] === "segmen" && !/^(ATAS|BAWAH)$/i.test(v)) ||
      (f[0] === "kunci" && v.split(/\s+/).length > 2);
  });
  if(miss){
    $("pm").textContent = "Isi semua bagian kotak ini dulu (segmen hanya ATAS atau BAWAH, kode warna format #rrggbb).";
    return;
  }
  if(cur === "kompetitor" && !(comp && comp.dna)){
    $("pm").textContent = "Analisa DNA kompetitor dulu lewat tombol 🔍 Riset Kompetitor di kotak.";
    return;
  }
  conf[cur] = true;
  applyLock();
  $("pn").style.display = "none";
  if(afterLock(cur)) return;
  document.querySelectorAll(".bx").forEach(function(x){ x.classList.remove("sel"); });
  if(cur === "web"){
    onAll12Done();
    return;
  }
  var n = first();
  if(n < BX.length){
    toast("Kotak " + b.n + " final." + nextHint(cur));
    autoAdv(cur);
  } else {
    toast("Semua kotak final! Silakan download.");
  }
};

$("ca").onclick = async function(){
  var m = $("cm"), n = $("cn").value.trim();
  if(!n){ m.textContent = "Isi nama kompetitor dulu."; return; }
  /* === T6 HOOK: ca === */ return t10BoxRun("kompetitor", n);
};

$("mc").onclick = function(){ closeModal("md"); };

$("mx").onclick = function(){
  var m = $("cm");
  if(!(comp && comp.dna)){ m.textContent = "Analisa DNA kompetitor dulu, lalu kunci."; return; }
  if($("cn").value.trim().toLowerCase() !== comp.name.toLowerCase()){ m.textContent = "Nama kompetitor diubah. Analisa ulang dulu agar sesuai."; return; }
  if(window.lastLocked !== comp.name){
    started.pain = false; started.gain = false; conf.pain = false; conf.gain = false;
    started.segmen = false; conf.segmen = false;
    started.user = false; conf.user = false;
    started.positioning = false; conf.positioning = false; posAuto = false;
    posOpts = []; posDasar = ""; userOpts = [];
    OK.forEach(function(k){
      if(!OPT[k] || typeof OPT[k] !== "object") OPT[k] = {l:[], busy:false};
      if(!Array.isArray(OPT[k].l)) OPT[k].l = [];
      OPT[k].l = [];
      renderOpts(k);
    });
    fld("segmen").textContent = "";
    fld("positioning").textContent = "";
    [1,2,3,4,5].forEach(function(i){ fld("pain"+i).textContent = ""; fld("gain"+i).textContent = ""; });
    window.lastLocked = comp.name;
  }
  conf.kompetitor = true;
  fld("kompetitor").textContent = comp.name.toUpperCase();
  applyLock();
  closeModal("md");
  toast("Kompetitor terkunci (Segmen " + seg(comp.dna.segmen) + ")." + nextHint("kompetitor"));
  autoAdv("kompetitor");
};

exposeFn({
  T10_BOX_AGENT: {get:()=>T10_BOX_AGENT, set:v=>{T10_BOX_AGENT=v}},
  T10_APPROVE: {get:()=>T10_APPROVE, set:v=>{T10_APPROVE=v}},
  OWL: {get:()=>OWL, set:v=>{OWL=v}},
  BPL: {get:()=>BPL, set:v=>{BPL=v}},
  BPK: {get:()=>BPK, set:v=>{BPK=v}},
  openP: {get:()=>openP, set:v=>{openP=v}},
  ai: {get:()=>ai, set:v=>{ai=v}},
  er: {get:()=>er, set:v=>{er=v}},
  mkGain: {get:()=>mkGain, set:v=>{mkGain=v}},
  PG: {get:()=>PG, set:v=>{PG=v}},
  mkPain: {get:()=>mkPain, set:v=>{mkPain=v}},
  ctx: {get:()=>ctx, set:v=>{ctx=v}},
  OW: {get:()=>OW, set:v=>{OW=v}},
  OWT: {get:()=>OWT, set:v=>{OWT=v}},
  JAMV: {get:()=>JAMV, set:v=>{JAMV=v}},
  LST: {get:()=>LST, set:v=>{LST=v}},
  POSX: {get:()=>POSX, set:v=>{POSX=v}},
  POS: {get:()=>POS, set:v=>{POS=v}},
  MJ: {get:()=>MJ, set:v=>{MJ=v}},
  mkPos: {get:()=>mkPos, set:v=>{mkPos=v}},
  renderPos: {get:()=>renderPos, set:v=>{renderPos=v}},
  choosePos: {get:()=>choosePos, set:v=>{choosePos=v}},
  lockPos: {get:()=>lockPos, set:v=>{lockPos=v}},
  autoPos: {get:()=>autoPos, set:v=>{autoPos=v}},
  regenPos: {get:()=>regenPos, set:v=>{regenPos=v}},
  BP: {get:()=>BP, set:v=>{BP=v}},
  mkUser: {get:()=>mkUser, set:v=>{mkUser=v}},
  applyUser: {get:()=>applyUser, set:v=>{applyUser=v}},
  regenUser: {get:()=>regenUser, set:v=>{regenUser=v}},
  renderUser: {get:()=>renderUser, set:v=>{renderUser=v}},
  chooseUser: {get:()=>chooseUser, set:v=>{chooseUser=v}},
  genUserOpts: {get:()=>genUserOpts, set:v=>{genUserOpts=v}},
  BXof: {get:()=>BXof, set:v=>{BXof=v}},
  curVals: {get:()=>curVals, set:v=>{curVals=v}},
  normOpt: {get:()=>normOpt, set:v=>{normOpt=v}},
  labelOpt: {get:()=>labelOpt, set:v=>{labelOpt=v}},
  renderOpts: {get:()=>renderOpts, set:v=>{renderOpts=v}},
  chooseOpt: {get:()=>chooseOpt, set:v=>{chooseOpt=v}},
  KN: {get:()=>KN, set:v=>{KN=v}},
  genOpts: {get:()=>genOpts, set:v=>{genOpts=v}},
  mkNames: {get:()=>mkNames, set:v=>{mkNames=v}},
  setNames: {get:()=>setNames, set:v=>{setNames=v}},
  regenNames: {get:()=>regenNames, set:v=>{regenNames=v}},
  idx: {get:()=>idx, set:v=>{idx=v}},
  isAdj: {get:()=>isAdj, set:v=>{isAdj=v}},
  nextHint: {get:()=>nextHint, set:v=>{nextHint=v}},
  autoAdv: {get:()=>autoAdv, set:v=>{autoAdv=v}},
  webFrom: {get:()=>webFrom, set:v=>{webFrom=v}},
  webOpts: {get:()=>webOpts, set:v=>{webOpts=v}},
  hashify: {get:()=>hashify, set:v=>{hashify=v}},
  mkTags: {get:()=>mkTags, set:v=>{mkTags=v}},
  setTags: {get:()=>setTags, set:v=>{setTags=v}},
  regenTags: {get:()=>regenTags, set:v=>{regenTags=v}},
  getAI: {get:()=>getAI, set:v=>{getAI=v}},
  sjImg: {get:()=>sjImg, set:v=>{sjImg=v}},
  useOwn: {get:()=>useOwn, set:v=>{useOwn=v}},
  useRec: {get:()=>useRec, set:v=>{useRec=v}},
  t10Status: {get:()=>t10Status, set:v=>{t10Status=v}},
  t10SyncBox: {get:()=>t10SyncBox, set:v=>{t10SyncBox=v}},
  t10Flag: {get:()=>t10Flag, set:v=>{t10Flag=v}},
  t10Notes: {get:()=>t10Notes, set:v=>{t10Notes=v}},
  t10PanelHTML: {get:()=>t10PanelHTML, set:v=>{t10PanelHTML=v}},
  t10Render: {get:()=>t10Render, set:v=>{t10Render=v}},
  t10Busy: {get:()=>t10Busy, set:v=>{t10Busy=v}},
  t10Stale: {get:()=>t10Stale, set:v=>{t10Stale=v}},
  t10Research: {get:()=>t10Research, set:v=>{t10Research=v}},
  t10Run: {get:()=>t10Run, set:v=>{t10Run=v}},
  t10BoxRun: {get:()=>t10BoxRun, set:v=>{t10BoxRun=v}},
  t10Loop: {get:()=>t10Loop, set:v=>{t10Loop=v}},
  t10Resume: {get:()=>t10Resume, set:v=>{t10Resume=v}},
  t10Approve: {get:()=>t10Approve, set:v=>{t10Approve=v}},
  t10Edit: {get:()=>t10Edit, set:v=>{t10Edit=v}},
  t10SubmitName: {get:()=>t10SubmitName, set:v=>{t10SubmitName=v}},
  t10Cancel: {get:()=>t10Cancel, set:v=>{t10Cancel=v}},
  t10Click: {get:()=>t10Click, set:v=>{t10Click=v}}
});
