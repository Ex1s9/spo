package ru.spo.auth.web.dto;

import ru.spo.auth.domain.UserAccount;
import ru.spo.auth.service.JwtService;

import java.util.List;

public record UserResponse(
        String id,
        String email,
        String name,
        boolean active,
        List<String> roles,
        List<String> permissions) {

    public static UserResponse of(UserAccount user) {
        return new UserResponse(
                user.getId().toString(),
                user.getEmail(),
                user.getName(),
                user.isActive(),
                List.copyOf(JwtService.roleCodes(user)),
                List.copyOf(JwtService.permissionCodes(user)));
    }
}
