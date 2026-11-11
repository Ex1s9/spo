package ru.spo.auth.mock;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.spo.auth.web.ApiException;

import java.util.List;
import java.time.Instant;

/**
 * ВРЕМЕННАЯ ЗАГЛУШКА: отдаёт дашборду сгенерированные данные, пока нет search-service.
 * Пути совпадают с тем, что вызывает фронт (features/demand/api.ts).
 */
@RestController
@RequestMapping("/api/vacancies")
@PreAuthorize("hasAuthority('STATS_VIEW')")
public class MockVacancyController {

    private final MockVacancyData data;

    public MockVacancyController(MockVacancyData data) {
        this.data = data;
    }

    @GetMapping
    public MockVacancyData.VacanciesResponse list(@RequestParam(required = false) List<String> directions,
                                                  @RequestParam(required = false) List<String> grades,
                                                  @RequestParam(defaultValue = "20") int limit) {
        if (limit < 1 || limit > 100) throw new ApiException(400, "Лимит должен быть от 1 до 100");
        return data.latest(knownDirections(directions), knownGrades(grades), limit);
    }

    @GetMapping("/demand")
    public MockVacancyData.DemandResponse demand(@RequestParam(defaultValue = "month") String period,
                                                 @RequestParam(required = false) List<String> directions) {
        MockVacancyData.Period parsed = MockVacancyData.Period.parse(period);
        if (parsed == null) {
            throw new ApiException(400, "Неизвестный период");
        }
        return data.demand(parsed, knownDirections(directions));
    }

    @GetMapping("/skills")
    public MockSkillData.SkillsResponse skills(@RequestParam(defaultValue = "month") String period,
                                               @RequestParam(required = false) List<String> directions,
                                               @RequestParam(required = false) List<String> grades) {
        MockVacancyData.Period parsed = MockVacancyData.Period.parse(period);
        if (parsed == null) throw new ApiException(400, "Неизвестный период");
        return MockSkillData.aggregate(data.vacancies(), parsed, knownDirections(directions), knownGrades(grades), Instant.now());
    }

    private static List<String> knownDirections(List<String> directions) {
        return known(directions, MockVacancyData.DIRECTIONS, "Неизвестное направление");
    }

    private static List<String> knownGrades(List<String> grades) {
        return known(grades, MockSkillData.GRADES, "Неизвестный грейд");
    }

    private static List<String> known(List<String> values, List<String> allowed, String message) {
        if (values == null) return allowed;
        if (values.isEmpty() || !values.stream().allMatch(allowed::contains)) throw new ApiException(400, message);
        return values.stream().distinct().toList();
    }
}
