import { useState, useEffect } from "react";

export type WidgetId =
  | "ransomware-groups-bar"
  | "ransomware-worldmap"
  | "ransomware-trend-line"
  | "ransomware-sectors-pie"
  | "card-ransomware"
  | "card-telegram"
  | "card-risks";

export interface DashboardLayout {
  slots: WidgetId[];
  columns: 1 | 2 | 3;
}

const DEFAULT_LAYOUT: DashboardLayout = {
  slots: [
    "ransomware-groups-bar",
    "ransomware-worldmap",
    "ransomware-trend-line",
    "ransomware-sectors-pie",
  ],
  columns: 2,
};

const STORAGE_KEY = "dashboard_layout_v2";

export const useDashboardLayout = () => {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_LAYOUT, ...JSON.parse(stored) };
    } catch {
      // Ignore malformed saved dashboard layouts and fall back to defaults.
    }
    return DEFAULT_LAYOUT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Ignore storage failures so the dashboard remains usable in private modes.
    }
  }, [layout]);

  const setColumns = (columns: 1 | 2 | 3) =>
    setLayout((prev) => ({ ...prev, columns }));

  const addWidget = (id: WidgetId) =>
    setLayout((prev) =>
      prev.slots.includes(id)
        ? prev
        : { ...prev, slots: [...prev.slots, id] }
    );

  const removeWidget = (index: number) =>
    setLayout((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));

  const moveUp = (index: number) => {
    if (index === 0) return;
    setLayout((prev) => {
      const slots = [...prev.slots];
      [slots[index - 1], slots[index]] = [slots[index], slots[index - 1]];
      return { ...prev, slots };
    });
  };

  const moveDown = (index: number) => {
    setLayout((prev) => {
      if (index >= prev.slots.length - 1) return prev;
      const slots = [...prev.slots];
      [slots[index], slots[index + 1]] = [slots[index + 1], slots[index]];
      return { ...prev, slots };
    });
  };

  return { layout, setColumns, addWidget, removeWidget, moveUp, moveDown };
};
