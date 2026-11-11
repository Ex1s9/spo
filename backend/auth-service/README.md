# auth-service + выравнивание контракта

Содержимое:

```
api/openapi.yaml            единый контракт (auth + stats), источник типов для фронта
backend/auth-service/       Spring Boot 3.4, Java 21, PostgreSQL, Flyway
frontend-patch/             файлы, которые заменяют текущие во фронте
docker-compose.yml          PostgreSQL для локального стенда
```

## Запуск

```bash
docker compose up -d postgres
cd backend/auth-service && mvn spring-boot:run        # http://localhost:8080
```

На старте Flyway создаёт схему `auth`, заливает права и роли и поднимает
администратора `admin@spo.dev` (пароль из `BOOTSTRAP_ADMIN_PASSWORD`, по умолчанию `admin1234`).

Фронт:

```bash
cd frontend
bun run api:types     # генерация src/shared/api/schema.d.ts из ../api/openapi.yaml
API_ORIGIN=http://localhost:8080 bun dev
bun run dev:mocks     # старый режим на моках, без бэкенда
```

## Ключи подписи

Без переменных окружения сервис генерирует временную пару RSA и пишет предупреждение:
после рестарта все выданные токены становятся невалидными. Для стенда:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl rsa -pubout -in private.pem -out public.pem
export JWT_PRIVATE_KEY="$(cat private.pem)"
export JWT_PUBLIC_KEY="$(cat public.pem)"
```

Публичный ключ отдаётся по `GET /.well-known/jwks.json` — search-service и parser-service
проверяют подпись сами, не обращаясь к auth-service на каждый запрос.

## Модель доступа

| Роль | Права |
| --- | --- |
| USER | STATS_VIEW, FILTER_SAVE, COMPANY_WATCH_VIEW, COMPANY_WATCH_EDIT |
| ANALYST | права USER + COLLECT_RUN, REPORT_EXPORT |
| ADMIN | права ANALYST + DICTIONARY_EDIT, USER_MANAGE, ROLE_MANAGE, PARSER_SCHEDULE_MANAGE, AUDIT_VIEW |

Иерархия развёрнута в таблицу `role_permissions`: роль несёт полный набор прав,
проверки в коде идут по праву (`hasAuthority('USER_MANAGE')`), а не по названию роли.

## Схема сессии

1. `POST /api/auth/login` → access-токен в теле (TTL 15 минут) + `spo_refresh` в httpOnly cookie (30 дней, path `/`).
2. Фронт держит access в памяти вкладки и шлёт в заголовке `Authorization`.
3. На 401 клиент один раз дёргает `POST /api/auth/refresh` и повторяет запрос.
4. Refresh ротируется. Повторное использование погашенного токена гасит все сессии пользователя — так обнаруживается кража cookie.
5. Смена ролей или отключение учётной записи гасит сессии: иначе новые права применились бы только после истечения access-токена.

Cookie остаётся first-party, потому что фронт ходит на свой же origin, а Next проксирует
`/api/*` на бэкенд (`rewrites`, `beforeFiles`). CORS и `SameSite=None` не нужны.

## Что осталось по авторизации на фронте

- заменить файлы из `frontend-patch/` и удалить `src/mocks/auth.ts` вместе с `src/app/api/auth/**`;
- `proxy.ts`: сейчас пускает по наличию cookie. Оставить как есть (дешёвая отсечка), но защиту считать серверной — решает бэкенд;
- форма регистрации (`/register`) — эндпоинт готов;
- экран 403 и скрытие пунктов меню через `useHasPermission`;
- интеграционные тесты на Testcontainers: вход, обновление, ротация, повторное использование погашенного токена, 403 на чужом праве.
