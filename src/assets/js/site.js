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

  /* Размер горшка: новый на 2–3 см шире старого */
  var pot = $('[data-pot]');
  if (pot) {
    var inp = $('input', pot), out = $('[data-pot-out]', pot);
    function calc() {
      var d = parseFloat(String(inp.value).replace(',', '.'));
      out.textContent = (d > 0 && d < 200) ? ('Бери горшок ' + (Math.round(d) + 2) + '–' + (Math.round(d) + 3) + ' см') : 'Введи диаметр в сантиметрах';
    }
    inp.addEventListener('input', calc); calc();
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
    var P = [
      { n: 'Хлорофитум', s: 'hlorofitum', url: 'rasteniya/hlorofitum/', light: ['bright', 'mid', 'low'], cat: true, dry: true, easy: true, bloom: false, vibes: ['clean', 'jungle'], why: 'Прощает забытый полив и сам себя размножает', v: { clean: 'Тонкие полосатые листья — легкий акцент без суеты', jungle: 'Свисающие усы с детками — зелени станет больше сама собой' } },
      { n: 'Сансевиерия', s: 'sansevieriya', light: ['bright', 'mid', 'low'], cat: false, dry: true, easy: true, bloom: false, vibes: ['clean', 'odd'], why: 'Переживет отпуск и тень', v: { clean: 'Строгие вертикальные листья — чистая графика', odd: 'Полоски как у змеи — это тебе' } },
      { n: 'Замиокулькас', s: 'zamiokulkas', light: ['mid', 'low'], cat: false, dry: true, easy: true, bloom: false, vibes: ['clean'], why: 'Стоик: мало света и редкий полив', v: { clean: 'Глянцевые листья, будто их только что протерли' } },
      { n: 'Пеперомия', s: 'peperomiya', light: ['bright', 'mid'], cat: true, dry: true, easy: true, bloom: false, vibes: ['clean'], why: 'Компактная, не ядовита для кошек', v: { clean: 'Маленькая и аккуратная — встанет на полку или стол' } },
      { n: 'Калатея', s: 'kalateya', light: ['mid', 'low'], cat: true, dry: false, easy: false, fussy: true, bloom: false, vibes: ['odd'], why: 'Красивая, но любит влажность и внимание', v: { odd: 'Листья с узором, как нарисованные, а на ночь еще и поднимаются' } },
      { n: 'Нефролепис', s: 'nefrolepis', light: ['mid'], cat: true, dry: false, easy: false, fussy: true, bloom: false, vibes: ['jungle'], why: 'Пушистый папоротник, не ядовит для кошек', v: { jungle: 'Облако зелени — самый быстрый путь к джунглям' } },
      { n: 'Монстера', s: 'monstera', light: ['bright', 'mid'], cat: false, dry: true, easy: true, bloom: false, vibes: ['jungle', 'odd'], why: 'Быстро растет и радует', v: { jungle: 'Огромные резные листья — главный символ джунглей', odd: 'Дырявые листья — классика странного' } },
      { n: 'Спатифиллум', s: 'spatifillum', light: ['mid', 'low'], cat: false, dry: false, easy: true, bloom: true, vibes: ['clean', 'bloom'], why: 'Цветет в квартире и честно показывает, когда хочет пить', v: { clean: 'Белые цветы и темные листья — минимализм, который цветет', bloom: 'Белые «паруса» на цветоносах — цветет в обычной квартире' } },
      { n: 'Антуриум', s: 'anturium', light: ['bright', 'mid'], cat: false, dry: false, easy: false, bloom: true, vibes: ['bloom', 'odd'], why: 'Яркие «сердечки» держатся долго', v: { bloom: 'Красные глянцевые «сердечки» — праздник на подоконнике', odd: 'Глянцевые «сердечки», будто из пластика, — но живые' } },
      { n: 'Орхидея фаленопсис', s: 'orhideya-falenopsis', light: ['bright', 'mid'], cat: true, dry: true, easy: false, bloom: true, vibes: ['clean', 'bloom'], why: 'Не ядовита для кошек и не любит, когда заливают', v: { clean: 'Белая орхидея — эталон clean girl интерьера', bloom: 'Цветет долго, если не заливать' } },
      { n: 'Драцена', s: 'dracena', light: ['bright', 'mid'], cat: false, dry: true, easy: true, bloom: false, vibes: ['clean', 'jungle'], why: 'Похожа на пальму, но без хлопот', v: { clean: 'Тонкие листья-перья — легкий силуэт', jungle: 'Пальмовое настроение без пальмы' } },
      { n: 'Фикус Бенджамина', s: 'fikus-bendzhamina', light: ['bright'], cat: false, dry: false, easy: false, fussy: true, bloom: false, vibes: ['jungle'], why: 'Настоящее домашнее дерево, но не любит переезды', v: { jungle: 'Целое дерево в горшке' } }
    ];
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
          t.appendChild(el('span', 'desc', p.why + (p.cat && !/кош/.test(p.why) ? ' · можно с котом' : '') + (p.url ? '' : ' · профиль скоро')));
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
