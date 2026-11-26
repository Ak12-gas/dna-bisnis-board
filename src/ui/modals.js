/* === FILE: src/ui/modals.js === */
import { exposeFn } from '../core/state.js';

var MODALS = [];
function visFocusables(m){
  return Array.prototype.slice.call(m.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'))
    .filter(function(x){ return x.offsetParent !== null || x === document.activeElement; });
}
export function openModal(id, opts){
  var m = $(id);
  if(!m || MODALS.indexOf(id) >= 0) return;
  m._returnFocus = document.activeElement;
  m.style.display = "block";
  m.setAttribute("role", "dialog");
  m.setAttribute("aria-modal", "true");
  if(opts && opts.labelledby) m.setAttribute("aria-labelledby", opts.labelledby);
  if(opts && opts.title){ var t = m.querySelector("b"); if(t) t.textContent = opts.title; }
  MODALS.push(id);
  var f = visFocusables(m);
  if(f[0]) f[0].focus();
}
export function closeModal(id){
  var m = $(id);
  if(!m) return;
  m.style.display = "none";
  var i = MODALS.indexOf(id);
  if(i >= 0) MODALS.splice(i, 1);
  var back = m._returnFocus;
  if(back && back.focus && document.contains(back)) back.focus();
  m._returnFocus = null;
}
function escHandler(ev){
  var id = MODALS[MODALS.length - 1];
  if(!id) return;
  var m = $(id);
  if(!m || m.style.display !== "block"){ MODALS.pop(); return; }
  if(ev.key === "Escape"){ if(id === "keyModal" && keyModalClose) keyModalClose(); else closeModal(id); return; }
  if(ev.key !== "Tab") return;
  var f = visFocusables(m);
  if(!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if(!m.contains(document.activeElement)){ ev.preventDefault(); first.focus(); return; }
  if(ev.shiftKey && document.activeElement === first){ ev.preventDefault(); last.focus(); }
  else if(!ev.shiftKey && document.activeElement === last){ ev.preventDefault(); first.focus(); }
}
document.addEventListener("keydown", escHandler);

export function openM(){
  lockUI();
  if(comp){
    $("cn").value = comp.name;
    if(comp.logo){
      $("cprev").src = comp.logo;
      $("cprev").hidden = false;
    }
    renderC(comp.dna);
  }
  openModal("md");
}

export function openSeg(){
  var q = window.segInfo;
  if(!q){ toast("Belum ada analisa segmen. Gunakan Rekomendasi dulu."); return; }
  $("sgt").textContent = "Analisa Segmen: " + q.seg + " (skor " + q.avg.toFixed(1) + "/5)";
  $("sgb").innerHTML = '<div style="font-size:13px;color:var(--mute);margin-bottom:8px">Segmen dikunci setara dengan kompetitor (' + esc(q.seg) + ') agar bersaing langsung (apple-to-apple) di benak pelanggan yang sama, berbeda pada Positioning dan User Spesifik.</div>' +
    q.rows.map(function(x){ return '<div style="margin:10px 0"><b>' + esc(RL[x.k]) + ' - ' + x.n + '/5</b><br>' + esc(x.a) + '</div>'; }).join("");
  openModal("sgm");
}

export function renderCP(){
  var W = CP.m === "warna", labs = W ? ["Warna Utama","Warna Kedua"] : ["Latar 1","Latar 2","Latar 3"];
  var n = fld("nama").textContent.trim(), tg = fld("tagline").textContent.trim();
  $("cpt").textContent = W ? "Pilih Kombinasi Warna Sendiri" : "Pilih Warna Background Logo";
  var h = '<div class="row" style="margin:0 0 8px">' + CP.v.map(function(v, i){
    return '<button class="cps' + (i === CP.slot ? " p" : "") + '" data-i="'+i+'">' + labs[i] + '</button>';
  }).join("") + '</div><div class="msg" style="margin-bottom:6px">Ketuk slot, lalu pilih warna dari daftar atau warna kustom.</div><div class="cpg">' +
    COL.map(function(c, i){
      return '<button class="cpc" data-i="'+i+'" style="background:'+c[1]+';color:'+(lumi(c[1])>.6?"#111":"#fff")+'"><b>'+c[0]+'</b><br><span>'+c[2]+'</span></button>';
    }).join("") + '</div><div class="row" style="margin-top:10px">Kustom: <input type="color" id="cpcol" value="'+CP.v[CP.slot].toLowerCase()+'"><span class="msg">' + CP.v[CP.slot] + '</span></div>';
  if(W){
    h += '<div class="vars" style="grid-template-columns:1fr 1fr">' + CP.v.map(function(v){
      var c = near(v);
      return '<div class="tile" style="background:'+v+';color:'+(lumi(v)>.6?"#111":"#fff")+'"><div class="tn" style="font-size:18px">'+v+'</div><div class="tt">'+c[0]+' = '+c[2]+'</div></div>';
    }).join("") + '</div><div style="margin-top:8px;font-size:13px"><b>Filosofi warna:</b> ' + esc(philo(CP.v)) + '</div>';
  } else {
    h += '<div class="vars">' + CP.v.map(function(v){
      var lt = lumi(v) >= .6;
      return '<div class="tile" style="background:'+v+';color:'+(lt?dk(v,.2):"#FFFFFF")+'">' +
        (logo && vcol[lt ? 2 : 1] ? '<img src="'+vcol[lt ? 2 : 1]+'">' : '<div class="tn">' + esc(n || "BRAND") + '</div>') +
        (tg ? '<div class="tt">' + esc(tg) + '</div>' : '') + '</div>';
    }).join("") + '</div>';
  }
  $("cpb").innerHTML = h;
}

export function openCP(m){
  var i = idx(m);
  if(i > first()){ toast("Selesaikan dulu kotak sebelumnya."); return; }
  if(!started[m] && !conf[m]){ started[m] = true; applyLock(); }
  var g = function(id, d){ var v = fld(id).textContent.trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : d; };
  CP.m = m;
  CP.slot = 0;
  if(m === "warna") CP.v = [g("c1","#E53935"), g("c2","#43A047")];
  else {
    var L = localBg()[0];
    CP.v = [g("bg1",L.bg1), g("bg2",L.bg2), g("bg3",L.bg3)];
    /* ponytail: nilai tersimpan yang sama bertiga membuka picker dengan 3 tile identik; pakai turunan korporat yang selalu beda. */
    if(new Set(CP.v.map(function(v){ return String(v).toLowerCase(); })).size < 3) CP.v = [L.bg1,L.bg2,L.bg3];
  }
  renderCP();
  openModal("cpm");
}

export function JAMX(){
  return jamVal ? ' JAM BERJUALAN brand pengguna: ' + jamVal + '. Jadikan jam ini dasar analisa ritual user spesifik pada jam itu. Tulis analisanya 2-3 kalimat dalam Bahasa Indonesia pada key analisa_jam.' : '';
}

export function openJam(){
  if(idx("user") > first()){ toast("Selesaikan dulu kotak sebelumnya."); return; }
  if(!started.user && !conf.user){ started.user = true; applyLock(); }
  var m = jamVal.match(/(\d\d)\.(\d\d)-(\d\d)\.(\d\d)/);
  $("jm1").value = m ? m[1] + ":" + m[2] : "";
  $("jm2").value = m ? m[3] + ":" + m[4] : "";
  $("jmr").textContent = jamAna ? "Analisa jam " + jamVal + ":\n" + jamAna : "";
  openModal("jmm");
}

export function dom0(){ return fld("web").textContent.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]; }

export function whoLink(d){ return "https://who.is/whois/" + encodeURIComponent(d); }

export function domAlts(){
  var d = dom0(), k = fld("kunci").textContent.toLowerCase().replace(/[^a-z0-9]/g, "") || d.replace(/\.(co\.id|web\.id|id)$/, "");
  var br = fld("nama").textContent.trim().toLowerCase().replace(/[^a-z0-9]/g, ""), seen = {};
  seen[d] = 1;
  return [k+".co.id", k+"ku.id", "beli"+k+".id", br && br !== k ? br+k+".id" : "", k+"indonesia.id", k+".web.id"].filter(function(x){
    if(!x || seen[x]) return false;
    seen[x] = 1;
    return true;
  }).slice(0, 5);
}

export function openDom(){
  var d = dom0();
  if(!d) return;
  var A = function(x){ return '<a href="' + whoLink(x) + '" target="_blank" rel="noopener noreferrer">Cek ↗</a>'; };
  $("dmt").textContent = "Cek domain www." + d;
  $("dmb").innerHTML = '<div class="msg" style="margin-bottom:8px">Ketuk Cek untuk melihat statusnya di WHOIS. Jika sudah terdaftar orang lain, pilih alternatif di bawah.</div><div style="margin:8px 0"><b>www.' + esc(d) + '</b> ' + A(d) + '</div><div class="msg">Alternatif domain:</div>' +
    domAlts().map(function(x){ return '<div style="margin:8px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:150px">www.' + esc(x) + '</span>' + A(x) + '<button class="dpk" data-d="' + esc(x) + '">Pakai</button></div>'; }).join("") +
    '<div class="msg" style="margin-top:8px">Cek resmi domain .id: <a href="https://pandi.id/whois/" target="_blank" rel="noopener noreferrer">pandi.id/whois ↗</a></div>';
  openModal("dmn");
}

$("sgx").onclick = function(){ closeModal("sgm"); };

document.addEventListener("change", function(e){
  if(e.target.id === "cpcol"){ CP.v[CP.slot] = e.target.value.toUpperCase(); renderCP(); }
});

$("cpx").onclick = function(){ closeModal("cpm"); };

$("cpok").onclick = function(){
  var m = CP.m;
  if(m === "warna"){
    t8FillField("c1", CP.v[0]);
    t8FillField("c2", CP.v[1]);
    t8FillField("filw", philo(CP.v));
  } else {
    CP.v.forEach(function(v, i){ t8FillField("bg"+(i+1), v); });
  }
  sync();
  closeModal("cpm");
  if(!conf[m]){
    conf[m] = true;
    applyLock();
    toast("Pilihan warna diterapkan dan dikunci." + nextHint(m));
    autoAdv(m);
  } else {
    toast("Pilihan warna diterapkan.");
  }
};

$("jmx").onclick = function(){ closeModal("jmm"); };

$("jmok").onclick = async function(){
  var a = $("jm1").value, b = $("jm2").value, btn = this;
  if(!a || !b){ $("jmr").textContent = "Isi jam buka dan jam tutup."; return; }
  jamVal = a.replace(":", ".") + "-" + b.replace(":", ".") + " WIB";
  var o = $("ow6");
  if(o) o.value = jamVal;
  btn.disabled = true;
  $("jmr").textContent = "Menganalisa ritual pelanggan pada jam " + jamVal + "…";
  try {
    var old = {t:fld("usertitle").textContent.trim(), u:fld("usia").textContent.trim(), s:fld("usersub").textContent.trim()};
    var r = await mkUser("");
    applyUser(r);
    genUserOpts([old].concat(userOpts));
    $("jmr").textContent = jamAna ? "Analisa jam " + jamVal + ":\n" + jamAna : "Selesai.";
  } catch(x){
    $("jmr").textContent = "Gagal: " + (x && x.message || x);
  }
  btn.disabled = false;
};

$("dmx").onclick = function(){ closeModal("dmn"); };

$("tgx").onclick = function(){ closeModal("tgm"); };

exposeFn({
  openModal: {get:()=>openModal, set:v=>{openModal=v}},
  closeModal: {get:()=>closeModal, set:v=>{closeModal=v}},
  openM: {get:()=>openM, set:v=>{openM=v}},
  openSeg: {get:()=>openSeg, set:v=>{openSeg=v}},
  renderCP: {get:()=>renderCP, set:v=>{renderCP=v}},
  openCP: {get:()=>openCP, set:v=>{openCP=v}},
  JAMX: {get:()=>JAMX, set:v=>{JAMX=v}},
  openJam: {get:()=>openJam, set:v=>{openJam=v}},
  dom0: {get:()=>dom0, set:v=>{dom0=v}},
  whoLink: {get:()=>whoLink, set:v=>{whoLink=v}},
  domAlts: {get:()=>domAlts, set:v=>{domAlts=v}},
  openDom: {get:()=>openDom, set:v=>{openDom=v}}
});
