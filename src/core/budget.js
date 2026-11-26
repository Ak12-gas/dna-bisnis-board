/* === FILE: src/core/budget.js === */
import { exposeFn } from './state.js';

/* Configuration must exist before BUDGET is initialized. */
export var DEFAULT_LIMITS = {
  groq:     {rpm:30, rpd:1000, tpm:8000,  tpd:200000},
  gemini:   {rpm:5,  rpd:20,   tpm:100000, tpd:0},
  compound: {rpm:30, rpd:250,  tpm:70000, tpd:0},
  custom:   {rpm:60, rpd:1000, tpm:100000, tpd:0}
};

export var BUDGET_STORE = "dna_budget_v1";
export var BUDGET_WINDOW = 60000;
export var BUDGET_MAX_WAIT = 60000;
export var BUDGET_MAX_ATTEMPTS = 5;

export var BUDGET = {
  limits: JSON.parse(JSON.stringify(DEFAULT_LIMITS)),
  state: {},
  tail: {},
  wait: function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); },

  reset: function(){ this.state = {}; this.tail = {}; },
  limitsFor: function(providerId, model){
    if(providerId === "groq" && /compound/i.test(String(model))){
      return this.limits.compound || DEFAULT_LIMITS.compound;
    }
    return this.limits[providerId] || this.limits.custom || DEFAULT_LIMITS.custom;
  },
  slot: function(providerId, model){
    var key = budgetKey(providerId, model);
    if(!this.state[key]){
      this.state[key] = {
        minute: {requests:0, tokens:0, times:[]},
        day: {date:budgetToday(), requests:0, tokens:0},
        remote: null, remoteAt: 0, retryAfter: 0, backoff: 0
      };
    }
    var s = this.state[key], today = budgetToday();
    if(s.day.date !== today) s.day = {date:today, requests:0, tokens:0};
    return s;
  },
  trim: function(s){
    var cut = Date.now() - BUDGET_WINDOW;
    var before = s.minute.times.length;
    while(s.minute.times.length && s.minute.times[0].t <= cut) s.minute.times.shift();
    s.minute.requests = s.minute.times.length;
    s.minute.tokens = s.minute.times.reduce(function(a, x){ return a + (x.tok || 0); }, 0);
    if(s.minute.times.length < before) s.remote = null;
  },
  reserve: function(providerId, model, est){
    var s = this.slot(providerId, model), e = Number(est) > 0 ? Number(est) : 0;
    this.trim(s);
    s.minute.times.push({t:Date.now(), tok:e});
    s.minute.requests++;
    s.minute.tokens += e;
    s.day.requests++;
    s.day.tokens += e;
    this.render();
    return s;
  },
  observe: function(providerId, model, resp, est){
    var s = this.slot(providerId, model), h = responseHeaders(resp || {});
    function lower(name){
      return Object.keys(h).filter(function(k){ return k.toLowerCase() === name; })[0];
    }
    if(resp && resp.ok){
      var rk = lower("x-ratelimit-remaining-requests"), tk = lower("x-ratelimit-remaining-tokens");
      if(rk || tk){
        s.remote = {
          requests: rk ? Number(h[rk]) : null,
          tokens: tk ? Number(h[tk]) : null
        };
        s.remoteAt = Date.now();
      }
      s.retryAfter = 0;
      s.backoff = 0;
    }
    if(resp && resp.status === 429){
      s.remote = null;
      var ra429 = lower("retry-after");
      if(ra429 && Number(h[ra429]) > 0){
        s.retryAfter = Math.min(BUDGET_MAX_WAIT, Number(h[ra429]) * 1000);
      } else {
        s.backoff = Math.min(BUDGET_MAX_WAIT, Math.max(1000, s.backoff * 2 || 1000));
        s.retryAfter = s.backoff;
      }
    }
    this.render();
    return s;
  },
  freshRemote: function(s){
    if(s.remote && Date.now() - (s.remoteAt || 0) >= BUDGET_WINDOW){
      s.remote = null;
      s.remoteAt = 0;
    }
    return s.remote;
  },
  remaining: function(providerId, model, est){
    var s = this.slot(providerId, model), lim = this.limitsFor(providerId, model);
    this.trim(s);
    this.freshRemote(s);
    var req = lim.rpm - s.minute.requests, tok = lim.tpm - s.minute.tokens;
    if(s.remote && s.remote.requests != null) req = Math.min(req, s.remote.requests);
    if(s.remote && s.remote.tokens != null) tok = Math.min(tok, s.remote.tokens);
    return {
      minuteRequests: req,
      minuteTokens: tok,
      dayRequests: lim.rpd > 0 ? lim.rpd - s.day.requests : Infinity,
      dayTokens: lim.tpd > 0 ? lim.tpd - s.day.tokens : Infinity,
      est: Number(est) > 0 ? Number(est) : 0
    };
  },
  dailyDone: function(providerId, candidates){
    var self = this;
    return candidates.every(function(m){
      var r = self.remaining(providerId, m, 1);
      return r.dayRequests <= 0 || r.dayTokens <= 0;
    });
  },
  pickModel: function(providerId, candidates, est){
    var self = this;
    var prev = this.tail[providerId] || Promise.resolve();
    var run = prev.then(function(){ return self._pick(providerId, candidates, est); });
    this.tail[providerId] = run.catch(function(){});
    return run;
  },
  _pick: function(providerId, candidates, est){
    var self = this;
    function attempt(n){
      if(n > BUDGET_MAX_ATTEMPTS){
        var waited = new Error("Batas kuota tercapai, lanjutkan setelah reset.");
        waited.code = "rate_limited";
        throw waited;
      }
      if(self.dailyDone(providerId, candidates)){
        var e = new Error("Kuota gratis habis, lanjutkan setelah reset.");
        e.code = "quota_exhausted";
        throw e;
      }
      for(var i = 0; i < candidates.length; i++){
        var r = self.remaining(providerId, candidates[i], est);
        if(r.minuteRequests > 0 && r.dayRequests > 0 && r.minuteTokens >= r.est && r.dayTokens >= r.est){
          return Promise.resolve(candidates[i]);
        }
      }
      var delay = BUDGET_WINDOW;
      candidates.forEach(function(m){
        var s = self.slot(providerId, m);
        var first = s.minute.times.length ? s.minute.times[0].t : Date.now();
        var sisa = Math.max(0, BUDGET_WINDOW - (Date.now() - first));
        delay = Math.min(delay, Math.max(sisa, s.retryAfter || 0));
      });
      delay = Math.max(0, Math.min(BUDGET_MAX_WAIT, delay));
      return self.wait(delay).then(function(){ return attempt(n + 1); });
    }
    return attempt(1);
  },
  prepare: function(providerId, candidates, text, maxTokens){
    if(!candidates || !candidates.length) return Promise.resolve([]);
    var self = this;
    var est = estTokens(text, maxTokens);
    /* ponytail: kalau estimasi melebihi sisa menit DAN hari, menunggu tidak akan membantu. */
    candidates.forEach(function(m){
      var r = self.remaining(providerId, m, est);
      if(r.est > r.minuteTokens && r.est > r.dayTokens){
        var e = new Error("Permintaan terlalu besar untuk kuota.");
        e.code = "quota_impossible";
        throw e;
      }
    });
    return this.pickModel(providerId, candidates, est).then(function(picked){
      return [picked].concat(candidates.filter(function(id){ return id !== picked; }));
    });
  },
  saveLimits: function(){
    try { localStorage.setItem(BUDGET_STORE, JSON.stringify({date:budgetToday(), limits:this.limits})); }
    catch(e){}
  },
  loadLimits: function(){
    try {
      var raw = JSON.parse(localStorage.getItem(BUDGET_STORE) || "null");
      if(raw && raw.limits){
        Object.keys(DEFAULT_LIMITS).forEach(function(p){
          var src = raw.limits[p] || {};
          if(!BUDGET.limits[p]) BUDGET.limits[p] = {};
          Object.keys(DEFAULT_LIMITS[p]).forEach(function(k){
            BUDGET.limits[p][k] = sanitizeBudgetLimit(src[k], DEFAULT_LIMITS[p][k]);
          });
        });
      }
    } catch(e){}
    return this.limits;
  },
  providerRemaining: function(providerId){
    var self = this;
    var lim = this.limits[providerId] || DEFAULT_LIMITS[providerId] || this.limits.custom;
    var prefix = providerId + "|", req = 0, tok = 0, dreq = 0, dtok = 0, rreq = null, rtok = null;
    Object.keys(this.state).forEach(function(key){
      if(key.indexOf(prefix) !== 0) return;
      var s = self.state[key];
      self.trim(s);
      self.freshRemote(s);
      req += s.minute.requests;
      tok += s.minute.tokens;
      dreq += s.day.requests;
      dtok += s.day.tokens;
      if(s.remote && s.remote.requests != null) rreq = rreq == null ? s.remote.requests : Math.min(rreq, s.remote.requests);
      if(s.remote && s.remote.tokens != null) rtok = rtok == null ? s.remote.tokens : Math.min(rtok, s.remote.tokens);
    });
    var out = {
      minuteRequests: lim.rpm - req,
      minuteTokens: lim.tpm - tok,
      dayRequests: lim.rpd > 0 ? lim.rpd - dreq : Infinity,
      dayTokens: lim.tpd > 0 ? lim.tpd - dtok : Infinity,
      est: 0
    };
    if(rreq != null) out.minuteRequests = Math.min(out.minuteRequests, rreq);
    if(rtok != null) out.minuteTokens = Math.min(out.minuteTokens, rtok);
    return out;
  },
  render: function(){
    var el = $("budgetStat");
    if(!el) return;
    var parts = ["Perkiraan lokal — cek penyedia untuk angka pasti."];
    ["groq", "gemini", "custom"].forEach(function(p){
      var r = BUDGET.providerRemaining(p);
      parts.push(p + ": " + Math.max(0, r.minuteRequests) + " req / " + Math.max(0, r.minuteTokens) + " token");
    });
    el.textContent = parts.join(" | ");
  }
};

export function budgetKey(providerId, model){ return providerId + "|" + model; }

export function budgetToday(){
  /* ponytail: reset mengikuti tanggal lokal browser (WIB untuk pengguna di Indonesia). */
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

export function estTokens(text, maxTokens){
  /* ponytail: data URL gambar bukan token prompt — tanpa ini request vision selalu terlihat mustahil. */
  var t = String(text == null ? "" : text).replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, "[IMG]");
  var n = Math.ceil(t.length / 3.5);
  return n + (Number(maxTokens) > 0 ? Number(maxTokens) : 0);
}

export function sanitizeBudgetLimit(v, fallback){
  var n = Number(v);
  return isFinite(n) && n > 0 && Math.floor(n) === n ? n : fallback;
}

export function budgetStatus(){
  var out = {};
  ["groq", "gemini", "custom"].forEach(function(p){
    out[p] = BUDGET.providerRemaining(p);
  });
  return out;
}

export function initBudgetUI(){
  BUDGET.reset();
  BUDGET.loadLimits();
  ["groq", "gemini", "compound", "custom"].forEach(function(p){
    ["rpm", "rpd", "tpm", "tpd"].forEach(function(k){
      var el = $("lim-" + p + "-" + k);
      var v = BUDGET.limits[p] ? BUDGET.limits[p][k] : null;
      if(el) el.value = (v > 0 ? String(v) : "");
    });
  });
  BUDGET.render();
}

export function saveBudgetLimits(){
  var valid = true;
  var next = JSON.parse(JSON.stringify(BUDGET.limits));
  ["groq", "gemini", "compound", "custom"].forEach(function(p){
    ["rpm", "rpd", "tpm", "tpd"].forEach(function(k){
      var el = $("lim-" + p + "-" + k), raw = el ? String(el.value || "").trim() : "";
      if(!raw) return;
      var n = Number(raw);
      if(!isFinite(n) || n <= 0 || Math.floor(n) !== n){ valid = false; return; }
      next[p][k] = n;
    });
  });
  var el = $("budgetStat");
  if(!valid){
    if(el){ el.className = "kstat err"; el.textContent = "❌ Batas harus bilangan bulat > 0."; }
    return;
  }
  BUDGET.limits = next;
  BUDGET.saveLimits();
  BUDGET.render();
  if(el){ el.className = "kstat ok"; el.textContent += " Tersimpan."; }
  toast("Batas kuota lokal tersimpan.");
}

exposeFn({
  BUDGET: {get:()=>BUDGET, set:v=>{BUDGET=v}},
  DEFAULT_LIMITS: {get:()=>DEFAULT_LIMITS, set:v=>{DEFAULT_LIMITS=v}},
  BUDGET_STORE: {get:()=>BUDGET_STORE, set:v=>{BUDGET_STORE=v}},
  BUDGET_WINDOW: {get:()=>BUDGET_WINDOW, set:v=>{BUDGET_WINDOW=v}},
  BUDGET_MAX_WAIT: {get:()=>BUDGET_MAX_WAIT, set:v=>{BUDGET_MAX_WAIT=v}},
  BUDGET_MAX_ATTEMPTS: {get:()=>BUDGET_MAX_ATTEMPTS, set:v=>{BUDGET_MAX_ATTEMPTS=v}},
  budgetKey: {get:()=>budgetKey, set:v=>{budgetKey=v}},
  budgetToday: {get:()=>budgetToday, set:v=>{budgetToday=v}},
  estTokens: {get:()=>estTokens, set:v=>{estTokens=v}},
  sanitizeBudgetLimit: {get:()=>sanitizeBudgetLimit, set:v=>{sanitizeBudgetLimit=v}},
  budgetStatus: {get:()=>budgetStatus, set:v=>{budgetStatus=v}},
  initBudgetUI: {get:()=>initBudgetUI, set:v=>{initBudgetUI=v}},
  saveBudgetLimits: {get:()=>saveBudgetLimits, set:v=>{saveBudgetLimits=v}}
});

document.addEventListener("click", function(ev){
  var b = ev.target && ev.target.closest ? ev.target.closest("button#toggleBudget, button#saveBudget") : null;
  if(!b) return;
  if(b.id === "toggleBudget"){
    var box = $("budgetBox");
    if(box) box.hidden = !box.hidden;
  } else if(b.id === "saveBudget") saveBudgetLimits();
});
