export const SESSION_COOKIE = 'session';
export const GUEST_CART_COOKIE = 'cart_id';

const GUEST_CART_MAX_AGE_S = 30 * 24 * 60 * 60;

export function sessionCookie(token: string, expiresAt: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
}

export const CLEAR_SESSION_COOKIE = `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;

export function guestCartCookie(cartId: string) {
  return `${GUEST_CART_COOKIE}=${cartId}; Path=/; SameSite=Lax; Max-Age=${GUEST_CART_MAX_AGE_S}`;
}

export function readDocumentCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
