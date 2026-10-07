# SPO — востребованность IT-вакансий

MVP фронтенда: вход и дашборд с динамикой новых вакансий React/Java по дням, неделям, месяцам и годам. Пока работает на моках, бэкенд не нужен.

Стек: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · TanStack Query · Recharts. Пакетный менеджер и раннер — **bun**.

## Запуск

```bash
bun install
bun dev          # http://localhost:3000
```

Демо-доступ: `demo@spo.dev` / `demo1234`.

Другие команды: `bun run build`, `bun run lint`, `bun run typecheck`.

## Структура

```
src/
  app/
    api/            mock-бэкенд (Route Handlers): auth, vacancies
    login/          страница входа
    dashboard/      защищённый раздел
    providers.tsx   React Query, тема, тосты, редирект на 401
  features/
    auth/           API-хуки, форма входа, меню пользователя
    demand/         фильтры, KPI, график, таблица последних вакансий
  mocks/            генератор «распарсенных» вакансий и агрегация
  shared/           типы, конфиг (направления, периоды), http-клиент, даты
  components/ui/    компоненты shadcn
  proxy.ts          редирект неавторизованных с /dashboard на /login
```

## Mock API

| Метод | Путь | Описание |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password }` → пользователь + httpOnly cookie `spo_session` |
| POST | `/api/auth/logout` | удаляет cookie |
| GET | `/api/auth/me` | текущий пользователь или 401 |
| GET | `/api/vacancies/demand?period=day\|week\|month\|year&directions=react,java` | временной ряд + сводка |
| GET | `/api/vacancies?directions=react,java&limit=20` | последние вакансии |

Данные генерируются детерминированно (seed) на 3 года назад от текущей даты.

## Переход на настоящий бэкенд

1. Реализовать те же контракты (типы в `src/shared/types.ts`).
2. Указать `NEXT_PUBLIC_API_URL` (см. `.env.example`). Запросы идут с `credentials: "include"`.
3. Если бэкенд ставит cookie с другим именем — поменять `SESSION_COOKIE` в `src/shared/config.ts` (его проверяет `proxy.ts`).
4. Удалить `src/app/api` и `src/mocks`.

Новые направления добавляются в `DIRECTIONS` в `src/shared/config.ts` (и в `DirectionId`).
