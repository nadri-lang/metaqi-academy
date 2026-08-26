/**
 * Media stored in the Emergent Object Store is persisted as a backend-relative
 * path ("/api/storage/objects/..."). React Native's <Image> and Linking need an
 * absolute URL - a relative one silently renders blank - so resolve it against
 * the backend origin before handing it to them.
 *
 * Values that are already absolute (http, https, data, file, content) pass
 * through untouched, so this is safe to apply to admin-entered links too.
 */
const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');

export function toAbsoluteMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  if (!BACKEND_URL) return url;
  return `${BACKEND_URL}/${url.replace(/^\/+/, '')}`;
}
