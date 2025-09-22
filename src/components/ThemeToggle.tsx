import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const enableDark = saved ? saved === "dark" : prefersDark;
    setDark(enableDark);
    document.documentElement.classList.toggle("dark", enableDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button className="button-contrast" onClick={toggle} title="Toggle theme">
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}