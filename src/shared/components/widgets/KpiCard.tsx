import React from "react";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
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

  return (
    <Card sx={{ ...surfaceSx, height: "100%", borderLeft: `3px solid ${ACCENT}` }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: "rgba(139, 92, 246, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Assessment sx={{ color: ACCENT, fontSize: 20 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }} noWrap>{kpi.name}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                  {latest != null ? `${latest} / ${kpi.targetValue} ${kpi.unit}` : `Meta ${kpi.targetValue} ${kpi.unit}`}
                </Typography>
              </Box>
            </Stack>
            <Chip size="small" color={status.color === "default" ? undefined : status.color} label={status.label} />
          </Stack>

          <Box sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 1.5 }}>
            {values.length ? (
              <SparkLineChart data={values} height={52} colors={[ACCENT]} />
            ) : (
              <Typography variant="caption" color="text.secondary">Sin mediciones</Typography>
            )}
          </Box>

          <Button size="small" onClick={() => navigate(`/kpis/${kpi.id}`)}>Ver mediciones</Button>
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

export default KpiCard;
