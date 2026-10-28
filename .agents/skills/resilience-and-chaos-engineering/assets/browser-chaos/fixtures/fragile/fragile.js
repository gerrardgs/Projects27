// Deliberately fragile code for testing the chaos experiments. Do not copy.
const saved = localStorage.getItem("theme"); // throws when storage is blocked: no try/catch
document.documentElement.dataset.theme = saved ?? "light";
document.getElementById("theme-toggle").addEventListener("click", () => {
  document.documentElement.dataset.theme = "dark";
  localStorage.setItem("theme", "dark");
});

// The form exists only when this script runs: no server-rendered fallback.
const form = document.createElement("form");
for (const [id, text, type] of [
  ["name", "Name", "text"],
  ["email", "Email address", "email"],
]) {
  const label = Object.assign(document.createElement("label"), { htmlFor: id, textContent: text });
  form.append(label, Object.assign(document.createElement("input"), { id, type }));
}
form.append(Object.assign(document.createElement("button"), { type: "submit", textContent: "Subscribe" }));
document.getElementById("form-root").append(form);
