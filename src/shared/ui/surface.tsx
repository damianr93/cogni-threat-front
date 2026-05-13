import type { ReactNode } from "react";
import { Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export const uiTokens = {
  surface: "rgba(15, 23, 42, 0.78)",
  surfaceSoft: "rgba(30, 41, 59, 0.72)",
  border: "rgba(148, 163, 184, 0.16)",
  borderMuted: "rgba(255, 255, 255, 0.06)",
  muted: "#64748b",
  textSoft: "#94a3b8",
  accent: "#4a90d9",
} as const;

export const surfaceSx: SxProps<Theme> = {
  backgroundColor: uiTokens.surface,
  border: `1px solid ${uiTokens.border}`,
  backgroundImage: "none",
};

export const softSurfaceSx: SxProps<Theme> = {
  backgroundColor: uiTokens.surfaceSoft,
  border: `1px solid ${uiTokens.borderMuted}`,
  backgroundImage: "none",
};

export function AppCard({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return <Card sx={{ ...surfaceSx, ...(sx as object) }}>{children}</Card>;
}

export function MetricCard({
  label,
  value,
  helper,
  accent = uiTokens.accent,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  accent?: string;
}) {
  return (
    <AppCard sx={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.16)}, ${uiTokens.surface})` }}>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="caption" sx={{ color: uiTokens.textSoft, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800 }}>
          {value}
        </Typography>
        {helper ? (
          <Typography variant="body2" sx={{ mt: 0.5, color: uiTokens.muted }}>
            {helper}
          </Typography>
        ) : null}
      </CardContent>
    </AppCard>
  );
}

export function StateMessage({
  title,
  description,
  loading = false,
}: {
  title: string;
  description?: ReactNode;
  loading?: boolean;
}) {
  return (
    <Box sx={{ py: 6, px: 2, textAlign: "center", color: "text.secondary" }}>
      <Stack spacing={1.5} alignItems="center">
        {loading ? <CircularProgress size={28} /> : null}
        <Typography variant="subtitle2" color="text.primary" fontWeight={700}>
          {title}
        </Typography>
        {description ? <Typography variant="body2">{description}</Typography> : null}
      </Stack>
    </Box>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
