import React from "react";
import { Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { Assessment } from "@mui/icons-material";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/useAppSelector";
import { softSurfaceSx, surfaceSx } from "../../ui/surface";
import type { Kpi } from "../../types/risk-operations";

const ACCENT = "#8b5cf6";

interface KpiCardProps {
  kpiId: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ kpiId }) => {
  const navigate = useNavigate();
  const kpi = useAppSelector((state) => state.riskOperations.kpis.find((item) => item.id === kpiId));

  if (!kpi) {
    return (
      <Card sx={{ ...surfaceSx, height: "100%" }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">KPI no encontrado.</Typography>
        </CardContent>
      </Card>
    );
  }

  const status = kpiStatus(kpi);
  const measurementsAsc = [...(kpi.measurements ?? [])].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  const values = measurementsAsc.map((measurement) => measurement.value);
  const latest = values.length ? values[values.length - 1] : undefined;
  const previous = values.length > 1 ? values[values.length - 2] : undefined;
  const progress = latest == null || kpi.targetValue === 0 ? 0 : Math.min(100, Math.round((latest / kpi.targetValue) * 100));
  const trend = latest != null && previous != null ? latest - previous : null;
  const statusAccent = statusColor(status.color);

  return (
    <Card
      sx={{
        ...surfaceSx,
        height: "100%",
        borderLeft: `4px solid ${statusAccent}`,
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(15, 23, 42, 0.2) 42%), #0f172a",
      }}
    >
      <CardContent sx={{ height: "100%" }}>
        <Stack spacing={2} sx={{ height: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: "rgba(139, 92, 246, 0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Assessment sx={{ color: ACCENT, fontSize: 24 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2 }} noWrap>{kpi.name}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Meta {kpi.targetValue} {kpi.unit}
                </Typography>
              </Box>
            </Stack>
            <Chip size="small" sx={{ bgcolor: `${statusAccent}22`, color: statusAccent, fontWeight: 700 }} label={status.label} />
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.15fr) minmax(140px, 0.85fr)" }, gap: 1.5, alignItems: "stretch" }}>
            <Box sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Valor actual</Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1, color: "text.primary" }}>
                  {latest ?? "--"}
                </Typography>
                <Typography variant="body2" color="text.secondary">{kpi.unit}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 999, bgcolor: "rgba(148, 163, 184, 0.16)", "& .MuiLinearProgress-bar": { bgcolor: statusAccent, borderRadius: 999 } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                {progress}% del objetivo
              </Typography>
            </Box>

            <Box sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 2, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 120 }}>
              {values.length > 1 ? (
                <SparkLineChart data={values} height={48} colors={[statusAccent]} margin={{ top: 4, right: 4, bottom: 4, left: 4 }} />
              ) : (
                <Typography variant="caption" color="text.secondary">Necesita más mediciones para mostrar tendencia.</Typography>
              )}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <Chip size="small" variant="outlined" label={`${values.length} mediciones`} />
                <Chip size="small" variant="outlined" label={trend == null ? "Sin tendencia" : `${trend >= 0 ? "+" : ""}${trend} vs anterior`} />
              </Stack>
            </Box>
          </Box>

          <Button variant="contained" size="small" onClick={() => navigate(`/kpis/${kpi.id}`)} sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}>Ver mediciones</Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

function kpiStatus(kpi: Kpi): { color: "success" | "warning" | "error" | "default"; label: string } {
  const latest = [...(kpi.measurements ?? [])].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())[0];
  if (!latest) return { color: "default", label: "Sin datos" };
  const { value } = latest;
  const { targetValue, warningValue, direction } = kpi;
  if (direction === "HIGHER_IS_BETTER") {
    if (value >= targetValue) return { color: "success", label: "En meta" };
    if (warningValue != null && value >= warningValue) return { color: "warning", label: "Alerta" };
    return { color: "error", label: "Fuera de meta" };
  }
  if (value <= targetValue) return { color: "success", label: "En meta" };
  if (warningValue != null && value <= warningValue) return { color: "warning", label: "Alerta" };
  return { color: "error", label: "Fuera de meta" };
}

function statusColor(color: "success" | "warning" | "error" | "default") {
  if (color === "success") return "#22c55e";
  if (color === "warning") return "#f59e0b";
  if (color === "error") return "#ef4444";
  return ACCENT;
}

export default KpiCard;
