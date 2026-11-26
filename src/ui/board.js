/* === FILE: src/ui/board.js === */
import { exposeFn } from '../core/state.js';


export var micBase = "";
export var recog = null;

export function sync(){
  /* === T5 HOOK: alias === */ if(typeof BB !== "undefined" && BB.__t5){ BB.comp = comp; BB.conf = conf; }
  var t = typeof BB !== "undefined" && BB.__t5 ? BBVAL("tagline") : fld("tagline").textContent; /* === T5 HOOK: tagline === */
  $("tg1").textContent = t;
  var cv = {};
  ["c1","c2"].forEach(function(c){
    var v = typeof BB !== "undefined" && BB.__t5 ? String(BBVAL(c)).trim() : fld(c).textContent.trim(); /* === T5 HOOK: warna === */
    var fb = c === "c2" && cv.c1 ? (lumi(cv.c1) < .72 ? cv.c1 : "#333333") : null;
    if(applyColor(c, v, fb)) cv[c] = v;
  });
  applyFont();
  var n = typeof BB !== "undefined" && BB.__t5 ? BBVAL("nama") : fld("nama").textContent, tg = typeof BB !== "undefined" && BB.__t5 ? String(BBVAL("tagline")).trim() : fld("tagline").textContent.trim(); /* === T5 HOOK: nama === */
  /* === T9 HOOK: sync === */ if(typeof BB !== "undefined" && BB.__t5 && BB.markSVG !== undefined){ markSVG = cleanSVG(BB.markSVG); markConcept = BB.markConcept; }
  var mw = $("markWrap");
  if(mw) mw.innerHTML = (markSVG && !logo) ? markSVG : "";
  var mn = $("markNote");
  if(mn){
    if(markBusy) mn.textContent = "🎨 Konsultan AI sedang merancang icon logo profesional Anda…";
    else if(markConcept && markSVG && !logo) mn.textContent = "✨ Filosofi Icon Logo: " + markConcept;
    else mn.textContent = "";
  }
  var mkBtn = document.querySelector(".mkgen");
  if(mkBtn) mkBtn.hidden = !conf.web || !!logo;
  var base = typeof BB !== "undefined" && BB.__t5 ? BBHEX("c1", "#E61D4C") : (/^#[0-9a-f]{6}$/i.test(fld("c1").textContent.trim()) ? fld("c1").textContent.trim() : "#E61D4C"); /* === T5 HOOK: base === */
  [1,2,3].forEach(function(i){
    var el = $("t"+i), bv = typeof BB !== "undefined" && BB.__t5 ? String(BBVAL("bg"+i)).trim() : fld("bg"+i).textContent.trim(); /* === T5 HOOK: bg === */
    if(!/^#[0-9a-f]{6}$/i.test(bv)) bv = base;
    var lt = lumi(bv) >= .6;
    el.style.background = bv;
    el.style.color = lt ? dk(bv, .2) : "#FFFFFF";
    el.innerHTML = (logo && vcol[lt ? 2 : 1] ? '<img src="'+vcol[lt ? 2 : 1]+'">' : '<div class="tn">'+esc(n || "BRAND")+'</div>') +
      (tg ? '<div class="tt">'+esc(tg)+'</div>' : '');
  });
  var li = $("logoImg");
  if(li){
    li.hidden = !logo;
    fld("nama").style.display = logo ? "none" : "inline-block";
    if(logo) li.src = logo;
  }
  var lb = document.querySelector('[data-t="logo"]');
  if(lb) lb.textContent = logo ? "🔄 Ganti logo" : "⬆ Upload logo (PNG)";
  var ld = document.querySelector(".ldel");
  if(ld) ld.hidden = !logo;
  applyLock();
}

export function applyColor(name, hex, fallback){
  if(!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  var sw = $("s" + name[1]);
  if(sw) sw.style.background = hex;
  var f = fld(name);
  if(f){ f.style.background = hex; f.style.color = lumi(hex) < .72 ? "#fff" : "#111"; }
  document.documentElement.style.setProperty("--" + name, lumi(hex) < .72 ? hex : (fallback || "#333333"));
  return hex;
}

export async function restoreBlobs(){
  try{
    await IDB.open();
    var l = await IDB.get("logo");
    if(l && !logo) applyLogoURL(await blobToDataURL(l));
    var c = await IDB.get("clogo");
    if(c && !cLogoU){
      var u = await blobToDataURL(c);
      cLogoU = u; compFile = c;
      $("cprev").src = u;
      $("cprev").hidden = false;
      if(comp){ comp.logo = u; renderC(comp.dna); }
    }
  }catch(e){}
}

export function showF(){
  var a = files.brief || [];
  $("bm").textContent = a.length ? "Terlampir: " + a.map(function(f){ return f.name; }).join(", ") : "";
  if(cur){
    var b = files[cur] || [];
    $("pf").textContent = b.length ? "Terlampir: " + b.map(function(f){ return f.name; }).join(", ") : "";
  }
}

export function first(){
  for(var i=0; i<BX.length; i++) if(!conf[BX[i].k]) return i;
  return BX.length;
}

export function applyLock(){
  var f = first();
  BX.forEach(function(b, i){
    var el = document.querySelector('.bx[data-k="'+b.k+'"]');
    if(!el) return;
    var lk = i > f, pend = i === f && !started[b.k] && !conf[b.k];
    el.classList.toggle("lk", lk);
    el.classList.toggle("ok", !!conf[b.k]);
    el.classList.toggle("pend", pend);
    var ch = el.querySelector(".choice");
    if(ch) ch.hidden = !pend;
    var v = (lk || pend) ? "false" : "true";
    el.querySelectorAll(".e").forEach(function(x){ if(x.contentEditable !== v) x.contentEditable = v; });
    var ed = el.querySelector(".ed"), t = (lk || pend) ? "🔒" : "✎";
    if(ed && ed.textContent !== t) ed.textContent = t;
    if(ed){
      ed.disabled = !!(lk || pend);
      ed.setAttribute("aria-label", (lk || pend) ? "Prompt kotak ini (terkunci)" : "Prompt kotak ini");
    }
  });
  BX.forEach(function(b, i){
    if(conf[b.k] && !prevC[b.k]){
      delete nxtDone[b.k];
    }
    prevC[b.k] = !!conf[b.k];
    var w = document.querySelector('.nxt[data-k="'+b.k+'"]');
    if(w) w.hidden = !(conf[b.k] && i === f - 1 && !nxtDone[b.k] && i < BX.length - 1 && !isAdj(b.k, BX[i+1].k));
  });
  OK.forEach(function(k){
    var w = document.querySelector('.owrap[data-k="'+k+'"]');
    if(!w) return;
    var i = BX.map(function(x){ return x.k; }).indexOf(k);
    var sh = (conf[k] || started[k]) && i <= f;
    w.hidden = !sh;
    if(!sh){
      var l = w.querySelector(".olist");
      if(l) l.hidden = true;
    }
  });
  var ub = document.querySelector(".ubar");
  if(ub){
    var u6 = BX.map(function(x){ return x.k; }).indexOf("user");
    var shu = (conf.user || started.user) && u6 <= f;
    ub.hidden = !shu;
    if(!shu) $("ulist").hidden = true;
  }
  var sbt = document.querySelector(".segb");
  if(sbt) sbt.hidden = !window.segInfo;
  var pb = document.querySelector(".posbar");
  if(pb){
    var sh = !!started.positioning && !conf.positioning && f === idx("positioning");
    pb.hidden = !sh;
    if(!sh) $("plist").hidden = true;
  }
  if(f === idx("positioning") && !started.positioning && !posAuto){
    posAuto = true;
    started.positioning = true;
    autoPos();
    applyLock();
    return;
  }
  $("dl").disabled = $("pr").disabled = f < BX.length;
  var m = $("dm");
  if(!m.dataset.busy){
    m.textContent = f < BX.length
      ? "Download aktif setelah semua kotak final (" + f + "/" + BX.length + "). Kotak aktif: " + BX[f].n + ". " + BX[f].t
      : "Semua 12 kotak final! Siap di-download.";
  }
  BX.forEach(function(b){
    var el = document.querySelector('.bx[data-k="'+b.k+'"]');
    if(el && BB.qa && typeof t11Flags === "function") el.dataset.qa = String(t11Flags(b.k).length);
  });
}

export function toast(t){
  var x = $("toast");
  x.textContent = t;
  x.style.display = "block";
  clearTimeout(window._t);
  window._t = setTimeout(function(){ x.style.display = "none"; }, 3200);
}

export function onAll12Done(){
  var topBox = document.querySelector('.bx[data-k="nama"]');
  if(topBox) topBox.scrollIntoView({behavior:"smooth", block:"center"});
  if(!logo){
    toast("Semua 12 kolom DNA selesai! Konsultan AI sedang merancang icon logo profesional Anda…");
    setTimeout(function(){ genMarkBG(true); }, 350);
  } else {
    toast("Semua 12 kolom DNA selesai! Siap di-download.");
  }
  if(typeof t11Layer1 === "function"){
    try { t11Layer1(); } catch(e){}
    applyLock();
    var qn = 0;
    if(BB.qa && typeof t11Flags === "function") BX.forEach(function(b){ qn += t11Flags(b.k).length; });
    if(qn) toast("QA menemukan " + qn + " temuan. Periksa kotak lalu perbaiki.");
  }
}

export function segScore(o, forcedSeg){
  /* AI kadang mengirim objek sebagai string/array/kunci kapital/skor datar; normalkan di sini agar semua pemanggil aman. */
  if(typeof o === "string"){
    try { o = JSON.parse(o); } catch(e){ o = null; }
  }
  var raw = o, aliases = {
    harga:"harga", hargaperporsivolume:"harga", hargapervolume:"harga",
    higienitas:"higienitas", kebersihan:"higienitas", kepercayaanmerek:"higienitas", higienitaskepercayaanmerek:"higienitas", higienitasdankepercayaanmerek:"higienitas",
    kemasan:"kemasan", penyajian:"kemasan", kemasanpenyajian:"kemasan", kemasandanpenyajian:"kemasan",
    iklan:"iklan", viralitas:"iklan", iklanviralitas:"iklan", iklandanviralitas:"iklan",
    tempat:"tempat", outlet:"tempat", jaringanoutlet:"tempat", tempatjualjaringanoutlet:"tempat",
    angle:"angle", dayatarik:"angle", angledayatarik:"angle",
    dayabeli:"dayabeli", dayapelitarget:"dayabeli", dayabelitarget:"dayabeli"
  };
  function keyOf(k){
    var clean = String(k == null ? "" : k).toLowerCase().replace(/[^a-z0-9]+/g, "");
    return aliases[clean] || clean;
  }
  function add(x, k){
    if(!x || typeof x !== "object") return;
    var name = keyOf(k || x.k || x.key || x.nama || x.indikator || x.label || x.name);
    if(name) o[name] = x;
  }
  if(Array.isArray(raw)){
    o = {};
    raw.forEach(function(x){ add(x); });
  } else if(raw && typeof raw === "object"){
    /* Be tolerant of common wrappers: {scores: {...}}, {indikator: [...]}, or {data: {...}}. */
    var wrapped = raw.segmen_skor || raw.scores || raw.score || raw.indikator || raw.data || raw.items;
    if(wrapped && wrapped !== raw && (Array.isArray(wrapped) || typeof wrapped === "object")) raw = wrapped;
    o = {};
    if(Array.isArray(raw)) raw.forEach(function(x){ add(x); });
    else Object.keys(raw).forEach(function(k){
      var v = raw[k];
      if(v && typeof v === "object" && !Array.isArray(v)) add(v, k);
      else o[keyOf(k)] = v;
    });
  }
  var rows = [], sum = 0;
  RK.forEach(function(k){
    var x = o && o[k], v = x && typeof x === "object" ? (x.skor != null ? x.skor : x.score) : x;
    var n = Number(v);
    if(n >= 1 && n <= 5){
      rows.push({k:k, n:n, a:(x && typeof x === "object" ? x.alasan : "") || ""});
      sum += n;
    }
  });
  if(rows.length < 4) throw new Error("Skor segmen dari AI tidak lengkap, coba lagi.");
  var avg = sum / rows.length;
  var finalSeg = forcedSeg ? seg(forcedSeg) : (avg >= 3 ? "ATAS" : "BAWAH");
  return {avg: avg, seg: finalSeg, rows: rows};
}

export function segTxt(q){
  return "Segmen " + q.seg + " (skor rata-rata " + q.avg.toFixed(1) + "/5; setara segmen kompetitor)" +
    q.rows.map(function(x){ return "\n• " + RL[x.k] + " " + x.n + "/5: " + x.a; }).join("");
}

export function seg(v){ return String(v || "").toUpperCase().indexOf("ATAS") > -1 ? "ATAS" : "BAWAH"; }

export function dom(w){
  w = String(w || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(w) ? w : "";
}

export function renderC(d){
  var h = function(c){ return /^#[0-9a-f]{6}$/i.test(c) ? c : "#444444"; };
  var c1 = h(d.c1), c2 = h(d.c2);
  var b1 = lumi(c1) < .72 ? c1 : "#333333";
  var b2 = lumi(c2) < .72 ? c2 : b1;
  var w = dom(d.web), q = encodeURIComponent(comp.name + " website resmi");
  var hs = (Array.isArray(d.hashtag) ? d.hashtag : []).map(function(x){
    x = String(x).replace(/\s+/g, "");
    return x[0] === "#" ? x : "#" + x;
  }).join(" ");
  var lk = '<a href="' + (w ? "https://" + esc(w) : "https://www.google.com/search?q=" + q) + '" target="_blank" rel="noopener noreferrer" style="color:#111;font-weight:700;text-decoration:underline">' + (w ? esc(w) + " ↗" : "Cari website resmi ↗") + '</a>';
  var k0 = Array.isArray(d.kompetitor) ? d.kompetitor[0] : d.kompetitor;
  var kp = esc(String(k0 || "").split(/[\(;\/,]/)[0].trim().toUpperCase());
  var A = function(hr, t, c){ return '<a href="'+hr+'" target="_blank" rel="noopener noreferrer" style="color:'+c+';text-decoration:underline;font-weight:700">'+t+' ↗</a>'; };
  var g = function(t){ return "https://www.google.com/search?q=" + encodeURIComponent(t); };
  var kw = dom(d.kompetitor_web), ki = igu(d.kompetitor_ig), ci = igu(d.instagram);
  var kl = '<div style="font-size:13px;font-weight:500;margin-top:12px;line-height:1.9">Website: ' +
    (kw ? A("https://"+esc(kw), esc(kw), "#fff") : A(g(String(k0||"")+" website resmi"), "cari website", "#fff")) +
    '<br>Instagram: ' +
    (ki ? A("https://www.instagram.com/"+ki+"/", "@"+esc(ki), "#fff") : A(g(String(k0||"")+" instagram resmi"), "cari Instagram", "#fff")) + '</div>';
  var igl = 'Instagram: ' + (ci ? A("https://www.instagram.com/"+ci+"/", "@"+esc(ci), "#111") : A(g(comp.name+" instagram resmi"), "cari Instagram", "#111"));
  var sg = d._seg ? '<details class="bx sa"><summary>ANALISA SEGMEN: ' + esc(d._seg.seg) + ' (skor ' + d._seg.avg.toFixed(1) + '/5) ▾ ketuk untuk buka/tutup</summary>' +
    d._seg.rows.map(function(x){ return '<div>• ' + esc(RL[x.k]) + ' ' + x.n + '/5: ' + esc(x.a) + '</div>'; }).join('') + '</details>' : '';
  var sw = function(c){ return '<span class="sw"><i style="background:'+c+';box-shadow:0 0 0 1px #ccc"></i><span style="font-size:13px">'+esc(c)+'</span></span>'; };
  var fb = d.fakta_bisnis ? '<div class="factbar"><b>📋 Validasi Entitas & Model Bisnis Asli:</b><br>' + esc(d.fakta_bisnis) + '</div>' : '';
  var tgDisp = d.tagline_asli_ditemukan ? ('“' + esc(d.tagline) + '”') : esc(d.tagline);
  var tgNote = d.tagline_asli_ditemukan
    ? '<div class="tgbadge">✓ Tagline Asli Brand</div>'
    : '<div class="tgbadge">✨ Rekomendasi Tagline (belum ditemukan tagline resmi)</div>';

  $("cr").innerHTML = '<div id="crb" class="cb" style="--c1:'+b1+';--c2:'+b2+'">' +
    '<div class="hd">DNA BISNIS BOARD</div>' +
    '<div class="bx" style="padding:36px 28px 26px">' + (comp.logo ? '<img src="'+esc(comp.logo)+'" alt="'+esc(comp.name)+'" style="max-height:130px;max-width:75%">' : '<div class="nama" style="font-size:52px">'+esc(comp.name)+'</div>') + '<div class="tg" style="margin-top:14px">'+tgDisp+'</div>' + tgNote + '</div>' +
    fb +
    '<div class="bx"><div class="lab">POSITIONING</div>' + esc(d.positioning) + (d.dasar ? '<div style="font-size:12px;opacity:.7;margin-top:8px">Dasar: '+esc(d.dasar)+'</div>' : '') + '</div>' +
    '<div class="band g"><div class="bx"><div class="lab">SEGMEN</div><div class="big" style="font-size:22px">KALANGAN '+esc(seg(d.segmen))+'</div></div><div class="bx"><div class="lab">USER</div><div class="big" style="font-size:22px">'+esc(d.usertitle)+'</div><div style="margin-top:6px">'+esc(d.usia)+'</div><div style="margin-top:6px">'+esc(d.usersub)+'</div></div></div>' + sg +
    '<div class="bx meja"><div class="lab">7 MEJA PERDEBATAN</div>' + lis(d.meja) + '</div>' +
    '<div class="band r"><div class="bx"><div class="lab">KOMPETITOR</div><div class="big" style="font-size:22px">'+(kp||"-")+'</div>' + kl + '</div><div class="bx"><div class="lab">KATA KUNCI</div><div class="big" style="font-size:24px">'+esc(Array.isArray(d.kunci)?d.kunci.slice(0,2).join(" "):d.kunci)+'</div></div></div>' +
    '<div class="two"><div class="bx"><div class="lab">PAIN</div>'+lis(d.pain)+'</div><div class="bx"><div class="lab">GAIN</div>'+lis(d.gain)+'</div></div>' +
    (hs ? '<div class="bx beige"><div class="tg" style="color:#111;font-size:18px">'+esc(hs)+'</div></div>' : '') +
    '<div class="bx"><div class="lab" style="font-size:16px">CORPORATE COLOR</div>' + sw(c1) + sw(c2) + '<div class="lab" style="font-size:16px;margin-top:16px">FONT TYPE</div><div class="fontb" style="font-size:18px;padding:10px 24px">'+esc(d.font)+'</div></div>' +
    '<div class="ft">' + lk + '<div style="margin-top:10px">' + igl + '</div></div></div>' +
    '<div class="msg" style="margin-top:6px">Keyakinan analisa: ' + esc(d.keyakinan || "-") + '. ' + esc(d.catatan || "") + '</div>';
  $("cd").disabled = false;
  $("cd2").disabled = false;
}

export function lockUI(){
  var k = !!conf.kompetitor;
  $("mx").disabled = k;
  $("mx").textContent = k ? "✔ Kompetitor Terkunci" : "🔒 Kunci Kompetitor";
  $("ca").disabled = k;
  if(k) $("cm").textContent = "Kompetitor sudah terkunci. Batalkan final kotak 1 (tombol ✎) untuk menggantinya.";
}

export function goNext(){
  var n = first();
  if(n < BX.length){
    var el = document.querySelector('.bx[data-k="'+BX[n].k+'"]');
    if(el) el.scrollIntoView({behavior:"smooth", block:"center"});
    toast("Kotak " + BX[n].n + ": " + BX[n].t + ". Pilih Gunakan Rekomendasi atau Prompt Sendiri.");
  } else {
    toast("Semua kotak final! Silakan download.");
  }
}

export function afterLock(k){ return false; }

export function boxMiss(b){
  return b.f.some(function(f){
    var v = fld(f[0]).textContent.trim();
    return !v ||
      (/^(c1|c2|bg1|bg2|bg3)$/.test(f[0]) && !/^#[0-9a-f]{6}$/i.test(v)) ||
      (f[0] === "segmen" && !/^(ATAS|BAWAH)$/i.test(v)) ||
      (f[0] === "kunci" && v.split(/\s+/).length > 2);
  });
}

export function readU(f, cb){
  var r = new FileReader();
  r.onload = function(){ cb(r.result); };
  r.readAsDataURL(f);
}

export function applyLogoURL(u){
  logo = u;
  recolor(u, "", function(a){
    vcol[0] = a;
    recolor(u, "#ffffff", function(b){
      vcol[1] = b;
      recolor(u, "#000000", function(c){ vcol[2] = c; sync(); });
    });
  });
}

export function initMic(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return;
  document.querySelectorAll(".mic").forEach(function(b){ b.hidden = false; });
  recog = new SR();
  recog.lang = "id-ID";
  recog.interimResults = true;
  recog.continuous = false;
  recog.onresult = function(ev){
    if(!act) return;
    var txt = "";
    for(var i=0; i<ev.results.length; i++) txt += ev.results[i][0].transcript;
    $(act.t).value = (micBase + (txt ? " " + txt : "")).trim();
  };
  recog.onerror = function(ev){
    if(!act) return;
    act.b.classList.remove("rec");
    act.b.textContent = act.l;
    act = null;
    if(ev.error !== "aborted") toast("Suara gagal: " + ev.error);
  };
  recog.onend = function(){
    if(!act) return;
    act.b.classList.remove("rec");
    act.b.textContent = act.l;
    act = null;
  };
}

export function mic(b){
  if(!recog) return;
  if(act){ try { recog.stop(); } catch(e){} return; }
  var t = b.dataset.t;
  micBase = $(t).value.trim();
  var lbl = b.textContent;
  act = {t:t, b:b, l:lbl};
  b.classList.add("rec");
  b.textContent = lbl.length > 3 ? "⏹ Berhenti (mendengarkan…)" : "⏹";
  try { recog.start(); } catch(x){
    act = null;
    b.classList.remove("rec");
    b.textContent = lbl;
    toast("Gagal memulai suara.");
  }
}

export function normImg(f){
  return new Promise(function(res){
    if(!f || String(f.type).indexOf("image/") !== 0 || f.type === "image/svg+xml"){ res(f); return; }
    readU(f, function(u){
      var im = new Image();
      im.onload = function(){
        var k = Math.min(1, 1024 / Math.max(im.width, im.height));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * k));
        c.height = Math.max(1, Math.round(im.height * k));
        var x = c.getContext("2d");
        x.fillStyle = "#fff";
        x.fillRect(0, 0, c.width, c.height);
        x.drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(function(b){
          if(b){ b.name = f.name; res(b); }
          else res(f);
        }, "image/jpeg", 0.85);
      };
      im.onerror = function(){ res(f); };
      im.src = u;
    });
  });
}

export function applyFont(){
  var t = fld("font").textContent.trim();
  if(t === lastFont) return;
  lastFont = t;
  if(customFont && t.indexOf(customFont.label) === 0){
    document.documentElement.style.setProperty("--bf", "UserFont");
    return;
  }
  var nm = t.split(/[(,]| [—–-] /)[0].replace(/\s+(Bold|Regular|Medium|SemiBold|Semibold|Light|ExtraBold|Black)$/i, "").trim();
  var gl = document.querySelector(".gfl");
  if(gl) gl.href = "https://fonts.google.com/?query=" + encodeURIComponent(nm || "");
  if(!nm){ document.documentElement.style.removeProperty("--bf"); return; }
  loadGoogleFont(nm);
}

export async function loadFont(f){
  if(!f) return;
  try {
    var buf = await f.arrayBuffer(), face = new FontFace("UserFont", buf);
    await face.load();
    document.fonts.add(face);
    var lbl = f.name.replace(/\.[^.]+$/, "");
    customFont = {label: lbl};
    fld("font").textContent = lbl + " (font upload)";
    lastFont = "";
    sync();
    toast("Font " + lbl + " terpasang di seluruh board.");
  } catch(x){
    toast("Font gagal dibaca. Pakai file .ttf, .otf, .woff, atau .woff2.");
  }
}

export function loadGoogleFont(family){
  family = String(family || "").trim();
  if(!family) return;
  var id = "gf-" + family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if(!document.getElementById(id)){
    var fam = encodeURIComponent(family).replace(/%20/g, "+");
    var l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + fam + ":wght@400;500;700&display=swap";
    l.onerror = function(){ l.onerror = null; l.href = "https://fonts.googleapis.com/css2?family=" + fam + "&display=swap"; };
    document.head.appendChild(l);
  }
  document.documentElement.style.setProperty("--bf", '"' + family + '", Fredoka, system-ui, sans-serif');
}

$("board").innerHTML =
  '<div class="hd">DNA BISNIS BOARD</div>' +
  bx("nama",
    '<div id="markWrap" style="margin-bottom:8px"></div>' +
    '<div id="logoWrap"><img id="logoImg" hidden alt="logo">' + e("nama","NAMA BRAND","nama") + '</div>' +
    '<div class="tg" id="tg1" style="margin-top:4px;line-height:1.15"></div>' +
    '<div id="markNote" data-html2canvas-ignore class="msg" style="margin-top:6px"></div>' +
    '<div data-html2canvas-ignore style="margin-top:14px">' +
      '<button class="upb" data-t="logo" style="font-size:12px">⬆ Upload logo (PNG)</button>' +
      '<button class="ldel" style="font-size:12px;margin-left:6px" hidden>🗑 Hapus logo</button>' +
      '<button class="mbb" style="font-size:12px;margin-left:6px">🖼 Moodboard Logo</button>' +
      '<button class="mkgen" style="font-size:12px;margin-left:6px" hidden>✨ Desain Ulang Icon</button>' +
      '<input type="file" accept="image/png,image/jpeg" data-f="logo">' +
    '</div>'
  ) +
  bx("positioning",
    '<div class="lab">POSITIONING</div>' +
    e("positioning","Jenis produk + keunggulan + teritori","big2") +
    '<div class="posbar" data-html2canvas-ignore hidden>' +
      '<button class="pdd">▾ Pilihan lain (<span id="pcnt">0</span>)</button>' +
      '<button class="p plk">🔒 Kunci Positioning</button>' +
    '</div>' +
    '<div id="plist" data-html2canvas-ignore hidden></div>' +
    '<div id="posd" data-html2canvas-ignore style="margin-top:8px;font-size:13px;opacity:.8" hidden></div>'
  ) +
  '<div class="band g">' +
    bx("segmen",
      '<div class="lab">SEGMEN</div>' +
      e("segmen","ATAS / BAWAH","big") +
      '<div data-html2canvas-ignore><button class="segb" style="margin-top:12px;font-size:13px" hidden>🔍 Cek Analisa</button></div>'
    ) +
    bx("user",
      '<div class="lab">USER SPECIFIC</div>' +
      e("usertitle","WANITA KARIR","big") +
      '<div style="margin-top:8px">' + e("usia","USIA 24 - 40 TAHUN","") + '</div>' +
      '<div style="margin-top:8px">' + e("usersub","Diet & Hidup Sehat, Sarapan Jus Tanpa Drama, Gak Telat Absen Kantor","") + '</div>' +
      '<div class="ubar" data-html2canvas-ignore hidden><button class="udd">✨ 5 Rekomendasi</button></div>' +
      '<div id="ulist" data-html2canvas-ignore hidden></div>' +
      '<div data-html2canvas-ignore style="margin-top:10px"><button class="jamb" style="font-size:13px">🕐 Jam Berjualan</button></div>'
    ) +
  '</div>' +
  bx("meja", '<div class="lab">7 MEJA PERDEBATAN</div>' + ol("meja",7), "meja") +
  '<div class="band r">' +
    bx("kompetitor",
      '<div class="lab">KOMPETITOR</div>' +
      e("kompetitor","PESAING","big") +
      '<div data-html2canvas-ignore><button class="cmp" style="margin-top:8px;font-size:12px">🔍 Riset Kompetitor</button></div>'
    ) +
    bx("kunci", '<div class="lab">KATA KUNCI</div>' + e("kunci","Jus Sehat","big")) +
  '</div>' +
  '<div class="two">' +
    bx("pain", '<div class="lab">PAIN</div>' + ol("pain",5)) +
    bx("gain", '<div class="lab">GAIN</div>' + ol("gain",5)) +
  '</div>' +
  bx("tagline",
    e("tagline","#Tagline","tg") +
    '<div data-html2canvas-ignore style="margin-top:10px"><button class="tgb" style="font-size:12px">🗣 Simulasi Forum</button></div>',
    "beige"
  ) +
  bx("warna",
    '<div class="lab" style="font-size:20px">CORPORATE COLOR</div>' +
    '<div><span class="sw"><i id="s1"></i>' + e("c1","#e61d4c") + '</span><span class="sw"><i id="s2"></i>' + e("c2","#28623c") + '</span></div>' +
    '<div style="margin-top:12px;font-size:14px;line-height:1.4"><b>Filosofi warna:</b> ' + e("filw","makna kedua warna") + '</div>' +
    '<div data-html2canvas-ignore style="margin-top:12px"><button class="cpb" data-m="warna" style="font-size:13px">🎨 Pilih Warna Sendiri</button></div>'
  ) +
  bx("font",
    '<div class="lab" style="font-size:20px">FONT TYPE</div>' +
    '<div class="fontb">' + e("font","Nama font") + '</div>' +
    '<div style="margin-top:12px;font-size:14px;line-height:1.4">' + e("filf","alasan memilih font") + '</div>' +
    '<div data-html2canvas-ignore style="margin-top:14px">' +
      '<a class="gfl" href="https://fonts.google.com/" target="_blank" rel="noopener noreferrer" style="font-size:13px;display:inline-block;margin:0 8px 8px;color:inherit">🔎 Cari &amp; download font ↗</a>' +
      '<button class="upb" data-t="fontup" style="font-size:13px">⬆ Upload font sendiri</button>' +
      '<input type="file" accept=".ttf,.otf,.woff,.woff2" data-f="fontup">' +
      '<div style="font-size:12px;opacity:.7;margin-top:4px">Download font (.ttf/.otf/.woff) dari internet, lalu upload di sini. Seluruh board langsung memakai font itu.</div>' +
    '</div>'
  ) +
  bx("logobg",
    '<div class="lab" style="font-size:20px">LOGO IN BACKGROUND COLOR</div>' +
    '<div class="vars"><div class="tile" id="t1"></div><div class="tile" id="t2"></div><div class="tile" id="t3"></div></div>' +
    '<div class="vars hx"><div>' + e("bg1","#hex") + '</div><div>' + e("bg2","#hex") + '</div><div>' + e("bg3","#hex") + '</div></div>' +
    '<div data-html2canvas-ignore style="margin-top:10px"><button class="cpb" data-m="logobg" style="font-size:13px">🎨 Pilih Background Sendiri</button></div>'
  ) +
  bx("web",
    '<div class="ft">' + e("web","www.namabrand.id") + '</div>' +
    '<div data-html2canvas-ignore style="padding:12px 14px 0;text-align:center"><button class="domb" style="font-size:13px">🔎 Cek Domain</button></div>',
    "nop"
  );

BX.forEach(function(b){
  var el = document.querySelector('.bx[data-k="'+b.k+'"]');
  if(el) el.insertAdjacentHTML("beforeend", '<div class="nxt" data-k="'+b.k+'" data-html2canvas-ignore hidden><button class="p nbtn" data-k="'+b.k+'">Lanjut ➜</button></div>');
});

document.addEventListener("input", sync);

document.addEventListener("input", bridgeInput, true); /* === T5 HOOK: input === */

document.addEventListener("click", function(ev){
  var b = ev.target.closest("button");
  if(!b) return;
  if(b.id === "aiCancel"){ cancelAI(); return; }
  if(b.classList.contains("upb")) b.parentNode.querySelector("input[type=file]").click();
  else if(b.classList.contains("ed")) openP(b.closest(".bx").dataset.k);
  else if(b.classList.contains("cmp")) openM();
  else if(b.classList.contains("bRec")){
    if(b.dataset.k === "kompetitor"){ openM(); toast("Isi nama kompetitor lalu Mulai Riset."); }
    else t10BoxRun(b.dataset.k);
  }
  else if(b.classList.contains("bOwn")) useOwn(b.dataset.k);
  else if(b.classList.contains("pdd")){ $("plist").hidden = !$("plist").hidden; }
  else if(b.classList.contains("po")) choosePos(+b.dataset.i);
  else if(b.classList.contains("plk")) lockPos();
  else if(b.classList.contains("segb")) openSeg();
  else if(b.classList.contains("nbtn")){
    nxtDone[b.dataset.k] = 1; applyLock();
    if(BB.dir && ["AWAIT_USER","RETRY","FALLBACK"].indexOf(BB.dir.status) >= 0) t10Approve();
    else goNext();
  }
  else if(b.classList.contains("ldel")){ logo = null; vcol = {}; IDB.del("logo").catch(function(){}); sync(); }
  else if(b.classList.contains("mkgen")){ genMarkBG(true, "Buat konsep icon logo profesional baru yang berbeda dan ikonik."); }
  else if(b.classList.contains("cpb")) openCP(b.dataset.m);
  else if(b.classList.contains("cps")){ CP.slot = +b.dataset.i; renderCP(); }
  else if(b.classList.contains("cpc")){ CP.v[CP.slot] = COL[+b.dataset.i][1].toUpperCase(); renderCP(); }
  else if(b.classList.contains("jamb")) openJam();
  else if(b.classList.contains("tgb")){
    if(!tagSim) toast("Belum ada simulasi forum. Gunakan Rekomendasi atau Generate tagline dulu.");
    else { $("tgb").textContent = tagSim.replace(/^Forum:\s*/,"").split(" / ").join("\n"); openModal("tgm"); }
  }
  else if(b.classList.contains("domb")){ if(!dom0()) toast("Nama website masih kosong."); else openDom(); }
  else if(b.classList.contains("dpk")){ fld("web").textContent = "www." + b.dataset.d; sync(); openDom(); }
  else if(b.classList.contains("mbb")) openMood();
  else if(b.classList.contains("udd")){ if(uBusy) return; if(!userOpts.length) genUserOpts([]); else $("ulist").hidden = !$("ulist").hidden; }
  else if(b.classList.contains("uo")) chooseUser(+b.dataset.i);
  else if(b.classList.contains("odd")){
    var ok = b.dataset.k;
    if(OPT[ok].busy) return;
    if(!OPT[ok].l.length) genOpts(ok, []);
    else { var OL = document.querySelector('.olist[data-k="'+ok+'"]'); OL.hidden = !OL.hidden; }
  }
  else if(b.classList.contains("oo")) chooseOpt(b.dataset.k, +b.dataset.i);
  else if(b.classList.contains("mic")) mic(b);
});

document.addEventListener("change", function(ev){
  var k = ev.target.dataset.f;
  if(!k) return;
  var fl = Array.from(ev.target.files);
  ev.target.value = "";
  try { fl.forEach(validateFile); } catch(e){ toast(e.message); return; }
  if(k === "clogo"){
    if(!fl[0]) return;
    idbStore("clogo", fl[0]);
    compFile = null;
    normImg(fl[0]).then(function(b){ compFile = b; });
    readU(fl[0], function(u){
      cLogoU = u;
      $("cprev").src = u;
      $("cprev").hidden = false;
      extractLogoColors(u).then(function(cols){
        if(cols){
          $("cm").textContent = "Logo terpasang (" + fl[0].name + ") · Warna terdeteksi: " + cols.c1 + " & " + cols.c2;
          if(comp){
            comp.logo = u;
            comp.dna.c1 = cols.c1;
            comp.dna.c2 = cols.c2;
            renderC(comp.dna);
          }
        } else {
          $("cm").textContent = "Logo terpasang: " + fl[0].name;
          if(comp){ comp.logo = u; renderC(comp.dna); }
        }
      });
    });
    return;
  }
  if(k === "fontup"){ loadFont(fl[0]); return; }
  if(k === "logo"){
    idbStore("logo", fl[0]);
    readU(fl[0], applyLogoURL);
    return;
  }
  var key = k === "box" ? cur : "brief";
  Promise.all(fl.map(normImg)).then(function(a){
    files[key] = (files[key] || []).concat(a);
    showF();
  });
});

document.addEventListener("click", function(ev){
  var lb = ev.target.closest(".bx.lk");
  if(lb && !ev.target.closest(".ed")) toast("Kotak terkunci. Selesaikan dulu kotak " + BX[first()].n + ": " + BX[first()].t);
});

exposeFn({
  micBase: {get:()=>micBase, set:v=>{micBase=v}},
  recog: {get:()=>recog, set:v=>{recog=v}},
  sync: {get:()=>sync, set:v=>{sync=v}},
  applyColor: {get:()=>applyColor, set:v=>{applyColor=v}},
  restoreBlobs: {get:()=>restoreBlobs, set:v=>{restoreBlobs=v}},
  showF: {get:()=>showF, set:v=>{showF=v}},
  first: {get:()=>first, set:v=>{first=v}},
  applyLock: {get:()=>applyLock, set:v=>{applyLock=v}},
  toast: {get:()=>toast, set:v=>{toast=v}},
  onAll12Done: {get:()=>onAll12Done, set:v=>{onAll12Done=v}},
  segScore: {get:()=>segScore, set:v=>{segScore=v}},
  segTxt: {get:()=>segTxt, set:v=>{segTxt=v}},
  seg: {get:()=>seg, set:v=>{seg=v}},
  dom: {get:()=>dom, set:v=>{dom=v}},
  renderC: {get:()=>renderC, set:v=>{renderC=v}},
  lockUI: {get:()=>lockUI, set:v=>{lockUI=v}},
  goNext: {get:()=>goNext, set:v=>{goNext=v}},
  afterLock: {get:()=>afterLock, set:v=>{afterLock=v}},
  boxMiss: {get:()=>boxMiss, set:v=>{boxMiss=v}},
  readU: {get:()=>readU, set:v=>{readU=v}},
  applyLogoURL: {get:()=>applyLogoURL, set:v=>{applyLogoURL=v}},
  initMic: {get:()=>initMic, set:v=>{initMic=v}},
  mic: {get:()=>mic, set:v=>{mic=v}},
  normImg: {get:()=>normImg, set:v=>{normImg=v}},
  applyFont: {get:()=>applyFont, set:v=>{applyFont=v}},
  loadFont: {get:()=>loadFont, set:v=>{loadFont=v}},
  loadGoogleFont: {get:()=>loadGoogleFont, set:v=>{loadGoogleFont=v}}
});
