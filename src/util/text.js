import { exposeFn } from '../core/state.js';

export function parseJSON(raw){
  var t = String(raw || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try { return JSON.parse(t); } catch(e){}
  var a = t.indexOf("{"), b = t.indexOf("[");
  var st = (a === -1) ? b : (b === -1 ? a : Math.min(a, b));
  if(st > -1){
    var ec = t[st] === "{" ? "}" : "]";
    var en = t.lastIndexOf(ec);
    if(en > st){
      try { return JSON.parse(t.slice(st, en + 1)); } catch(e2){}
    }
  }
  var err = new Error("Format JSON dari AI tidak valid.");
  err.code = "invalid_json";
  throw err;
}

export var GENDER_RX = /^(WANITA|PEREMPUAN|PRIA|LAKI|LAKI-LAKI|IBU|BAPAK|GADIS)\b/i;

export function withGender(title, gender){
  var t = String(title == null ? "" : title).trim();
  var g = String(gender == null ? "" : gender).trim();
  if(!t || !g || GENDER_RX.test(t)) return t;
  return g.toUpperCase() + " " + t;
}

export function t10Esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];
  });
}

export function t11Esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];
  });
}

export function t13Esc(v){
  var m = {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"};
  return String(v == null ? "" : v).replace(/[&<>"']/g, function(c){ return m[c]; });
}

export function t14Esc(v){
  return String(v == null ? "" : v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

export function t15Redact(v, key){
  var out = String(v == null ? "" : v);
  if(key) out = out.split(key).join("[dikunci]");
  return out;
}

exposeFn({
  parseJSON: {get:()=>parseJSON, set:v=>{parseJSON=v}},
  GENDER_RX: {get:()=>GENDER_RX, set:v=>{GENDER_RX=v}},
  withGender: {get:()=>withGender, set:v=>{withGender=v}},
  t10Esc: {get:()=>t10Esc, set:v=>{t10Esc=v}},
  t11Esc: {get:()=>t11Esc, set:v=>{t11Esc=v}},
  t13Esc: {get:()=>t13Esc, set:v=>{t13Esc=v}},
  t14Esc: {get:()=>t14Esc, set:v=>{t14Esc=v}},
  t15Redact: {get:()=>t15Redact, set:v=>{t15Redact=v}}
});
