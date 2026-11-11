package ru.spo.auth.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.converter.RsaKeyConverters;
import org.springframework.security.oauth2.jwt.*;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

/**
 * Ключи подписи access-токена. В проде пара RSA задаётся переменными окружения
 * JWT_PRIVATE_KEY / JWT_PUBLIC_KEY (PEM). Если они пустые, на старте генерируется
 * временная пара: удобно для разработки, но после рестарта все токены становятся невалидными.
 */
@Configuration
public class JwtKeyConfig {

    private static final Logger log = LoggerFactory.getLogger(JwtKeyConfig.class);

    @Bean
    public RSAKey rsaKey(JwtProperties props) throws Exception {
        if (hasText(props.privateKey()) && hasText(props.publicKey())) {
            RSAPrivateKey privateKey = RsaKeyConverters.pkcs8()
                    .convert(new ByteArrayInputStream(props.privateKey().getBytes(StandardCharsets.UTF_8)));
            RSAPublicKey publicKey = RsaKeyConverters.x509()
                    .convert(new ByteArrayInputStream(props.publicKey().getBytes(StandardCharsets.UTF_8)));
            return new RSAKey.Builder(publicKey).privateKey(privateKey).keyID(props.keyId()).build();
        }

        log.warn("JWT: ключи не заданы, сгенерирована временная пара RSA. "
                + "Для стенда и прода задайте JWT_PRIVATE_KEY и JWT_PUBLIC_KEY.");
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair pair = generator.generateKeyPair();
        return new RSAKey.Builder((RSAPublicKey) pair.getPublic())
                .privateKey(pair.getPrivate())
                .keyID(props.keyId())
                .build();
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }

    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    public JwtDecoder jwtDecoder(RSAKey rsaKey, JwtProperties props) throws Exception {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(props.issuer()));
        return decoder;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
