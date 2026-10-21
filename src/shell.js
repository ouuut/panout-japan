/* japan.ouuut.com · shell.js — theme, language, header, reveal, inline chapter mount.
   No framework, no build step. Everything degrades without JS. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var THEMES = ['sage', 'dark'];
  var LANGS = ['ja', 'zh', 'en'];
  var dic = null;
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var VER = '';
  try { VER = new URL(scriptSrc).searchParams.get('v') || ''; } catch (e) {}

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function lang() {
    // ?lang= 优先级最高：分享链接的语言参数必须压过本机记忆，
    // 否则老访客点 zh/en 链接会永远停在旧语言。
    var q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS.indexOf(q) >= 0) return q;
    var l = get('pj-lang');
    if (LANGS.indexOf(l) >= 0) return l;
    return 'ja';
  }

  function tr(key) {
    if (dic && dic[key] && dic[key][lang()]) return dic[key][lang()];
    return '';
  }

  function updateTextEls(l) {
    if (!dic) return;
    var els = document.querySelectorAll('[data-t]');
    for (var j = 0; j < els.length; j++) {
      var v = dic[els[j].dataset.t];
      if (v && v[l]) els[j].innerHTML = v[l];
    }
  }

  function setLang(l, animate) {
    if (LANGS.indexOf(l) < 0) return;
    put('pj-lang', l);
    doc.lang = l;
    var btns = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].dataset.lang === l));
    }
    if (animate && dic) {
      doc.classList.add('lang-switching');
      setTimeout(function () {
        updateTextEls(l);
        setTimeout(function () {
          doc.classList.remove('lang-switching');
        }, 30);
      }, 190);
    } else {
      updateTextEls(l);
    }
    var live = document.querySelector('.stage[data-live="1"] .stage-live');
    if (live && live._setVendorLang) live._setVendorLang(l);
  }

  function loadDic() {
    if (dic) return Promise.resolve(dic);
    return fetch('/assets/i18n.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { dic = d; return d; })
      .catch(function () { return null; });
  }

  function autoTheme() {
    var h = new Date().getHours();
    return (h >= 6 && h < 18) ? 'sage' : 'dark';
  }

  function syncVendorTheme(t) {
    var live = document.querySelector('.stage[data-live="1"] .stage-live');
    if (live && live._setVendorTheme) live._setVendorTheme(t);
  }

  function applyTheme(t) {
    if (THEMES.indexOf(t) < 0) t = 'sage';
    doc.dataset.theme = t;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0E0E0C' : '#E9EDE3');
    var dots = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < dots.length; i++) {
      dots[i].setAttribute('aria-pressed', String(dots[i].dataset.themeSet === t));
    }
    var sage = tr('ui.theme.sage') || 'Sage';
    var dark = tr('ui.theme.dark') || 'Dark';
    if (dots.length) {
      for (var k = 0; k < dots.length; k++) {
        var label = dots[k].dataset.themeSet === 'dark' ? dark : sage;
        dots[k].setAttribute('aria-label', label);
        dots[k].setAttribute('title', label);
      }
    }
    try { window.dispatchEvent(new CustomEvent('pj:theme', { detail: t })); } catch (e) {}
    syncVendorTheme(t);
  }

  function setTheme(t, save) {
    if (save) put('pj-theme', t);
    applyTheme(t);
  }

  function bootTheme() {
    var saved = get('pj-theme');
    applyTheme(THEMES.indexOf(saved) >= 0 ? saved : autoTheme());
  }

  function bootLang() {
    setLang(lang());
    loadDic().then(function () { setLang(lang()); });
  }

  function mountStage(stage, ch) {
    if (!stage || stage.dataset.busy || stage.dataset.live === '1') return;
    var live = stage.querySelector('.stage-live');
    if (!live) return;
    stage.dataset.busy = '1';

    var url = '/app/' + ch + '/view.js' + (VER ? '?v=' + VER : '');
    import(url).then(function (mod) {
      var opts = { base: '/', lang: lang(), theme: doc.dataset.theme || 'sage' };
      if (ch === 'quake') mod.mountQuake(live, opts);
      else if (ch === 'crime') mod.mountCrime(live, opts);
      else mod.mountCabinet(live, opts);

      live._setVendorLang = function (l) {
        try {
          if (ch === 'quake' && mod.setQuakeLang) mod.setQuakeLang(l);
          else if (ch === 'crime' && mod.setCrimeLang) mod.setCrimeLang(l);
          else if (ch === 'cabinet' && mod.setCabinetLang) mod.setCabinetLang(l);
        } catch (e) {}
      };
      live._setVendorTheme = function (t) {
        try {
          if (ch === 'quake' && mod.setQuakeTheme) mod.setQuakeTheme(t);
          else if (ch === 'crime' && mod.setCrimeTheme) mod.setCrimeTheme(t);
          else if (ch === 'cabinet' && mod.setCabinetTheme) mod.setCabinetTheme(t);
        } catch (e) {}
      };
      live._setVendorLang(opts.lang);
      live._setVendorTheme(opts.theme);

      stage.dataset.live = '1';
      stage.classList.remove('stage-failed');
      delete stage.dataset.busy;
      if (!document.body.classList.contains('chapter-app')) {
        [60, 350, 900, 2400].forEach(function (ms) {
          setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, ms);
        });
      }
      try { window.dispatchEvent(new CustomEvent('pj:stage-mounted', { detail: { ch: ch } })); } catch (e) {}
    }).catch(function (err) {
      console.error(err);
      stage.dataset.live = '0';
      delete stage.dataset.busy;
      stage.classList.add('stage-failed');
      try { window.dispatchEvent(new CustomEvent('pj:stage-error', { detail: { ch: ch } })); } catch (e) {}
    });
  }

  function setupStages() {
    var stages = document.querySelectorAll('.stage[data-stage-auto]');
    if (!stages.length) return;
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < stages.length; i++) {
        mountStage(stages[i], stages[i].dataset.stageAuto);
      }
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (!entries[j].isIntersecting) continue;
        var stage = entries[j].target;
        io.unobserve(stage);
        mountStage(stage, stage.dataset.stageAuto);
      }
    }, { rootMargin: '320px 0px' });
    for (var k = 0; k < stages.length; k++) io.observe(stages[k]);
  }

  function legacyHash() {
    var h = location.hash || '';
    var m = /^#\/?(quake|crime|cabinet)\/?$/.exec(h);
    if (m) location.replace('/' + m[1] + '/');
    else if (/^#\/(quake|crime|cabinet)\/(.+)$/.test(h)) {
      location.replace('/' + h.slice(1).replace(/\/?$/, '/'));
    }
  }

  function setupHeader() {
    var header = document.querySelector('.masthead');
    var bar = document.querySelector('.scroll-progress');
    function onScroll() {
      var y = window.scrollY || window.pageYOffset || 0;
      if (header) header.classList.toggle('scrolled', y > 8);
      if (bar) {
        var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        bar.style.width = Math.min(100, Math.max(0, y / max * 100)) + '%';
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  function setupMenu() {
    var btn = document.querySelector('[data-burger]');
    var menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    function close() {
      menu.classList.remove('open');
      document.body.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', toggle);
    var links = menu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) links[i].addEventListener('click', close);
    menu.querySelectorAll('[data-lang], [data-theme-set]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) close();
    });
  }

  function setupReveal() {
    var els = document.querySelectorAll('.rv');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) {
          entries[j].target.classList.add('in');
          io.unobserve(entries[j].target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    for (var k = 0; k < els.length; k++) io.observe(els[k]);
  }

  function init() {
    doc.classList.add('js');
    bootTheme();
    bootLang();
    legacyHash();
    setupHeader();
    setupMenu();
    setupReveal();
    setupStages();

    var langs = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < langs.length; i++) {
      langs[i].addEventListener('click', function () {
        var l = this.dataset.lang;
        loadDic().then(function () { setLang(l, true); });
      });
    }

    var dots = document.querySelectorAll('[data-theme-set]');
    for (var j = 0; j < dots.length; j++) {
      dots[j].addEventListener('click', function () {
        setTheme(this.dataset.themeSet, true);
      });
    }

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
