/* Home preview · scale selector. No framework, no runtime data fetch. */
(function () {
  'use strict';

  var root = document.querySelector('.hp');
  if (!root) return;

  var track = root.querySelector('.hp-track');
  var plate = root.querySelector('.hp-plate');
  var stops = root.querySelectorAll('[data-stop]');
  var layers = root.querySelectorAll('[data-layer]');
  var states = root.querySelectorAll('[data-state]');
  if (!track || !plate || !stops.length) return;

  var order = [];
  for (var i = 0; i < stops.length; i++) order.push(stops[i].dataset.stop);

  function setActive(key) {
    var index = order.indexOf(key);
    if (index < 0) return;

    root.dataset.active = key;
    track.style.setProperty('--stop', String(index));

    for (var i = 0; i < stops.length; i++) {
      var stop = stops[i];
      if (stop.dataset.stop === key) stop.setAttribute('aria-current', 'true');
      else stop.removeAttribute('aria-current');
    }

    for (var j = 0; j < layers.length; j++) {
      var layer = layers[j];
      var on = layer.dataset.layer === key;
      layer.classList.toggle('is-active', on);
      layer.setAttribute('aria-hidden', on ? 'false' : 'true');
    }

    for (var k = 0; k < states.length; k++) {
      var state = states[k];
      var visible = state.dataset.state === key;
      state.classList.toggle('is-active', visible);
      state.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    plate.setAttribute('href', stops[index].getAttribute('href'));
    plate.setAttribute('aria-labelledby', stops[index].id);
  }

  for (var s = 0; s < stops.length; s++) {
    (function (stop) {
      var key = stop.dataset.stop;
      stop.addEventListener('mouseenter', function () { setActive(key); });
      stop.addEventListener('focus', function () { setActive(key); });
      stop.addEventListener('click', function () { setActive(key); });
    })(stops[s]);
  }

  root.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    var current = document.activeElement;
    if (!current || !current.dataset || !current.dataset.stop) return;
    event.preventDefault();
    var at = order.indexOf(current.dataset.stop);
    var next = event.key === 'ArrowRight' ? (at + 1) % order.length : (at - 1 + order.length) % order.length;
    stops[next].focus();
  });

  setActive(root.dataset.active || order[0]);
})();
