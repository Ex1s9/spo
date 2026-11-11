package ru.spo.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "spo.jwt")
public record JwtProperties(
        String issuer,
        String keyId,
        Duration accessTtl,
        Duration refreshTtl,
        String privateKey,
        String publicKey) {
}
