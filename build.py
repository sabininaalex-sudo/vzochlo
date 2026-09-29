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
    slugs = {'Хлорофитум': 'hlorofitum', 'Калатея': 'kalateya', 'Пеперомия': 'peperomiya', 'Орхидея фаленопсис': 'orhideya-falenopsis',
             'Нефролепис': 'nefrolepis', 'Монстера': 'monstera', 'Спатифиллум': 'spatifillum', 'Сансевиерия': 'sansevieriya',
             'Фикус Бенджамина': 'fikus-bendzhamina', 'Антуриум': 'anturium', 'Драцена': 'dracena', 'Замиокулькас': 'zamiokulkas'}
    for p in data:
        p['s'] = slugs[p['n']]
    dot = {'safe': 'g', 'toxic': 'r', 'care': 'y'}
    word = {'safe': 'безопасно', 'toxic': 'ядовито', 'care': 'осторожно'}
    tiles = ''.join(
        f'<button class="tile" type="button" data-i="{i}" aria-pressed="false"><span class="dot {dot[p["v"]]}" aria-hidden="true"></span>'
        f'<img src="@/assets/img/plants/{p["s"]}.webp" alt="" width="84" height="84" loading="lazy"><span class="nm">{esc(p["n"])}</span>'
        f'<span class="visually-hidden">— {word[p["v"]]}</span></button>'
        for i, p in enumerate(data))
    return json.dumps(data, ensure_ascii=False).replace('</', '<\\/'), tiles


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
    urls = []
    for name in sorted(os.listdir(os.path.join(SRC, 'pages'))):
        if not name.endswith('.html'):
            continue
        meta, body = read_page(os.path.join(SRC, 'pages', name))
        url = meta['url']
        if url == '/404.html':
            root = CFG.get('base_path', '/')  # 404 открывается по любому адресу — пути от корня сайта
        else:
            root = rel_root(url)
        page = layout(meta, expand(body, root, extra), root, meta.get('css'))
        page = page.replace('@/', root)
        if 'ё' in page.replace('\\u0451', ''):
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
