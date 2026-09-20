# @microfronts/catalog

Архитектура и правила FSD: [docs/architecture.md](docs/architecture.md). Процесс выполнения задач: [AGENTS.md](AGENTS.md).

Отдельный Git-репозиторий React 19 + Vite + Module Federation. Установка не требует соседних исходников: готовый UI находится в vendor. Связь микрофронтов — через props, навигационные callbacks и общий TanStack QueryClient; пакет platform не требуется. Контракт поставляется архивом @microfronts/contracts в vendor.

```powershell
npm ci
npm run dev
```

Открыть http://localhost:5174.
Это standalone-приложение: Shell для запуска не требуется. По умолчанию нужен backend на 3000.

Скопируйте .env.example в .env.local. API_PROXY_TARGET выбирает backend для локального /api proxy. Для публичной сборки задайте HTTPS-переменные из примера. Настройки передаются через runtime-config.json.

Команды: npm run typecheck, npm run build (cloud), npm run build:local (localhost), npm run preview. Preview использует порт 4174. Общая сборка и тесты стенда находятся в отдельном integration-репозитории.

Exposed module: catalog/CatalogApp. Props из @microfronts/contracts: apiBaseUrl, cartKey, queryClient, sessionScope, onUnauthorized, onNavigate. Общий клиент создаёт Shell. Standalone создаёт свой клиент и отправляет гостевые запросы без cookies. Старые onCartChanged сохранены для совместимости host. CreateRoot вызывается только в standalone main.tsx.

Для Render используйте render.yaml; для Docker Compose — Dockerfile и nginx.conf (он ожидает сервис backend:3000). vendor и package-lock.json коммитятся, node_modules/dist/.env — нет.

Текущий backend хранит пользователей, сессии и корзины в SQLite. Разные origins имеют разные анонимные ключи корзины. Полная инструкция и отчёт — в integration/README.md и integration/IMPLEMENTATION_REPORT.md общего workspace.

Обновляйте backend, Shell и remote согласованным комплектом: новый backend требует X-Requested-With для мутаций, новые remote его отправляют. Новому Shell нужны remote с поддержкой sessionScope. Zustand пока не используется.
