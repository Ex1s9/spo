package ru.spo.auth.mock;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class MockSkillDataTest {
    private static final Instant NOW = Instant.parse("2026-11-05T12:00:00Z");

    private MockVacancyData.Vacancy vacancy(String id, String date, String grade, String direction, String... skills) {
        return new MockVacancyData.Vacancy(id, "Demo", "Demo", direction, grade, List.of(skills),
                "Москва", null, null, "hh.ru", "https://example.com", Instant.parse(date));
    }

    @Test
    void filtersGradeAndDirectionAndComparesCompletePeriods() {
        var result = MockSkillData.aggregate(List.of(
                vacancy("1", "2026-09-01T00:00:00Z", "senior", "java", "java"),
                vacancy("2", "2026-10-01T00:00:00Z", "senior", "java", "java", "kubernetes", "kubernetes"),
                vacancy("3", "2026-10-31T23:59:59Z", "senior", "java", "java"),
                vacancy("4", "2026-10-10T00:00:00Z", "middle", "java", "kubernetes"),
                vacancy("5", "2026-10-10T00:00:00Z", "senior", "react", "kubernetes"),
                vacancy("6", "2026-11-02T00:00:00Z", "senior", "java", "kubernetes"),
                vacancy("7", "2026-11-06T00:00:00Z", "senior", "java", "kubernetes")
        ), MockVacancyData.Period.MONTH, List.of("java"), List.of("senior"), NOW);
        assertThat(result.buckets().get(10).total()).isEqualTo(2);
        assertThat(result.buckets().get(11).total()).isEqualTo(1);
        assertThat(result.summary().stream().filter(s -> s.skill().equals("kubernetes")).findFirst().orElseThrow())
                .isEqualTo(new MockSkillData.SkillSummary("kubernetes", 2, 1, 0, 50.0, 0.0, 50.0));
        assertThat(result.skills()).extracting(MockSkillData.Skill::id).doesNotContain("react");
    }

    @Test
    void distinguishesEmptySamplesFromAbsentSkills() {
        var result = MockSkillData.aggregate(List.of(vacancy("1", "2026-10-01T00:00:00Z", "senior", "java", "java")),
                MockVacancyData.Period.MONTH, List.of("java"), List.of("senior"), NOW);
        var row = result.summary().stream().filter(s -> s.skill().equals("kubernetes")).findFirst().orElseThrow();
        assertThat(row.lastCompleteShare()).isZero();
        assertThat(row.previousShare()).isNull();
        assertThat(row.changePp()).isNull();
    }

    @Test
    void supportsEveryPeriodAndCombinedGrades() {
        for (var period : MockVacancyData.Period.values()) {
            var result = MockSkillData.aggregate(List.of(
                    vacancy("1", "2026-11-01T00:00:00Z", "middle", "java", "java"),
                    vacancy("2", "2026-11-01T00:00:00Z", "senior", "java", "kubernetes")
            ), period, List.of("java"), List.of("middle", "senior"), NOW);
            assertThat(result.buckets()).hasSize(period.bucketCount);
            assertThat(result.buckets().stream().mapToInt(MockSkillData.SkillBucket::total).sum()).isEqualTo(2);
            if (period == MockVacancyData.Period.WEEK) {
                assertThat(result.buckets().get(11).start()).isEqualTo(Instant.parse("2026-11-02T00:00:00Z"));
            }
        }
    }

    @Test
    void generatedSkillsDifferByGradeAndChangeOverTime() {
        int recentK8s = 0, oldTypescript = 0, recentTypescript = 0, oldRedux = 0, recentRedux = 0;
        for (int seed = 1; seed <= 1000; seed++) {
            assertThat(MockSkillData.generateSkills("react", "middle", 0, seed)).doesNotContain("kubernetes");
            var recent = MockSkillData.generateSkills("react", "senior", 0, seed);
            var old = MockSkillData.generateSkills("react", "senior", 1095, seed);
            if (recent.contains("kubernetes")) recentK8s++;
            if (recent.contains("typescript")) recentTypescript++;
            if (old.contains("typescript")) oldTypescript++;
            if (recent.contains("redux")) recentRedux++;
            if (old.contains("redux")) oldRedux++;
        }
        assertThat(recentK8s).isGreaterThan(500);
        assertThat(recentTypescript).isGreaterThan(oldTypescript);
        assertThat(recentRedux).isLessThan(oldRedux);
        for (int seedStart : new int[]{1, 20000, 50000}) {
            int mentions = 0;
            for (int i = 0; i < 1000; i++) {
                if (MockSkillData.generateSkills("java", "senior", 0, i + seedStart).contains("testing")) mentions++;
            }
            assertThat(mentions).isBetween(650, 850);
        }
        assertThat(MockSkillData.generateSkills("java", "senior", 0, 42)).containsExactly(
                "testing", "git", "java", "spring", "sql", "postgresql", "docker", "kubernetes", "cicd", "architecture");
        var data = new MockVacancyData();
        assertThat(data.vacancies()).allMatch(v -> v.skills().contains(v.direction()));
        assertThat(data.latest(List.of("java"), List.of("middle"), 20).items())
                .allMatch(v -> v.grade().equals("middle") && !v.skills().contains("kubernetes"));
    }
}
