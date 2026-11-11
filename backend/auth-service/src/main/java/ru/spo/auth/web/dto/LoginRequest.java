package ru.spo.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Укажите email") @Email(message = "Некорректный email") String email,
        @NotBlank(message = "Укажите пароль") String password) {
}
