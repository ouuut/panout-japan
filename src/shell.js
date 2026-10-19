/* Pan Out Japan · shell.js — theme, language, lazy chapter launch.
   No framework, no build step. Everything degrades without JS. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var THEMES = ['mono', 'sage', 'dark'];
  var LANGS = ['ja', 'zh', 'en'];
  var dic = null;
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var VER = '';
  try { VER = new URL(scriptSrc).searchParams.get('v') || ''; } catch (e) {}

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function lang() {
    var l = get('pj-lang');
    if (LANGS.indexOf(l) >= 0) return l;
    var q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS.indexOf(q) >= 0) return q;
    return 'ja';
  }

  function tr(key) {
    if (dic && dic[key] && dic[key][lang()]) return dic[key][lang()];
    return '';
  }

  function setLang(l) {
    if (LANGS.indexOf(l) < 0) return;
    put('pj-lang', l);
    doc.lang = l;
    var btns = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].dataset.lang === l));
    }
    if (!dic) return;
    var els = document.querySelectorAll('[data-t]');
    for (var j = 0; j < els.length; j++) {
      var v = dic[els[j].dataset.t];
      if (v && v[l]) els[j].innerHTML = v[l];
    }
  }

  function loadDic() {
    if (dic) return Promise.resolve(dic);
    return fetch('/assets/i18n.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { dic = d; return d; })
      .catch(function () { return null; });
  }

  function setTheme(t) {
    if (THEMES.indexOf(t) < 0) t = 'mono';
    doc.dataset.theme = t;
    put('pj-theme', t);
    var btn = document.querySelector('[data-theme-btn]');
    if (btn) {
      var label = tr('ui.theme') || 'Theme';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
    try { window.dispatchEvent(new CustomEvent('pj:theme', { detail: t })); } catch (e) {}
  }

  function bootTheme() {
    var t = get('pj-theme');
    setTheme(THEMES.indexOf(t) >= 0 ? t : 'mono');
  }

  function bootLang() {
    setLang(lang());
    loadDic().then(function () { setLang(lang()); });
  }

  function launch(btn) {
    var stage = btn.closest('.stage');
    if (!stage || stage.dataset.busy) return;
    var ch = btn.dataset.launch;
    var live = stage.querySelector('.stage-live');
    if (!live) return;
    var label = btn.querySelector('span') || btn;
    var prev = label.textContent;
    stage.dataset.busy = '1';
    btn.disabled = true;
    label.textContent = tr('ui.launching') || 'Loading…';

    var url = '/app/' + ch + '/view.js' + (VER ? '?v=' + VER : '');
    import(url).then(function (mod) {
      var opts = { base: '/', lang: lang(), theme: doc.dataset.theme || 'mono' };
      if (ch === 'quake') mod.mountQuake(live, opts);
      else if (ch === 'crime') mod.mountCrime(live, opts);
      else mod.mountCabinet(live, opts);

      stage.dataset.live = '1';
      var close = document.createElement('button');
      close.className = 'stage-close';
      close.type = 'button';
      close.setAttribute('aria-label', tr('ui.close') || 'Close');
      close.innerHTML = '&times;';
      close.addEventListener('click', function () {
        try {
          if (ch === 'quake') mod.unmountQuake();
          else if (ch === 'crime') mod.unmountCrime();
          else mod.unmountCabinet();
        } catch (e) {}
        live.innerHTML = '';
        stage.dataset.live = '0';
        delete stage.dataset.busy;
        btn.disabled = false;
        label.textContent = prev;
        close.remove();
      });
      stage.appendChild(close);
    }).catch(function (err) {
      console.error(err);
      label.textContent = tr('ui.failed') || 'Failed to load';
      setTimeout(function () {
        label.textContent = prev;
        btn.disabled = false;
        delete stage.dataset.busy;
      }, 2000);
    });
  }

  function legacyHash() {
    var h = location.hash || '';
    var m = /^#\/?(quake|crime|cabinet)\/?$/.exec(h);
    if (m) location.replace('/' + m[1] + '/');
    else if (/^#\/(quake|crime|cabinet)\/(.+)$/.test(h)) {
      location.replace('/' + h.slice(1).replace(/\/?$/, '/'));
    }
  }

  function init() {
    bootTheme();
    bootLang();
    legacyHash();

    var langs = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < langs.length; i++) {
      langs[i].addEventListener('click', function () {
        var l = this.dataset.lang;
        loadDic().then(function () { setLang(l); });
      });
    }

    var tb = document.querySelector('[data-theme-btn]');
    if (tb) tb.addEventListener('click', function () {
      var cur = doc.dataset.theme || 'mono';
      setTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
    });

    var btns = document.querySelectorAll('[data-launch]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener('click', function () { launch(this); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
