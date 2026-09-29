# Взошло! — сайт про комнатные растения

Статический сайт: только HTML, CSS и немного JavaScript, без сервера и базы данных. Работает на телефонах, планшетах и компьютерах. Тема — светлая или темная: по умолчанию как в системе, переключается кнопкой в шапке.

## Что где лежит

```
build.py        — сборка сайта (Python 3.8+, без установки пакетов)
site.json       — настройки: домен, почта, код подтверждения Вебмастера
snippets/       — сюда вставляется код Метрики и РСЯ
src/pages/      — страницы (одна страница = один файл)
src/assets/     — стили, скрипт, картинки
src/static/     — favicon и иконки
docs/           — ГОТОВЫЙ сайт. Его публикует GitHub Pages. Руками не править
```

Поменял что-то в `src/` или `site.json` → запусти `python3 build.py` → закоммить папку `docs/`.

## Как опубликовать на GitHub Pages

1. Создай на GitHub новый репозиторий, например `vzoshlo` (Public — для бесплатного GitHub Pages).
2. Загрузи туда содержимое этой папки:
   - через сайт: «Add file → Upload files», перетащи все файлы и папки, «Commit changes»;
   - или из терминала:
     ```
     git remote add origin https://github.com/ТВОЙ_ЛОГИН/vzoshlo.git
     git push -u origin main
     ```
3. В репозитории: **Settings → Pages → Build and deployment → Deploy from a branch → Branch: `main`, папка `/docs` → Save**.
4. Через 1–2 минуты сайт откроется по адресу `https://ТВОЙ_ЛОГИН.github.io/vzoshlo/`.

Пока домена нет и сайт живет по адресу `…github.io/vzoshlo/`, поставь в `site.json` `"base_path": "/vzoshlo/"` и пересобери — иначе страница 404 не найдет стили. Все остальные ссылки на сайте относительные и работают на любом адресе.

## Как подключить домен (например, vzoshlo.ru)

1. **Купи домен** у регистратора (Рег.ру, RU-CENTER, Beget, Timeweb и др.). С 1 сентября 2026 для доменов .ru и .рф нужна идентификация администратора через подтвержденную учетную запись Госуслуг — регистратор попросит пройти ее в личном кабинете.
2. **Пропиши DNS** у регистратора (в Рег.ру: Домены → твой домен → «DNS-серверы и управление зоной» → Добавить запись):
   | Тип | Имя | Значение |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | ТВОЙ_ЛОГИН.github.io |
   Старые A/CNAME-записи для `@` и `www` (заглушка регистратора) удали.
3. **В `site.json`** поставь `"custom_domain": "vzoshlo.ru"`, `"base_url": "https://vzoshlo.ru"`, `"base_path": "/"` → `python3 build.py` → закоммить. Сборка создаст файл `docs/CNAME`.
4. **На GitHub:** Settings → Pages → Custom domain → `vzoshlo.ru` → Save. Когда проверка DNS пройдет, включи **Enforce HTTPS** (сертификат выпускается автоматически, до 24 часов).
5. **Защити домен от перехвата:** в настройках профиля GitHub (не репозитория) → Pages → Add a domain → добавь TXT-запись, которую покажет GitHub, у регистратора.

DNS обновляется от 15 минут до суток.

Официальные инструкции: [домен для GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), [проверка домена](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages), [записи DNS в Рег.ру](https://help.reg.ru/support/dns-servery-i-nastroyka-zony/nastroyka-resursnykh-zapisey-dns/nastroyka-resursnykh-zapisey-v-lichnom-kabinete).

## После запуска

- **Яндекс Вебмастер:** добавь сайт, подтверди права (код вставь в `site.json` → `yandex_verification`), отправь `https://домен/sitemap.xml`.
- **Метрика:** создай счетчик и вставь его код как есть в файл `snippets/metrika.html`.
- **РСЯ:** после одобрения площадки код загрузчика — в `snippets/rsya-loader.html`, коды блоков — в `snippets/ad-list.html` (между карточками), `snippets/ad-article.html` (в тексте) и `snippets/ad-feed.html` (в конце статьи). Пока файл пустой, место под рекламу на сайте не показывается.
- **Политика конфиденциальности:** впиши `operator_name` и `contact_email` в `site.json`. Текст политики — черновик: перед подключением Метрики и РСЯ покажи его юристу.
- **Проверь код ответа 404:** `curl -I https://домен/net-takoi-stranicy/` должен вернуть `404`.

## Что пока не сделано (помечено на сайте как «скоро»)

- Разборы симптомов, кроме «Желтеют листья».
- Профили растений, кроме хлорофитума.
- Калькуляторы грунта и фитолампы, бот-напоминалка в Telegram.
- Календари дачи для регионов, кроме средней полосы.

## Риски хостинга

- GitHub Pages запрещает использовать бесплатный хостинг для интернет-магазинов и SaaS; контентный сайт с рекламой прямо не запрещен, но реклама не должна быть основным содержанием ([условия GitHub](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)).
- В 2026 году в России были перебои с доступом к GitHub. Перед расчетом на доход проверь, открывается ли сайт у разных провайдеров. Запасной вариант — Yandex Cloud Object Storage (статический хостинг): папку `docs/` можно загрузить туда без изменений и переключить DNS.
