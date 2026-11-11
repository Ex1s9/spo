package ru.spo.auth.mock;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import ru.spo.auth.config.SecurityConfig;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MockVacancyController.class)
@Import({SecurityConfig.class, MockVacancyData.class})
class MockVacancyControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean JwtDecoder jwtDecoder;

    @Test
    void requiresAuthenticationAndStatsPermission() throws Exception {
        mvc.perform(get("/api/vacancies/skills")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/vacancies/skills").with(jwt().authorities(new SimpleGrantedAuthority("FILTER_SAVE"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void returnsGradeFilteredStatsAndStacks() throws Exception {
        var access = jwt().authorities(new SimpleGrantedAuthority("STATS_VIEW"));
        mvc.perform(get("/api/vacancies/skills?directions=java&grades=middle&period=month").with(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grades[0]").value("middle"))
                .andExpect(jsonPath("$.buckets.length()").value(12))
                .andExpect(jsonPath("$.summary[?(@.skill == 'kubernetes')].lastComplete").value(org.hamcrest.Matchers.contains(0)));
        mvc.perform(get("/api/vacancies?directions=java&grades=middle&limit=2").with(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[*].grade").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("middle"))))
                .andExpect(jsonPath("$.items[0].skills").isArray());
    }

    @Test
    void rejectsUnknownOrEmptyFiltersAndInvalidLimits() throws Exception {
        for (String query : new String[]{"grades=unknown", "grades=", "directions=", "directions=python", "period=invalid"}) {
            mvc.perform(get("/api/vacancies/skills?" + query).with(jwt().authorities(new SimpleGrantedAuthority("STATS_VIEW"))))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/vacancies?limit=-1").with(jwt().authorities(new SimpleGrantedAuthority("STATS_VIEW"))))
                .andExpect(status().isBadRequest());
    }
}
