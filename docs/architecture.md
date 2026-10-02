# Архитектура Catalog

## Ответственность и текущая реализация

Catalog показывает товары и позволяет добавлять их в корзину. Работает standalone и как catalog/CatalogApp внутри Shell.

- src/main.tsx — standalone bootstrap: React root, собственный QueryClient, runtime config и гостевой ключ.
- src/CatalogApp.tsx — exposed component и текущая композиция каталога, загрузки товаров и добавления в корзину.
- src/models.ts — модель Product.
- src/api.ts — HTTP helper и форматирование денежных сумм.
- src/cart-key.ts — гостевой ключ для standalone.
- src/app/styles/tailwind.css — собственные Tailwind utilities и тема без reset.
- src/app/styles/remote.css — оставшиеся стили remote; src/app/styles/standalone.css — обрамление standalone.

В host используется переданный QueryClient. Ключи запросов поставляются contracts; после добавления товара инвалидируется ключ корзины текущего контекста. Поддерживается callback onCartChanged для совместимости. Remote не управляет router Shell: навигация запрашивается callback.
Standalone работает без Shell; без sessionScope HTTP helper не отправляет cookies. Ошибки 401/410 передаются через onUnauthorized, когда callback задан. createRoot вызывается только standalone-точкой входа.

## FSD

Обязательный стандарт развития — [Feature-Sliced Design](https://fsd.how/docs/get-started/overview/).
Исходники пока расположены преимущественно прямо в src; это текущее отклонение от стандарта, а не завершённая FSD-структура.

Порядок слоёв: app → pages → widgets (при обоснованной необходимости) → features → entities → shared.
Использовать только нужные слои; устаревший processes не создавать. По текущим рекомендациям FSD widgets обычно не нужен: композицию размещать в странице или layout приложения.

- app: запуск, провайдеры, глобальные стили, маршрутизация и интеграционные адаптеры.
- pages: страницы и их локальная логика.
- features: переиспользуемые пользовательские действия.
- entities: модели, API и представления бизнес-сущностей.
- shared: инфраструктура и общие утилиты без бизнес-логики.

В pages/features/entities (и widgets, если он необходим) сначала выделять предметный слайс, затем сегменты ui/model/api/lib/config по необходимости. app и shared делить непосредственно на сегменты.

Импорты между слоями направлены строго вниз; слайсы одного слоя изолированы. Внешние потребители слайса обращаются к его публичному API (например, index.ts), без глубоких импортов. Внутренние импорты самого слайса допустимы. Контролируемые связи entities через @x допустимы только с явным обоснованием здесь. Межрепозиторные зависимости поставляются опубликованными пакетами/архивами или контрактом Module Federation, а не импортом соседних исходников.

Новый код следует этим правилам. Legacy-код переносится в пределах затронутой ответственности, сохраняя публичные exposed modules, standalone-запуск и поведение. Массовая миграция выполняется отдельной задачей; таблица ниже — направление миграции, а не перечень уже созданных каталогов.

| Ответственность | Размещение при миграции |
| --- | --- |
| Standalone bootstrap, providers и адаптер exposed module | app |
| Экран каталога, его композиция и локальное состояние | pages/catalog |
| Переиспользуемое добавление товара в корзину | features/add-to-cart |
| Product, получение и представление товара | entities/product |
| Низкоуровневый HTTP и форматирование денег | shared/api, shared/lib |

Бизнес-запросы и работа с корзиной не должны целиком попадать в shared вместе с HTTP helper.

## Общие зависимости и интеграция

React 19, TypeScript, Vite и Module Federation. Серверное состояние управляется TanStack Query.
UI и типы интеграции поставляются архивами @microfronts/ui и @microfronts/contracts в vendor; архивы и package-lock.json хранятся в Git. src/remote-props.ts реэкспортирует типы contracts. Изменения контракта требуют согласованного обновления потребителей.

Связь host и remote: props apiBaseUrl, cartKey, queryClient, sessionScope и callbacks onUnauthorized/onNavigate. Shell владеет маршрутизацией и общим QueryClient, remote владеют своей бизнес-логикой и запросами. Исходники соседних приложений не импортируются. Общий event bus и пакет platform приложениями не используются.

## Конфигурация и проверки

Настройки окружения перечислены в [.env.example](../.env.example), команды запуска — в [README](../README.md).
runtime-config.json формируется инфраструктурой сборки/запуска; секреты в браузерную конфигурацию не помещаются.
Для локальной проверки кода: npm run typecheck и npm run build:local. npm run build предназначен для production с HTTPS-настройками. Существующий CI выполняет установку, проверку типов и production-сборку.
Интеграционный стенд и E2E находятся в отдельном репозитории integration общего workspace; standalone checkout не должен требовать соседних исходников для установки.

## Актуализация

После каждой задачи сверять этот документ с кодом и обновлять затронутые разделы в том же PR.
Фактическую реализацию и план миграции различать явно. Описание задачи, результаты проверок и история изменений находятся в PR/Git; папка docs/tasks не используется.

## Tailwind и владение CSS

Tailwind 4 и @tailwindcss/vite установлены как devDependencies: каждый репозиторий собирает свой CSS, в federation.shared они не входят. Поддерживаются Chrome 111+, Safari 16.4+ и Firefox 128+.

Файл src/app/styles/page-reset.css подключает reset UI-пакета и импортируется только из main.tsx. Файл src/app/styles/tailwind.css сканирует только собственный src и использует префикс `catalog:`: например, `catalog:flex`, `catalog:hover:bg-blue-600`. Записывайте классы целиком, не собирайте имена интерполяцией. Исходники соседей и UI-пакета не сканируются.

Exposed-компонент импортирует Tailwind и remote.css, поэтому стили доступны и внутри Shell. Reset @microfronts/ui/reset.css импортируется только в src/main.tsx для standalone и не входит в граф exposed-модуля. Глобальные стили страницы остаются в standalone.css.

UI-пакет 0.2.0-tailwind.0 из vendor автоматически поставляет готовые стили компонентов без Preflight и глобальных правил base. Его reset.css содержит Preflight и базовые правила темы. Во всех сборках порядок слоёв: theme, base, components, utilities. Префиксы не изолируют произвольный CSS: ручные правила ограничивайте корнем remote или CSS Modules. Оставшиеся правила без слоя имеют приоритет над utilities; при миграции удаляйте заменённые декларации.

Порядок выпуска: сначала Shell с явным reset, затем remote с CSS без reset. Архивы vendor и lock-файлы обновляются вместе; зависимости на соседние checkout не добавляются.
