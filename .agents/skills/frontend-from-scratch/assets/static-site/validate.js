// Pure validation shared by the browser (main.js) and the tests. No DOM access here.
// The server must validate again: client-side checks are for the user's convenience, not for security.

export const NAME_MAX_LENGTH = 100;
// RFC 5321 limits a forward path to 256 octets including angle brackets, so 254 for the address itself.
export const EMAIL_MAX_LENGTH = 254;

// Deliberately loose: one "@", something before it, a dot in the domain, no spaces.
// Strict email regexes reject real addresses; confirmation emails are the real check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @typedef {{ field: "name" | "email", message: string }} FieldError
 * @param {{ name?: unknown, email?: unknown }} input
 * @returns {{ ok: true, value: { name: string, email: string } } | { ok: false, errors: FieldError[] }}
 */
export function validateSignup(input) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  /** @type {FieldError[]} */
  const errors = [];

  // Messages say what to do, not just what is wrong (WCAG 3.3.3 Error Suggestion).
  if (name === "") {
    errors.push({ field: "name", message: "Enter your name" });
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.push({ field: "name", message: `Name must be ${NAME_MAX_LENGTH} characters or fewer` });
  }

  if (email === "") {
    errors.push({ field: "email", message: "Enter your email address" });
  } else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.push({ field: "email", message: "Enter an email address in the correct format, like name@example.com" });
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: { name, email } };
}

/**
 * Chooses the theme to apply: an explicit saved choice wins, otherwise follow the operating system.
 * @param {string | null} saved
 * @param {boolean} systemPrefersDark
 * @returns {"light" | "dark"}
 */
export function resolveTheme(saved, systemPrefersDark) {
  if (saved === "light" || saved === "dark") return saved;
  return systemPrefersDark ? "dark" : "light";
}
