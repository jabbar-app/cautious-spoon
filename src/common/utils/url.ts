/**
 * Safely append a token query param to a URL.
 * Works with absolute URLs (https://...) and relative paths (/auth/verify).
 *
 * Examples:
 *  buildVerifyUrl('https://candidate.com/verify', 'abc') -> 'https://candidate.com/verify?token=abc'
 *  buildVerifyUrl('/auth/candidate/verify?x=1#frag', 'abc') -> '/auth/candidate/verify?x=1&token=abc#frag'
 */
export function buildVerifyUrl(base: string, token: string, paramName = 'token'): string {
  const hasProtocol = /^https?:\/\//i.test(base);
  const url = new URL(base, hasProtocol ? undefined : 'http://local'); // dummy origin for relative paths

  url.searchParams.set(paramName, token);

  if (hasProtocol) {
    // Absolute URL: keep full origin
    return url.toString();
  }

  // Relative path: strip the dummy origin
  const path = url.pathname || '/';
  const query = url.search || '';
  const hash = url.hash || '';
  return `${path}${query}${hash}`;
}

/**
 * Alias for password reset links (same behavior, different name if you prefer semantic usage).
 */
export function buildResetUrl(base: string, token: string, paramName = 'token'): string {
  return buildVerifyUrl(base, token, paramName);
}
