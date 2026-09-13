# Правила catalog-репозитория

Это отдельный репозиторий команды каталога. Команда не зависит от shell и не должна импортировать его код.

## Границы

- Catalog запускается standalone на `http://localhost:5174`.
- Catalog отдает `remoteEntry.js` для shell.
- Публичный модуль: `catalog/CatalogApp`.
- Контракт с shell - это exposed module, URL remote и договоренная форма интеграции.

## Команды

- `npm install` - установить зависимости catalog.
- `npm run dev` - запустить standalone/dev remote на `http://localhost:5174`.
- `npm run dev:remote` - то же самое, явное имя для запуска из shell.
- `npm run typecheck` - проверить TypeScript.
- `npm run build` - собрать catalog.

## Shared UI

Для независимого checkout `@microfronts/ui` и `@microfronts/platform` поставляются готовыми tarball в `vendor/`. Архивы и package-lock.json должны храниться в Git. После обновления пакета обновлять версию и lock-файл. Плановый следующий шаг — npm registry.

Production build требует HTTPS-переменные из `.env.example`. Для локальной проверки сборки используется `npm run build:local`; общий стенд и E2E находятся в отдельном `integration`-репозитории.
