/* japan.ouuut.com · shell.js — theme, language, header, reveal, lazy chapter launch.
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
    var l = get('pj-lang');
    if (LANGS.indexOf(l) >= 0) return l;
    var q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS.indexOf(q) >= 0) return q;
    return 'ja';
  }

  function langLabel(l) {
    return l === 'ja' ? '日本語' : l === 'zh' ? '中文' : 'EN';
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
    var live = document.querySelector('.stage[data-live="1"] .stage-live');
    if (live && live._setVendorLang) live._setVendorLang(l);
    var stageLang = document.querySelector('.stage-chrome [data-stage-lang]');
    if (stageLang) stageLang.textContent = langLabel(l);
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

  function createStageChrome(stage, closeFn) {
    var bar = document.createElement('div');
    bar.className = 'stage-chrome';

    var brand = document.createElement('a');
    brand.className = 'stage-brand';
    brand.href = '/';
    brand.textContent = 'japan.ouuut.com';

    var spacer = document.createElement('span');
    spacer.className = 'stage-spacer';

    var theme = document.createElement('div');
    theme.className = 'stage-theme';
    theme.setAttribute('role', 'group');
    theme.setAttribute('aria-label', 'Theme');
    var current = doc.dataset.theme || 'sage';
    [['sage', 'Sage', '#E9EDE3', '#2F6B4F'],
     ['dark', 'Dark', '#0E0E0C', '#FF6A3D']].forEach(function (row) {
      var b = document.createElement('button');
      b.className = 'theme-dot';
      b.type = 'button';
      b.dataset.themeSet = row[0];
      b.setAttribute('aria-pressed', String(current === row[0]));
      b.setAttribute('aria-label', row[1]);
      b.title = row[1];
      b.style.setProperty('--td-bg', row[2]);
      b.style.setProperty('--td-accent', row[3]);
      b.innerHTML = '<span class="td-dot"><span class="td-core"></span></span>';
      b.addEventListener('click', function () { setTheme(this.dataset.themeSet, true); });
      theme.appendChild(b);
    });

    var langBtn = document.createElement('button');
    langBtn.className = 'stage-lang';
    langBtn.type = 'button';
    langBtn.setAttribute('data-stage-lang', '');
    langBtn.setAttribute('aria-label', 'Language');
    langBtn.title = 'Language';
    langBtn.textContent = langLabel(lang());
    langBtn.addEventListener('click', function () {
      var next = LANGS[(LANGS.indexOf(lang()) + 1) % LANGS.length];
      loadDic().then(function () { setLang(next); });
    });

    var close = document.createElement('button');
    close.className = 'stage-close';
    close.type = 'button';
    close.setAttribute('aria-label', tr('ui.close') || 'Close');
    close.innerHTML = '&times;';
    close.addEventListener('click', closeFn);

    bar.appendChild(brand);
    bar.appendChild(spacer);
    bar.appendChild(theme);
    bar.appendChild(langBtn);
    bar.appendChild(close);
    return { bar: bar, close: close };
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
      stage.classList.remove('is-preparing');
      document.body.classList.add('stage-open');
      doc.classList.add('stage-open');
      setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 60);
      setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 350);
      setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 900);

      var chrome = null;
      var closeStage = function () {
        try {
          if (ch === 'quake') mod.unmountQuake();
          else if (ch === 'crime') mod.unmountCrime();
          else mod.unmountCabinet();
        } catch (e) {}
        live.innerHTML = '';
        live._setVendorLang = null;
        live._setVendorTheme = null;
        stage.dataset.live = '0';
        stage.classList.remove('is-preparing');
        delete stage.dataset.busy;
        document.body.classList.remove('stage-open');
        doc.classList.remove('stage-open');
        btn.disabled = false;
        label.textContent = prev;
        if (chrome) chrome.bar.remove();
        document.removeEventListener('keydown', onKey);
        setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 60);
        try { window.dispatchEvent(new CustomEvent('pj:stage-closed', { detail: { ch: ch } })); } catch (e) {}
        try { btn.focus({ preventScroll: true }); } catch (e) {}
      };
      var onKey = function (e) { if (e.key === 'Escape') closeStage(); };
      chrome = createStageChrome(stage, closeStage);
      stage.appendChild(chrome.bar);
      document.addEventListener('keydown', onKey);
      try { chrome.close.focus({ preventScroll: true }); } catch (e) {}
    }).catch(function (err) {
      console.error(err);
      stage.classList.remove('is-preparing');
      stage.dataset.live = '0';
      document.body.classList.remove('stage-open');
      doc.classList.remove('stage-open');
      label.textContent = tr('ui.failed') || 'Failed to load';
      btn.disabled = false;
      delete stage.dataset.busy;
      try { window.dispatchEvent(new CustomEvent('pj:stage-error', { detail: { ch: ch } })); } catch (e) {}
      setTimeout(function () {
        label.textContent = prev;
      }, 2000);
    });
  }

  function startLabel(panel) {
    return panel.querySelector('.hp-enter span, .prod-action span');
  }

  function resetStartPanel(panel) {
    panel.classList.remove('is-launching');
    panel.removeAttribute('aria-busy');
    var label = startLabel(panel);
    if (label && label.dataset.prevLabel !== undefined) {
      label.textContent = label.dataset.prevLabel;
      delete label.dataset.prevLabel;
    }
  }

  function resetStartPanels() {
    var panels = document.querySelectorAll('[data-start-app].is-launching');
    for (var i = 0; i < panels.length; i++) {
      resetStartPanel(panels[i]);
      try { panels[i].focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function failStartPanels() {
    var panels = document.querySelectorAll('[data-start-app].is-launching');
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      var label = startLabel(panel);
      if (label) label.textContent = tr('ui.failed') || 'Failed to load';
      panel.classList.remove('is-launching');
      panel.removeAttribute('aria-busy');
      (function (p) {
        setTimeout(function () {
          if (!p.classList.contains('is-launching')) resetStartPanel(p);
        }, 1800);
      })(panel);
    }
  }

  function startHome(panel) {
    var ch = panel.dataset.startApp;
    var stage = document.querySelector('.home-stage[data-view="' + ch + '"]');
    if (!stage) return false;
    if (stage.dataset.busy || stage.dataset.live === '1') return true;
    var btn = stage.querySelector('[data-launch]');
    if (!btn) return false;
    var label = startLabel(panel);
    if (label) {
      if (label.dataset.prevLabel === undefined) label.dataset.prevLabel = label.textContent;
      label.textContent = tr('ui.launching') || 'Loading…';
    }
    panel.classList.add('is-launching');
    panel.setAttribute('aria-busy', 'true');
    stage.classList.add('is-preparing');
    stage.dataset.live = '1';
    document.body.classList.add('stage-open');
    doc.classList.add('stage-open');
    btn.click();
    return true;
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

    var langs = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < langs.length; i++) {
      langs[i].addEventListener('click', function () {
        var l = this.dataset.lang;
        loadDic().then(function () { setLang(l); });
      });
    }

    var dots = document.querySelectorAll('[data-theme-set]');
    for (var j = 0; j < dots.length; j++) {
      dots[j].addEventListener('click', function () {
        setTheme(this.dataset.themeSet, true);
      });
    }

    var btns = document.querySelectorAll('[data-launch]');
    for (var k = 0; k < btns.length; k++) {
      btns[k].addEventListener('click', function () { launch(this); });
    }

    var starts = document.querySelectorAll('[data-start-app]');
    for (var m = 0; m < starts.length; m++) {
      starts[m].addEventListener('click', function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (startHome(this)) e.preventDefault();
      });
    }
    window.addEventListener('pj:stage-closed', resetStartPanels);
    window.addEventListener('pj:stage-error', failStartPanels);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
