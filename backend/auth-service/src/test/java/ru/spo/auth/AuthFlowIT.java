package ru.spo.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.security.web.FilterChainProxy;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import jakarta.servlet.http.Cookie;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
class AuthFlowIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    WebApplicationContext context;

    @Autowired
    FilterChainProxy springSecurityFilterChain;

    @Autowired
    ObjectMapper objectMapper;

    MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context).addFilters(springSecurityFilterChain).build();
    }

    @Test
    void registerLoginRefreshAndReuseDetection() throws Exception {
        MockMvc mvc = mockMvc();
        String email = "user-" + System.nanoTime() + "@spo.dev";

        MvcResult registered = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123","name":"Тест"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode session = objectMapper.readTree(registered.getResponse().getContentAsString());
        String accessToken = session.get("accessToken").asText();
        assertThat(session.get("user").get("roles").toString()).contains("USER");
        assertThat(session.get("user").get("permissions").toString()).contains("STATS_VIEW");

        Cookie refreshCookie = registered.getResponse().getCookie("spo_refresh");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();

        // Токен даёт доступ к /me
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        // Прав USER не хватает для админского эндпоинта
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());

        // Обновление по refresh-cookie выдаёт новую пару
        MvcResult refreshed = mvc.perform(post("/api/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isOk())
                .andReturn();
        Cookie rotated = refreshed.getResponse().getCookie("spo_refresh");
        assertThat(rotated).isNotNull();
        assertThat(rotated.getValue()).isNotEqualTo(refreshCookie.getValue());

        // Повторное использование погашенного токена отклоняется
        mvc.perform(post("/api/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isUnauthorized());

        // ...и гасит всю цепочку: свежий токен тоже больше не работает
        mvc.perform(post("/api/auth/refresh").cookie(rotated))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anonymousIsRejected() throws Exception {
        mockMvc().perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
}
