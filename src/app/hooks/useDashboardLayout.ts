import { useState, useEffect } from "react";

export type WidgetId =
  | "ransomware-groups-bar"
  | "ransomware-worldmap"
  | "ransomware-trend-line"
  | "ransomware-sectors-pie"
  | "card-ransomware"
  | "card-telegram"
  | "card-risks"
  | "card-kpis"
  | "card-kpi-single";

export interface DashboardSlot {
  widgetId: WidgetId;
  kpiId?: string;
}

export interface DashboardLayout {
  slots: DashboardSlot[];
  columns: 1 | 2 | 3;
}

const DEFAULT_LAYOUT: DashboardLayout = {
  slots: [
    { widgetId: "ransomware-groups-bar" },
    { widgetId: "ransomware-worldmap" },
    { widgetId: "ransomware-trend-line" },
    { widgetId: "ransomware-sectors-pie" },
  ],
  columns: 2,
};

const STORAGE_KEY = "dashboard_layout_v3";

export const useDashboardLayout = () => {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const slots = Array.isArray(parsed.slots)
          ? parsed.slots.map((entry: unknown) =>
              typeof entry === "string" ? { widgetId: entry as WidgetId } : (entry as DashboardSlot),
            )
          : DEFAULT_LAYOUT.slots;
        return { ...DEFAULT_LAYOUT, ...parsed, slots };
      }
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

  const addWidget = (id: WidgetId, kpiId?: string) =>
    setLayout((prev) => {
      if (id !== "card-kpi-single" && prev.slots.some((slot) => slot.widgetId === id)) return prev;
      return { ...prev, slots: [...prev.slots, { widgetId: id, kpiId }] };
    });

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
