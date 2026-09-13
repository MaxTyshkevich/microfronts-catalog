# @microfronts/catalog

Отдельный Git-репозиторий React 19 + Vite + Module Federation. Установка не требует соседних исходников: готовые UI и Platform находятся в vendor.

```powershell
npm ci
npm run dev
```

Открыть http://localhost:5174.
Это standalone-приложение: Shell для запуска не требуется. По умолчанию нужен backend на 3000.

Скопируйте .env.example в .env.local. API_PROXY_TARGET выбирает backend для локального /api proxy. Для публичной сборки задайте HTTPS-переменные из примера. Настройки передаются через runtime-config.json.

Команды: npm run typecheck, npm run build (cloud), npm run build:local (localhost), npm run preview. Preview использует порт 4174. Общая сборка и тесты стенда находятся в отдельном integration-репозитории.

Exposed module: catalog/CatalogApp. Он получает RemoteProps из @microfronts/platform. CreateRoot вызывается только в standalone main.tsx.

Для Render используйте render.yaml; для Docker Compose — Dockerfile и nginx.conf (он ожидает сервис backend:3000). vendor и package-lock.json коммитятся, node_modules/dist/.env — нет.

Текущий backend хранит учебные корзины в памяти. Разные origins имеют разные анонимные ключи корзины. Полная инструкция и отчёт — в integration/README.md и integration/IMPLEMENTATION_REPORT.md общего workspace.
