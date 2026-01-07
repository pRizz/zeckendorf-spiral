import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SettingsContextType {
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  useSqrtMode: boolean;
  setUseSqrtMode: (use: boolean) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  lineThickness: number;
  setLineThickness: (thickness: number) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showLabels, setShowLabels] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1.25);
  const [useSqrtMode, setUseSqrtMode] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lineThickness, setLineThickness] = useState(0.75);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  return (
    <SettingsContext.Provider
      value={{
        showLabels,
        setShowLabels,
        animationSpeed,
        setAnimationSpeed,
        useSqrtMode,
        setUseSqrtMode,
        theme,
        setTheme,
        lineThickness,
        setLineThickness,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
