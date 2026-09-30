#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Сборка сайта «Взошло!» в папку docs/ (для GitHub Pages).

Запуск: python3 build.py
Зависимостей нет, нужен только Python 3.8+.
Страницы лежат в src/pages/*.html: сверху JSON-шапка в комментарии <!--meta {...} -->, ниже тело страницы.
В теле можно писать:
  @/путь/     — ссылка от корня сайта (превратится в относительную, работает и на github.io/репо/, и на своем домене)
  {{cat_svg}} — рисунок котика
  {{ad:имя}}  — место под блок РСЯ (код берется из site.json → ad_blocks; пусто — блок не выводится)
"""
import html
import json
import os
import re
import shutil
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'docs')
CFG = json.load(open(os.path.join(ROOT, 'site.json'), encoding='utf-8'))


def snippet(name):
    """Код из папки snippets/ (сюда удобно вставлять код Метрики и РСЯ как есть)."""
    path = os.path.join(ROOT, 'snippets', name + '.html')
    return open(path, encoding='utf-8').read().strip() if os.path.exists(path) else ''


CFG['metrika_snippet'] = CFG.get('metrika_snippet') or snippet('metrika')
CFG['rsya_loader'] = CFG.get('rsya_loader') or snippet('rsya-loader')
CFG.setdefault('ad_blocks', {})
for _k in ('list', 'article', 'feed'):
    CFG['ad_blocks'][_k] = CFG['ad_blocks'].get(_k) or snippet('ad-' + _k)
BASE = CFG['base_url'].rstrip('/')

NAV = [
    ('Что с растением?', '/chto-s-rasteniem/'),
    ('Подобрать растение', '/podbor/'),
    ('Растения А–Я', '/rasteniya/'),
    ('Подоконник', '/podokonnik/'),
    ('Дача', '/dacha/'),
    ('Инструменты', '/instrumenty/'),
]

LOGO_SVG = ('<svg viewBox="0 0 120 200" aria-hidden="true"><path class="stem" d="M60 128 C60 108 58 90 60 64" stroke-width="11" '
            'stroke-linecap="round" fill="none"/><path class="leaf1" d="M60 66 C40 72 16 60 12 36 C34 26 56 38 60 62 Z"/>'
            '<path class="leaf2" d="M60 64 C66 36 88 18 112 26 C110 50 86 66 60 64 Z" stroke="none"/><circle cx="60" cy="166" r="22" fill="#E8483A"/></svg>')
ICON_MOON = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
ICON_SUN = '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'

# Ставится до отрисовки, чтобы не мигала не та тема
THEME_BOOT = "<script>(function(){try{var t=localStorage.getItem('vz-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()</script>"


def esc(s):
    return html.escape(s, quote=True)


def read_page(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'\s*<!--meta\s*(\{.*?\})\s*-->', raw, re.S)
    if not m:
        raise SystemExit('Нет шапки <!--meta {...} --> в ' + path)
    meta = json.loads(m.group(1))
    return meta, raw[m.end():]


def rel_root(url):
    depth = len([p for p in url.strip('/').split('/') if p])
    return '../' * depth


def out_path(url):
    if url.endswith('.html'):
        return os.path.join(OUT, url.lstrip('/'))
    return os.path.join(OUT, url.strip('/'), 'index.html')


def expand(body, root, extra):
    body = body.replace('{{cat_svg}}', extra['cat_svg'])
    body = body.replace('{{cats_json}}', extra['cats_json'])
    body = body.replace('{{cats_tiles}}', extra['cats_tiles'])
    body = body.replace('{{contact}}', extra['contact'])
    body = body.replace('{{plants_grid}}', extra['plants_grid'])
    body = body.replace('{{quiz_json}}', extra['quiz_json'])
    body = body.replace('{{operator}}', esc(CFG.get('operator_name') or 'владелец сайта'))
    body = body.replace('{{today}}', date.today().strftime('%d.%m.%Y'))

    def ad(m):
        code = (CFG.get('ad_blocks') or {}).get(m.group(1), '')
        return f'<div class="ad-slot" data-ad="{m.group(1)}">{code}</div>' if code else ''
    body = re.sub(r'\{\{ad:(\w+)\}\}', ad, body)
    body = re.sub(r'(["\'(])@/', lambda m: m.group(1) + root, body)
    return body


def breadcrumbs_html(crumbs, root):
    if not crumbs:
        return ''
    items = [f'<li><a href="{root}">Главная</a></li>']
    for i, (name, url) in enumerate(crumbs):
        if i == len(crumbs) - 1:
            items.append(f'<li><span aria-current="page">{esc(name)}</span></li>')
        else:
            items.append(f'<li><a href="{root}{url.lstrip("/")}">{esc(name)}</a></li>')
    return '<nav class="crumbs" aria-label="Хлебные крошки"><ol>' + ''.join(items) + '</ol></nav>'


def jsonld(meta):
    out = []
    url = meta['url']
    if url == '/':
        out.append({"@context": "https://schema.org", "@type": "WebSite", "name": CFG['site_name'], "url": BASE + '/', "inLanguage": "ru"})
        out.append({"@context": "https://schema.org", "@type": "Organization", "name": CFG['site_name'], "url": BASE + '/', "logo": BASE + '/assets/img/logo-512.png'})
    if meta.get('crumbs'):
        items = [{"@type": "ListItem", "position": 1, "name": "Главная", "item": BASE + '/'}]
        for i, (n, u) in enumerate(meta['crumbs']):
            items.append({"@type": "ListItem", "position": i + 2, "name": n, "item": BASE + u})
        out.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items})
    return ''.join('<script type="application/ld+json">' + json.dumps(o, ensure_ascii=False) + '</script>\n' for o in out)


def layout(meta, body, root, extra_css):
    url = meta['url']
    is404 = url == '/404.html'
    title = meta['title']
    desc = meta['description']
    head = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{esc(title)}</title>',
        f'<meta name="description" content="{esc(desc)}">',
        '<meta name="theme-color" content="#FBF6EF" media="(prefers-color-scheme: light)">',
        '<meta name="theme-color" content="#2A1F1B" media="(prefers-color-scheme: dark)">',
        f'<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">',
        f'<link rel="icon" href="{root}favicon-120.png" sizes="120x120" type="image/png">',
        f'<link rel="apple-touch-icon" href="{root}apple-touch-icon.png">',
    ]
    if is404:
        head.append('<meta name="robots" content="noindex, follow">')
    else:
        full = BASE + url
        og_title = title.replace(' | ' + CFG['site_name'], '')
        head += [
            f'<link rel="canonical" href="{full}">',
            f'<meta property="og:site_name" content="{esc(CFG["site_name"])}">',
            '<meta property="og:locale" content="ru_RU">',
            f'<meta property="og:type" content="{"website" if url == "/" else "article"}">',
            f'<meta property="og:title" content="{esc(og_title)}">',
            f'<meta property="og:description" content="{esc(desc)}">',
            f'<meta property="og:url" content="{full}">',
            f'<meta property="og:image" content="{BASE}/assets/img/og.png">',
        ]
        if url == '/' and CFG.get('yandex_verification'):
            head.append(f'<meta name="yandex-verification" content="{esc(CFG["yandex_verification"])}">')
    head += [
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@800;900&family=Onest:wght@400;500;600&display=swap" rel="stylesheet">',
        f'<link rel="stylesheet" href="{root}assets/css/site.css">',
    ]
    if extra_css:
        head.append(f'<link rel="stylesheet" href="{root}assets/css/{extra_css}">')
    head.append(THEME_BOOT)
    if not is404:
        head.append(jsonld(meta).rstrip())
    if CFG.get('rsya_loader'):
        head.append(CFG['rsya_loader'])
    if CFG.get('metrika_snippet') and not is404:
        head.append(CFG['metrika_snippet'])

    nav = ''.join(
        f'<a href="{root}{u.lstrip("/")}"' + (' aria-current="page"' if url.startswith(u) else '') + f'>{esc(n)}</a>'
        for n, u in NAV)
    header = f'''<a class="skip" href="#main">К содержанию</a>
<header class="site-header"><div class="wrap">
<a class="logo" href="{root}" aria-label="{esc(CFG["site_name"])} — на главную">Взошло{LOGO_SVG}</a>
<nav class="main-nav" id="main-nav" aria-label="Главное меню">{nav}</nav>
<div class="header-tools">
<a class="btn-outline" href="{root}instrumenty/poliv/">Напоминалка</a>
<button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Переключить тему">{ICON_MOON}{ICON_SUN}</button>
<button class="icon-btn menu-btn" type="button" data-menu-btn aria-expanded="false" aria-controls="main-nav" aria-label="Меню">{ICON_MENU}</button>
</div></div></header>'''
    footer_links = [f'<a href="{root}o-proekte/">О проекте</a>', f'<a href="{root}bezopasno-dlya-koshek/">Растения и кошки</a>',
                    f'<a href="{root}politika-konfidencialnosti/">Политика конфиденциальности</a>']
    footer = f'''<footer class="site-footer"><div class="wrap">
<a class="logo" href="{root}" aria-label="{esc(CFG["site_name"])} — на главную">Взошло{LOGO_SVG}</a>
<nav aria-label="Нижнее меню">{"".join(footer_links)}</nav>
</div></footer>'''
    crumbs = breadcrumbs_html(meta.get('crumbs'), root)
    main = body.replace('{{crumbs}}', crumbs)
    return f'''<!doctype html>
<html lang="ru" data-root="{root}">
<head>
{chr(10).join(head)}
</head>
<body>
{header}
<main id="main">
{main}
</main>
{footer}
<script src="{root}assets/js/site.js" defer></script>
</body>
</html>
'''


def cats_extra():
    data = json.load(open(os.path.join(SRC, 'partials', 'cats-data.json'), encoding='utf-8'))
    dot = {'safe': 'g', 'toxic': 'r', 'care': 'y'}
    word = {'safe': 'безопасно', 'toxic': 'ядовито', 'care': 'осторожно'}
    tiles = ''.join(
        f'<button class="tile" type="button" data-i="{i}" aria-pressed="false"><span class="dot {dot[p["v"]]}" aria-hidden="true"></span>'
        f'<img src="@/assets/img/plants/{p["s"]}.webp" alt="" width="84" height="84" loading="lazy"><span class="nm">{esc(p["n"])}</span>'
        f'<span class="visually-hidden">— {word[p["v"]]}</span></button>'
        for i, p in enumerate(data))
    return json.dumps(data, ensure_ascii=False).replace('</', '<\\/'), tiles


PLANTS = json.load(open(os.path.join(SRC, 'data', 'plants.json'), encoding='utf-8'))
TAG_WORD = {'new': ('Для новичков', 'g'), 'cat': ('Можно с котом', 'g'), 'shade': ('Тень', 'y'), 'bloom': ('Цветет', 'y'), 'light': ('Светолюбивое', 'y')}
CAT_WORD = {'safe': ('Безопасно для кошек', 'g', 'Безопасно'), 'toxic': ('Ядовито для кошек', 'r', 'Ядовито'), 'care': ('Кошкам — осторожно', 'y', 'Осторожно')}
LEVEL_CLS = {'Для новичков': 'g', 'Средняя': 'y'}


def plant_img_size(slug):
    """Ширина и высота webp без сторонних библиотек (VP8/VP8L/VP8X)."""
    b = open(os.path.join(SRC, 'assets', 'img', 'plants', slug + '.webp'), 'rb').read(40)
    kind = b[12:16]
    if kind == b'VP8X':
        return 1 + int.from_bytes(b[24:27], 'little'), 1 + int.from_bytes(b[27:30], 'little')
    if kind == b'VP8L':
        v = int.from_bytes(b[21:25], 'little')
        return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
    return int.from_bytes(b[26:28], 'little') & 0x3FFF, int.from_bytes(b[28:30], 'little') & 0x3FFF


def plants_grid():
    cards = []
    for p in sorted(PLANTS, key=lambda x: x['n']):
        tags = ''.join(f'<span class="tag {TAG_WORD[t][1]}">{TAG_WORD[t][0]}</span>' for t in p['tags'] if t in ('new', 'cat'))
        if p['cat'] == 'toxic':
            tags += '<span class="tag r">Ядовито для кошек</span>'
        cards.append(
            f'<a class="card plant-card" href="@/rasteniya/{p["slug"]}/" data-tags="{" ".join(p["tags"])}">'
            f'<div class="pic"><img src="@/assets/img/plants/{p["slug"]}.webp" alt="{esc(p["n"])}" width="200" height="200" loading="lazy"></div>'
            f'<h2>{esc(p["n"])}</h2><span class="desc">{esc(p["desc"])}</span><div class="tags">{tags}</div></a>')
    return '<div class="grid">' + ''.join(cards) + '</div>'


def quiz_json():
    out = []
    for p in PLANTS:
        q = dict(p['quiz'])
        q.update(n=p['n'], s=p['slug'], url='rasteniya/' + p['slug'] + '/', cat=p['cat'] == 'safe')
        out.append(q)
    return json.dumps(out, ensure_ascii=False).replace('</', '<\\/')


def related(p):
    def sim(o):
        return len(set(o['tags']) & set(p['tags'])) + (o['cat'] == p['cat']) * 0.5
    others = [o for o in PLANTS if o['slug'] != p['slug']]
    others.sort(key=lambda o: -sim(o))
    return others[:3]


def plant_page(p):
    url = f'/rasteniya/{p["slug"]}/'
    cw = CAT_WORD[p['cat']]
    aka = f' ({p["aka"]})' if p.get('aka') else ''
    desc = (f'{p["n"]}{aka}: свет, полив, влажность, температура, пересадка и размножение, частые беды. '
            f'{cw[2]} для кошек — с источником.')
    meta = {'url': url, 'title': p['title'] + ' | Взошло!', 'description': desc,
            'crumbs': [['Растения А–Я', '/rasteniya/'], [p['n'], url]]}
    w, h = plant_img_size(p['slug'])
    lvl = f'<span class="tag {LEVEL_CLS.get(p["level"], "r")}">{esc(p["level"])}</span>'
    tags = lvl + f'<span class="tag {cw[1]}">{cw[0]}</span>' + ''.join(
        f'<span class="tag {TAG_WORD[t][1]}">{TAG_WORD[t][0]}</span>' for t in p['tags'] if t in ('shade', 'bloom', 'light'))
    aka_line = f'<div class="desc">Еще называют: {esc(p["aka"])}</div>' if p.get('aka') else ''
    sec = lambda title, text: f'<section class="card"><h2>{title}</h2><p style="margin-top:8px">{esc(text)}</p></section>'
    probs = ''.join(f'<li><b>{esc(a)}</b> — {esc(b)}</li>' for a, b in p['probs'])
    facts = ''.join(f'<li>{esc(f)}</li>' for f in p['facts'])
    srcs = ''.join(f'<li><a href="{esc(u)}" target="_blank" rel="noopener">{esc(t)}</a></li>' for t, u in p['src'])
    srcs += f'<li><a href="{esc(p["cat_url"])}" target="_blank" rel="noopener">ASPCA — растения и кошки</a></li>'
    rel = ''.join(
        f'<a class="rel" href="@/rasteniya/{o["slug"]}/"><img src="@/assets/img/plants/{o["slug"]}.webp" alt="" width="48" height="48" loading="lazy">'
        f'<span><strong>{esc(o["n"])}</strong><span class="desc">{esc(o["desc"])}</span></span></a>' for o in related(p))
    yellow = any('елт' in a for a, _ in p['probs'])
    body = f'''<div class="wrap">
<div class="page-head">{{{{crumbs}}}}</div>
<div class="profile-top">
<div class="profile-pic"><img src="@/assets/img/plants/{p["slug"]}.webp" alt="{esc(p["n"])} в терракотовом горшке" width="{w}" height="{h}"></div>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="eyebrow">Профиль растения</div>
<h1>{esc(p["n"])}</h1>
<div class="latin">{esc(p["latin"])}</div>
{aka_line}
<div class="tags">{tags}</div>
<div class="facts">
<div class="card"><div class="k">Свет</div><div class="v">{esc(p["q_light"])}</div></div>
<div class="card"><div class="k">Полив</div><div class="v">{esc(p["q_water"])}</div></div>
<div class="card"><div class="k">Сложность</div><div class="v">{esc(p["level"])}</div></div>
<div class="card"><div class="k">Кошки</div><div class="v">{cw[2]} (<a href="{esc(p["cat_url"])}" target="_blank" rel="noopener">ASPCA</a>)</div></div>
</div>
<div style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn" href="@/instrumenty/poliv/">Как поливать</a><a class="btn-ghost" href="@/chto-s-rasteniem/">Что-то не так?</a></div>
</div>
</div>
<div class="with-aside section">
<div style="display:flex;flex-direction:column;gap:16px">
{sec("Характер", p["char"])}
{sec("Свет", p["light"])}
{sec("Полив", p["water"])}
{{{{ad:article}}}}
{sec("Влажность", p["hum"])}
{sec("Температура", p["temp"])}
{sec("Грунт и пересадка", p["soil"])}
{sec("Размножение", p["prop"])}
<section class="card"><h2>Частые беды</h2><ul class="plist">{probs}</ul>{'<p style="margin-top:10px"><a href="@/chto-s-rasteniem/zhelteyut-listya/" style="color:var(--accent)">Подробно: почему желтеют листья →</a></p>' if yellow else ''}</section>
<section class="card"><h2>Интересно</h2><ul class="plist">{facts}</ul></section>
<section class="card"><h2>{esc(p["n"])} и кошки</h2><p style="margin-top:8px"><span class="tag {cw[1]}">{cw[2]}</span></p><p style="margin-top:8px">{esc(p["cat_note"])}</p><p style="margin-top:8px"><a href="@/bezopasno-dlya-koshek/" style="color:var(--accent)">Проверить другие растения →</a></p></section>
<section class="card"><h2>Источники</h2><p class="desc" style="margin-top:6px">Факты взяты из справочников университетских служб, RHS и базы ASPCA. Где источники расходятся, мы так и пишем.</p><ul class="plist">{srcs}</ul></section>
{{{{ad:feed}}}}
</div>
<aside class="sticky"><div class="card"><div class="eyebrow">Похожие по характеру</div><div class="rel-list">{rel}</div>
<p style="margin-top:10px"><a href="@/rasteniya/" style="color:var(--accent)">Весь каталог →</a></p></div>
<div class="card"><div class="eyebrow">Не знаешь, что выбрать?</div><p style="margin-top:8px">Шесть вопросов — и три растения под твое окно и вайб.</p><p style="margin-top:10px"><a class="btn" href="@/podbor/">Пройти квиз</a></p></div></aside>
</div>
</div>
'''
    return meta, body


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    shutil.copytree(os.path.join(SRC, 'assets'), os.path.join(OUT, 'assets'))
    for f in os.listdir(os.path.join(SRC, 'static')):
        shutil.copy(os.path.join(SRC, 'static', f), os.path.join(OUT, f))
    cats_json, cats_tiles = cats_extra()
    email = CFG.get('contact_email') or ''
    extra = {
        'cat_svg': open(os.path.join(SRC, 'partials', 'cat.svg'), encoding='utf-8').read(),
        'cats_json': cats_json, 'cats_tiles': cats_tiles,
        'contact': (f'<a href="mailto:{esc(email)}">{esc(email)}</a>' if email else 'адрес для связи появится здесь в ближайшее время'),
    }
    extra['plants_grid'] = plants_grid()
    extra['quiz_json'] = quiz_json()
    pages = []
    for name in sorted(os.listdir(os.path.join(SRC, 'pages'))):
        if name.endswith('.html'):
            meta, body = read_page(os.path.join(SRC, 'pages', name))
            pages.append((name, meta, body))
    for p in PLANTS:
        meta, body = plant_page(p)
        pages.append(('plant:' + p['slug'], meta, body))
    urls = []
    for name, meta, body in pages:
        url = meta['url']
        if url == '/404.html':
            root = CFG.get('base_path', '/')  # 404 открывается по любому адресу — пути от корня сайта
        else:
            root = rel_root(url)
        page = layout(meta, expand(body, root, extra), root, meta.get('css'))
        page = page.replace('@/', root)
        if 'ё' in page.replace('\\u0451', '') or 'Ё' in page:
            raise SystemExit('Буква ё в странице ' + name)
        path = out_path(url)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'w', encoding='utf-8').write(page)
        if url != '/404.html' and not meta.get('noindex'):
            urls.append(url)
    # sitemap и robots
    today = date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sm += [f'  <url><loc>{BASE}{u}</loc><lastmod>{today}</lastmod></url>' for u in sorted(urls)]
    sm.append('</urlset>')
    open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(sm) + '\n')
    open(os.path.join(OUT, 'robots.txt'), 'w', encoding='utf-8').write(
        f'User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n')
    open(os.path.join(OUT, '.nojekyll'), 'w').write('')
    if CFG.get('custom_domain'):
        open(os.path.join(OUT, 'CNAME'), 'w').write(CFG['custom_domain'].strip() + '\n')
    print(f'Готово: {len(urls)} страниц в sitemap, папка docs/')


if __name__ == '__main__':
    main()
