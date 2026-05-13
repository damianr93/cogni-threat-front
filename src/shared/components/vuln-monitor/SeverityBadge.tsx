import React from "react";
import { Chip } from "@mui/material";

const SEVERITY_COLORS: Record<string, { bg: string; color: string }> = {
  CRITICAL: { bg: "#7f1d1d", color: "#fca5a5" },
  HIGH:     { bg: "#7c2d12", color: "#fdba74" },
  MEDIUM:   { bg: "#713f12", color: "#fde047" },
  LOW:      { bg: "#1e3a5f", color: "#93c5fd" },
  UNKNOWN:  { bg: "#1e293b", color: "#94a3b8" },
};

interface Props {
  severity: string | null;
  size?: "small" | "medium";
}

const SeverityBadge: React.FC<Props> = ({ severity, size = "small" }) => {
  const key = (severity ?? "UNKNOWN").toUpperCase();
  const colors = SEVERITY_COLORS[key] ?? SEVERITY_COLORS.UNKNOWN;

  return (
    <Chip
      label={key}
      size={size}
      sx={{
        backgroundColor: colors.bg,
        color: colors.color,
        fontWeight: 700,
        fontSize: "0.68rem",
        height: 20,
        borderRadius: 1,
      }}
    />
  );
};

export default SeverityBadge;
