package ru.spo.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Укажите email") @Email(message = "Некорректный email") String email,
        @NotBlank(message = "Укажите пароль") @Size(min = 8, message = "Пароль не короче 8 символов") String password,
        @NotBlank(message = "Укажите имя") @Size(max = 120) String name) {
}
