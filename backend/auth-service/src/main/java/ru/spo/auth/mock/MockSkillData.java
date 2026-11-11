package ru.spo.auth.mock;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

/** Временный радар по требованиям на дату публикации, до появления search-service. */
public final class MockSkillData {
    private MockSkillData() {}

    public static final List<String> GRADES = List.of("junior", "middle", "senior", "lead");

    public record Skill(String id, String label) {}
    private record Definition(String id, String label, List<String> directions, double before, double after) {}
    public record SkillBucket(Instant start, int total, Map<String, Integer> counts) {}
    public record SkillSummary(String skill, int total, int lastComplete, int previous,
                               Double lastCompleteShare, Double previousShare, Double changePp) {}
    public record SkillsResponse(String period, List<String> directions, List<String> grades,
                                  List<Skill> skills, List<SkillBucket> buckets,
                                  List<SkillSummary> summary, Instant generatedAt) {}

    private static final List<String> BOTH = List.of("react", "java");
    private static final List<String> REACT = List.of("react");
    private static final List<String> JAVA = List.of("java");
    private static final List<Definition> DEFINITIONS = List.of(
            new Definition("javascript", "JavaScript", REACT, .95, .9),
            new Definition("typescript", "TypeScript", REACT, .4, .95),
            new Definition("react", "React", REACT, 1, 1),
            new Definition("css", "HTML / CSS", REACT, .9, .85),
            new Definition("nextjs", "Next.js", REACT, .1, .65),
            new Definition("redux", "Redux", REACT, .8, .35),
            new Definition("testing", "Тестирование", BOTH, .35, .75),
            new Definition("git", "Git", BOTH, .9, .95),
            new Definition("java", "Java", JAVA, 1, 1),
            new Definition("spring", "Spring Boot", JAVA, .65, .9),
            new Definition("sql", "SQL", JAVA, .8, .85),
            new Definition("postgresql", "PostgreSQL", JAVA, .35, .7),
            new Definition("kafka", "Kafka", JAVA, .2, .65),
            new Definition("docker", "Docker", BOTH, .3, .8),
            new Definition("kubernetes", "Kubernetes (k8s)", BOTH, .15, .7),
            new Definition("cicd", "CI/CD", BOTH, .25, .75),
            new Definition("architecture", "Проектирование систем", BOTH, .6, .9));

    static List<String> generateSkills(String direction, String grade, int daysAgo, int seed) {
        double progress = 1 - daysAgo / (365.0 * 3);
        int mixed = (seed ^ (seed >>> 16)) * 0x7feb352d;
        mixed = (mixed ^ (mixed >>> 15)) * 0x846ca68b;
        long state = Integer.toUnsignedLong(mixed ^ (mixed >>> 16));
        List<String> result = new ArrayList<>();
        for (Definition skill : DEFINITIONS) {
            if (!skill.directions().contains(direction)) continue;
            if (List.of("kubernetes", "architecture").contains(skill.id())
                    && List.of("junior", "middle").contains(grade)) continue;
            if (grade.equals("junior") && List.of("kafka", "cicd", "docker").contains(skill.id())) continue;
            double factor = grade.equals("junior") && List.of("testing", "spring", "nextjs").contains(skill.id()) ? .45 : 1;
            state = (state * 1664525L + 1013904223L) & 0xffffffffL;
            if (state / 4294967296.0 < (skill.before() + (skill.after() - skill.before()) * progress) * factor) {
                result.add(skill.id());
            }
        }
        return List.copyOf(result);
    }

    public static SkillsResponse aggregate(List<MockVacancyData.Vacancy> vacancies, MockVacancyData.Period period,
                                            List<String> directions, List<String> grades, Instant now) {
        List<Skill> skills = DEFINITIONS.stream()
                .filter(s -> s.directions().stream().anyMatch(directions::contains))
                .map(s -> new Skill(s.id(), s.label())).toList();
        LocalDate currentStart = period.startOf(LocalDate.ofInstant(now, ZoneOffset.UTC));
        LocalDate firstStart = period.shift(currentStart, -(period.bucketCount - 1));
        List<LocalDate> starts = new ArrayList<>();
        Map<LocalDate, Integer> index = new HashMap<>();
        List<Map<String, Integer>> counts = new ArrayList<>();
        int[] totals = new int[period.bucketCount];
        for (int i = 0; i < period.bucketCount; i++) {
            LocalDate start = period.shift(firstStart, i);
            starts.add(start);
            index.put(start, i);
            Map<String, Integer> bucket = new LinkedHashMap<>();
            skills.forEach(s -> bucket.put(s.id(), 0));
            counts.add(bucket);
        }
        for (MockVacancyData.Vacancy vacancy : vacancies) {
            if (!directions.contains(vacancy.direction()) || !grades.contains(vacancy.grade()) || vacancy.publishedAt().isAfter(now)) continue;
            Integer i = index.get(period.startOf(LocalDate.ofInstant(vacancy.publishedAt(), ZoneOffset.UTC)));
            if (i == null) continue;
            totals[i]++;
            for (String id : new HashSet<>(vacancy.skills())) {
                counts.get(i).computeIfPresent(id, (key, count) -> count + 1);
            }
        }
        List<SkillBucket> buckets = new ArrayList<>();
        for (int i = 0; i < starts.size(); i++) {
            buckets.add(new SkillBucket(starts.get(i).atStartOfDay(ZoneOffset.UTC).toInstant(), totals[i], counts.get(i)));
        }
        int last = period.bucketCount - 2;
        int previous = period.bucketCount - 3;
        List<SkillSummary> summary = skills.stream().map(s -> {
            int lastCount = counts.get(last).get(s.id());
            int previousCount = counts.get(previous).get(s.id());
            Double lastShare = totals[last] == 0 ? null : lastCount * 100.0 / totals[last];
            Double previousShare = totals[previous] == 0 ? null : previousCount * 100.0 / totals[previous];
            return new SkillSummary(s.id(), counts.stream().mapToInt(c -> c.get(s.id())).sum(), lastCount, previousCount,
                    lastShare, previousShare, lastShare == null || previousShare == null ? null : lastShare - previousShare);
        }).toList();
        return new SkillsResponse(period.name().toLowerCase(Locale.ROOT), directions, grades, skills, buckets, summary, now);
    }
}
