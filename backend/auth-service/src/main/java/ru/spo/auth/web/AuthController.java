package ru.spo.auth.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import ru.spo.auth.config.CookieProperties;
import ru.spo.auth.config.JwtProperties;
import ru.spo.auth.domain.UserAccount;
import ru.spo.auth.service.AuthService;
import ru.spo.auth.service.JwtService;
import ru.spo.auth.service.RefreshTokenService;
import ru.spo.auth.web.dto.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokens;
    private final CookieProperties cookieProps;
    private final JwtProperties jwtProps;

    public AuthController(AuthService authService,
                          JwtService jwtService,
                          RefreshTokenService refreshTokens,
                          CookieProperties cookieProps,
                          JwtProperties jwtProps) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.refreshTokens = refreshTokens;
        this.cookieProps = cookieProps;
        this.jwtProps = jwtProps;
    }

    @PostMapping("/register")
    public ResponseEntity<SessionResponse> register(@Valid @RequestBody RegisterRequest request,
                                                    HttpServletRequest httpRequest) {
        UserAccount user = authService.register(request.email(), request.password(), request.name());
        return session(user, httpRequest, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<SessionResponse> login(@Valid @RequestBody LoginRequest request,
                                                 HttpServletRequest httpRequest) {
        UserAccount user = authService.authenticate(request.email(), request.password());
        return session(user, httpRequest, HttpStatus.OK);
    }

    /** Обновление access-токена по refresh-cookie. Refresh ротируется: старый гасится. */
    @PostMapping("/refresh")
    public ResponseEntity<SessionResponse> refresh(
            @CookieValue(name = "${spo.cookie.name}", required = false) String refreshToken,
            HttpServletRequest httpRequest) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException(401, "Сессия не найдена");
        }
        RefreshTokenService.Rotated rotated =
                refreshTokens.rotate(refreshToken, httpRequest.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(rotated.refreshToken()).toString())
                .body(new SessionResponse(
                        jwtService.issueAccessToken(rotated.user()),
                        jwtService.accessTtlSeconds(),
                        UserResponse.of(rotated.user())));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "${spo.cookie.name}", required = false) String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokens.revoke(refreshToken);
        }
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expiredCookie().toString())
                .build();
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return UserResponse.of(authService.requireUser(UUID.fromString(jwt.getSubject())));
    }

    private ResponseEntity<SessionResponse> session(UserAccount user,
                                                    HttpServletRequest request,
                                                    HttpStatus status) {
        String refreshToken = refreshTokens.issue(user, request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie(refreshToken).toString())
                .body(new SessionResponse(
                        jwtService.issueAccessToken(user),
                        jwtService.accessTtlSeconds(),
                        UserResponse.of(user)));
    }

    private ResponseCookie refreshCookie(String value) {
        return ResponseCookie.from(cookieProps.name(), value)
                .httpOnly(true)
                .secure(cookieProps.secure())
                .sameSite(cookieProps.sameSite())
                .path(cookieProps.path())
                .maxAge(jwtProps.refreshTtl())
                .build();
    }

    private ResponseCookie expiredCookie() {
        return ResponseCookie.from(cookieProps.name(), "")
                .httpOnly(true)
                .secure(cookieProps.secure())
                .sameSite(cookieProps.sameSite())
                .path(cookieProps.path())
                .maxAge(0)
                .build();
    }
}
