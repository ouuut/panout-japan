/* Isolated option controls. No production file reads or writes this script. */
(function () {
  'use strict';
  var variants = ['current', 'a', 'b', 'c', 'd'];
  var descriptions = {
    current: '现状基线：标题与六尺度句并列，下面是方法行、章节链接与重复品牌句。',
    a: '只留一个大标题；方法说明与可展开出典安静退到右侧。',
    b: '六种尺度变成可扫读目录；四个真章节可进入，两个预告不放假链接。',
    c: '把数据可信度放在主角位置；四个真实来源与计算口径直接展开。',
    d: '取消独立宣言区；一句标题、方法、出典与版权合并成最短的收尾。'
  };
  var viewport = document.getElementById('lab-viewport');
  var dictionary = JSON.parse(document.getElementById('lab-dictionary').textContent);

  function syncOptionStates(variant, width) {
    document.querySelectorAll('[data-select-variant]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.selectVariant === variant));
    });
    document.querySelectorAll('[data-select-width]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.selectWidth === width));
    });
  }

  function setVariant(variant, updateHash) {
    if (variants.indexOf(variant) < 0) variant = 'a';
    if (document.activeElement && document.activeElement.closest('.lab-design')) document.activeElement.blur();
    document.querySelectorAll('.lab-design').forEach(function (section) {
      var active = section.dataset.variant === variant;
      section.hidden = !active;
      section.classList.toggle('on', active);
    });
    document.getElementById('lab-description').textContent = descriptions[variant];
    syncOptionStates(variant, viewport.classList.contains('is-mobile') ? 'mobile' : 'desktop');
    if (updateHash !== false) history.replaceState(null, '', '#' + variant);
  }

  function setWidth(width) {
    var mobile = width === 'mobile';
    viewport.classList.toggle('is-mobile', mobile);
    syncOptionStates(document.querySelector('.lab-design.on').dataset.variant, mobile ? 'mobile' : 'desktop');
  }

  document.querySelectorAll('[data-select-variant]').forEach(function (button) {
    button.addEventListener('click', function () {
      var y = window.scrollY;
      setVariant(button.dataset.selectVariant);
      window.scrollTo(0, y);
    });
  });
  document.querySelectorAll('[data-select-width]').forEach(function (button) {
    button.addEventListener('click', function () { setWidth(button.dataset.selectWidth); });
  });
  var burger = viewport.querySelector('.masthead [data-burger]');
  if (burger) {
    burger.addEventListener('click', function () {
      if (viewport.classList.contains('is-mobile') && burger.getAttribute('aria-expanded') !== 'true') viewport.scrollTop = 0;
    }, true);
  }
  document.querySelectorAll('.oc-disclosure').forEach(function (button) {
    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      button.querySelector('.oc-details-icon').textContent = expanded ? '+' : '×';
      document.getElementById(button.getAttribute('aria-controls')).hidden = expanded;
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    var key = event.key;
    if (/^[0-4]$/.test(key)) { setVariant(variants[Number(key)]); event.preventDefault(); }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      var current = variants.indexOf(document.querySelector('.lab-design.on').dataset.variant);
      var delta = key === 'ArrowRight' ? 1 : -1;
      setVariant(variants[(current + delta + variants.length) % variants.length]);
      event.preventDefault();
    }
  });

  // The production shell fetches /assets/i18n.json. Add only the lab's keys and
  // restore the full response; production translations stay exactly unchanged.
  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, options) {
    var url = typeof input === 'string' ? input : input.url;
    if (url !== '/assets/i18n.json') return nativeFetch(input, options);
    return nativeFetch(input, options).then(function (response) {
      return response.json().then(function (production) {
        return new Response(JSON.stringify(Object.assign({}, production, dictionary)), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    });
  };

  // The language control changes html[lang], so CJK font routing stays native.
  // Source labels in C link to the chapter that documents that dataset.

  setVariant(location.hash.slice(1));
  setWidth('desktop');
  window.__lab = { setVariant: setVariant, setWidth: setWidth, variants: variants.slice() };
})();
