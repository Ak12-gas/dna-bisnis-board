import { exposeFn } from '../core/state.js';

export var $ = function(i){ return document.getElementById(i); };

export function fld(id){ return document.querySelector('[data-f="'+id+'"]'); }

export function e(id, ph, cl){
  return '<span class="e '+(cl||"")+'" contenteditable="plaintext-only" role="textbox" aria-label="'+ph+'" data-f="'+id+'" data-ph="'+ph+'"></span>';
}

export function ol(p, n){
  var s = "<ol>";
  for(var i=1; i<=n; i++) s += "<li>"+e(p+i,"…")+"</li>";
  return s + "</ol>";
}

export function bx(k, inner, cl){
  var b = BX.filter(function(x){ return x.k === k; })[0];
  return '<div class="bx '+(cl||"")+'" data-k="'+k+'">' +
    '<span class="nb" data-html2canvas-ignore>'+b.n+'</span>' +
    '<button class="ed" data-html2canvas-ignore title="Prompt kotak ini" aria-label="Prompt kotak ini">✎</button>' +
    '<div class="choice" data-html2canvas-ignore hidden>' +
      '<button class="p bRec" data-k="'+k+'">✨ Gunakan Rekomendasi</button>' +
      '<button class="bOwn" data-k="'+k+'">✍ Prompt Sendiri</button>' +
    '</div>' + inner + '</div>';
}

export function esc(x){
  return String(x == null ? "" : x).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;"}[c];
  });
}

export function lis(a){
  return "<ol>" + (Array.isArray(a) ? a : []).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
}

export function cleanSVG(t){
  var m = String(t).match(/<svg[\s\S]*?<\/svg>/i);
  if(!m) return "";
  var doc = new DOMParser().parseFromString(m[0], "image/svg+xml");
  if(doc.querySelector("parsererror")) return "";
  var root = doc.documentElement;
  if(!root || root.nodeName !== "svg") return "";
  var OT = "g path circle ellipse rect polygon polyline line defs clippath".split(" ");
  var OA = "d cx cy r rx ry x y width height points fill stroke stroke-width stroke-linecap stroke-linejoin opacity fill-opacity stroke-opacity transform id clip-path fill-rule clip-rule x1 y1 x2 y2".split(" ");
  function walk(n){
    var nm = n.nodeName;
    if(OT.indexOf(nm.toLowerCase()) < 0) return "";
    var a = "";
    for(var i=0; i<n.attributes.length; i++){
      var at = n.attributes[i], an = at.name.toLowerCase(), v = at.value;
      if(OA.indexOf(an) < 0) continue;
      if(/javascript|data:|http|<|>/i.test(v)) continue;
      if(/url\(/i.test(v) && an !== "clip-path") continue;
      a += " " + an + '="' + v.replace(/"/g, "&quot;") + '"';
    }
    var k = "";
    for(var c=n.firstChild; c; c=c.nextSibling) if(c.nodeType === 1) k += walk(c);
    return "<" + nm + a + ">" + k + "</" + nm + ">";
  }
  var body = "";
  for(var c=root.firstChild; c; c=c.nextSibling) if(c.nodeType === 1) body += walk(c);
  return body ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' + body + '</svg>' : "";
}

export function pastePlain(ev){
  var t = ev.target;
  if(!t || !t.isContentEditable) return;
  var d = ev.clipboardData || (window.clipboardData || null);
  if(!d) return;
  ev.preventDefault();
  var txt = d.getData("text/plain").replace(/[\r\n]+/g, " ");
  if(txt) document.execCommand("insertText", false, txt);
}

export function noParagraph(ev){
  var t = ev.target;
  if(!t || !t.isContentEditable) return;
  if(ev.inputType === "insertParagraph" || ev.inputType === "insertLineBreak") ev.preventDefault();
}

export function t8FillField(key, val){
  var el = fld(key);
  if(el) el.textContent = val;
  if(typeof BB !== "undefined" && BB){
    var path = typeof BB_FIELD === "function" ? BB_FIELD(key) : null;
    if(path && typeof BB_SET === "function") BB_SET(path, val);
    else BB[key] = val;
  }
}

exposeFn({
  $: {get:()=>$, set:v=>{$=v}},
  fld: {get:()=>fld, set:v=>{fld=v}},
  e: {get:()=>e, set:v=>{e=v}},
  ol: {get:()=>ol, set:v=>{ol=v}},
  bx: {get:()=>bx, set:v=>{bx=v}},
  esc: {get:()=>esc, set:v=>{esc=v}},
  lis: {get:()=>lis, set:v=>{lis=v}},
  cleanSVG: {get:()=>cleanSVG, set:v=>{cleanSVG=v}},
  pastePlain: {get:()=>pastePlain, set:v=>{pastePlain=v}},
  noParagraph: {get:()=>noParagraph, set:v=>{noParagraph=v}},
  t8FillField: {get:()=>t8FillField, set:v=>{t8FillField=v}}
});

document.addEventListener("paste", pastePlain);

document.addEventListener("beforeinput", noParagraph);
