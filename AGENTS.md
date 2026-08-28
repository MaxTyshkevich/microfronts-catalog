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

В учебном стенде `@microfronts/ui` подключен через `file:../../packages/ui`. В реальном проекте команда ставит опубликованную версию из npm registry.

