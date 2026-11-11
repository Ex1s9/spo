package ru.spo.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.spo.auth.domain.Role;
import ru.spo.auth.domain.UserAccount;
import ru.spo.auth.repo.RoleRepository;
import ru.spo.auth.repo.UserAccountRepository;
import ru.spo.auth.web.ApiException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    public static final String DEFAULT_ROLE = "USER";

    private final UserAccountRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository users, RoleRepository roles, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserAccount register(String email, String password, String name) {
        String normalized = email.trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(normalized)) {
            throw new ApiException(409, "Пользователь с таким email уже зарегистрирован");
        }
        UserAccount user = new UserAccount(normalized, passwordEncoder.encode(password), name.trim());
        user.setRoles(new LinkedHashSet<>(List.of(requireRole(DEFAULT_ROLE))));
        return users.save(user);
    }

    @Transactional(readOnly = true)
    public UserAccount authenticate(String email, String password) {
        UserAccount user = users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ApiException(401, "Неверный email или пароль"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(401, "Неверный email или пароль");
        }
        if (!user.isActive()) {
            throw new ApiException(403, "Учётная запись отключена");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public UserAccount requireUser(UUID id) {
        return users.findById(id).orElseThrow(() -> new ApiException(404, "Пользователь не найден"));
    }

    @Transactional
    public UserAccount replaceRoles(UUID userId, Set<String> roleCodes) {
        UserAccount user = requireUser(userId);
        List<Role> found = roles.findByCodeIn(roleCodes);
        if (found.size() != roleCodes.size()) {
            throw new ApiException(400, "Указана несуществующая роль");
        }
        user.setRoles(new LinkedHashSet<>(found));
        return user;
    }

    @Transactional
    public UserAccount setActive(UUID userId, boolean active) {
        UserAccount user = requireUser(userId);
        user.setActive(active);
        return user;
    }

    @Transactional(readOnly = true)
    public List<UserAccount> findAll() {
        return users.findAll();
    }

    private Role requireRole(String code) {
        return roles.findByCode(code)
                .orElseThrow(() -> new IllegalStateException("Роль " + code + " отсутствует, проверьте миграции"));
    }
}
