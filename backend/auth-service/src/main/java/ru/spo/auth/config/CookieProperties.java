package ru.spo.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "spo.cookie")
public record CookieProperties(String name, String path, boolean secure, String sameSite) {
}
