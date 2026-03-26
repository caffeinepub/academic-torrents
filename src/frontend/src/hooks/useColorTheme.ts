import { useEffect, useState } from "react";

const STORAGE_MAIN = "tui-main-color";
const STORAGE_SECONDARY = "tui-secondary-color";

export const MAIN_COLOR_PRESETS: Record<string, string> = {
  RED_PINK: "0.65 0.28 355",
  CYAN: "0.75 0.18 195",
  GREEN: "0.72 0.22 145",
  AMBER: "0.78 0.18 70",
  ORANGE: "0.72 0.22 45",
  WHITE: "0.92 0.005 0",
};

export const SECONDARY_COLOR_PRESETS: Record<string, string> = {
  PURPLE: "0.6 0.22 300",
  BLUE: "0.65 0.2 250",
  TEAL: "0.68 0.18 175",
  MAGENTA: "0.65 0.25 320",
  YELLOW: "0.82 0.18 95",
  GREY: "0.55 0.005 0",
};

export function applyColors(main: string, secondary: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", main);
  root.style.setProperty("--secondary", secondary);
  root.style.setProperty("--accent", secondary);
  root.style.setProperty("--ring", main);

  const styleId = "tui-glow-dynamic";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @keyframes tui-glow {
      0%, 100% { text-shadow: 0 0 8px oklch(${main} / 0.5); }
      50% { text-shadow: 0 0 16px oklch(${main} / 0.9), 0 0 32px oklch(${secondary} / 0.3); }
    }
  `;
}

export function useColorTheme() {
  const [mainColor, setMainColor] = useState<string>(
    () => localStorage.getItem(STORAGE_MAIN) ?? MAIN_COLOR_PRESETS.RED_PINK,
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    () =>
      localStorage.getItem(STORAGE_SECONDARY) ?? SECONDARY_COLOR_PRESETS.PURPLE,
  );
  const [hasChosenColors, setHasChosenColors] = useState<boolean>(
    () =>
      !!(
        localStorage.getItem(STORAGE_MAIN) &&
        localStorage.getItem(STORAGE_SECONDARY)
      ),
  );

  useEffect(() => {
    const savedMain =
      localStorage.getItem(STORAGE_MAIN) ?? MAIN_COLOR_PRESETS.RED_PINK;
    const savedSecondary =
      localStorage.getItem(STORAGE_SECONDARY) ?? SECONDARY_COLOR_PRESETS.PURPLE;
    applyColors(savedMain, savedSecondary);
  }, []);

  function setColors(main: string, secondary: string) {
    localStorage.setItem(STORAGE_MAIN, main);
    localStorage.setItem(STORAGE_SECONDARY, secondary);
    setMainColor(main);
    setSecondaryColor(secondary);
    setHasChosenColors(true);
    applyColors(main, secondary);
  }

  function resetColors() {
    localStorage.removeItem(STORAGE_MAIN);
    localStorage.removeItem(STORAGE_SECONDARY);
    setHasChosenColors(false);
  }

  return { mainColor, secondaryColor, setColors, hasChosenColors, resetColors };
}
