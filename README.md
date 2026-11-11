# SPO — востребованность IT-вакансий

```
api/openapi.yaml          контракт фронт ↔ бэкенд, источник типов
backend/auth-service/     авторизация и RBAC (Java 21, Spring Boot 3.4)
frontend/                 Next.js 16
docker-compose.yml        PostgreSQL 16
```

## Что нужно установить

- Docker (для PostgreSQL)
- JDK 21 и Maven 3.9+ (или открыть `backend/auth-service` в IntelliJ IDEA как Maven-проект)
- bun

## Запуск (три терминала)

**1. База**

```bash
docker compose up -d postgres
```

PostgreSQL из Docker публикуется на `localhost:5434`, чтобы не конфликтовать с локально
установленным Postgres на стандартном 5432. Другой адрес базы задаётся переменной `DB_URL`.

**2. Бэкенд** — http://localhost:8080

```bash
cd backend/auth-service
mvn spring-boot:run
```

На первом старте Flyway создаёт схему `auth`, роли и права,
и поднимает администратора `admin@spo.dev` / `admin1234`.

**3. Фронт** — http://localhost:3000

```bash
cd frontend
bun install
bun dev
```

Браузер ходит только на `localhost:3000/api/*`, Next проксирует запросы на `localhost:8080`
(`rewrites` в `next.config.ts`). Адрес бэкенда меняется переменной `API_ORIGIN`.

## Режим без бэкенда

Создать `frontend/.env.local` со строкой `USE_MOCKS=true` и запустить `bun dev`.
Вход на моках: `demo@spo.dev` / `demo1234`.

Обрати внимание: настоящих данных о вакансиях пока нет (это будущие parser-service и
search-service). Чтобы дашборд работал с реальным бэкендом, `/api/vacancies` и
`/api/vacancies/demand` временно отдаёт заглушка в auth-service
(`backend/auth-service/src/main/java/ru/spo/auth/mock`) — данные сгенерированные.
Когда появится search-service, пакет `mock` удаляется целиком.

## Проверка бэкенда без фронта

```bash
curl -i -X POST localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@spo.dev","password":"admin1234"}'
```

В ответе — `accessToken` в теле и `Set-Cookie: spo_refresh=...; HttpOnly`.

## Типы из контракта

```bash
cd frontend
bun add -d openapi-typescript
bun run api:types        # ../api/openapi.yaml → src/shared/api/schema.d.ts
```

## Радар навыков

В разделе **Радар навыков** (`/dashboard/skills`) можно выбрать React или Java,
грейд (Junior / Middle / Senior / Lead / все), период и до шести навыков для графиков.
Линейный график показывает долю вакансий с навыком во времени; радар и таблица сравнивают
два завершённых периода. В таблице — весь стек, число вакансий, доля и изменение в п.п.
Последние вакансии используют те же фильтры и показывают грейд и требуемый стек.

Моки содержат историю за три года с разными вероятностями требований на разных датах:
TypeScript, Next.js, Kafka, Docker и CI/CD растут, Redux встречается реже.
В демонстрационном сценарии Kubernetes и проектирование систем встречаются только
у Senior / Lead. Это условные данные, а не статистика реального рынка.
История отражает требования на дату публикации новых вакансий; редактирование уже
опубликованной вакансии и её версий пока не моделируется.

`GET /api/vacancies/skills?directions=java&grades=senior&period=month` возвращает
каталог навыков, временные корзины с общей выборкой и числом упоминаний, а также сводку.
`GET /api/vacancies?directions=java&grades=senior` возвращает вакансии с полями
`grade` и `skills` (идентификаторы из каталога). Без фильтров используются все направления
и грейды; неизвестные или пустые значения дают 400. Требуется `STATS_VIEW`.

Доля считается внутри выбранных направлений и грейдов. Каждая вакансия учитывается
один раз на навык; сумма долей может превышать 100%. При нулевой выборке доля и её
изменение — `null`, при отсутствии навыка в непустой выборке — 0%.
Периоды считаются в UTC, недели начинаются в понедельник. Окна (включая текущий):
30 дней / 12 недель / 12 месяцев / 3 года. Незавершённая корзина не участвует в сравнении.

Одинаковый контракт работает в Next.js (`USE_MOCKS=true`) и в Java-заглушке
`ru.spo.auth.mock` (включая отдельный проект `spo-auth`). Авторизация и RBAC остаются
в auth-service; при появлении search-service туда переносится API аналитики.

Проверки: `cd frontend && bun test`, `bun run typecheck`, `bun run lint`;
для Java: `cd backend/auth-service && mvn -Dtest=MockSkillDataTest,MockVacancyControllerTest test`.
