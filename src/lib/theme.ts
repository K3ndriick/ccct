// Theme handling — the app's own light/dark toggle.
// Persisted to localStorage; applied as data-theme on <html> (see index.html
// for the pre-paint bootstrap that avoids a flash of the wrong theme).

export type Theme = "dark" | "light";

const KEY = "ccct-theme";

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // ignore storage failures — theme still applies for this session
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
