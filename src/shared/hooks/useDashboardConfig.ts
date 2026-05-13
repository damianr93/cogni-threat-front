import { useState, useEffect } from "react";

export interface DashboardConfig {
  ransomware: boolean;
  telegram: boolean;
}

const DEFAULT_CONFIG: DashboardConfig = {
  ransomware: true,
  telegram: true,
};

const STORAGE_KEY = "dashboard_widgets_config";

export const useDashboardConfig = () => {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Error loading dashboard config:", error);
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error("Error saving dashboard config:", error);
    }
  }, [config]);

  const toggleWidget = (widget: keyof DashboardConfig) => {
    setConfig((prev) => ({
      ...prev,
      [widget]: !prev[widget],
    }));
  };

  return { config, toggleWidget };
};

