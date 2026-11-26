/* === FILE: src/ui/export.js === */
import { exposeFn } from '../core/state.js';



export function prepareForCapture(root, nodes){
  var list = Array.prototype.slice.call(nodes || []);
  var was = list.map(function(n){ return n.classList.contains("sel"); });
  root.classList.add("capturing");
  list.forEach(function(n){ n.classList.remove("sel"); });
  return function restore(){
    root.classList.remove("capturing");
    list.forEach(function(n, i){ if(was[i]) n.classList.add("sel"); });
  };
}

export async function H2C(el, sc){
  /* ponytail: satu tempat membersihkan state untuk semua export; state dikembalikan setelahnya. */
  var root = document.documentElement, active = document.activeElement;
  if(active && active.blur) active.blur();
  var sel = document.querySelectorAll ? document.querySelectorAll(".bx.sel") : [];
  var restore = prepareForCapture(root, sel);
  try {
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise(function(r){
      requestAnimationFrame(function(){ requestAnimationFrame(r); });
    });
    return await html2canvas(el, {
      scale: sc,
      backgroundColor: "#ffffff",
      useCORS: true,
      onclone: function(d){
        var w = d.defaultView;
        d.querySelectorAll("#board *,#crb *,#mbd *").forEach(function(n){
          var cs = w.getComputedStyle(n);
          if(cs.letterSpacing === "normal" || cs.letterSpacing === "0px") n.style.letterSpacing = "0.01px";
        });
      }
    });
  } finally {
    restore();
  }
}

export async function saveBlob(filename, blob){
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function dlC(full){
  var m = $("cm");
  if(!comp) return;
  m.textContent = "Membuat PDF…";
  var el = $("crb"), dt = el.querySelector("details");
  try {
    el.classList.toggle("short", !full);
    if(dt) dt.open = !!full;
    var c = await H2C(el, 2);
    var J = window.jspdf.jsPDF, w = c.width / 2, h = c.height / 2;
    var pdf = new J({unit:"px", format:[w, h], orientation: w > h ? "l" : "p", hotfixes:["px_scaling"]});
    pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
    await saveBlob("DNA-Kompetitor-" + comp.name.replace(/[^\w-]+/g, "-") + (full ? "-Lengkap" : "-Ringkas") + ".pdf", pdf.output("blob"));
    m.textContent = "Selesai.";
  } catch(x){
    m.textContent = "Gagal download: " + (x && x.message || x);
  }
  el.classList.remove("short");
  if(dt) dt.open = false;
}

export function fallbackMark(){
  var a = hexOr("c1","#E61D4C"), b = hexOr("c2","#28623C");
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="24" y="24" width="152" height="152" rx="44" fill="'+a+'"/><path d="M100 48C130 78 144 102 144 124A44 44 0 0 1 56 124C56 102 70 78 100 48Z" fill="#FFFFFF"/><path d="M100 84C116 102 124 114 124 126A24 24 0 0 1 76 126C76 114 84 102 100 84Z" fill="'+b+'"/></svg>';
}

export async function mkMark(instr){
  /* === T9 HOOK: mkMark === */ if(BB.flags && BB.flags.t9) return mkMarkAgent(instr);
  var n = fld("nama").textContent.trim() || "Brand";
  var a = hexOr("c1","#E61D4C"), b = hexOr("c2","#28623C"), dkc = dk(a, .45);
  var kunci = fld("kunci").textContent.trim();
  var pos = fld("positioning").textContent.trim();
  var tg = fld("tagline").textContent.trim();
  var sg = fld("segmen").textContent.trim();
  var us = fld("usertitle").textContent.trim();
  var filw = fld("filw").textContent.trim();
  var web = fld("web").textContent.trim();
  var s = await getAI();
  var lim = await s.limits().catch(function(){ return {}; });
  var o = {cache:false, temp:0.55};
  if(lim.modelTiers && lim.modelTiers.indexOf("complex") > -1) o.modelTier = "complex";
  var promptLogo =
    'Kamu adalah Principal Brand Identity Designer tingkat internasional (sekelas Pentagram / Landor) yang merancang ikon logo untuk brand-brand besar nasional & global.\n' +
    'Semua 12 pilar DNA Bisnis brand sudah lengkap:\n' +
    '- Nama Brand: "' + n + '" (inisial utama: "' + n.charAt(0).toUpperCase() + '")\n' +
    '- Kategori / Kata Kunci: "' + kunci + '"\n' +
    '- Positioning: "' + pos + '"\n' +
    '- Tagline: "' + tg + '"\n' +
    '- Segmen & Target User: ' + sg + ' · ' + us + '\n' +
    '- Filosofi Warna: ' + filw + '\n' +
    '- Website: ' + web + '\n\n' +
    'TUGAS: Rancang SATU ICON LOGOMARK VEKTOR yang elegan, ikonik, simetris/seimbang, dan mudah dikenali dalam ukuran kecil maupun besar (seperti ikon Apple, Airbnb, Starbucks, atau Kopi Kenangan).\n' +
    'STANDAR DESAIN PROFESIONAL:\n' +
    '1. Gunakan perpaduan simbol visual kategori produk ("' + kunci + '") + monogram huruf "' + n.charAt(0).toUpperCase() + '" atau metafora keunggulan positioning ("' + pos + '") dengan teknik negative space dan kurva Bezier yang halus.\n' +
    '2. DILARANG membuat bentuk acak/segitiga asal-asalan. Bangun siluet utama yang kokoh di dalam area x:24..176, y:24..176 pada viewBox="0 0 200 200" (gunakan 4-9 elemen SVG bersih: <path>, <circle>, <rect rx="..."> dengan stroke-linecap="round" stroke-linejoin="round").\n' +
    '3. TANPA teks tulisan, TANPA gradien, TANPA filter.\n' +
    '4. Palet warna HANYA dari warna korporat brand: ' + a + ', ' + b + ', #FFFFFF, dan ' + dkc + '.\n' +
    (instr ? '5. Arahan khusus: ' + instr + '\n' : '') +
    '\nJawab dengan format PERSIS:\nKONSEP: [penjelasan filosofi bentuk ikon dalam 1 kalimat Bahasa Indonesia]\n<svg viewBox="0 0 200 200">...</svg>';
  var r = await s(promptLogo, o);
  var t = r.text || "", svg = cleanSVG(t);
  if(!svg) throw new Error("SVG logomark tidak valid");
  var k = t.match(/KONSEP:\s*(.*)/);
  return {svg: svg, konsep: k ? k[1].trim() : "Simbol visual ikonik berbasis karakter & filosofi " + n};
}

export async function genMarkBG(force, instr){
  if(markBusy || (markSVG && !force)) return;
  markBusy = true;
  sync();
  $("mbc").textContent = "Konsultan AI sedang merancang icon logo profesional…";
  try {
    var r = await mkMark(instr || "");
    /* === T9 HOOK: genMarkBG === */ t9SetMark(r.svg, r.konsep);
    markSVG = r.svg;
    markConcept = r.konsep;
    toast("✨ Icon logo profesional berhasil dirancang!");
  } catch(x){
    toast("Logomark AI gagal (" + (x && x.message || x) + "). Memakai logomark cadangan.");
    if(!markSVG || force){
      markSVG = fallbackMark();
      markConcept = "Logomark geometris selaras warna korporat brand.";
      /* === T9 HOOK: genMarkBG === */ t9SetMark(markSVG, markConcept);
    }
  }
  markBusy = false;
  sync();
  renderMood();
}

export function moodHTML(){
  var n = esc((fld("nama").textContent.trim() || "BRAND").toUpperCase());
  var tg = esc(fld("tagline").textContent.trim());
  var a = hexOr("c1","#E61D4C"), b = hexOr("c2","#28623C");
  var sv = markSVG || fallbackMark();
  var mk = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sv);
  var dkc = dk(a, .45);
  var sw = function(c, nm){
    var r = rgb(c);
    return '<div><div style="height:46px;background:'+c+';border:1px solid #0002"></div><div style="font-size:11px;margin-top:6px">'+nm+'</div><div style="font-size:10px;opacity:.7">RGB: '+r.join(", ")+'<br>HEX: '+c+'</div></div>';
  };
  var H = function(t){ return '<div style="font-size:12px;letter-spacing:3px;opacity:.6;margin:0 0 14px">'+t+'</div>'; };
  var hr = '<div style="height:1px;background:'+dkc+';opacity:.4;margin:22px 0"></div>';
  var fn = esc((fld("font").textContent.trim() || "Font").split(/[(,]/)[0].trim()).toUpperCase();
  var ls = 'font-weight:700;letter-spacing:2px;color:' + a;
  return '<div id="mbd" style="background:#FFF8E8;color:'+dkc+';padding:26px 24px;text-align:center;font-family:var(--bf,Fredoka),Fredoka,sans-serif">' +
    H("MAIN LOGO") + '<img src="'+mk+'" style="width:120px;height:120px"><div style="font-weight:700;font-size:34px;letter-spacing:4px;color:'+a+';margin-top:6px">'+n+'</div><div style="font-size:13px;letter-spacing:2px;margin-top:4px">'+tg+'</div>' + hr +
    H("SECONDARY LOGO") + '<div style="display:flex;align-items:center;justify-content:center;gap:14px"><img src="'+mk+'" style="width:72px;height:72px"><div style="text-align:left"><div style="font-size:28px;'+ls+'">'+n+'</div><div style="font-size:11px;letter-spacing:2px">'+tg+'</div></div></div>' + hr +
    H("SUB MARK LOGOS") + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;align-items:center"><div><div style="font-size:20px;'+ls+'">'+n+'</div><div style="font-size:9px;letter-spacing:2px">'+tg+'</div></div><div style="border:2px solid '+dkc+';border-radius:60px 60px 8px 8px;padding:14px 6px 8px"><img src="'+mk+'" style="width:56px;height:56px"><div style="font-size:9px;letter-spacing:2px;font-weight:700">'+n+'</div></div><div style="border:2px solid '+dkc+';border-radius:50%;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center"><img src="'+mk+'" style="width:56px;height:56px"><div style="font-size:9px;letter-spacing:2px;font-weight:700">'+n+'</div></div></div>' + hr +
    H("COLOR") + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' + sw(a,near(a)[0]) + sw(b,near(b)[0]) + sw(mixc(a,"#FFFFFF"),"Tint") + sw(dkc,"Dark") + '</div>' + hr +
    H("TYPEFACE") + '<div style="font-size:13px;letter-spacing:2px;margin-bottom:10px">'+fn+'</div><div style="font-size:24px;line-height:1.45;letter-spacing:2px">ABCDEFGHIJKLMN<br>OPQRSTUVWXYZ<br>abcdefghijklmn<br>opqrstuvwxyz<br>1234567890</div>' +
    '<div style="margin:22px -24px -26px;background:'+mixc(b,"#FFFFFF")+';padding:12px;font-size:11px;letter-spacing:3px">BRANDING BY '+n+'</div></div>';
}

export function moodSVG(){
  var n = esc((fld("nama").textContent.trim() || "BRAND").toUpperCase());
  var tg = esc(fld("tagline").textContent.trim());
  var a = hexOr("c1","#E61D4C"), b = hexOr("c2","#28623C"), dkc = dk(a, .45);
  var sv = markSVG || fallbackMark();
  var fam = esc(fld("font").textContent.trim().split(/[(,]/)[0].trim() || "Fredoka");
  var pl = function(x, y, z){ return sv.replace("<svg ", '<svg x="'+x+'" y="'+y+'" width="'+z+'" height="'+z+'" '); };
  var T = function(x, y, sz, t, o){
    o = o || {};
    return '<text x="'+x+'" y="'+y+'" font-size="'+sz+'" font-family="\''+fam+'\', sans-serif" font-weight="'+(o.w||400)+'" letter-spacing="'+(o.ls||0)+'" text-anchor="'+(o.a||"middle")+'" fill="'+(o.c||dkc)+'">'+t+'</text>';
  };
  var L = function(y){ return '<line x1="40" x2="520" y1="'+y+'" y2="'+y+'" stroke="'+dkc+'" stroke-opacity=".4"/>'; };
  var sw = function(x, c, nm){
    var r = rgb(c);
    return '<rect x="'+x+'" y="675" width="110" height="46" fill="'+c+'" stroke="#00000022"/>' + T(x+55,741,11,nm) + T(x+55,757,10,"RGB: "+r.join(", ")) + T(x+55,771,10,"HEX: "+c);
  };
  var AL = ["ABCDEFGHIJKLMN","OPQRSTUVWXYZ","abcdefghijklmn","opqrstuvwxyz","1234567890"];
  return '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="1180" viewBox="0 0 560 1180"><rect width="560" height="1180" fill="#FFF8E8"/>' +
    T(280,44,12,"MAIN LOGO",{ls:3}) + pl(220,60,120) + T(280,226,34,n,{w:700,ls:4,c:a}) + T(280,250,13,tg,{ls:2}) + L(280) +
    T(280,312,12,"SECONDARY LOGO",{ls:3}) + pl(120,330,72) + T(206,370,28,n,{w:700,ls:2,c:a,a:"start"}) + T(206,392,11,tg,{ls:2,a:"start"}) + L(430) +
    T(280,462,12,"SUB MARK LOGOS",{ls:3}) + T(95,540,20,n,{w:700,ls:2,c:a}) + T(95,558,9,tg,{ls:2}) +
    '<rect x="205" y="490" width="100" height="110" rx="45" fill="none" stroke="'+dkc+'" stroke-width="2"/>' + pl(227,505,56) + T(255,585,9,n,{w:700,ls:2}) +
    '<circle cx="430" cy="545" r="55" fill="none" stroke="'+dkc+'" stroke-width="2"/>' + pl(402,512,56) + T(430,585,9,n,{w:700,ls:2}) + L(625) +
    T(280,655,12,"COLOR",{ls:3}) + sw(40,a,near(a)[0]) + sw(165,b,near(b)[0]) + sw(290,mixc(a,"#FFFFFF"),"Tint") + sw(415,dkc,"Dark") + L(800) +
    T(280,835,12,"TYPEFACE",{ls:3}) + T(280,862,13,fam.toUpperCase(),{ls:2}) + AL.map(function(t, i){ return T(280,905+i*35,26,t,{ls:2}); }).join("") +
    '<rect y="1110" width="560" height="70" fill="'+mixc(b,"#FFFFFF")+'"/>' + T(280,1150,11,"BRANDING BY "+n,{ls:3}) + '</svg>';
}

export function renderMood(){
  if($("mbm").style.display !== "block") return;
  $("mbv").innerHTML = moodHTML();
  $("mbc").textContent = markBusy ? "Menggambar logomark…" : (markConcept ? "Konsep logomark: " + markConcept : "");
}

export function openMood(){
  if(!fld("nama").textContent.trim()){ toast("Isi nama brand dulu."); return; }
  openModal("mbm");
  renderMood();
  if(!markSVG) genMarkBG(true);
}

export async function doDl(t){
  var nm = (fld("nama").textContent.trim() || "brand").replace(/[^\w-]+/g, "-");
  try {
    if(t === "png"){
      var c = await H2C($("mbd"), 2);
      var bl = await new Promise(function(r){ c.toBlob(r, "image/png"); });
      await saveBlob("Moodboard-" + nm + ".png", bl);
    } else {
      await saveBlob("Moodboard-" + nm + ".svg", new Blob([moodSVG()], {type:"image/svg+xml"}));
    }
    toast("Selesai.");
  } catch(x){
    toast("Gagal download: " + (x && x.message || x));
  }
}

$("dl").onclick = async function(){
  var m = $("dm");
  m.textContent = "Membuat gambar…";
  try {
    var c = await H2C($("board"), 2);
    var bl = await new Promise(function(r){ c.toBlob(r, "image/png"); });
    await saveBlob("DNA-Bisnis-Board-" + (fld("nama").textContent.trim() || "brand").replace(/[^\w-]+/g, "-") + ".png", bl);
    m.textContent = "Selesai.";
  } catch(x){
    m.textContent = "Gagal download: " + (x && x.message || x);
  }
};

$("pr").onclick = async function(){
  var m = $("dm");
  m.dataset.busy = "1";
  m.textContent = "Membuat PDF…";
  try {
    var el = $("board"), sc = Math.min(2, 8000 / el.scrollHeight);
    var c = await H2C(el, sc);
    var J = window.jspdf.jsPDF, w = c.width / sc, h = c.height / sc;
    var pdf = new J({unit:"px", format:[w, h], orientation: w > h ? "l" : "p", hotfixes:["px_scaling"]});
    pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
    await saveBlob("DNA-Bisnis-Board-" + (fld("nama").textContent.trim() || "brand").replace(/[^\w-]+/g, "-") + ".pdf", pdf.output("blob"));
    m.textContent = "Selesai.";
  } catch(x){
    m.textContent = "Gagal PDF: " + (x && x.message || x);
  }
  delete m.dataset.busy;
};

$("cd").onclick = function(){ dlC(false); };

$("cd2").onclick = function(){ dlC(true); };

$("mbx").onclick = function(){ closeModal("mbm"); };

$("mbn").onclick = function(){ genMarkBG(true, "Buat konsep icon logo profesional baru yang berbeda dari sebelumnya."); };

$("mbpng").onclick = function(){ doDl("png"); };

$("mbvec").onclick = function(){ doDl("vec"); };

exposeFn({
  H2C: {get:()=>H2C, set:v=>{H2C=v}},
  saveBlob: {get:()=>saveBlob, set:v=>{saveBlob=v}},
  dlC: {get:()=>dlC, set:v=>{dlC=v}},
  fallbackMark: {get:()=>fallbackMark, set:v=>{fallbackMark=v}},
  mkMark: {get:()=>mkMark, set:v=>{mkMark=v}},
  genMarkBG: {get:()=>genMarkBG, set:v=>{genMarkBG=v}},
  moodHTML: {get:()=>moodHTML, set:v=>{moodHTML=v}},
  moodSVG: {get:()=>moodSVG, set:v=>{moodSVG=v}},
  renderMood: {get:()=>renderMood, set:v=>{renderMood=v}},
  openMood: {get:()=>openMood, set:v=>{openMood=v}},
  doDl: {get:()=>doDl, set:v=>{doDl=v}}
});
