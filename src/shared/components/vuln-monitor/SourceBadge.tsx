import React from "react";
import { Stack, Chip } from "@mui/material";

const SOURCE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  nvd:    { bg: "#1e3a5f", color: "#60a5fa", label: "NVD" },
  kev:    { bg: "#4a1942", color: "#e879f9", label: "KEV" },
  github: { bg: "#1a2f1a", color: "#4ade80", label: "GH" },
  osv:    { bg: "#1c2a3a", color: "#38bdf8", label: "OSV" },
};

interface Props {
  sources: string[];
}

const SourceBadge: React.FC<Props> = ({ sources }) => (
  <Stack direction="row" spacing={0.5} flexWrap="wrap">
    {sources.map((src) => {
      const style = SOURCE_STYLES[src] ?? { bg: "#1e293b", color: "#94a3b8", label: src.toUpperCase() };
      return (
        <Chip
          key={src}
          label={style.label}
          size="small"
          sx={{
            backgroundColor: style.bg,
            color: style.color,
            fontWeight: 700,
            fontSize: "0.62rem",
            height: 18,
            borderRadius: 0.75,
          }}
        />
      );
    })}
  </Stack>
);

export default SourceBadge;
