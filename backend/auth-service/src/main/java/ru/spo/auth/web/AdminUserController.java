package ru.spo.auth.web;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.spo.auth.service.AuthService;
import ru.spo.auth.service.RefreshTokenService;
import ru.spo.auth.web.dto.UpdateRolesRequest;
import ru.spo.auth.web.dto.UserResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokens;

    public AdminUserController(AuthService authService, RefreshTokenService refreshTokens) {
        this.authService = authService;
        this.refreshTokens = refreshTokens;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public List<UserResponse> list() {
        return authService.findAll().stream().map(UserResponse::of).toList();
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public UserResponse replaceRoles(@PathVariable UUID id, @Valid @RequestBody UpdateRolesRequest request) {
        var user = authService.replaceRoles(id, request.roles());
        // Права живут внутри access-токена, поэтому старые сессии гасим: иначе новые права
        // или их отзыв применятся только после истечения токена.
        refreshTokens.revokeAll(user);
        return UserResponse.of(user);
    }

    @PutMapping("/{id}/active")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public UserResponse setActive(@PathVariable UUID id, @RequestParam boolean value) {
        var user = authService.setActive(id, value);
        if (!value) {
            refreshTokens.revokeAll(user);
        }
        return UserResponse.of(user);
    }
}
