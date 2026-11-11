package ru.spo.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "spo.bootstrap-admin")
public record BootstrapAdminProperties(boolean enabled, String email, String password, String name) {
}
