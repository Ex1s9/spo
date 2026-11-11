package ru.spo.auth.web.dto;

/** accessToken фронт держит в памяти, refresh уходит в httpOnly cookie и в теле не передаётся. */
public record SessionResponse(String accessToken, long expiresIn, UserResponse user) {
}
