import { useState } from "react";
import {
  MAIN_COLOR_PRESETS,
  SECONDARY_COLOR_PRESETS,
  applyColors,
  useColorTheme,
} from "../hooks/useColorTheme";

export function ColorSetupModal() {
  const { hasChosenColors, setColors, mainColor, secondaryColor } =
    useColorTheme();
  const [selectedMain, setSelectedMain] = useState<string>(() => {
    const entry = Object.entries(MAIN_COLOR_PRESETS).find(
      ([, v]) => v === mainColor,
    );
    return entry ? entry[0] : "RED_PINK";
  });
  const [selectedSecondary, setSelectedSecondary] = useState<string>(() => {
    const entry = Object.entries(SECONDARY_COLOR_PRESETS).find(
      ([, v]) => v === secondaryColor,
    );
    return entry ? entry[0] : "PURPLE";
  });
  const [visible, setVisible] = useState(!hasChosenColors);

  if (!visible) return null;

  const mainVal = MAIN_COLOR_PRESETS[selectedMain];
  const secondaryVal = SECONDARY_COLOR_PRESETS[selectedSecondary];

  function handleSelectMain(key: string) {
    setSelectedMain(key);
    applyColors(
      MAIN_COLOR_PRESETS[key],
      SECONDARY_COLOR_PRESETS[selectedSecondary],
    );
  }

  function handleSelectSecondary(key: string) {
    setSelectedSecondary(key);
    applyColors(MAIN_COLOR_PRESETS[selectedMain], SECONDARY_COLOR_PRESETS[key]);
  }

  function handleConfirm() {
    setColors(mainVal, secondaryVal);
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/90"
      data-ocid="color_setup.modal"
    >
      <div className="tui-panel w-full max-w-xl mx-4 p-6">
        <span className="tui-panel-label">TERMINAL_SETUP</span>

        <div className="mb-6 mt-2">
          <h2 className="font-mono font-bold text-sm tracking-widest uppercase tui-glow blink-cursor">
            CONFIGURE TERMINAL COLORS
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            &gt; SELECT YOUR COLOR PREFERENCES TO INITIALIZE THE TERMINAL
          </p>
        </div>

        <div className="mb-5">
          <div className="text-xs font-mono font-bold tracking-widest text-muted-foreground mb-2">
            &gt; SELECT PRIMARY COLOR:
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(MAIN_COLOR_PRESETS).map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => handleSelectMain(key)}
                data-ocid="color_setup.primary.button"
                className={`font-mono text-xs font-bold tracking-wider px-2 py-0.5 border cursor-pointer transition-colors ${
                  selectedMain === key
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                [{key}]
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-xs font-mono font-bold tracking-widest text-muted-foreground mb-2">
            &gt; SELECT SECONDARY COLOR:
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(SECONDARY_COLOR_PRESETS).map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => handleSelectSecondary(key)}
                data-ocid="color_setup.secondary.button"
                className={`font-mono text-xs font-bold tracking-wider px-2 py-0.5 border cursor-pointer transition-colors ${
                  selectedSecondary === key
                    ? "border-secondary text-secondary bg-secondary/10"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                [{key}]
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border p-3 mb-6 bg-background/50">
          <div className="text-xs font-mono text-muted-foreground mb-1">
            PREVIEW:
          </div>
          <div className="font-mono text-xs">
            SAMPLE:{" "}
            <span style={{ color: `oklch(${mainVal})` }}>
              {selectedMain}_TEXT
            </span>{" "}
            and{" "}
            <span style={{ color: `oklch(${secondaryVal})` }}>
              {selectedSecondary}_TEXT
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleConfirm}
            data-ocid="color_setup.confirm_button"
            className="font-mono text-xs font-bold tracking-widest border border-primary text-primary bg-primary/10 hover:bg-primary/20 px-6 py-2 cursor-pointer blink-cursor transition-colors"
          >
            &gt; CONFIRM_COLORS
          </button>
        </div>
      </div>
    </div>
  );
}
