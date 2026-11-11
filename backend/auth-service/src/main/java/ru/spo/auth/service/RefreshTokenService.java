package ru.spo.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.spo.auth.config.JwtProperties;
import ru.spo.auth.domain.RefreshToken;
import ru.spo.auth.domain.UserAccount;
import ru.spo.auth.repo.RefreshTokenRepository;
import ru.spo.auth.web.ApiException;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final TokenRevoker tokenRevoker;
    private final JwtProperties props;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository repository,
                               TokenRevoker tokenRevoker,
                               JwtProperties props) {
        this.repository = repository;
        this.tokenRevoker = tokenRevoker;
        this.props = props;
    }

    /** Возвращает исходный токен: в базу кладётся только его SHA-256. */
    @Transactional
    public String issue(UserAccount user, String userAgent) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        repository.save(new RefreshToken(
                user,
                hash(raw),
                Instant.now().plus(props.refreshTtl()),
                trim(userAgent)));
        return raw;
    }

    /** Ротация: старый токен гасится, выдаётся новый. Повторное использование погашенного — ошибка. */
    @Transactional
    public Rotated rotate(String rawToken, String userAgent) {
        RefreshToken token = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new ApiException(401, "Сессия недействительна"));

        if (!token.isUsable()) {
            // Токен уже погашен или истёк. Это либо просрочка, либо попытка переиспользовать
            // украденную cookie — гасим всю цепочку сессий пользователя. Гашение идёт отдельной
            // транзакцией, иначе исключение ниже откатило бы и его.
            tokenRevoker.revokeAllForUser(token.getUser());
            throw new ApiException(401, "Сессия истекла, войдите заново");
        }

        UserAccount user = token.getUser();
        if (!user.isActive()) {
            throw new ApiException(403, "Учётная запись отключена");
        }

        token.revoke();
        return new Rotated(user, issue(user, userAgent));
    }

    @Transactional
    public void revoke(String rawToken) {
        repository.findByTokenHash(hash(rawToken))
                .filter(RefreshToken::isUsable)
                .ifPresent(RefreshToken::revoke);
    }

    @Transactional
    public void revokeAll(UserAccount user) {
        repository.revokeAllForUser(user, Instant.now());
    }

    @Transactional
    public int purgeExpired() {
        return repository.deleteExpired(Instant.now());
    }

    private static String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 недоступен", e);
        }
    }

    private static String trim(String userAgent) {
        if (userAgent == null) return null;
        return userAgent.length() > 255 ? userAgent.substring(0, 255) : userAgent;
    }

    public record Rotated(UserAccount user, String refreshToken) {
    }
}
