package ru.spo.auth.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import ru.spo.auth.domain.UserAccount;
import ru.spo.auth.repo.RefreshTokenRepository;

import java.time.Instant;

/**
 * Гашение сессий в отдельной транзакции. Нужно там, где вызывающий код сразу после
 * этого бросает исключение: иначе откат транзакции отменил бы и само гашение.
 */
@Component
public class TokenRevoker {

    private final RefreshTokenRepository repository;

    public TokenRevoker(RefreshTokenRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void revokeAllForUser(UserAccount user) {
        repository.revokeAllForUser(user, Instant.now());
    }
}
