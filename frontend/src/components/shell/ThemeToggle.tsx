import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Toggle de tema: papel de día / papel de guardia nocturna. Persiste en localStorage. */
export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem("tickitflow.theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("tickitflow.theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex size-8 cursor-pointer items-center justify-center rounded-[3px] text-ink-3 transition-colors duration-150 hover:bg-ink/5 hover:text-ink"
    >
      {dark ? (
        <Sun size={15} strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon size={15} strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
