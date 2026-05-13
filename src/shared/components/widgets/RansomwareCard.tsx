import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { TrendingUp, OpenInNew, Warning } from "@mui/icons-material";
import { useAppSelector } from "../../hooks/useAppSelector";

// Accent color for Ransomware module — muted red
const ACCENT = "#c94c4c";
const ACCENT_BG = "rgba(201, 76, 76, 0.1)";
const ACCENT_BORDER = "rgba(201, 76, 76, 0.2)";

interface RansomwareCardProps {
  onExpand: () => void;
}

const RansomwareCard: React.FC<RansomwareCardProps> = ({ onExpand }) => {
  const { stats, loading } = useAppSelector((state) => state.ransomware);

  if (loading && !stats) {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderLeft: `3px solid ${ACCENT_BORDER}`,
        }}
      >
        <CircularProgress size={28} sx={{ color: ACCENT }} />
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card
      sx={{
        height: "100%",
        cursor: "pointer",
        borderLeft: `3px solid ${ACCENT}`,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderLeftColor: "#e06060",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
        },
      }}
      onClick={onExpand}
    >
      <CardContent>
        <Stack spacing={2.5}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: ACCENT_BG,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Warning sx={{ color: ACCENT, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
                  Ransomware
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                  Threat Module
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": { color: ACCENT, bgcolor: ACCENT_BG },
              }}
            >
              <OpenInNew sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          {/* Primary metrics */}
          <Stack direction="row" spacing={1.5}>
            <Box
              flex={1}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, fontSize: "0.67rem" }}
              >
                Grupos activos
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: ACCENT, lineHeight: 1.1, mt: 0.5 }}
              >
                {stats.overview.totalGroups}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                monitoreados
              </Typography>
            </Box>
            <Box
              flex={1}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, fontSize: "0.67rem" }}
              >
                Víctimas
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#c9872a", lineHeight: 1.1, mt: 0.5 }}
              >
                {stats.overview.totalVictims.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                afectadas
              </Typography>
            </Box>
          </Stack>

          {/* Recent activity */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, fontSize: "0.67rem" }}
              >
                Incidentes recientes
              </Typography>
              <Chip
                icon={<TrendingUp sx={{ fontSize: "12px !important" }} />}
                label={(stats.recentActivity || []).length}
                size="small"
                sx={{
                  bgcolor: ACCENT_BG,
                  color: "#f87171",
                  border: `1px solid ${ACCENT_BORDER}`,
                  fontSize: "0.68rem",
                  height: 20,
                }}
              />
            </Stack>
            <Box sx={{ maxHeight: 110, overflow: "auto" }}>
              {(stats.recentActivity || []).slice(0, 5).map((incident, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    py: 0.6,
                    px: 1,
                    borderRadius: 1,
                    mb: 0.25,
                    bgcolor: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      color: "text.primary",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {incident.victim}
                  </Typography>
                  <Chip
                    label={incident.group}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.65rem",
                      bgcolor: ACCENT_BG,
                      color: "#fca5a5",
                      border: `1px solid ${ACCENT_BORDER}`,
                      flexShrink: 0,
                    }}
                  />
                </Stack>
              ))}
            </Box>
          </Box>

          {/* Footer */}
          <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#2d9e6b", flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                {stats.attacksByCountry?.length || 0} países
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
              {stats.recentActivity?.length || 0} incidentes
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default RansomwareCard;
