import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack, Assessment } from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import PageHeader from "../../shared/components/PageHeader";
import { useAppDispatch } from "../../shared/hooks/useAppDispatch";
import { useAppSelector } from "../../shared/hooks/useAppSelector";
import { createKpiMeasurement, fetchRiskOperations } from "../../store/slices/riskOperations/riskOperationsSlice";
import { AppCard, surfaceSx } from "../../shared/ui/surface";
import type { Kpi } from "../../shared/types/risk-operations";

const wrapTextSx = { minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" } as const;

const formGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" },
  gap: 2,
  minWidth: 0,
};

const initialMeasurementForm = { measuredAt: new Date().toISOString().slice(0, 10), value: "", notes: "", evidenceUrl: "" };

const KpiDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { kpis, saving, loading } = useAppSelector((state) => state.riskOperations);

  const [form, setForm] = useState(initialMeasurementForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (kpis.length === 0) dispatch(fetchRiskOperations());
  }, [dispatch, kpis.length]);

  const kpi = kpis.find((item) => item.id === id);

  const updateField = (field: keyof typeof initialMeasurementForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async () => {
    if (!kpi || !form.value) return;
    setSubmitting(true);
    try {
      await dispatch(
        createKpiMeasurement({
          kpiId: kpi.id,
          payload: {
            measuredAt: form.measuredAt,
            value: Number(form.value),
            notes: form.notes || undefined,
            evidenceUrl: form.evidenceUrl || undefined,
          },
        }),
      ).unwrap();
      await dispatch(fetchRiskOperations());
      setForm((current) => ({ ...initialMeasurementForm, measuredAt: current.measuredAt }));
    } finally {
      setSubmitting(false);
    }
  };

  const backButton = (
    <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/kpis")}>
      Volver
    </Button>
  );

  if (!kpi) {
    return (
      <Box sx={{ minHeight: "100vh", pb: 4 }}>
        <PageHeader icon={<Assessment />} title="KPI" subtitle="Mediciones del indicador" actions={backButton} />
        <Container maxWidth="xl">
          {!loading ? (
            <Typography variant="body2" color="text.secondary">KPI no encontrado.</Typography>
          ) : null}
        </Container>
      </Box>
    );
  }

  const measurementsAsc = sortMeasurementsAsc(kpi.measurements);
  const measurementsDesc = sortMeasurementsDesc(kpi.measurements);
  const chartDataset = measurementsAsc.map((measurement) => ({ ...measurement, target: kpi.targetValue }));
  const latest = measurementsAsc.at(-1);
  const previous = measurementsAsc.length > 1 ? measurementsAsc.at(-2) : undefined;
  const trend = latest && previous ? latest.value - previous.value : null;
  const progress = latest && kpi.targetValue !== 0 ? Math.min(100, Math.round((latest.value / kpi.targetValue) * 100)) : 0;
  const status = latest ? kpiStatus(kpi, latest.value) : { color: "default" as const, label: "Sin datos" };
  const statusAccent = statusColor(status.color);

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader icon={<Assessment />} title={`Mediciones — ${kpi.name}`} subtitle={`Meta ${kpi.targetValue} ${kpi.unit}`} actions={backButton} />
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <AppCard>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }} spacing={2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" color="text.secondary">Evolución del indicador</Typography>
                    <Typography variant="h5" fontWeight={900} sx={wrapTextSx}>{kpi.name}</Typography>
                  </Box>
                  <Chip size="small" sx={{ bgcolor: `${statusAccent}22`, color: statusAccent, fontWeight: 800, alignSelf: { xs: "flex-start", md: "center" } }} label={status.label} />
                </Stack>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
                  <KpiMetric label="Valor actual" value={latest ? `${latest.value} ${kpi.unit}` : "--"} helper={latest ? new Date(latest.measuredAt).toLocaleDateString() : "Sin mediciones"} accent={statusAccent} />
                  <KpiMetric label="Meta" value={`${kpi.targetValue} ${kpi.unit}`} helper={`${progress}% del objetivo`} accent="#8b5cf6" progress={progress} />
                  <KpiMetric label="Tendencia" value={trend == null ? "--" : `${trend >= 0 ? "+" : ""}${trend}`} helper="vs medición anterior" accent={trend == null ? "#64748b" : trend >= 0 ? "#22c55e" : "#ef4444"} />
                  <KpiMetric label="Mediciones" value={String(measurementsAsc.length)} helper="registros cargados" accent="#38bdf8" />
                </Box>

              {chartDataset.length ? (
                <Box sx={{ borderRadius: 2, border: "1px solid rgba(148, 163, 184, 0.14)", bgcolor: "rgba(15, 23, 42, 0.42)", p: { xs: 1, sm: 1.5 }, overflowX: "auto" }}>
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ px: 1, pt: 0.5, mb: 1 }}>
                    <LegendDot color="#8b5cf6" label="Valor medido" />
                    <LegendDot color="#64748b" label="Meta" />
                  </Stack>
                  <LineChart
                    dataset={chartDataset}
                    xAxis={[{ scaleType: "band", dataKey: "measuredAt", valueFormatter: (value: string) => new Date(value).toLocaleDateString() }]}
                    series={[
                      { dataKey: "value", color: "#8b5cf6", showMark: true },
                      { dataKey: "target", color: "#64748b", showMark: false },
                    ]}
                    height={280}
                    margin={{ left: 45, right: 18, top: 20, bottom: 42 }}
                    sx={{
                      minWidth: { xs: 640, md: "auto" },
                      "& .MuiChartsAxis-line": { stroke: "rgba(255,255,255,0.08)" },
                      "& .MuiChartsAxis-tick": { stroke: "rgba(255,255,255,0.08)" },
                      "& .MuiChartsGrid-line": { stroke: "rgba(255,255,255,0.05)" },
                      "& .MuiLineElement-root": { strokeWidth: 3 },
                      "& .MuiMarkElement-root": { stroke: "#8b5cf6", strokeWidth: 2, fill: "#0c1220" },
                    }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin mediciones registradas todavía.</Typography>
              )}
              </Stack>
            </Box>
          </AppCard>

          <AppCard>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Cargar medición</Typography>
              <Box sx={formGridSx}>
                <TextField fullWidth size="small" type="date" label="Fecha" value={form.measuredAt} onChange={(event) => updateField("measuredAt", event.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField fullWidth size="small" type="number" label="Valor" value={form.value} onChange={(event) => updateField("value", event.target.value)} />
                <TextField fullWidth size="small" label="Notas" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
                <TextField fullWidth size="small" label="URL de evidencia" value={form.evidenceUrl} onChange={(event) => updateField("evidenceUrl", event.target.value)} />
              </Box>
              <Button variant="contained" sx={{ mt: 2 }} disabled={saving || submitting} onClick={submit}>
                {saving || submitting ? "Guardando..." : "Registrar medición"}
              </Button>
            </Box>
          </AppCard>

          <TableContainer component={Paper} sx={{ ...surfaceSx, maxWidth: "100%", overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Notas</TableCell>
                  <TableCell>Evidencia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measurementsDesc.map((measurement) => (
                  <TableRow key={measurement.id} hover>
                    <TableCell>{new Date(measurement.measuredAt).toLocaleDateString()}</TableCell>
                    <TableCell>{measurement.value}</TableCell>
                    <TableCell sx={wrapTextSx}>{truncate(measurement.notes)}</TableCell>
                    <TableCell>
                      {measurement.evidenceUrl ? <a href={measurement.evidenceUrl} target="_blank" rel="noreferrer">Ver URL</a> : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {!measurementsDesc.length ? (
                  <TableRow><TableCell colSpan={4}><Typography color="text.secondary">Sin mediciones todavía.</Typography></TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Container>
    </Box>
  );
};

function truncate(value?: string | null, maxLength = 60) {
  if (!value) return "-";
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function sortMeasurementsAsc(measurements: Kpi["measurements"] | undefined) {
  return [...(measurements ?? [])].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
}

function sortMeasurementsDesc(measurements: Kpi["measurements"] | undefined) {
  return [...(measurements ?? [])].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
}

function kpiStatus(kpi: Kpi, value: number): { color: "success" | "warning" | "error" | "default"; label: string } {
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
  return "#8b5cf6";
}

function KpiMetric({ label, value, helper, accent, progress }: { label: string; value: string; helper: string; accent: string; progress?: number }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(148, 163, 184, 0.14)", bgcolor: "rgba(15, 23, 42, 0.42)", minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h5" sx={{ color: accent, fontWeight: 900, mt: 0.5, ...wrapTextSx }}>{value}</Typography>
      {progress != null ? <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 999, my: 0.75, bgcolor: "rgba(148, 163, 184, 0.16)", "& .MuiLinearProgress-bar": { bgcolor: accent, borderRadius: 999 } }} /> : null}
      <Typography variant="caption" color="text.secondary" sx={wrapTextSx}>{helper}</Typography>
    </Box>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
      <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
    </Stack>
  );
}

export default KpiDetailPage;
