package ru.spo.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.spo.auth.config.BootstrapAdminProperties;
import ru.spo.auth.domain.UserAccount;
import ru.spo.auth.repo.RoleRepository;
import ru.spo.auth.repo.UserAccountRepository;

import java.util.LinkedHashSet;
import java.util.List;

/** Создаёт первого администратора, если его ещё нет: иначе систему некому настроить. */
@Component
public class BootstrapAdminRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);

    private final BootstrapAdminProperties props;
    private final UserAccountRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;

    public BootstrapAdminRunner(BootstrapAdminProperties props,
                                UserAccountRepository users,
                                RoleRepository roles,
                                PasswordEncoder passwordEncoder) {
        this.props = props;
        this.users = users;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!props.enabled() || users.existsByEmailIgnoreCase(props.email())) {
            return;
        }
        UserAccount admin = new UserAccount(
                props.email().toLowerCase(),
                passwordEncoder.encode(props.password()),
                props.name());
        admin.setRoles(new LinkedHashSet<>(List.of(
                roles.findByCode("ADMIN").orElseThrow(() ->
                        new IllegalStateException("Роль ADMIN отсутствует, проверьте миграции")))));
        users.save(admin);
        log.info("Создан администратор {} (пароль задаётся через BOOTSTRAP_ADMIN_PASSWORD)", props.email());
    }
}
