# Архитектура Catalog

## Ответственность и текущая реализация

Catalog показывает товары и позволяет добавлять их в корзину. Работает standalone и как catalog/CatalogApp внутри Shell.

- src/main.tsx — тонкая standalone-точка входа, вызывающая src/app/entrypoint/standalone.tsx.
- src/CatalogApp.tsx — публичный модуль Module Federation: QueryClientProvider и внутренние маршруты.
- src/app — standalone bootstrap, провайдер QueryClient, гостевой ключ и общие стили.
- src/pages/catalog — композиция общего списка, локальное сообщение и стили страницы.
- src/pages/category — описание категории, рекомендации, сетка товаров и состояния загрузки/ошибок.
- src/pages/product — полное описание товара, рейтинг, добавление в корзину и возврат к фильтру.
- src/entities/category — получение категорий и локальные описания по slug с общим текстом для новых категорий.
- src/features/add-to-cart — запрос POST /cart/items, мутация, инвалидация корзины и кнопка.
- src/entities/product — тип Product, GET /products, параметры useQuery и карточка товара. Карточка принимает URL и action-слот; feature корзины передаётся страницей без зависимости entity от features.
- src/shared/ui — локальные примитивы shadcn/ui (Button, Card, Skeleton) и тема, ограниченная `.catalog-ui`.
- src/shared/api — HTTP-клиент без бизнес-запросов; src/shared/lib — форматирование денег.

В host используется переданный QueryClient. Базовый ключ списка и ключ корзины поставляются contracts; фильтр расширяет ключ списка объектом `{ category }`, товар использует отдельный ключ `["product", apiBaseUrl, id]`, категории — `["categories", apiBaseUrl]`. После добавления инвалидируется корзина текущего контекста. Поддерживается callback onCartChanged. Переходы внутри каталога используют общий React Router, переход в корзину — callback onNavigate.

`app/routes/catalog-routes.tsx` содержит index со списком, `category/:slug` с описанием категории и `products/:productId` с описанием товара; неизвестный подпуть показывает локальную страницу 404. Старый query-параметр `category` сохраняет фильтр списка. Страница категории получает метаданные из существующего `GET /categories`, а товары — из `GET /products?category=<slug>`; отдельного endpoint категории не требуется. Ссылка на товар передаёт `?category=<slug>&from=category` для возврата на страницу категории после перезагрузки. Хлебные крошки товара ведут к его категории. Неизвестный slug отличается от существующей категории без товаров; ошибки категорий и товаров можно повторить независимо.

В host Shell владеет BrowserRouter и маршрутом `/catalog/*`; обе сборки разделяют singleton `react-router` 7.18.4. Standalone создаёт BrowserRouter и монтирует то же дерево по `/catalog/*`, `/` перенаправляет в каталог. Прямые ссылки обслуживаются SPA fallback для `/catalog` и `/catalog/*`.
Standalone работает без Shell; без sessionScope HTTP helper не отправляет cookies. Ошибки 401/410 передаются через onUnauthorized, когда callback задан. createRoot вызывается только standalone-точкой входа.

## FSD

Обязательный стандарт развития — [Feature-Sliced Design](https://fsd.how/docs/get-started/overview/).
Код каталога распределён по слоям FSD. В корне src остаются только технические точки входа для Vite и Module Federation.

Порядок слоёв: app → pages → widgets (при обоснованной необходимости) → features → entities → shared.
Использовать только нужные слои; устаревший processes не создавать. По текущим рекомендациям FSD widgets обычно не нужен: композицию размещать в странице или layout приложения.

- app: запуск, провайдеры, глобальные стили, маршрутизация и интеграционные адаптеры.
- pages: страницы и их локальная логика.
- features: переиспользуемые пользовательские действия.
- entities: модели, API и представления бизнес-сущностей.
- shared: инфраструктура и общие утилиты без бизнес-логики.

В pages/features/entities (и widgets, если он необходим) сначала выделять предметный слайс, затем сегменты ui/model/api/lib/config по необходимости. app и shared делить непосредственно на сегменты.

Импорты между слоями направлены строго вниз; слайсы одного слоя изолированы. Внешние потребители слайса обращаются к его публичному API (например, index.ts), без глубоких импортов. Внутренние импорты самого слайса допустимы. Контролируемые связи entities через @x допустимы только с явным обоснованием здесь. Межрепозиторные зависимости поставляются опубликованными пакетами/архивами или контрактом Module Federation, а не импортом соседних исходников.

При добавлении кода сначала определять владельца по предметной ответственности, затем сегмент. Публичный API каждого слайса — index.ts; соседние слайсы и верхние слои не импортируют внутренние файлы. Exposed module и standalone-запуск сохраняются.

| Ответственность | Текущее размещение |
| --- | --- |
| Standalone bootstrap, providers и адаптер exposed module | app |
| Экран каталога, его композиция и локальное состояние | pages/catalog |
| Экран категории, композиция описания и товаров | pages/category |
| Переиспользуемое добавление товара в корзину | features/add-to-cart |
| Product, получение товаров и Query-хук | entities/product |
| Карточка товара с action-слотом | entities/product/ui |
| Категории, Query-хук и локальные описания | entities/category |
| Примитивы shadcn/ui, тема и объединение классов | shared/ui, shared/lib |
| Низкоуровневый HTTP и форматирование денег | shared/api, shared/lib |

Бизнес-запросы и работа с корзиной не попадают в shared вместе с HTTP helper.

### Где размещать новый код

- Новый запрос данных товара: HTTP-функция и queryOptions в entities/product/api, React-хук в entities/product/model. Ключ productsKey берётся из @microfronts/contracts.
- Действие добавления: POST в features/add-to-cart/api, useMutation и инвалидация cartKey в features/add-to-cart/model, кнопка в ui. Ключ корзины учитывает apiBaseUrl и sessionScope либо гостевой cartKey.
- Состояние ответа сервера, загрузка и ошибка принадлежат TanStack Query. Локальное сообщение об успешном добавлении живёт на странице. Не копировать список товаров в отдельный useState или глобальный store.
- Низкоуровневые заголовки, credentials, отмена и обработка HTTP-ошибок принадлежат shared/api. Компоненты страниц не вызывают fetch напрямую.
- Если UI-блок нужен только этому экрану, держать его в pages/catalog/ui. Новый widgets-слой создавать лишь для самостоятельного крупного блока.

Host может передать общий QueryClient; standalone создаёт свой. После успешного POST feature инвалидирует ключ корзины и вызывает совместимый onCartChanged. Публичный контракт props и URL запросов не изменились.

## Общие зависимости и интеграция

React 19, TypeScript, Vite и Module Federation. Серверное состояние управляется TanStack Query.
UI и типы интеграции поставляются архивами @microfronts/ui и @microfronts/contracts в vendor; архивы и package-lock.json хранятся в Git. Типы CatalogProps используются напрямую из contracts. Изменения контракта требуют согласованного обновления потребителей.

Страница категории, карточки товаров и кнопка корзины используют локальные компоненты shadcn/ui из shared/ui. Button использует Radix Slot и class-variance-authority; cn объединяет clsx и tailwind-merge с префиксом catalog; иконки поставляет lucide-react. Компоненты адаптированы из [shadcn/ui](https://ui.shadcn.com/docs/components) под FSD и изоляцию remote. Они пока не публикуются через общий UI-пакет. Описания категорий хранятся в entities/category/model/category-content.ts, пока API предоставляет только id/name/slug. Для нового slug, существующего в API, предусмотрен общий текст; локальный текст сам по себе не создаёт категорию. Контракты backend и CatalogProps не менялись.

Связь host и remote: прежние props apiBaseUrl, cartKey, queryClient, sessionScope и callbacks onUnauthorized/onNavigate, а также общий контекст singleton React Router. Shell владеет верхними маршрутами и общим QueryClient, catalog — внутренними маршрутами и запросами. Исходники соседних приложений не импортируются. Backend сначала выпускается с API категорий и товара по ID, затем Shell и catalog обновляются согласованно. Общий event bus и пакет platform не используются.

## Конфигурация и проверки

Настройки окружения перечислены в [.env.example](../.env.example), команды запуска — в [README](../README.md).
runtime-config.json формируется инфраструктурой сборки/запуска; секреты в браузерную конфигурацию не помещаются.
`app/config/build-environment.ts` разрешает origin, base и API для vite.config.ts. При production-сборке приоритет имеет `VITE_PUBLIC_BASE`; на Vercel (`VERCEL=1`) при его отсутствии используется HTTPS-origin текущего `VERCEL_URL`. Для других платформ явный HTTPS-base обязателен. Некорректные/HTTP URL отклоняются; API допускает `/api` или полноценный HTTPS URL. Dev и integration сохраняют локальные defaults и не используют Vercel fallback. `/api` в standalone требует маршрутизации к backend на хостинге; dev proxy не попадает в сборку. Встраиваемый remote получает API от Shell через CatalogProps, независимо от standalone runtime-config.json.
`vercel.json` задаёт SPA fallback только для `/catalog` и `/catalog/*`. Пути API и статические ресурсы обслуживаются отдельно; ошибка API не подменяется HTML страницы.
Для локальной проверки кода: npm run typecheck и npm run build:local. npm run build предназначен для production с HTTPS-настройками. CI выполняет установку, проверку типов, HTTP-тесты и production-сборку.
Интеграционный стенд и E2E находятся в отдельном репозитории integration общего workspace; standalone checkout не должен требовать соседних исходников для установки.

## Актуализация

После каждой задачи сверять этот документ с кодом и обновлять затронутые разделы в том же PR.
Фактическую реализацию и план миграции различать явно. Описание задачи, результаты проверок и история изменений находятся в PR/Git; папка docs/tasks не используется.

## Tailwind и владение CSS

Tailwind 4 и @tailwindcss/vite установлены как devDependencies: каждый репозиторий собирает свой CSS, в federation.shared они не входят. Поддерживаются Chrome 111+, Safari 16.4+ и Firefox 128+.

Файл src/app/styles/page-reset.css подключает reset UI-пакета и импортируется только из app/entrypoint/standalone.tsx. Файл src/app/styles/tailwind.css сканирует только собственный src и использует префикс `catalog:`: например, `catalog:flex`, `catalog:hover:bg-blue-600`. Записывайте классы целиком, не собирайте имена интерполяцией. Исходники соседей и UI-пакета не сканируются.

Exposed-компонент импортирует Tailwind, а страница — свой catalog.css, поэтому стили доступны и внутри Shell. Reset @microfronts/ui/reset.css импортируется только в app/entrypoint/standalone.tsx для standalone и не входит в граф exposed-модуля. Глобальные стили страницы остаются в standalone.css.

UI-пакет 0.2.0-tailwind.0 из vendor автоматически поставляет готовые стили компонентов без Preflight и глобальных правил base. Его reset.css содержит Preflight и базовые правила темы. Catalog объявляет слои `theme, base, components, utilities, catalog-utilities`, собственные utilities находятся в `catalog-utilities`. Это сохраняет их приоритет над base при любом порядке загрузки remote и standalone reset: старый UI CSS может зарегистрировать utilities раньше base. Токены shadcn/ui ограничены `.catalog-ui`; новый reset не добавляется. Префиксы не изолируют произвольный CSS: ручные правила ограничивайте корнем remote или CSS Modules. Оставшиеся правила без слоя имеют приоритет над utilities; при миграции удаляйте заменённые декларации.

Порядок выпуска: сначала Shell с явным reset, затем remote с CSS без reset. Архивы vendor и lock-файлы обновляются вместе; зависимости на соседние checkout не добавляются.
