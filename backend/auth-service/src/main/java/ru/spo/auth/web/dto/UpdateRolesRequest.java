package ru.spo.auth.web.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public record UpdateRolesRequest(@NotEmpty(message = "Укажите хотя бы одну роль") Set<String> roles) {
}
