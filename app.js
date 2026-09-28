/*
  Логика приглашения.
  Дата, время и место берутся из config.js — здесь ничего менять не нужно.
*/
(function () {
  'use strict';

  var cfg = window.INVITE || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  // Что говорит кнопка «нет», когда от тебя убегает
  var TEASES = [
    'не-а 😏',
    'мимо!',
    'эта кнопка сегодня не работает',
    'я же вижу, куда ты целишься 👀',
    'может, всё-таки «конечно»?',
    'сопротивление бесполезно 😌',
    'кнопка «нет» ушла в отпуск 🌴',
    'ну пожалуйста 🥺',
    'правильный ответ тут только один'
  ];

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function plural(n, forms) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  // 'ГГГГ-ММ-ДДTЧЧ:ММ' → Date в местном времени (без сюрпризов с часовыми поясами в Safari)
  function parseLocalDate(value) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(String(value || '').trim());
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  }

  /* ---------- 1. Данные из config.js ---------- */

  var when = parseLocalDate(cfg.date) || new Date(Date.now() + 5 * 864e5);
  var place = cfg.place || {};
  var placeLine = [place.name, place.address].filter(Boolean).join(', ');
  var hasPlace = placeLine.length > 0;
  var mapUrl = place.mapUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(placeLine));

  var values = {
    month: MONTHS[when.getMonth()],
    year: String(when.getFullYear()),
    weekday: WEEKDAYS[when.getDay()],
    dayMonth: when.getDate() + ' ' + MONTHS_GEN[when.getMonth()],
    time: when.getHours() + ':' + pad(when.getMinutes()),
    placeName: place.name,
    placeAddress: place.address || place.name
  };

  $$('[data-bind]').forEach(function (el) {
    var v = values[el.getAttribute('data-bind')];
    if (v) el.textContent = v;
  });

  $$('[data-map]').forEach(function (a) { a.href = mapUrl; });

  // Место не указано — оставляем интригу: «сюрприз 🤫» и без кнопки «как добраться»
  $$('[data-place-known], [data-place-only]').forEach(function (el) { el.hidden = !hasPlace; });
  $$('[data-place-secret]').forEach(function (el) { el.hidden = hasPlace; });

  // Календарик: два дня до, день свидания в сердечке, два дня после
  var daysEl = $('[data-days]');
  if (daysEl) {
    for (var i = -2; i <= 2; i++) {
      var d = new Date(when.getFullYear(), when.getMonth(), when.getDate() + i);
      var li = document.createElement('li');
      if (i === 0) {
        li.className = 'is-date';
        li.innerHTML = '<svg viewBox="-4 -4 108 98"><use href="#i-heart-line"/></svg><span>' + pad(d.getDate()) + '</span>';
      } else {
        li.textContent = pad(d.getDate());
      }
      daysEl.appendChild(li);
    }
  }

  /* ---------- 2. Обратный отсчёт ---------- */

  var cd = {
    d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]'),
    dl: $('[data-cd-label="d"]'), hl: $('[data-cd-label="h"]'), ml: $('[data-cd-label="m"]'), sl: $('[data-cd-label="s"]')
  };
  var cdLabel = $('[data-countdown-label]');
  var cdGrid = $('[data-countdown-grid]');
  var cdTimer = 0;

  function tick() {
    if (!cd.d) return;
    var diff = when.getTime() - Date.now();
    if (diff <= 0) {
      var endsAt = when.getTime() + (cfg.durationHours || 3) * 36e5;
      cdLabel.textContent = Date.now() < endsAt ? 'свидание уже идёт ❤' : 'этот вечер уже случился ❤';
      cdGrid.hidden = true;
      clearInterval(cdTimer);
      return;
    }
    var s = Math.floor(diff / 1000);
    var days = Math.floor(s / 86400);
    var hours = Math.floor((s % 86400) / 3600);
    var mins = Math.floor((s % 3600) / 60);
    var secs = s % 60;
    cd.d.parentNode.hidden = days === 0; // свидание сегодня — окошко «0 дней» не нужно
    cd.d.textContent = days;
    cd.h.textContent = pad(hours);
    cd.m.textContent = pad(mins);
    cd.s.textContent = pad(secs);
    cd.dl.textContent = plural(days, ['день', 'дня', 'дней']);
    cd.hl.textContent = plural(hours, ['час', 'часа', 'часов']);
    cd.ml.textContent = plural(mins, ['минута', 'минуты', 'минут']);
    cd.sl.textContent = plural(secs, ['секунда', 'секунды', 'секунд']);
  }

  tick();
  cdTimer = setInterval(tick, 1000);

  /* ---------- 3. «Добавить в календарь» ---------- */

  function utcStamp(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function icsEscape(text) {
    return String(text || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  }

  var calLink = $('[data-calendar]');
  if (calLink) {
    var end = new Date(when.getTime() + (cfg.durationHours || 3) * 36e5);
    var title = cfg.calendarTitle || 'Свидание';
    var ua = navigator.userAgent || '';
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (/Android/i.test(ua)) {
      // На Android удобнее всего Google Календарь
      calLink.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent(title) +
        '&dates=' + utcStamp(when) + '/' + utcStamp(end) +
        (hasPlace ? '&location=' + encodeURIComponent(placeLine) : '');
      calLink.target = '_blank';
      calLink.rel = 'noopener';
    } else {
      var ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//svidanie//invite//RU',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:' + utcStamp(when) + '-svidanie@invite',
        'DTSTAMP:' + utcStamp(new Date()),
        'DTSTART:' + utcStamp(when),
        'DTEND:' + utcStamp(end),
        'SUMMARY:' + icsEscape(title),
        hasPlace ? 'LOCATION:' + icsEscape(placeLine) : '',
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        'DESCRIPTION:' + icsEscape(title),
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(Boolean).join('\r\n');
      calLink.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
      // iPhone сам предложит добавить событие, остальным — скачать файл
      if (!isIOS) calLink.setAttribute('download', 'svidanie.ics');
    }
  }

  /* ---------- 4. Появление блоков при прокрутке ---------- */

  var hero = $('.hero');
  var envelope = $('.envelope');
  var question = $('.question');

  // Сердце «рисуется» кистью: готовим штрихи маски
  $$('.brush-heart .draw').forEach(function (use) {
    var path = document.querySelector(use.getAttribute('href'));
    var len = path && path.getTotalLength ? Math.ceil(path.getTotalLength()) + 2 : 600;
    use.style.strokeDasharray = len + ' ' + len;
    use.style.strokeDashoffset = reduceMotion ? 0 : len;
  });

  function openEnvelope() {
    envelope.classList.add('is-open');
    question.classList.add('is-open');
  }

  function showHero() {
    hero.classList.add('is-in');
    $$('.brush-heart .draw').forEach(function (use) { use.style.strokeDashoffset = 0; });
  }

  requestAnimationFrame(function () { requestAnimationFrame(showHero); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target === envelope) openEnvelope();
        else entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    io.observe(envelope);
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    openEnvelope();
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 5. Сердечки-конфетти ---------- */

  var fx = (function () {
    var canvas = $('.fx');
    var ctx = canvas && canvas.getContext && canvas.getContext('2d');
    var parts = [];
    var raf = 0;
    var last = 0;
    var dpr = 1;
    var W = 0;
    var H = 0;
    var COLORS = ['#b52d2f', '#c83a3e', '#dd5156', '#e87a7e', '#f2a7a9', '#8f1f22', '#ffffff'];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    function heart(size) {
      ctx.beginPath();
      ctx.moveTo(0, size * 0.32);
      ctx.bezierCurveTo(-size * 0.95, -size * 0.28, -size * 0.45, -size * 0.98, 0, -size * 0.45);
      ctx.bezierCurveTo(size * 0.45, -size * 0.98, size * 0.95, -size * 0.28, 0, size * 0.32);
      ctx.fill();
    }

    function step(t) {
      var dt = last ? Math.min((t - last) / 16.667, 3) : 1;
      last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life += dt;
        if (p.life > p.ttl || p.y > H + 40) { parts.splice(i, 1); continue; }
        p.vx *= Math.pow(p.drag, dt);
        p.vy += p.g * dt;
        if (p.sway != null) { p.sway += 0.05 * dt; p.x += Math.sin(p.sway) * 0.7 * dt; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, (p.ttl - p.life) / 30));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        heart(p.size);
        ctx.restore();
      }
      if (parts.length) {
        raf = requestAnimationFrame(step);
      } else {
        raf = 0;
        last = 0;
        ctx.clearRect(0, 0, W, H);
      }
    }

    function start() {
      if (!ctx) return;
      resize();
      if (!raf) raf = requestAnimationFrame(step);
    }

    function burst(x, y, n) {
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.25;
        var speed = 5 + Math.random() * 10;
        parts.push({
          x: x, y: y,
          vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          g: 0.2 + Math.random() * 0.12, drag: 0.985,
          rot: (Math.random() - 0.5) * 0.8, vr: (Math.random() - 0.5) * 0.06,
          size: 9 + Math.random() * 15,
          color: COLORS[i % COLORS.length],
          life: 0, ttl: 110 + Math.random() * 70
        });
      }
      start();
    }

    function rain(n) {
      var w = window.innerWidth;
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * w, y: -30 - Math.random() * 320,
          vx: (Math.random() - 0.5) * 0.6, vy: 1.4 + Math.random() * 1.8,
          g: 0.008, drag: 1, sway: Math.random() * 6.28,
          rot: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 0.02,
          size: 8 + Math.random() * 12,
          color: COLORS[i % (COLORS.length - 1)],
          life: 0, ttl: 520
        });
      }
      start();
    }

    return { burst: burst, rain: rain };
  })();

  /* ---------- 6. Кнопка «нет», которая убегает ---------- */

  var yesBtn = $('.btn--yes');
  var noBtn = $('.btn--no');
  var slot = $('.no-slot');
  var teaseEl = $('.tease');
  var answered = false;
  var fleeing = false;
  var dodges = 0;
  var lastFlee = 0;
  var flyTimer = 0;

  function detachNo() {
    if (fleeing) return;
    var q = question.getBoundingClientRect();
    var b = noBtn.getBoundingClientRect();
    // держим место, чтобы «конечно» не прыгало
    slot.style.width = b.width + 'px';
    slot.style.height = b.height + 'px';
    question.appendChild(noBtn);
    noBtn.classList.add('is-fleeing');
    noBtn.style.left = (b.left - q.left) + 'px';
    noBtn.style.top = (b.top - q.top) + 'px';
    void noBtn.offsetWidth; // фиксируем стартовую точку, чтобы прыжок был плавным
    fleeing = true;
  }

  function flee(px, py, force) {
    if (answered || !question.classList.contains('is-open')) return;
    var now = Date.now();
    if (!force && now - lastFlee < 140) return;
    lastFlee = now;
    detachNo();

    var q = question.getBoundingClientRect();
    var b = noBtn.getBoundingClientRect();
    var y = yesBtn.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var gap = 14;

    // прыгаем внутри блока с письмом, но только в пределах экрана
    var minX = Math.max(q.left, 0) + gap;
    var maxX = Math.min(q.right, vw) - b.width - gap;
    var minY = Math.max(q.top, 0) + gap;
    var maxY = Math.min(q.bottom, vh) - b.height - gap;
    if (maxX < minX) { minX = gap; maxX = vw - b.width - gap; }
    if (maxY - minY < b.height * 2) { minY = gap; maxY = vh - b.height - gap; }

    var cx0 = b.left + b.width / 2;
    var cy0 = b.top + b.height / 2;
    if (px == null) { px = cx0; py = cy0; }

    var best = null;
    var bestScore = -Infinity;
    for (var i = 0; i < 48; i++) {
      var x = minX + Math.random() * Math.max(0, maxX - minX);
      var top = minY + Math.random() * Math.max(0, maxY - minY);
      // не садимся на кнопку «конечно»
      if (x < y.right + 18 && x + b.width > y.left - 18 && top < y.bottom + 18 && top + b.height > y.top - 18) continue;
      var cx = x + b.width / 2;
      var cy = top + b.height / 2;
      var fromPointer = Math.sqrt((cx - px) * (cx - px) + (cy - py) * (cy - py));
      var fromSelf = Math.sqrt((cx - cx0) * (cx - cx0) + (cy - cy0) * (cy - cy0));
      if (fromSelf < 70 || fromPointer < Math.max(b.width, b.height) + 30) continue;
      var score = Math.min(fromPointer, 280) + Math.min(fromSelf, 220) * 0.25 + Math.random() * 40;
      if (score > bestScore) { bestScore = score; best = { x: x, y: top }; }
    }
    if (!best) {
      best = { x: px < vw / 2 ? maxX : minX, y: py < vh / 2 ? maxY : minY };
    }

    noBtn.style.left = (best.x - q.left) + 'px';
    noBtn.style.top = (best.y - q.top) + 'px';
    noBtn.style.setProperty('--tilt', (Math.random() * 18 - 9).toFixed(1) + 'deg');

    // пока кнопка в полёте, в неё невозможно попасть даже очень быстрым кликом
    noBtn.classList.add('is-flying');
    clearTimeout(flyTimer);
    flyTimer = setTimeout(function () { noBtn.classList.remove('is-flying'); }, 480);

    dodges++;
    teaseEl.textContent = TEASES[(dodges - 1) % TEASES.length];
    teaseEl.classList.remove('is-pop');
    void teaseEl.offsetWidth;
    teaseEl.classList.add('is-pop');

    yesBtn.style.setProperty('--grow', Math.min(1 + dodges * 0.05, 1.35).toFixed(2));
    if (dodges >= 3) yesBtn.classList.add('is-pulsing');
  }

  // Мышь: кнопка убегает ещё на подлёте курсора
  window.addEventListener('pointermove', function (e) {
    if (answered || e.pointerType !== 'mouse') return;
    var b = noBtn.getBoundingClientRect();
    var dx = Math.max(b.left - e.clientX, 0, e.clientX - b.right);
    var dy = Math.max(b.top - e.clientY, 0, e.clientY - b.bottom);
    if (dx * dx + dy * dy < 44 * 44) flee(e.clientX, e.clientY);
  }, { passive: true });

  noBtn.addEventListener('pointerenter', function (e) { flee(e.clientX, e.clientY); });

  noBtn.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    flee(e.clientX, e.clientY, true);
  });

  // Палец: убегаем раньше, чем случится нажатие
  noBtn.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var t = e.touches[0];
    flee(t ? t.clientX : null, t ? t.clientY : null, true);
  }, { passive: false });

  // Клавиатура и всё остальное: «нет» всё равно не засчитывается
  noBtn.addEventListener('click', function (e) {
    e.preventDefault();
    flee(null, null, true);
  });

  window.addEventListener('resize', function () {
    if (!fleeing || answered) return;
    var q = question.getBoundingClientRect();
    var b = noBtn.getBoundingClientRect();
    var left = Math.min(Math.max(b.left, 8), document.documentElement.clientWidth - b.width - 8);
    noBtn.style.left = (left - q.left) + 'px';
  });

  /* ---------- 7. «Конечно 😍» ---------- */

  function sayYes(instant) {
    if (answered) return;
    answered = true;

    var y = yesBtn.getBoundingClientRect();
    noBtn.classList.add('is-gone');
    root.classList.add('is-answered');
    teaseEl.textContent = '';

    // показываем скрытые блоки и сразу проверяем, что уже на экране
    $$('.details .reveal').forEach(function (el) {
      if (instant) el.classList.add('is-in');
    });

    if (instant) return;

    if (!reduceMotion) {
      fx.burst(y.left + y.width / 2, y.top + y.height / 2, 90);
      setTimeout(function () { fx.rain(36); }, 450);
    }

    var yay = $('#yay-title');
    setTimeout(function () {
      try { yay.focus({ preventScroll: true }); } catch (err) { /* старые браузеры */ }
      yay.closest('section').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }, reduceMotion ? 0 : 700);
  }

  yesBtn.addEventListener('click', function () { sayYes(false); });

  // Предпросмотр подробностей без вопроса: index.html?yes
  if (/[?&#]yes\b/.test(location.search + location.hash)) {
    openEnvelope();
    sayYes(true);
  }

})();
