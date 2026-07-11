import React, { useEffect } from "react";
import { Box, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Assessment, OpenInNew } from "@mui/icons-material";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { fetchRiskOperations } from "../../../store/slices/riskOperations/riskOperationsSlice";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { softSurfaceSx, surfaceSx } from "../../ui/surface";
import type { Kpi } from "../../types/risk-operations";

const ACCENT = "#8b5cf6";

interface KpiOperationsCardProps {
  onExpand?: () => void;
}

const KpiOperationsCard: React.FC<KpiOperationsCardProps> = ({ onExpand }) => {
  const dispatch = useAppDispatch();
  const { kpis, loading, error } = useAppSelector((state) => state.riskOperations);

  useEffect(() => {
    if (!loading && kpis.length === 0) {
      dispatch(fetchRiskOperations());
    }
  }, [dispatch, loading, kpis.length]);

  const totalKpis = kpis.length;
  const outOfTarget = kpis.filter((kpi) => isOutOfTarget(kpi)).length;
  const topKpis = [...kpis]
    .sort((a, b) => (b.measurements?.length ?? 0) - (a.measurements?.length ?? 0))
    .slice(0, 2);

  if (loading && kpis.length === 0) {
    return (
      <Card sx={{ ...surfaceSx, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} sx={{ color: ACCENT }} />
      </Card>
    );
  }

  return (
    <Card
      sx={{
        ...surfaceSx,
        height: "100%",
        cursor: onExpand ? "pointer" : "default",
        borderLeft: `3px solid ${ACCENT}`,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": onExpand
          ? { borderLeftColor: "#a78bfa", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)" }
          : undefined,
      }}
      onClick={onExpand}
    >
      <CardContent>
        <Stack spacing={2.5}>
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
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
                  KPIs
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                  Indicadores y mediciones
                </Typography>
              </Box>
            </Stack>
            <OpenInNew sx={{ color: "text.secondary", fontSize: 18 }} />
          </Stack>

          {error ? (
            <Box sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="body2" color="error.main">
                No se pudieron cargar los KPIs.
              </Typography>
            </Box>
          ) : (
            <>
              <Stack direction="row" spacing={1.5}>
                <MetricBox label="KPIs" value={totalKpis} helper="definidos" icon={<Assessment />} color={ACCENT} />
                <MetricBox label="Fuera de meta" value={outOfTarget} helper="requieren atención" icon={<Assessment />} color="#ef4444" />
              </Stack>

              <Stack spacing={1.5}>
                {topKpis.map((kpi) => {
                  const status = kpiStatus(kpi);
                  const values = [...kpi.measurements]
                    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
                    .map((measurement) => measurement.value);
                  return (
                    <Box key={kpi.id} sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }} noWrap>
                          {kpi.name}
                        </Typography>
                        <Chip size="small" color={status.color === "default" ? undefined : status.color} label={status.label} />
                      </Stack>
                      {values.length > 0 ? (
                        <SparkLineChart data={values} height={44} colors={[ACCENT]} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">Sin mediciones</Typography>
                      )}
                    </Box>
                  );
                })}
                {!topKpis.length ? (
                  <Typography variant="caption" color="text.secondary">Sin KPIs definidos todavía.</Typography>
                ) : null}
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

function isOutOfTarget(kpi: Kpi) {
  return kpiStatus(kpi).color === "error";
}

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

function MetricBox({ label, value, helper, icon, color }: { label: string; value: number; helper: string; icon: React.ReactNode; color: string }) {
  return (
    <Box flex={1} sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, fontSize: "0.67rem" }}>
          {label}
        </Typography>
        <Box sx={{ color, display: "flex", "& svg": { fontSize: 16 } }}>{icon}</Box>
      </Stack>
      <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
        {helper}
      </Typography>
    </Box>
  );
}

export default KpiOperationsCard;
