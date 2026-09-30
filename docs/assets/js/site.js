/* Взошло! — интерактив сайта. Без зависимостей. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var ROOT = doc.getAttribute('data-root') || '';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function norm(s) { return String(s || '').toLowerCase().replace(/\u0451/g, 'е').replace(/\s+/g, ' ').trim(); }

  /* Тема */
  function effectiveDark() {
    var t = doc.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  $$('[data-theme-toggle]').forEach(function (b) {
    function sync() { b.setAttribute('aria-label', effectiveDark() ? 'Включить светлую тему' : 'Включить темную тему'); }
    sync();
    b.addEventListener('click', function () {
      var next = effectiveDark() ? 'light' : 'dark';
      doc.setAttribute('data-theme', next); store('vz-theme', next); sync();
    });
  });

  /* Меню на мобильных */
  var header = $('.site-header'), menuBtn = $('[data-menu-btn]');
  if (header && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Растение дня */
  var pod = $('[data-pod]'), pop = $('[data-pop]');
  if (pod && pop) {
    function setPop(open) { pop.hidden = !open; pod.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    pod.addEventListener('click', function (e) { e.stopPropagation(); setPop(pop.hidden); });
    $$('[data-pop-close]').forEach(function (b) { b.addEventListener('click', function () { setPop(false); pod.focus(); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { setPop(false); pod.focus(); } });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target)) setPop(false); });
  }

  /* Лейка на главной */
  var hero = $('[data-hero]');
  if (hero) {
    var cap = $('[data-caption]', hero), reset = $('[data-reset]', hero), timers = [];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function phase(n) { hero.classList.remove('phase-1', 'phase-2', 'phase-3'); if (n) hero.classList.add('phase-' + n); }
    function say(t) { if (cap) cap.textContent = t; }
    $('[data-water]', hero).addEventListener('click', function () {
      if (hero.classList.contains('busy') || hero.classList.contains('watered')) return;
      hero.classList.add('busy'); say('Поливаем…');
      if (reduce) { hero.classList.add('grown', 'watered'); hero.classList.remove('busy'); say('Расцвели! С твоими будет так же — если не заливать'); if (reset) reset.hidden = false; return; }
      phase(1);
      timers.push(setTimeout(function () { phase(2); hero.classList.add('grown'); say('Взошло!'); }, 800));
      timers.push(setTimeout(function () { phase(3); }, 2750));
      timers.push(setTimeout(function () { phase(0); hero.classList.remove('busy'); hero.classList.add('watered'); say('Расцвели! С твоими будет так же — если не заливать'); if (reset) reset.hidden = false; }, 3600));
    });
    if (reset) reset.addEventListener('click', function () {
      timers.forEach(clearTimeout); timers = []; phase(0);
      hero.classList.remove('grown', 'watered', 'busy'); reset.hidden = true; say('Нажми на лейку');
    });
  }

  /* Фильтр каталога */
  var chips = $$('[data-filter]');
  if (chips.length) {
    var cards = $$('[data-tags]');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-filter');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        cards.forEach(function (card) { card.hidden = f !== 'all' && card.getAttribute('data-tags').split(' ').indexOf(f) < 0; });
      });
    });
  }

  /* Инструменты: общие помощники */
  function num(v) { var x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : NaN; }
  function fmt(x, d) { return (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toString().replace('.', ','); }
  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function plantsData() { var n = $('#plants-data'); return n ? JSON.parse(n.textContent) : []; }

  /* Размер горшка: NC State (до 20 см +2,5–5, от 25 см +5–7,5), RHS +5–10 */
  var pot = $('[data-pot]');
  if (pot) {
    var inp = $('input', pot), out = $('[data-pot-out]', pot), note = $('[data-pot-note]', pot);
    function calc() {
      var d = num(inp.value);
      if (!(d > 0 && d < 200)) { out.textContent = 'Введи диаметр в сантиметрах'; return; }
      var a, b;
      if (d <= 20) { a = 2.5; b = 5; } else if (d >= 25) { a = 5; b = 7.5; } else { a = 2.5; b = 7.5; }
      out.textContent = 'Бери горшок ' + fmt(d + a, 1) + '–' + fmt(d + b, 1) + ' см';
      if (note) note.textContent = (d > 20 && d < 25 ? 'Между правилами NC State для горшков до 20 см (+2,5–5 см) и от 25 см (+5–7,5 см). ' : 'По правилу NC State. ') +
        'Вариант RHS: ' + fmt(d + 5, 1) + '–' + fmt(d + 10, 1) + ' см, с запасом на 2–3 года.';
      var vd = $('#vol-d'); if (vd && !vd.dataset.touched) { vd.value = fmt(d + a, 1).replace(',', '.'); vd.dispatchEvent(new Event('input')); }
    }
    inp.addEventListener('input', calc); calc();
  }
  var vol = $('[data-vol]');
  if (vol) {
    var vd = $('#vol-d'), vh = $('#vol-h'), vo = $('[data-vol-out]', vol);
    function vcalc() {
      var D = num(vd.value), H = num(vh.value);
      if (!(D > 0 && H > 0)) { vo.textContent = 'Введи диаметр и высоту'; return; }
      var d = D * 0.8, L = Math.PI * H / 12 * (D * D + D * d + d * d) / 1000;
      vo.textContent = 'Около ' + (L < 2 ? fmt(L, 1) : fmt(Math.round(L * 2) / 2, 1)) + ' л грунта';
    }
    vd.addEventListener('input', function (e) { if (e.isTrusted) vd.dataset.touched = '1'; vcalc(); });
    vh.addEventListener('input', vcalc); vcalc();
  }

  /* Состав грунта */
  var soil = $('[data-soil]');
  if (soil) {
    var R = {
      leaf: [
        { t: 'Торф и перлит поровну', s: 'NC State', p: [['торф', 1], ['перлит', 1]] },
        { t: 'Торф, перлит и вермикулит 60/20/20', s: 'NC State', p: [['торф', 3], ['перлит', 1], ['вермикулит', 1]] },
        { t: '2 части торфа, по 1 части перлита и крупного песка', s: 'Clemson', p: [['торф', 2], ['перлит', 1], ['крупный песок', 1]] },
        { t: 'Торф, сосновая кора и перлит поровну', s: 'Clemson', p: [['торф', 1], ['сосновая кора', 1], ['перлит', 1]] }],
      cact: [{ t: '2 части грунта на 1 часть гравия', s: 'RHS', p: [['суглинистый грунт (у RHS — John Innes No 2)', 2], ['садовый гравий или крупный песок', 1]], n: 'Сверху RHS советует тонкий слой гравия.' }],
      epi: [{ t: 'Cornell Epiphytic: кора, торф, перлит поровну', s: 'Clemson', p: [['кора (в рецепте — пихта Дугласа)', 1], ['сфагновый торф', 1], ['перлит', 1]], n: 'В оригинальном рецепте добавляют известь и удобрения. Отдельного рецепта для ароидных источники не дают — этот ближе всего.' }],
      orch: [],
      viol: [
        { t: 'Почва, торф и перлит поровну', s: 'Clemson', p: [['пастеризованная почва', 1], ['торф', 1], ['перлит', 1]] },
        { t: 'Грунт для фиалок и перлит поровну', s: 'UMN', p: [['покупной грунт для фиалок', 1], ['перлит', 1]], n: 'UMN: pH 6,2–6,5, пересаживать раз в год.' }]
    };
    var sg = $('#soil-g'), sl = $('#soil-l'), so = $('[data-soil-out]', soil);
    function scalc() {
      so.innerHTML = '';
      var L = num(sl.value), list = R[sg.value];
      if (sg.value === 'orch') {
        so.appendChild(mk('p', null, 'Орхидеям нужен не грунт, а субстрат: кора сосны или пихты, древесный уголь, крупный перлит (Clemson). Точных пропорций источники не дают — проще купить готовую смесь для орхидей.'));
        so.appendChild(mk('p', 'desc', 'Сфагнум держит влагу у корней и грозит гнилью. Корьевой субстрат меняют примерно раз в 2 года.'));
        return;
      }
      if (!(L > 0)) { so.appendChild(mk('p', null, 'Введи объем в литрах')); return; }
      list.forEach(function (r) {
        var box = mk('div', 'recipe'), sum = r.p.reduce(function (a, x) { return a + x[1]; }, 0);
        box.appendChild(mk('strong', null, r.t)); box.appendChild(mk('span', 'desc', ' · ' + r.s));
        var ul = mk('ul', 'plist');
        r.p.forEach(function (x) { ul.appendChild(mk('li', null, x[0] + ' — ' + fmt(L * x[1] / sum, 1) + ' л')); });
        box.appendChild(ul);
        if (r.n) box.appendChild(mk('p', 'desc', r.n));
        so.appendChild(box);
      });
    }
    sg.addEventListener('change', scalc); sl.addEventListener('input', scalc); scalc();
  }
  var sp = $('[data-soilplant]');
  if (sp) {
    var PL = plantsData(), sel = $('#soil-p'), spo = $('[data-soilplant-out]', sp);
    PL.forEach(function (p, i) { var o = mk('option', null, p.n); o.value = i; sel.appendChild(o); });
    function pcalc() {
      var p = PL[+sel.value]; spo.innerHTML = '';
      spo.appendChild(mk('p', null, p.soil));
      var a = mk('a', null, 'Весь уход за растением →'); a.href = ROOT + p.url; a.style.color = 'var(--accent)';
      var w = mk('p'); w.style.marginTop = '10px'; w.appendChild(a); spo.appendChild(w);
    }
    sel.addEventListener('change', pcalc); pcalc();
  }

  /* Свет у окна: таблица Illinois Extension + шкала UMN */
  var LV = {
    direct: ['Прямое солнце', 'Очень ярко: прямые лучи. Подойдет светолюбивым, остальных отодвинь или притени.', 'g', ['bright']],
    high: ['Высокий свет', 'Ярко. Хорошо светолюбивым и растениям среднего света без прямых полуденных лучей.', 'g', ['bright', 'mid']],
    mid: ['Средний свет', 'Большинству лиственных растений здесь хорошо, цветущим может не хватить.', 'y', ['mid']],
    low: ['Низкий свет', 'Выживут теневыносливые. Цветения не жди.', 'y', ['low']],
    dark: ['Слишком темно', 'Растениям здесь, скорее всего, не хватит света. Переставь ближе к окну или добавь фитолампу.', 'r', []]
  };
  var TBL = { s: ['direct', 'high', 'high', 'mid', 'low', 'low'], ew: ['high', 'mid', 'low', 'low', 'dark', 'dark'], n: ['mid', 'low', 'low', 'dark', 'dark', 'dark'] };
  var light = $('[data-light]'), PLL = plantsData(), plBox = $('[data-light-plants]');
  function showPlants(lv) {
    if (!plBox) return;
    plBox.innerHTML = '';
    var fit = PLL.filter(function (p) { return LV[lv][3].some(function (x) { return p.light.indexOf(x) >= 0; }); });
    if (!fit.length) { plBox.appendChild(mk('p', null, 'Ни одно растение из каталога здесь без досветки не порадует.')); return; }
    fit.forEach(function (p) {
      var a = mk('a', 'rel'); a.href = ROOT + p.url;
      var img = mk('img'); img.src = ROOT + 'assets/img/plants/' + p.s + '.webp'; img.alt = ''; img.width = 48; img.height = 48; img.loading = 'lazy';
      var t = mk('span'); t.appendChild(mk('strong', null, p.n)); t.appendChild(mk('span', 'desc', p.desc));
      a.appendChild(img); a.appendChild(t); plBox.appendChild(a);
    });
  }
  function renderLevel(box, lv, extra) {
    box.innerHTML = '';
    var h = mk('div'); h.appendChild(mk('span', 'tag ' + LV[lv][2], LV[lv][0])); box.appendChild(h);
    box.appendChild(mk('p', null, LV[lv][1]));
    if (extra) box.appendChild(mk('p', 'desc', extra));
    showPlants(lv);
  }
  if (light) {
    var ls = $('#lt-side'), ld = $('#lt-dist'), lo = $('[data-light-out]', light);
    function lcalc() {
      var lv = TBL[ls.value][+ld.value];
      renderLevel(lo, lv, ls.value === 'n' && +ld.value === 0 ? 'У северного окна свет средний только вплотную к стеклу, а зимой — низкий.' : (+ld.value >= 4 ? 'Дальше примерно 3 м от окна света обычно не хватает.' : ''));
    }
    ls.addEventListener('change', lcalc); ld.addEventListener('change', lcalc); lcalc();
  }
  var lux = $('[data-lux]');
  if (lux) {
    var lv2 = $('#lux-v'), lxo = $('[data-lux-out]', lux);
    lv2.addEventListener('input', function () {
      var x = num(lv2.value);
      if (!(x >= 0)) { lxo.textContent = ''; return; }
      renderLevel(lxo, x > 10760 ? 'high' : x >= 2690 ? 'mid' : x >= 538 ? 'low' : 'dark', 'Это примерно ' + fmt(x / 10.76, 0) + ' фут-свечей.');
    });
    lv2.addEventListener('focus', function () { lv2.dispatchEvent(new Event('input')); }, { once: true });
  }

  /* Фитолампа */
  var lamp = $('[data-lamp]');
  if (lamp) {
    var T = {
      leaf: { h: [12, 14], d: 'лиственным UMN советует 30–60 см', src: 'UMN' },
      bloom: { h: [14, 16], d: 'цветущим UMN советует 15–30 см', src: 'UMN' },
      seed: { h: [16, 18], d: 'рассаде UMN советует 10–15 см', src: 'UMN' },
      viol: { h: [14, 16], d: 'фиалкам Clemson советует 15–30 см', src: 'UMN, Clemson' }
    };
    var lt = $('#lp-t'), lk = $('#lp-k'), ln = $('#lp-n'), lon = $('#lp-on'), lpo = $('[data-lamp-out]', lamp);
    function tadd(t, h) { var p = t.split(':'); var m = (+p[0] * 60 + +p[1] + h * 60) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
    function pcalc2() {
      var c = T[lt.value], hrs = c.h.slice();
      var why = '';
      if (lt.value !== 'seed') {
        if (ln.value === 'none') { hrs = [16, 16]; why = 'Без дневного света University of Missouri советует 16–18 ч, но Clemson и Illinois — не больше 16 ч, чтобы осталось 8 ч темноты.'; }
        else if (lt.value === 'leaf') why = 'При частичном дневном свете University of Missouri тоже называет 12–14 ч.';
      }
      var H = hrs[1];
      lpo.innerHTML = '';
      var big = mk('strong', 'calc-out', (hrs[0] === hrs[1] ? hrs[0] : hrs[0] + '–' + hrs[1]) + ' ч в сутки'); lpo.appendChild(big);
      lpo.appendChild(mk('p', null, 'Включай в ' + (lon.value || '08:00') + ', выключай в ' + tadd(lon.value || '08:00', H) + '. Темный период — ' + (24 - H) + ' ч.'));
      lpo.appendChild(mk('p', null, 'Расстояние до листьев: ' + c.d + '. ' + 'Общий ориентир Iowa State по типу лампы: ' + (lk.value === 'led' ? 'светодиодные обычно 30–60 см.' : 'люминесцентные 15–30 см.') + ' Точнее — по инструкции к лампе.'));
      if (why) lpo.appendChild(mk('p', 'desc', why));
      lpo.appendChild(mk('p', 'desc', 'Источник: ' + c.src + ', Iowa State.'));
    }
    [lt, lk, ln].forEach(function (e) { e.addEventListener('change', pcalc2); }); lon.addEventListener('input', pcalc2); pcalc2();
  }

  /* Календарь: подсветить текущий месяц */
  var m = new Date().getMonth() + 1;
  $$('.cal th[data-m="' + m + '"]').forEach(function (th) { th.classList.add('now'); });

  /* Квиз подбора: условия + вайб */
  var quiz = $('[data-quiz]');
  if (quiz) {
    var Q = [
      { k: 'vibe', q: 'Какой у тебя вайб?', o: [
        ['clean', 'Clean girl: светлые стены, лен, все по линеечке'],
        ['bloom', 'Хочу, чтобы цвело: немножко бабушкин сад, но в городе'],
        ['jungle', 'Джунгли: больше зелени, больше листьев'],
        ['odd', 'Коллекционер странного: узоры, полоски, необычные формы']] },
      { k: 'light', q: 'Сколько света у окна, где будет растение?', o: [['bright', 'Много: юг, солнце полдня'], ['mid', 'Средне: восток или запад'], ['low', 'Мало: север или в глубине комнаты']] },
      { k: 'cat', q: 'Дома есть кот, который все пробует на зуб?', o: [['yes', 'Да, конечно'], ['no', 'Нет']] },
      { k: 'care', q: 'Честно: какой ты растительный родитель?', o: [
        ['killer', 'Все вянет. Нужен кто-то, кто выживет сам'],
        ['ok', 'Полью, когда вспомню'],
        ['fussy', 'Люблю возиться: опрыскивать, протирать листья']] },
      { k: 'away', q: 'Как часто ты уезжаешь больше чем на неделю?', o: [['often', 'Часто'], ['rare', 'Редко']] },
      { k: 'flow', q: 'Цветы или листья?', o: [['bloom', 'Хочу цветы'], ['leaves', 'Мне хватит красивых листьев'], ['any', 'Без разницы']] }
    ];
    var VIBE = {
      clean: { t: 'Clean girl на подоконнике', d: 'Светло, чисто, одна идеальная линия. Тебе подходят растения с четкой графикой: выглядят аккуратно и не устраивают беспорядок.' },
      bloom: { t: 'Бабушкин сад, но в городе', d: 'Хочется, чтобы радовало цветом. Берем тех, кто цветет в квартире без теплицы и шаманства.' },
      jungle: { t: 'Джунгли в однушке', d: 'Больше листьев — больше счастья. Твоя цель — зеленая стена, и начать можно с этих ребят.' },
      odd: { t: 'Коллекционер странного', d: 'Тебе скучно с обычным фикусом. Узоры, полоски и формы, про которые спрашивают гости.' }
    };
    // light — где нормально, cat — безопасно для кошек по ASPCA, dry — переживет пропуск полива, easy — для новичков, fussy — любит внимание
    var P = JSON.parse($('#quiz-data').textContent);
    function score(p, a, strictLight) {
      if (a.cat === 'yes' && !p.cat) return null;                 // безопасность кота — жесткое правило
      if (strictLight && p.light.indexOf(a.light) < 0) return null;
      var s = 0;
      if (p.light.indexOf(a.light) >= 0) s += 3;
      if (p.vibes.indexOf(a.vibe) >= 0) s += 4;
      if (a.care === 'killer') s += p.easy ? 3 : -4;
      if (a.care === 'ok') s += p.easy ? 1 : -1;
      if (a.care === 'fussy') s += p.fussy ? 3 : (p.easy ? 0 : 1);
      if (a.away === 'often') s += p.dry ? 2 : -3;
      if (a.flow === 'bloom') s += p.bloom ? 4 : -1;
      if (a.flow === 'leaves') s += p.bloom ? -1 : 1;
      return s;
    }
    function pick(a) {
      function rank(strict) {
        return P.map(function (p, i) { return { p: p, s: score(p, a, strict), i: i }; })
          .filter(function (x) { return x.s !== null; })
          .sort(function (x, y) { return y.s - x.s || x.i - y.i; });
      }
      var r = rank(true), relaxed = false;
      if (r.length < 3) { r = rank(false); relaxed = true; }
      return { list: r.slice(0, 3).map(function (x) { return x.p; }), relaxed: relaxed };
    }
    var st = { step: 0, a: {} };
    var box = $('[data-quiz-box]', quiz), bar = $('.progress i', quiz);
    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function render() {
      box.innerHTML = '';
      bar.style.width = Math.round(Math.min(st.step, Q.length) / Q.length * 100) + '%';
      if (st.step < Q.length) {
        var cur = Q[st.step];
        var k = el('div', null, 'Вопрос ' + (st.step + 1) + ' из ' + Q.length); k.style.cssText = 'font-size:14px;color:var(--muted)'; box.appendChild(k);
        var h = el('h2', null, cur.q); h.setAttribute('tabindex', '-1'); box.appendChild(h);
        var list = el('div'); list.style.cssText = 'display:flex;flex-direction:column;gap:10px';
        cur.o.forEach(function (o) {
          var b = el('button', 'card opt', o[1]); b.type = 'button';
          b.addEventListener('click', function () { st.a[cur.k] = o[0]; st.step++; render(); var nh = $('h2', box); if (nh) nh.focus(); });
          list.appendChild(b);
        });
        box.appendChild(list);
        if (st.step > 0) {
          var back = el('button', 'btn-ghost', '← Назад'); back.type = 'button'; back.style.alignSelf = 'flex-start';
          back.addEventListener('click', function () { st.step--; render(); });
          box.appendChild(back);
        }
      } else {
        var a = st.a, vb = VIBE[a.vibe], res = pick(a);
        var vc = el('div', 'card vibe-card');
        vc.appendChild(el('div', 'eyebrow', 'Твой растительный вайб'));
        var h2 = el('h2', null, vb.t); h2.setAttribute('tabindex', '-1'); vc.appendChild(h2);
        vc.appendChild(el('p', null, vb.d));
        box.appendChild(vc);
        box.appendChild(el('h3', null, 'Твои кандидаты'));
        res.list.forEach(function (p) {
          var c = el(p.url ? 'a' : 'div', 'card result');
          if (p.url) c.href = ROOT + p.url;
          var img = el('img'); img.src = ROOT + 'assets/img/plants/' + p.s + '.webp'; img.alt = ''; img.width = 64; img.height = 72;
          var t = el('span'); t.style.cssText = 'display:flex;flex-direction:column;gap:3px';
          var nm = el('strong', null, p.n); nm.style.cssText = 'font-family:Nunito,sans-serif;font-size:21px;font-weight:800'; t.appendChild(nm);
          if (p.v[a.vibe]) t.appendChild(el('span', null, p.v[a.vibe]));
          t.appendChild(el('span', 'desc', p.why + (p.cat && !/кош/.test(p.why) ? ' · можно с котом' : '') + ''));
          c.appendChild(img); c.appendChild(t); box.appendChild(c);
        });
        if (res.relaxed) box.appendChild(el('p', 'desc', 'Под твое окно подошло мало вариантов, поэтому часть кандидатов любит чуть больше света. Поставь их поближе к окну или добавь фитолампу.'));
        if (a.cat === 'yes') box.appendChild(el('p', 'desc', 'Ядовитые для кошек растения мы убрали из подборки — по базе ASPCA.'));
        var row = el('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px';
        var share = el('button', 'btn', 'Поделиться вайбом'); share.type = 'button';
        share.addEventListener('click', function () {
          var text = 'Мой растительный вайб — «' + vb.t + '». Мне подходят: ' + res.list.map(function (p) { return p.n.toLowerCase(); }).join(', ') + '. Узнай свой:';
          var url = location.href.split('#')[0];
          if (navigator.share) { navigator.share({ title: 'Взошло!', text: text, url: url }).catch(function () {}); return; }
          var done = function () { share.textContent = 'Скопировано ✓'; setTimeout(function () { share.textContent = 'Поделиться вайбом'; }, 2000); };
          if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(done, function () {});
        });
        var r = el('button', 'btn-ghost', 'Пройти заново'); r.type = 'button';
        r.addEventListener('click', function () { st = { step: 0, a: {} }; render(); });
        row.appendChild(share); row.appendChild(r); box.appendChild(row);
      }
    }
    render();
  }

  /* Безопасно для кота */
  var cats = $('[data-cats]');
  if (cats) {
    var DATA = JSON.parse($('#cats-data').textContent);
    var stage = $('[data-stage]', cats), bubble = $('[data-bubble]', cats), plantImg = $('[data-plant-img]', cats);
    var out = $('[data-cat-result]', cats), input = $('input', cats), tick = 0, sel = -1;
    var BUB = { idle: 'Покажи, что у тебя на подоконнике', safe: 'Мрр! Можно дружить', toxic: 'Фу-фу! Убери повыше!', care: 'Хм... я бы не грыз', unknown: 'Такого не знаю...' };
    var LBL = { safe: ['Не ядовит', 'g'], toxic: ['Ядовит', 'r'], care: ['Осторожно', 'y'] };
    var tiles = $$('[data-i]', cats);
    function setMood(m) {
      tick = tick ? 0 : 1;
      stage.className = stage.className.replace(/\b(vz-m-\w+|vz-t\d|m-\w+)\b/g, '').trim() + ' vz-m-' + m + ' m-' + m + ' vz-t' + tick;
      bubble.textContent = BUB[m];
      $('svg', stage).setAttribute('aria-label', 'Котик: ' + BUB[m]);
    }
    function show(i, q) {
      sel = i;
      tiles.forEach(function (t) { t.setAttribute('aria-pressed', String(+t.getAttribute('data-i') === i)); });
      out.innerHTML = '';
      if (i >= 0) {
        var p = DATA[i]; setMood(p.v);
        plantImg.src = ROOT + 'assets/img/plants/' + p.s + '.webp'; plantImg.alt = p.n;
        var head = document.createElement('div'); head.style.cssText = 'display:flex;justify-content:space-between;gap:12px;align-items:flex-start';
        var nm = document.createElement('div');
        var h = document.createElement('h2'); h.textContent = p.n; nm.appendChild(h);
        var lt = document.createElement('div'); lt.className = 'latin'; lt.textContent = p.l; nm.appendChild(lt);
        var tg = document.createElement('span'); tg.className = 'tag ' + LBL[p.v][1]; tg.textContent = LBL[p.v][0];
        head.appendChild(nm); head.appendChild(tg); out.appendChild(head);
        var t = document.createElement('p'); var b = document.createElement('b'); b.textContent = p.why + ' '; t.appendChild(b); t.appendChild(document.createTextNode(p.more)); out.appendChild(t);
        var a = document.createElement('a'); a.href = p.u; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Источник: ASPCA ↗'; a.style.color = 'var(--accent)'; out.appendChild(a);
        var pr = document.createElement('a'); pr.href = ROOT + 'rasteniya/' + p.s + '/'; pr.textContent = 'Уход за растением →'; pr.style.color = 'var(--accent)'; out.appendChild(pr);
      } else {
        setMood('unknown'); plantImg.removeAttribute('src'); plantImg.alt = '';
        var h2 = document.createElement('h2'); h2.textContent = '«' + q + '» пока нет в нашем списке'; out.appendChild(h2);
        var p2 = document.createElement('p'); p2.textContent = 'Мы добавляем растения постепенно и проверяем каждое по базе ASPCA. Пока можно поискать там по латинскому названию.'; out.appendChild(p2);
        var l = document.createElement('a'); l.href = 'https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list'; l.target = '_blank'; l.rel = 'noopener'; l.textContent = 'Список растений ASPCA для кошек ↗'; l.style.color = 'var(--accent)'; out.appendChild(l);
      }
    }
    function find(q) {
      q = norm(q); if (!q) return -2;
      for (var i = 0; i < DATA.length; i++) {
        var names = [DATA[i].n, DATA[i].l].concat(DATA[i].syn);
        for (var j = 0; j < names.length; j++) { var n = norm(names[j]); if (n === q || n.indexOf(q) === 0 || q.indexOf(n) === 0) return i; }
      }
      for (var k = 0; k < DATA.length; k++) if (q.length >= 4 && norm(DATA[k].n).indexOf(q) >= 0) return k;
      return -1;
    }
    function reveal() { if (window.innerWidth < 1000 && stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    tiles.forEach(function (t) { t.addEventListener('click', function () { show(+t.getAttribute('data-i')); reveal(); }); });
    $('form', cats).addEventListener('submit', function (e) { e.preventDefault(); var i = find(input.value); if (i === -2) return; show(i, input.value.trim()); reveal(); });
  }

  /* 404: полить росток */
  var nf = $('[data-nf]');
  if (nf) {
    var nstage = $('.vz-stage', nf), say = $('[data-say]', nf), wbtn = $('[data-nf-water]', nf), t2 = 0;
    wbtn.addEventListener('click', function () {
      t2 = t2 ? 0 : 1;
      nstage.className = 'vz-stage vz-m-safe vz-t' + t2;
      say.textContent = 'Взошло! Страницу все равно не нашли, зато красиво';
      wbtn.textContent = 'Еще разок';
    });
  }
})();
