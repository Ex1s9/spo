package ru.spo.auth.mock;

import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * ВРЕМЕННАЯ ЗАГЛУШКА, пока нет parser-service и search-service.
 * Генерирует правдоподобные вакансии за три года — перенос frontend/src/mocks/vacancies.ts.
 * Когда появятся настоящие данные, пакет ru.spo.auth.mock удаляется целиком.
 */
@Component
public class MockVacancyData {

    public static final List<String> DIRECTIONS = List.of("react", "java");

    private static final int HISTORY_DAYS = 365 * 3;
    private static final long DAY_MS = 24L * 60 * 60 * 1000;

    public record Vacancy(String id, String title, String company, String direction, String grade, List<String> skills, String city,
                          Integer salaryFrom, Integer salaryTo, String source, String url,
                          Instant publishedAt) {
    }

    public record VacanciesResponse(List<Vacancy> items, int total) {
    }

    public record DemandBucket(Instant start, Map<String, Integer> counts) {
    }

    public record DirectionSummary(String direction, int total, int lastComplete, int previous, Double changePct) {
    }

    public record DemandResponse(String period, List<String> directions, List<DemandBucket> buckets,
                                 List<DirectionSummary> summary, Instant generatedAt) {
    }

    public enum Period {
        DAY(30), WEEK(12), MONTH(12), YEAR(3);

        final int bucketCount;

        Period(int bucketCount) {
            this.bucketCount = bucketCount;
        }

        public static Period parse(String value) {
            return Arrays.stream(values())
                    .filter(p -> p.name().equalsIgnoreCase(value))
                    .findFirst()
                    .orElse(null);
        }

        LocalDate startOf(LocalDate date) {
            return switch (this) {
                case DAY -> date;
                case WEEK -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                case MONTH -> date.withDayOfMonth(1);
                case YEAR -> date.withDayOfYear(1);
            };
        }

        LocalDate shift(LocalDate date, int amount) {
            return switch (this) {
                case DAY -> date.plusDays(amount);
                case WEEK -> date.plusWeeks(amount);
                case MONTH -> date.plusMonths(amount);
                case YEAR -> date.plusYears(amount);
            };
        }
    }

    private enum Grade {
        JUNIOR(60, 130), MIDDLE(150, 280), SENIOR(280, 450), LEAD(400, 600);

        final int minK;
        final int maxK;

        Grade(int minK, int maxK) {
            this.minK = minK;
            this.maxK = maxK;
        }
    }

    private record Title(String title, Grade grade) {
    }

    private record Profile(int baseDaily, double yearlyGrowth, List<Title> titles) {
    }

    private static final Map<String, Profile> PROFILES = Map.of(
            "react", new Profile(14, 0.18, List.of(
                    new Title("Frontend-разработчик (React)", Grade.MIDDLE),
                    new Title("Senior React Developer", Grade.SENIOR),
                    new Title("Middle Frontend Developer React/TypeScript", Grade.MIDDLE),
                    new Title("React Native / React разработчик", Grade.MIDDLE),
                    new Title("Lead Frontend Engineer (React)", Grade.LEAD),
                    new Title("Junior React-разработчик", Grade.JUNIOR))),
            "java", new Profile(19, 0.07, List.of(
                    new Title("Java-разработчик", Grade.MIDDLE),
                    new Title("Senior Java Developer (Spring)", Grade.SENIOR),
                    new Title("Middle Java Backend Engineer", Grade.MIDDLE),
                    new Title("Java/Kotlin разработчик", Grade.MIDDLE),
                    new Title("Team Lead Java", Grade.LEAD),
                    new Title("Junior Java-разработчик", Grade.JUNIOR))));

    private static final List<String> COMPANIES = List.of(
            "Сбер", "Яндекс", "Т-Банк", "VK", "Ozon", "Авито",
            "Wildberries", "МТС", "Альфа-Банк", "Kaspersky", "2ГИС", "Lamoda");

    private static final List<String> CITIES = List.of("Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Удалённо");
    private static final List<String> SOURCES = List.of("hh.ru", "habr career", "superjob");

    private LocalDate cachedDay;
    private List<Vacancy> cached;

    /** Все вакансии, от новых к старым. Пересчитываются раз в сутки (UTC). */
    public synchronized List<Vacancy> vacancies() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!today.equals(cachedDay)) {
            cached = generate(today);
            cachedDay = today;
        }
        return cached;
    }

    public VacanciesResponse latest(List<String> directions, int limit) {
        return latest(directions, MockSkillData.GRADES, limit);
    }

    public VacanciesResponse latest(List<String> directions, List<String> grades, int limit) {
        List<Vacancy> filtered = vacancies().stream()
                .filter(v -> directions.contains(v.direction()) && grades.contains(v.grade()))
                .toList();
        return new VacanciesResponse(filtered.subList(0, Math.min(limit, filtered.size())), filtered.size());
    }

    public DemandResponse demand(Period period, List<String> directions) {
        LocalDate currentStart = period.startOf(LocalDate.now(ZoneOffset.UTC));
        LocalDate firstStart = period.shift(currentStart, -(period.bucketCount - 1));
        Instant firstInstant = toInstant(firstStart);

        List<LocalDate> starts = new ArrayList<>();
        List<Map<String, Integer>> counts = new ArrayList<>();
        Map<LocalDate, Integer> indexByStart = new HashMap<>();
        for (int i = 0; i < period.bucketCount; i++) {
            LocalDate start = period.shift(firstStart, i);
            Map<String, Integer> bucketCounts = new LinkedHashMap<>();
            directions.forEach(d -> bucketCounts.put(d, 0));
            starts.add(start);
            counts.add(bucketCounts);
            indexByStart.put(start, i);
        }

        for (Vacancy vacancy : vacancies()) {
            if (vacancy.publishedAt().isBefore(firstInstant)) break;
            if (!directions.contains(vacancy.direction())) continue;
            LocalDate published = LocalDate.ofInstant(vacancy.publishedAt(), ZoneOffset.UTC);
            Integer index = indexByStart.get(period.startOf(published));
            if (index != null) counts.get(index).merge(vacancy.direction(), 1, Integer::sum);
        }

        List<DemandBucket> buckets = new ArrayList<>();
        for (int i = 0; i < starts.size(); i++) {
            buckets.add(new DemandBucket(toInstant(starts.get(i)), counts.get(i)));
        }

        List<DirectionSummary> summary = directions.stream().map(direction -> {
            int total = counts.stream().mapToInt(c -> c.get(direction)).sum();
            int lastComplete = counts.size() >= 2 ? counts.get(counts.size() - 2).get(direction) : 0;
            int previous = counts.size() >= 3 ? counts.get(counts.size() - 3).get(direction) : 0;
            Double changePct = previous > 0 ? (lastComplete - previous) * 100.0 / previous : null;
            return new DirectionSummary(direction, total, lastComplete, previous, changePct);
        }).toList();

        return new DemandResponse(period.name().toLowerCase(Locale.ROOT), directions, buckets, summary, Instant.now());
    }

    private static List<Vacancy> generate(LocalDate today) {
        Random rand = new Random(42);
        long now = System.currentTimeMillis();
        List<Vacancy> result = new ArrayList<>();
        int seq = 0;

        for (int daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo--) {
            LocalDate date = today.minusDays(daysAgo);
            long dayStart = toInstant(date).toEpochMilli();

            for (String direction : DIRECTIONS) {
                Profile profile = PROFILES.get(direction);
                int count = dailyCount(rand, profile, date, daysAgo);

                for (int i = 0; i < count; i++) {
                    long publishedAt = dayStart + (long) (rand.nextDouble() * DAY_MS);
                    if (publishedAt > now) continue;

                    Title title = pick(rand, profile.titles());
                    Grade grade = title.grade();
                    double fromK = grade.minK + rand.nextDouble() * (grade.maxK - grade.minK) * 0.6;
                    Integer salaryFrom = rand.nextDouble() < 0.35 ? null : (int) Math.round(fromK / 10) * 10_000;
                    Integer salaryTo = salaryFrom == null || rand.nextDouble() < 0.3
                            ? null
                            : (int) Math.round((fromK + rand.nextDouble() * (grade.maxK - fromK)) / 10) * 10_000 + 10_000;

                    seq++;
                    result.add(new Vacancy(
                            "v" + seq,
                            title.title(),
                            pick(rand, COMPANIES),
                            direction,
                            grade.name().toLowerCase(Locale.ROOT),
                            MockSkillData.generateSkills(direction, grade.name().toLowerCase(Locale.ROOT), daysAgo, seq),
                            pick(rand, CITIES),
                            salaryFrom,
                            salaryTo,
                            pick(rand, SOURCES),
                            "https://hh.ru/vacancy/" + (100_000_000 + seq),
                            Instant.ofEpochMilli(publishedAt)));
                }
            }
        }

        result.sort(Comparator.comparing(Vacancy::publishedAt).reversed());
        return List.copyOf(result);
    }

    private static int dailyCount(Random rand, Profile profile, LocalDate date, int daysAgo) {
        double trend = 1 + profile.yearlyGrowth() * ((HISTORY_DAYS - daysAgo) / 365.0);
        DayOfWeek weekday = date.getDayOfWeek();
        double weekdayFactor = weekday == DayOfWeek.SATURDAY || weekday == DayOfWeek.SUNDAY ? 0.35 : 1;
        Month month = date.getMonth();
        double seasonFactor = month == Month.DECEMBER || month == Month.JANUARY ? 0.8
                : month.getValue() >= 9 && month.getValue() <= 11 ? 1.15 : 1;
        double noise = 0.75 + rand.nextDouble() * 0.5;
        return (int) Math.round(profile.baseDaily() * trend * weekdayFactor * seasonFactor * noise);
    }

    private static <T> T pick(Random rand, List<T> list) {
        return list.get(rand.nextInt(list.size()));
    }

    private static Instant toInstant(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}
