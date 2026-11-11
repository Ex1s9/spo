"use client"

/**
 * Access-токен живёт только в памяти вкладки: ни localStorage, ни sessionStorage,
 * ни обычной cookie — иначе его достанет любой XSS. Перезагрузка страницы токен теряет,
 * и он восстанавливается вызовом /auth/refresh по httpOnly-cookie.
 */
let accessToken: string | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}
