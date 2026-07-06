import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStorageItem, setStorageItem } from "../../lib/storage";

type ThemeChoice = "light" | "dark" | "system";

type ThemeContextValue = {
  choice: ThemeChoice;
  setChoice: (c: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "fifa-ranking:theme";

function applyChoice(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }
}

function readInitial(): ThemeChoice {
  const stored = getStorageItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>(readInitial);

  useEffect(() => {
    applyChoice(choice);
    setStorageItem(STORAGE_KEY, choice);
  }, [choice]);

  const value = useMemo<ThemeContextValue>(() => ({ choice, setChoice }), [choice]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
