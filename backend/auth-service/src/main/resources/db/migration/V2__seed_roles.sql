-- Права. Состав соответствует матрице доступа из отчёта:
-- USER (базовые) < ANALYST (+ сбор и выгрузка) < ADMIN (+ справочники, учётные записи, эксплуатация)
insert into permissions (code, description) values
    ('STATS_VIEW',              'Просмотр аналитики спроса'),
    ('FILTER_SAVE',             'Сохранение собственных фильтров'),
    ('COMPANY_WATCH_VIEW',      'Просмотр списка отслеживаемых компаний'),
    ('COMPANY_WATCH_EDIT',      'Изменение списка отслеживаемых компаний'),
    ('COLLECT_RUN',             'Ручной запуск сбора вакансий'),
    ('REPORT_EXPORT',           'Выгрузка отчёта в CSV'),
    ('DICTIONARY_EDIT',         'Ведение справочника технологий'),
    ('USER_MANAGE',             'Управление учётными записями'),
    ('ROLE_MANAGE',             'Назначение ролей и прав'),
    ('PARSER_SCHEDULE_MANAGE',  'Управление расписанием парсинга'),
    ('AUDIT_VIEW',              'Просмотр журнала аудита');

insert into roles (code, name) values
    ('USER',    'Пользователь'),
    ('ANALYST', 'Аналитик'),
    ('ADMIN',   'Администратор');

-- USER
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'USER'
  and p.code in ('STATS_VIEW', 'FILTER_SAVE', 'COMPANY_WATCH_VIEW', 'COMPANY_WATCH_EDIT');

-- ANALYST = USER + сбор и выгрузка
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'ANALYST'
  and p.code in ('STATS_VIEW', 'FILTER_SAVE', 'COMPANY_WATCH_VIEW', 'COMPANY_WATCH_EDIT',
                 'COLLECT_RUN', 'REPORT_EXPORT');

-- ADMIN = ANALYST + справочники, учётные записи, эксплуатация
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'ADMIN';
