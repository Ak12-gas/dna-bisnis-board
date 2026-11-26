import { exposeFn } from '../core/state.js';

export function rgb(h){
  var n = parseInt(h.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

export function col(a){
  return "#" + a.map(function(v){
    return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
  }).join("").toUpperCase();
}

export function dk(h, f){ return col(rgb(h).map(function(v){ return v * f; })); }

export function mixc(a, b){
  var x = rgb(a), y = rgb(b);
  return col([(x[0]+y[0])/2, (x[1]+y[1])/2, (x[2]+y[2])/2]);
}

export function localBg(){
  var g = function(id){
    var v = fld(id).textContent.trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v : "#333333";
  };
  var A = g("c1"), B = g("c2");
  if(lumi(A) >= .72) A = dk(A, .5);
  if(lumi(B) >= .72) B = dk(B, .5);
  /* ponytail: fallback warna korporat identik diganti pasangan kontras; tanpa ini 5 opsi cuma 3 unik dan tampak sama. */
  if(String(A).toLowerCase() === String(B).toLowerCase()) B = String(A).toLowerCase() === "#28623c" ? "#e61d4c" : "#28623c";
  return [[A,B,dk(A,.6)], [B,A,dk(B,.6)], [dk(A,.6),A,B], [A,mixc(A,B),B], [dk(B,.6),B,A]].map(function(t){
    return {bg1:t[0], bg2:t[1], bg3:t[2]};
  });
}

export function lumi(h){
  var n = parseInt(h.slice(1), 16);
  return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
}

export function igu(u){
  u = String(u || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").split(/[\/?]/)[0];
  return /^[a-z0-9._]{1,30}$/i.test(u) ? u : "";
}

export function recolor(src, col, cb){
  var im = new Image();
  im.onload = function(){
    var c = document.createElement("canvas");
    c.width = im.width;
    c.height = im.height;
    var x = c.getContext("2d");
    x.drawImage(im, 0, 0);
    if(col){
      x.globalCompositeOperation = "source-in";
      x.fillStyle = col;
      x.fillRect(0, 0, c.width, c.height);
    }
    cb(c.toDataURL("image/png"));
  };
  im.src = src;
}

export function near(h){
  var a = rgb(h), b = COL[0], bd = 1e9;
  COL.forEach(function(c){
    var r = rgb(c[1]), d = (a[0]-r[0])*(a[0]-r[0]) + (a[1]-r[1])*(a[1]-r[1]) + (a[2]-r[2])*(a[2]-r[2]);
    if(d < bd){ bd = d; b = c; }
  });
  return b;
}

export function philo(arr){
  return arr.map(function(h){ var c = near(h); return c[0] + " = " + c[2]; }).join("; ");
}

export function hexOr(id, d){
  var el = fld(id), v = el ? el.textContent.trim() : "";
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : d;
}

export function extractLogoColors(dataUrl){
  return new Promise(function(resolve){
    if(!dataUrl){ resolve(null); return; }
    var im = new Image();
    im.onload = function(){
      try {
        var c = document.createElement("canvas");
        c.width = 120;
        c.height = 120;
        var ctx2 = c.getContext("2d");
        ctx2.drawImage(im, 0, 0, 120, 120);
        var d = ctx2.getImageData(0, 0, 120, 120).data;
        var buckets = {};
        for(var i = 0; i < d.length; i += 4){
          var r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];
          if(a < 140) continue;
          if(r > 235 && g > 235 && b > 235) continue;
          var key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          if(!buckets[key]) buckets[key] = {n:0, r:0, g:0, b:0};
          buckets[key].n++;
          buckets[key].r += r;
          buckets[key].g += g;
          buckets[key].b += b;
        }
        var arr = Object.keys(buckets).map(function(k){
          var o = buckets[k];
          var mr = Math.round(o.r / o.n), mg = Math.round(o.g / o.n), mb = Math.round(o.b / o.n);
          var max = Math.max(mr, mg, mb), min = Math.min(mr, mg, mb);
          var sat = max === 0 ? 0 : (max - min) / max;
          return {n: o.n, r: mr, g: mg, b: mb, sat: sat, score: o.n * (1 + sat * 2.5)};
        }).sort(function(x, y){ return y.score - x.score; });

        if(!arr.length){ resolve(null); return; }
        var toHex = function(o){
          return "#" + [o.r, o.g, o.b].map(function(v){
            return ("0" + Math.max(0, Math.min(255, v)).toString(16)).slice(-2);
          }).join("").toUpperCase();
        };
        var first = arr[0];
        var second = null;
        for(var j = 1; j < arr.length; j++){
          var cand = arr[j];
          var dist = Math.sqrt(
            Math.pow(first.r - cand.r, 2) +
            Math.pow(first.g - cand.g, 2) +
            Math.pow(first.b - cand.b, 2)
          );
          if(dist > 70 && cand.n > first.n * 0.08){
            second = cand;
            break;
          }
        }
        resolve({
          c1: toHex(first),
          c2: second ? toHex(second) : dk(toHex(first), 0.55)
        });
      } catch(e){
        resolve(null);
      }
    };
    im.onerror = function(){ resolve(null); };
    im.src = dataUrl;
  });
}

exposeFn({
  rgb: {get:()=>rgb, set:v=>{rgb=v}},
  col: {get:()=>col, set:v=>{col=v}},
  dk: {get:()=>dk, set:v=>{dk=v}},
  mixc: {get:()=>mixc, set:v=>{mixc=v}},
  localBg: {get:()=>localBg, set:v=>{localBg=v}},
  lumi: {get:()=>lumi, set:v=>{lumi=v}},
  igu: {get:()=>igu, set:v=>{igu=v}},
  recolor: {get:()=>recolor, set:v=>{recolor=v}},
  near: {get:()=>near, set:v=>{near=v}},
  philo: {get:()=>philo, set:v=>{philo=v}},
  hexOr: {get:()=>hexOr, set:v=>{hexOr=v}},
  extractLogoColors: {get:()=>extractLogoColors, set:v=>{extractLogoColors=v}}
});
