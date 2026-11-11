package ru.spo.auth.web;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Публичный ключ для остальных сервисов: они проверяют подпись токена, не ходя в auth-service. */
@RestController
public class JwksController {

    private final JWKSet publicKeys;

    public JwksController(RSAKey rsaKey) {
        this.publicKeys = new JWKSet(rsaKey.toPublicJWK());
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> jwks() {
        return publicKeys.toJSONObject();
    }
}
