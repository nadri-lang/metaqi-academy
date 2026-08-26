// Shared helpers for the free-text date fields in the admin panel.
//
// There is no native date picker here, so whatever the admin types has to be
// normalised into the YYYY-MM-DD string the API stores. The previous
// newborn-vocation formatter appended a hyphen whenever the raw text happened
// to be 4 or 7 characters long, which broke two ways: typing your own hyphens
// turned "2026-08-29" into "2026--08-2" (and the trailing digit was silently
// dropped by a length guard), and backspacing re-added the hyphen so the field
// could never be cleared past "2026-" — clearing and retyping then produced a
// valid-but-wrong date that saved over a different day's entry.
//
// Rebuilding the value from its digits avoids both: the result depends only on
// the digits present, so the function is idempotent and re-running it on
// already-formatted text is a no-op.

/** Normalise arbitrary typed text into as much of YYYY-MM-DD as is available. */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8); // YYYYMMDD
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);

  // A separator is only added once the group behind it has a digit. Appending
  // it eagerly is what made the old field impossible to backspace through.
  let formatted = year;
  if (month) formatted += `-${month}`;
  if (day) formatted += `-${day}`;
  return formatted;
}

/** True only for a well-formed YYYY-MM-DD that is also a real calendar date. */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1) return false;

  // Round-trip through Date to reject impossible days (2026-02-31, 2026-04-31).
  // Those pass a regex check, save fine, and then never match a lookup.
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * Today in the admin's own timezone.
 *
 * Deliberately not `new Date().toISOString().split('T')[0]` — that is UTC, so
 * for an admin at UTC+2 every entry created after 22:00 local is dated to the
 * previous day.
 */
export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** "29 AGO 2026" style label for confirmation prompts. Falls back to the raw string. */
export function describeDate(value: string, locale = 'es-ES'): string {
  if (!isValidISODate(value)) return value;
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}
