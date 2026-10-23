# @microfronts/catalog

Архитектура, структура FSD и правила размещения новых запросов и состояния: [docs/architecture.md](docs/architecture.md). Процесс выполнения задач: [AGENTS.md](AGENTS.md).

Отдельный Git-репозиторий React 19 + Vite + Module Federation. Установка не требует соседних исходников: готовый UI находится в vendor. Связь микрофронтов — через props, навигационные callbacks и общий TanStack QueryClient; пакет platform не требуется. Контракт поставляется архивом @microfronts/contracts в vendor.

```powershell
npm ci
npm run dev
```

Открыть http://localhost:5174.
Это standalone-приложение: Shell для запуска не требуется. По умолчанию нужен backend на 3000.

Скопируйте .env.example в .env.local. API_PROXY_TARGET выбирает backend для локального /api proxy. Для публичной сборки задайте HTTPS-переменные из примера. Настройки передаются через runtime-config.json.

Команды: npm run typecheck, npm run test, npm run build (cloud), npm run build:local (localhost), npm run preview. Preview использует порт 4174. Общая сборка и тесты стенда находятся в отдельном integration-репозитории.

Exposed module: catalog/CatalogApp. Props из @microfronts/contracts: apiBaseUrl, cartKey, queryClient, sessionScope, onUnauthorized, onNavigate. Общий клиент создаёт Shell. Standalone создаёт свой клиент и отправляет гостевые запросы без cookies. Старые onCartChanged сохранены для совместимости host. createRoot вызывается только в app/entrypoint/standalone.tsx.

Для Render используйте render.yaml; для Docker Compose — Dockerfile и nginx.conf (он ожидает сервис backend:3000). vendor и package-lock.json коммитятся, node_modules/dist/.env — нет.

Текущий backend хранит товары, категории, пользователей, сессии и корзины в PostgreSQL. Разные origins имеют разные анонимные ключи корзины.

## Страницы каталога

- `/catalog` — категории слева, все товары справа. Выбор категории меняет URL на `/catalog?category=peripherals`; «Все товары» сбрасывает фильтр. Обновление страницы и история браузера сохраняют выбор.
- `/catalog/products/:productId` — описание товара, категория, цена, рейтинг и добавление в корзину. Ссылка из списка переносит query string; «К списку товаров» возвращает выбранный фильтр. Хлебные крошки ведут к категории самого товара.

Catalog использует React Router 7.18.4. Shell монтирует remote по `/catalog/*` и предоставляет общий router через singleton `react-router` в Module Federation; remote не создаёт второй BrowserRouter. Standalone создаёт BrowserRouter сам и перенаправляет `/` на `/catalog`. nginx/Render настроены на прямые ссылки `/catalog` и `/catalog/*`.

Нужен backend с миграцией `20261023000100_add_categories` и API `GET /categories`, `GET /products?category=<slug>`, `GET /products/:id`. Товары включают `categoryId` и `category: { id, name, slug }`; неизвестный товар/категория дают 404, пустая категория — `[]`. Ошибки сети можно повторить. Состояние запросов и отдельные ключи фильтра/товара принадлежат TanStack Query.

Проверки: `npm test`, `npm run typecheck`, `npm run build:local`; `npx playwright install chromium`, затем `npm run test:browser` проверяет собранное standalone-приложение с подменённым API (фильтр, история, прямые ссылки, ошибки, корзина). Настоящую загрузку remote дополнительно проверять в Shell. Порядок выпуска: сначала backend с миграцией, затем Shell с общим router и catalog согласованным комплектом; `CatalogProps` не изменились, но общий router стал требованием интеграции.

Обновляйте backend, Shell и remote согласованным комплектом: новый backend требует X-Requested-With для мутаций, новые remote его отправляют. Новому Shell нужны remote с поддержкой sessionScope. Zustand пока не используется.

## Tailwind и владение CSS

Tailwind 4 и @tailwindcss/vite установлены как devDependencies: каждый репозиторий собирает свой CSS, в federation.shared они не входят. Поддерживаются Chrome 111+, Safari 16.4+ и Firefox 128+.

Файл src/app/styles/tailwind.css сканирует только собственный src и использует префикс `catalog:`: например, `catalog:flex`, `catalog:hover:bg-blue-600`. Записывайте классы целиком, не собирайте имена интерполяцией. Исходники соседей и UI-пакета не сканируются.

Exposed-компонент импортирует Tailwind, а страница — свой catalog.css, поэтому стили доступны и внутри Shell. Reset @microfronts/ui/reset.css импортируется только в app/entrypoint/standalone.tsx для standalone и не входит в граф exposed-модуля. Глобальные стили страницы остаются в standalone.css.

UI-пакет 0.2.0-tailwind.0 из vendor автоматически поставляет готовые стили компонентов без Preflight и глобальных правил base. Его reset.css содержит Preflight и базовые правила темы. Во всех сборках порядок слоёв: theme, base, components, utilities. Префиксы не изолируют произвольный CSS: ручные правила ограничивайте корнем remote или CSS Modules. Оставшиеся правила без слоя имеют приоритет над utilities; при миграции удаляйте заменённые декларации.

Порядок выпуска: сначала Shell с явным reset, затем remote с CSS без reset. Архивы vendor и lock-файлы обновляются вместе; зависимости на соседние checkout не добавляются.
