import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
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

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader icon={<Assessment />} title={`Mediciones — ${kpi.name}`} subtitle={`Meta ${kpi.targetValue} ${kpi.unit}`} actions={backButton} />
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <AppCard>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              {chartDataset.length ? (
                <LineChart
                  dataset={chartDataset}
                  xAxis={[{ scaleType: "band", dataKey: "measuredAt", valueFormatter: (value: string) => new Date(value).toLocaleDateString() }]}
                  series={[
                    { dataKey: "value", label: kpi.name, color: "#8b5cf6", showMark: true },
                    { dataKey: "target", label: "Meta", color: "#64748b", showMark: false },
                  ]}
                  height={220}
                  margin={{ left: 45, right: 15, top: 20, bottom: 45 }}
                  sx={{
                    "& .MuiChartsAxis-line": { stroke: "rgba(255,255,255,0.06)" },
                    "& .MuiChartsAxis-tick": { stroke: "rgba(255,255,255,0.06)" },
                    "& .MuiChartsGrid-line": { stroke: "rgba(255,255,255,0.04)" },
                    "& .MuiLineElement-root": { strokeWidth: 2 },
                    "& .MuiMarkElement-root": { stroke: "#8b5cf6", strokeWidth: 2, fill: "#0c1220" },
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">Sin mediciones registradas todavía.</Typography>
              )}
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

export default KpiDetailPage;
