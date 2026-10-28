// Progressive enhancement: the page and form work without this script (the form posts to the server).
// With it, users get inline validation, an error summary, and a theme toggle.
import { resolveTheme, validateSignup } from "./validate.js";

const THEME_KEY = "theme";

/** Storage can throw (private mode, blocked cookies); treat that as "no saved choice". */
function readSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

/** @param {"light" | "dark"} theme */
function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not persisting is acceptable; the choice still applies to this page view.
  }
}

function setUpThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  if (!(toggle instanceof HTMLButtonElement)) return;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  /** @param {"light" | "dark"} theme */
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
  };

  apply(resolveTheme(readSavedTheme(), systemDark.matches));
  toggle.classList.add("is-ready");
  toggle.addEventListener("click", () => {
    const next = toggle.getAttribute("aria-pressed") === "true" ? "light" : "dark";
    apply(next);
    saveTheme(next);
  });
}

/**
 * @param {HTMLFormElement} form
 * @param {"name" | "email"} field
 * @param {string | null} message
 */
function showFieldError(form, field, message) {
  const input = form.elements.namedItem(field);
  const error = document.getElementById(`${field}-error`);
  if (!(input instanceof HTMLInputElement) || error === null) return;
  input.setAttribute("aria-invalid", message === null ? "false" : "true");
  error.textContent = message ?? "";
  error.hidden = message === null;
}

function setUpForm() {
  const form = document.getElementById("signup-form");
  const summary = document.getElementById("error-summary");
  const list = document.getElementById("error-list");
  const status = document.getElementById("form-status");
  if (!(form instanceof HTMLFormElement) || summary === null || list === null || status === null) return;

  form.addEventListener("submit", (event) => {
    const data = new FormData(form);
    const result = validateSignup({ name: data.get("name"), email: data.get("email") });
    for (const field of /** @type {const} */ (["name", "email"])) showFieldError(form, field, null);
    list.replaceChildren();

    if (result.ok) {
      summary.hidden = true;
      return; // Let the browser submit to the server, which validates again.
    }

    event.preventDefault();
    for (const { field, message } of result.errors) {
      showFieldError(form, field, message);
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${field}`;
      link.textContent = message; // textContent, never innerHTML, for anything built from data
      item.append(link);
      list.append(item);
    }
    summary.hidden = false;
    summary.focus(); // Moves screen reader and keyboard users straight to the list of problems.
    status.textContent = "";
  });
}

setUpThemeToggle();
setUpForm();
