# @microfronts/catalog

Архитектура, структура FSD и правила размещения новых запросов и состояния: [docs/architecture.md](docs/architecture.md). Процесс выполнения задач: [AGENTS.md](AGENTS.md).

Импорты: `@/` указывает на собственный `src`; между слайсами использовать публичный API, внутри слайса — прямой относительный путь. Проверки: `npm run lint` (включая границы FSD), `npm run test:lint` (тесты правил). `npm run check:architecture` — совместимый псевдоним lint. Подробности и исключения описаны в [архитектуре](docs/architecture.md#импорты-и-eslint).

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

В Vercel production/preview сборка использует `https://<VERCEL_URL>/`, если `VERCEL=1` и не задан `VITE_PUBLIC_BASE`. Системные переменные Vercel должны быть доступны сборке. Явный `VITE_PUBLIC_BASE` имеет приоритет; для других платформ HTTPS-адрес по-прежнему обязателен. API задаётся `VITE_API_BASE_URL` (HTTPS) либо остаётся `/api`. Для `/api` нужен backend или rewrite на том же origin: локальный Vite proxy на Vercel не переносится. В Shell API передаётся через props; standalone использует runtime-config.json текущего deployment.

`vercel.json` направляет `/catalog` и `/catalog/*` на index.html для прямого открытия страниц и перезагрузки. Пути `/api/*`, remoteEntry.js и assets не входят в SPA rewrite.

Автоматические Vercel deployment разрешены только для `main`: production обновляется после слияния PR, Preview для остальных веток отключены через `git.deploymentEnabled`. GitHub CI продолжает проверять каждый push и PR (типы, HTTP/config-тесты, браузерные сценарии и production-сборка). Перед слиянием проверяйте remote локально внутри Shell. Поддержка Vercel URL в конфигурации сохранена для возможного ручного тестового deployment; существующие deployment автоматически не удаляются.

Текущий backend хранит товары, категории, пользователей, сессии и корзины в PostgreSQL. Разные origins имеют разные анонимные ключи корзины.

## Страницы каталога

- `/catalog` — категории слева, все товары справа. Ссылки категорий открывают `/catalog/category/:slug`. Старые ссылки `/catalog?category=peripherals` продолжают фильтровать список; «Все товары» сбрасывает фильтр.
- `/catalog/category/:slug` — название, описание, рекомендации по выбору и товары категории. Данные категории берутся из `GET /categories`, товары — из `GET /products?category=<slug>`. Описания для `peripherals`, `monitors`, `other` хранятся локально в `entities/category/model/category-content.ts`; для других существующих категорий используется общий текст. Backend не требует изменений.
- `/catalog/products/:productId` — описание товара, категория, цена, рейтинг и добавление в корзину. Ссылка со страницы категории передаёт `?category=<slug>&from=category`, чтобы «К списку товаров» возвращала на страницу категории даже после перезагрузки. Ссылка из старого фильтра сохраняет возврат в фильтр. Хлебные крошки открывают страницу категории самого товара.

Catalog использует React Router 7.18.4. Shell монтирует remote по `/catalog/*` и предоставляет общий router через singleton `react-router` в Module Federation; remote не создаёт второй BrowserRouter. Standalone создаёт BrowserRouter сам и перенаправляет `/` на `/catalog`. nginx/Render настроены на прямые ссылки `/catalog` и `/catalog/*`.

Нужен backend с миграцией `20261023000100_add_categories` и API `GET /categories`, `GET /products?category=<slug>`, `GET /products/:id`. Товары включают `categoryId` и `category: { id, name, slug }`; неизвестный товар/категория дают 404, пустая категория — `[]`. Ошибки сети можно повторить. Состояние запросов и отдельные ключи фильтра/товара принадлежат TanStack Query.

Проверки: `npm test`, `npm run typecheck`, `npm run build:local`; `npx playwright install chromium`, затем `npm run test:browser` проверяет собранное standalone-приложение с подменённым API (категории, фильтр, история, прямые ссылки, ошибки, корзина, мобильная вёрстка и CSS-слои). Настоящую загрузку remote дополнительно проверять в Shell. Для страницы категории достаточно существующего backend и Shell с общим router; `CatalogProps` не меняется.

## Локальные компоненты shadcn/ui

На странице `/catalog` администратору доступна кнопка «Создать товар» и модальная форма: уникальный ID (строчные латинские буквы, цифры и дефисы, до 100 символов), название (до 200), описание (до 10000), цена USD с точностью до цента и существующая категория. Нулевая цена допустима. Цена передаётся как `priceMinor`, максимум 2147483647 центов; валюта USD и отсутствие рейтинга задаются сервером. Успех закрывает окно и обновляет списки; ошибки сохраняют введённые данные. На время отправки закрытие и повторная отправка блокируются.

Catalog самостоятельно проверяет роль через `GET /auth/me` в текущем QueryClient; публичные props не меняются. Это отдельный запрос от внешнего кеша сессии Shell. В standalone запрос тоже отправляет cookies, но cookie должна соответствовать адресу используемого API. При ошибке проверки сессии кнопка скрыта. `POST /products` требует действующую сессию, роль ADMIN и CSRF-заголовок; сервер проверяет права заново при каждом создании. Ответы 401/403 обновляют локальную сессию, 401 также вызывает переданный onUnauthorized. Роль при регистрации остаётся USER; назначение администратора выполняется отдельно, UI назначения ролей нет.

Для выпуска сначала обновить backend с защищённым `POST /api/products`, затем catalog. Изменения Shell, contracts и схемы БД не требуются. Браузерные проверки создания находятся в `tests/browser/create-product.spec.ts`.

Страницы списка, категории, отдельного товара и карточки товаров используют исходники shadcn/ui, адаптированные в `src/shared/ui` (Button с Radix Slot, Card, Skeleton). Они принадлежат catalog; общую UI-библиотеку для этой задачи обновлять не нужно. Варианты кнопки задаются через class-variance-authority, классы объединяются clsx и tailwind-merge с префиксом `catalog`, иконки — lucide-react. Источник компонентов: [shadcn/ui](https://ui.shadcn.com/docs/components).

Токены темы ограничены `.catalog-ui`, общего провайдера или глобального reset для новых компонентов нет. Повторяющиеся примитивы можно позднее перенести в общий UI-пакет. Страницы каталога больше не импортируют компоненты `@microfronts/ui`: пакет сохранён для standalone reset. Список содержит адаптивную сетку и боковую панель категорий, страница товара — описание, характеристики и блок покупки. Загрузка показана Skeleton, ошибки и пустые результаты — Card. Экспериментальный TestComponent не выводится в каталоге; его исходники сохранены.

Обновляйте backend, Shell и remote согласованным комплектом: новый backend требует X-Requested-With для мутаций, новые remote его отправляют. Новому Shell нужны remote с поддержкой sessionScope. Zustand пока не используется.

## Tailwind и владение CSS

Tailwind 4 и @tailwindcss/vite установлены как devDependencies: каждый репозиторий собирает свой CSS, в federation.shared они не входят. Поддерживаются Chrome 111+, Safari 16.4+ и Firefox 128+.

Файл src/app/styles/tailwind.css сканирует только собственный src и использует префикс `catalog:`: например, `catalog:flex`, `catalog:hover:bg-blue-600`. Записывайте классы целиком, не собирайте имена интерполяцией. Исходники соседей и UI-пакета не сканируются.

Exposed-компонент импортирует Tailwind и локальную тему shadcn/ui, поэтому стили доступны и внутри Shell. Страницы списка, категории и товара используют Tailwind utilities с префиксом `catalog:` без отдельных CSS-файлов страниц. Reset @microfronts/ui/reset.css импортируется только в app/entrypoint/standalone.tsx для standalone и не входит в граф exposed-модуля. Глобальные стили страницы остаются в standalone.css.

UI-пакет 0.2.0-tailwind.0 из vendor автоматически поставляет готовые стили компонентов без Preflight и глобальных правил base. Его reset.css содержит Preflight и базовые правила темы. Catalog объявляет слои `theme, base, components, utilities, catalog-utilities`; собственные utilities помещаются в `catalog-utilities`. Отдельный слой гарантирует приоритет над `base`, даже если CSS UI-пакета уже зарегистрировал `utilities` до загрузки standalone reset. Префиксы не изолируют произвольный CSS: ручные правила ограничивайте корнем remote или CSS Modules. Оставшиеся правила без слоя имеют приоритет над utilities; при миграции удаляйте заменённые декларации.

Порядок выпуска: сначала Shell с явным reset, затем remote с CSS без reset. Архивы vendor и lock-файлы обновляются вместе; зависимости на соседние checkout не добавляются.
