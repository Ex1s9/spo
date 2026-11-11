package ru.spo.auth.service;

import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import ru.spo.auth.config.JwtProperties;
import ru.spo.auth.domain.Permission;
import ru.spo.auth.domain.Role;
import ru.spo.auth.domain.UserAccount;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final JwtProperties props;

    public JwtService(JwtEncoder encoder, JwtProperties props) {
        this.encoder = encoder;
        this.props = props;
    }

    public String issueAccessToken(UserAccount user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .issuedAt(now)
                .expiresAt(now.plus(props.accessTtl()))
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("roles", List.copyOf(roleCodes(user)))
                .claim("perms", List.copyOf(permissionCodes(user)))
                .build();

        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).keyId(props.keyId()).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long accessTtlSeconds() {
        return props.accessTtl().toSeconds();
    }

    public static Set<String> roleCodes(UserAccount user) {
        return user.getRoles().stream()
                .map(Role::getCode)
                .collect(java.util.stream.Collectors.toCollection(TreeSet::new));
    }

    public static Set<String> permissionCodes(UserAccount user) {
        return user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .collect(java.util.stream.Collectors.toCollection(TreeSet::new));
    }
}
