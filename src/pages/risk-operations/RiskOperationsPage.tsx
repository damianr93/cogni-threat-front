import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Add, Assessment, Close, Edit, FactCheck, Inventory, Link as LinkIcon, Security, Speed } from "@mui/icons-material";
import PageHeader from "../../shared/components/PageHeader";
import { useAppDispatch } from "../../shared/hooks/useAppDispatch";
import { useAppSelector } from "../../shared/hooks/useAppSelector";
import {
  createKpiMeasurement,
  createRiskOperation,
  createTreatmentAction,
  fetchRiskOperations,
  updateRiskOperation,
} from "../../store/slices/riskOperations/riskOperationsSlice";
import {
  RISK_LEVEL_LABELS,
  RISK_STATUS_LABELS,
  TREATMENT_OPTION_LABELS,
  TREATMENT_STATUS_LABELS,
  type InformationAsset,
  type Kpi,
  type OperationalControl,
  type Risk,
  type RiskMatrixData,
  type RiskLevel,
  type RiskStatus,
  type RiskTreatment,
  type TreatmentOption,
  type TreatmentStatus,
} from "../../shared/types/risk-operations";
import { AppCard, MetricCard, softSurfaceSx, surfaceSx, uiTokens } from "../../shared/ui/surface";

type PageKind = "assets" | "risks" | "treatments" | "controls" | "kpis";

interface RiskOperationsData {
  assets: InformationAsset[];
  risks: Risk[];
  treatments: RiskTreatment[];
  controls: OperationalControl[];
  kpis: Kpi[];
}

interface RiskOperationsPageProps {
  kind: PageKind;
}

const pageMeta = {
  assets: { title: "Activos", subtitle: "Inventario de activos de información", icon: <Inventory /> },
  risks: { title: "Riesgos", subtitle: "Evaluación de probabilidad por impacto", icon: <Security /> },
  treatments: { title: "Tratamiento de riesgos", subtitle: "Planes, responsables y acciones", icon: <FactCheck /> },
  controls: { title: "Control operacional", subtitle: "Controles medibles vinculados a riesgos", icon: <Speed /> },
  kpis: { title: "KPIs", subtitle: "Indicadores, metas y mediciones", icon: <Assessment /> },
} satisfies Record<PageKind, { title: string; subtitle: string; icon: JSX.Element }>;

const riskLevels: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const riskStatuses: RiskStatus[] = ["IDENTIFIED", "ANALYZED", "TREATMENT_DEFINED", "TREATED", "ACCEPTED", "CLOSED"];
const treatmentOptions: TreatmentOption[] = ["MITIGATE", "ACCEPT", "TRANSFER", "AVOID"];
const treatmentStatuses: TreatmentStatus[] = ["PLANNED", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED"];

const initialForm: Record<string, string> = {
  code: "",
  name: "",
  type: "INFORMATION",
  criticality: "MEDIUM",
  confidentiality: "3",
  integrity: "3",
  availability: "3",
  ownerName: "",
  businessContext: "",
  tags: "",
  assetId: "",
  title: "",
  scenario: "",
  threat: "",
  vulnerability: "",
  likelihood: "3",
  impact: "3",
  status: "IDENTIFIED",
  riskId: "",
  strategy: "MITIGATE",
  plan: "",
  responsibleName: "",
  dueDate: "",
  residualLikelihood: "",
  residualImpact: "",
  category: "Preventivo",
  objective: "",
  implementation: "",
  monitoringFrequency: "Mensual",
  metricType: "NUMBER",
  unit: "%",
  frequency: "MONTHLY",
  targetValue: "90",
  warningValue: "75",
  direction: "HIGHER_IS_BETTER",
  description: "",
  controlId: "",
  measuredAt: new Date().toISOString().slice(0, 10),
  value: "",
  notes: "",
  evidenceUrl: "",
  evidenceNotes: "",
  treatmentId: "",
  kpiId: "",
};

const RiskOperationsPage = ({ kind }: RiskOperationsPageProps) => {
  const dispatch = useAppDispatch();
  const { assets, risks, treatments, controls, kpis, criteria, matrix, loading, saving, error } = useAppSelector((state) => state.riskOperations);
  const [form, setForm] = useState(initialForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [riskView, setRiskView] = useState<"list" | "matrix">("list");

  useEffect(() => {
    dispatch(fetchRiskOperations());
  }, [dispatch]);

  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const save = async () => {
    const payload = buildPayload(kind, form);
    if (editingId) {
      await dispatch(updateRiskOperation({ resource: kind, id: editingId, payload })).unwrap();
    } else {
      await dispatch(createRiskOperation({ resource: kind, payload })).unwrap();
    }
    setForm((current) => ({ ...initialForm, assetId: current.assetId, riskId: current.riskId, treatmentId: current.treatmentId }));
    setEditingId(null);
    setCreateOpen(false);
    await dispatch(fetchRiskOperations());
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setCreateOpen(true);
  };

  const openEdit = (row: InformationAsset | Risk | RiskTreatment | OperationalControl | Kpi) => {
    setEditingId(row.id);
    setForm((current) => ({ ...current, ...formFromRow(kind, row) }));
    setCreateOpen(true);
  };

  const saveAction = async () => {
    if (!form.treatmentId) return;
    await dispatch(createTreatmentAction({ treatmentId: form.treatmentId, payload: buildActionPayload(form) })).unwrap();
    setActionOpen(false);
    await dispatch(fetchRiskOperations());
  };

  const saveMeasurement = async () => {
    if (!form.kpiId) return;
    await dispatch(createKpiMeasurement({ kpiId: form.kpiId, payload: buildMeasurementPayload(form) })).unwrap();
    setMeasurementOpen(false);
    await dispatch(fetchRiskOperations());
  };

  const meta = pageMeta[kind];
  const data = { assets, risks, treatments, controls, kpis };

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={meta.icon}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <Stack direction="row" spacing={1}>
            {kind === "treatments" ? (
              <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => setActionOpen(true)}>
                Acción
              </Button>
            ) : null}
            {kind === "kpis" ? (
              <Button variant="outlined" startIcon={<Assessment />} onClick={() => setMeasurementOpen(true)}>
                Medición
              </Button>
            ) : null}
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              Crear
            </Button>
          </Stack>
        }
      />

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {loading ? <CircularProgress sx={{ mb: 2 }} /> : null}

      <SummaryCards kind={kind} data={data} />
      {kind === "risks" ? (
        <RiskViewSwitcher value={riskView} onChange={setRiskView} />
      ) : null}
      {kind === "risks" && riskView === "matrix" && matrix ? (
        <RiskMatrixWidget matrix={matrix} threshold={criteria?.acceptanceThreshold ?? matrix.acceptanceThreshold} />
      ) : (
        renderTable(kind, data, openEdit)
      )}

      {kind === "treatments" ? (
        <FormDrawer title="Agregar acción" open={actionOpen} onClose={() => setActionOpen(false)} saving={saving} onSave={saveAction} saveLabel="Agregar acción">
          <EvidenceHint />
          <Box sx={formGridSx}>
            {field("treatmentId", "Tratamiento", form, update, treatments.map((item) => ({ value: item.id, label: item.risk?.title ?? item.id })))}
            {field("title", "Acción", form, update)}
            {field("ownerName", "Responsable", form, update)}
            {field("dueDate", "Vencimiento", form, update, undefined, "date")}
            {field("evidenceUrl", "URL de evidencia", form, update)}
            {field("evidenceNotes", "Notas de evidencia", form, update)}
          </Box>
        </FormDrawer>
      ) : null}

      {kind === "kpis" ? (
        <FormDrawer title="Registrar medición" open={measurementOpen} onClose={() => setMeasurementOpen(false)} saving={saving} onSave={saveMeasurement} saveLabel="Registrar medición">
          <EvidenceHint />
          <Box sx={formGridSx}>
            {field("kpiId", "KPI", form, update, kpis.map((item) => ({ value: item.id, label: item.name })))}
            {field("measuredAt", "Fecha", form, update, undefined, "date")}
            {field("value", "Valor", form, update, undefined, "number")}
            {field("evidenceUrl", "URL de evidencia", form, update)}
            {field("notes", "Notas", form, update)}
          </Box>
        </FormDrawer>
      ) : null}

      <FormDrawer title={`${editingId ? "Editar" : "Crear"} ${meta.title.toLowerCase()}`} open={createOpen} onClose={() => setCreateOpen(false)} saving={saving} onSave={save}>
        <Box sx={formGridSx}>{renderForm(kind, form, update, { assets, risks, treatments, controls })}</Box>
      </FormDrawer>
    </Box>
  );
};

const formGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
  gap: 2,
};

const FormDrawer = ({
  title,
  open,
  saving,
  children,
  onClose,
  onSave,
  saveLabel = "Guardar",
}: {
  title: string;
  open: boolean;
  saving: boolean;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
}) => (
  <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, bgcolor: "#0c1220" } }}>
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">Completá solo lo necesario y guardá sin salir de la lista.</Typography>
        </Box>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>{children}</Box>
      <Divider />
      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={saving} onClick={onSave}>{saving ? "Guardando..." : saveLabel}</Button>
      </Stack>
    </Box>
  </Drawer>
);

const EvidenceHint = () => (
  <Alert severity="info" sx={{ mb: 2 }}>
    La evidencia se registra por URL. No hay carga de archivos porque esta app no tiene storage/S3 configurado.
  </Alert>
);

const SummaryCards = ({ kind, data }: { kind: PageKind; data: RiskOperationsData }) => {
  const cards = getSummaryCards(kind, data);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
      {cards.map((card) => (
        <MetricCard key={card.label} label={card.label} value={card.value} helper={card.helper} accent={card.accent} />
      ))}
    </Box>
  );
};

const RiskViewSwitcher = ({ value, onChange }: { value: "list" | "matrix"; onChange: (value: "list" | "matrix") => void }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
    <Box>
      <Typography variant="body2" color="text.secondary">
        Alterná entre operación diaria y lectura ejecutiva de criticidad.
      </Typography>
    </Box>
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, next) => next && onChange(next)}
      sx={{
        ...surfaceSx,
      }}
    >
      <ToggleButton value="list">Listado</ToggleButton>
      <ToggleButton value="matrix">Matriz</ToggleButton>
    </ToggleButtonGroup>
  </Stack>
);

const RiskMatrixWidget = ({ matrix, threshold }: { matrix: RiskMatrixData; threshold: number }) => {
  const size = matrix.matrixSize;
  const impacts = Array.from({ length: size }, (_, index) => size - index);
  const probabilities = Array.from({ length: size }, (_, index) => index + 1);
  const cells = new Map<string, RiskMatrixData["cells"][number]>(matrix.cells.map((cell) => [`${cell.probability}-${cell.impact}`, cell]));
  const totalRisks = matrix.cells.reduce((total, cell) => total + cell.count, 0);
  const unacceptable = matrix.cells.reduce((total, cell) => total + (cell.probability * cell.impact > threshold ? cell.count : 0), 0);

  return (
    <AppCard sx={{ mb: 3, overflow: "hidden" }}>
      <CardContent>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={4}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800}>Widget de matriz de riesgos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Vista rápida de concentración de riesgos por probabilidad × impacto.
            </Typography>
            <Box sx={{ overflowX: "auto", pb: 1 }}>
            <Box sx={{ display: "inline-grid", gridTemplateColumns: `28px repeat(${size}, 54px)`, gap: 0.75, alignItems: "center" }}>
              {impacts.map((impact) => [
                <Typography key={`impact-${impact}`} variant="caption" color="text.secondary" textAlign="center">{impact}</Typography>,
                ...probabilities.map((probability) => {
                  const score = probability * impact;
                  const cell = cells.get(`${probability}-${impact}`);
                  const count = cell?.count ?? 0;
                  return (
                    <Box key={`${probability}-${impact}`} title={`P${probability} × I${impact} = ${score}`} sx={{ height: 50, borderRadius: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#020617", fontWeight: 800, backgroundColor: matrixColor(score, threshold), opacity: count > 0 ? 1 : 0.38 }}>
                      <Typography variant="caption" sx={{ lineHeight: 1 }}>{score}</Typography>
                      {count > 0 ? <Typography variant="body2" fontWeight={900}>{count}</Typography> : null}
                    </Box>
                  );
                }),
              ])}
              <Box />
              {probabilities.map((probability) => <Typography key={probability} variant="caption" color="text.secondary" textAlign="center">{probability}</Typography>)}
            </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, ml: 4 }}>Probabilidad →</Typography>
          </Box>
          <Stack spacing={2} sx={{ minWidth: { xs: "auto", lg: 260 } }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
              <MatrixMetric label="Total" value={totalRisks} />
              <MatrixMetric label="No aceptables" value={unacceptable} />
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, ...softSurfaceSx }}>
              <Typography variant="caption" color="text.secondary">Umbral configurado</Typography>
              <Typography variant="h4" fontWeight={900}>{threshold}</Typography>
              <Typography variant="caption" color="text.secondary">Score mayor a {threshold} requiere tratamiento.</Typography>
            </Box>
            <MatrixLegend color="#22c55e" label="Aceptable" />
            <MatrixLegend color="#eab308" label="Revisar" />
            <MatrixLegend color="#f97316" label="Tratamiento recomendado" />
            <MatrixLegend color="#ef4444" label="No aceptable" />
          </Stack>
        </Stack>
      </CardContent>
    </AppCard>
  );
};

const MatrixMetric = ({ label, value }: { label: string; value: number }) => (
  <Box sx={{ p: 1.5, borderRadius: 2, ...softSurfaceSx }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" fontWeight={900}>{value}</Typography>
  </Box>
);

const MatrixLegend = ({ color, label }: { color: string; label: string }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: color }} />
    <Typography variant="body2" color="text.secondary">{label}</Typography>
  </Stack>
);

function matrixColor(score: number, threshold: number) {
  if (score > threshold + 6) return "#ef4444";
  if (score > threshold) return "#f97316";
  if (score >= Math.max(1, threshold - 4)) return "#eab308";
  return "#22c55e";
}

function getSummaryCards(kind: PageKind, data: RiskOperationsData) {
  if (kind === "assets") {
    return [
      { label: "Activos", value: data.assets.length, helper: "Total inventariado", accent: uiTokens.accent },
      { label: "Críticos", value: data.assets.filter((item) => item.criticality === "CRITICAL").length, helper: "Requieren máxima atención", accent: "#ef4444" },
      { label: "Activos", value: data.assets.filter((item) => item.isActive).length, helper: "En seguimiento", accent: "#22c55e" },
    ];
  }
  if (kind === "risks") {
    return [
      { label: "Riesgos", value: data.risks.length, helper: "Escenarios registrados", accent: uiTokens.accent },
      { label: "Altos/críticos", value: data.risks.filter((item) => item.inherentLevel === "HIGH" || item.inherentLevel === "CRITICAL").length, helper: "Priorización operativa", accent: "#f59e0b" },
      { label: "Tratados", value: data.risks.filter((item) => item.status === "TREATED" || item.status === "ACCEPTED" || item.status === "CLOSED").length, helper: "Con respuesta avanzada", accent: "#22c55e" },
    ];
  }
  if (kind === "treatments") {
    return [
      { label: "Planes", value: data.treatments.length, helper: "Tratamientos definidos", accent: uiTokens.accent },
      { label: "Acciones", value: data.treatments.reduce((total, item) => total + (item.actions?.length ?? 0), 0), helper: "Con responsables/evidencia", accent: "#8b5cf6" },
      { label: "Verificados", value: data.treatments.filter((item) => item.status === "VERIFIED").length, helper: "Cerrados operativamente", accent: "#22c55e" },
    ];
  }
  if (kind === "controls") {
    return [
      { label: "Controles", value: data.controls.length, helper: "Controles operacionales", accent: uiTokens.accent },
      { label: "Activos", value: data.controls.filter((item) => item.status === "ACTIVE" || item.status === "MONITORING").length, helper: "En monitoreo", accent: "#22c55e" },
      { label: "Atención", value: data.controls.filter((item) => item.status === "NEEDS_ATTENTION").length, helper: "Con desvíos", accent: "#ef4444" },
    ];
  }
  return [
    { label: "KPIs", value: data.kpis.length, helper: "Indicadores definidos", accent: uiTokens.accent },
    { label: "Mediciones", value: data.kpis.reduce((total, item) => total + (item.measurements?.length ?? 0), 0), helper: "Historial registrado", accent: "#8b5cf6" },
    { label: "Sin datos", value: data.kpis.filter((item) => !item.measurements?.length).length, helper: "Necesitan primera medición", accent: "#f59e0b" },
  ];
}

function renderForm(kind: PageKind, form: Record<string, string>, update: (field: string, value: string) => void, data: Pick<RiskOperationsData, "assets" | "risks" | "treatments" | "controls">) {
  if (kind === "assets") {
    return <>{field("code", "Código", form, update)}{field("name", "Nombre", form, update)}{field("type", "Tipo", form, update)}{field("criticality", "Criticidad", form, update, riskLevels.map((level) => ({ value: level, label: RISK_LEVEL_LABELS[level] })))}{field("confidentiality", "Confidencialidad", form, update, undefined, "number")}{field("integrity", "Integridad", form, update, undefined, "number")}{field("availability", "Disponibilidad", form, update, undefined, "number")}{field("ownerName", "Responsable", form, update)}{field("businessContext", "Contexto", form, update)}{field("tags", "Tags separados por coma", form, update)}</>;
  }
  if (kind === "risks") {
    return <>{field("assetId", "Activo", form, update, data.assets.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })))}{field("title", "Título", form, update)}{field("scenario", "Escenario", form, update)}{field("threat", "Amenaza", form, update)}{field("vulnerability", "Vulnerabilidad", form, update)}{field("likelihood", "Probabilidad", form, update, undefined, "number")}{field("impact", "Impacto", form, update, undefined, "number")}{field("status", "Estado", form, update, riskStatuses.map((status) => ({ value: status, label: RISK_STATUS_LABELS[status] })))}{field("ownerName", "Responsable", form, update)}</>;
  }
  if (kind === "treatments") {
    return <>{field("riskId", "Riesgo", form, update, data.risks.map((item) => ({ value: item.id, label: item.title })))}{field("strategy", "Opción", form, update, treatmentOptions.map((option) => ({ value: option, label: TREATMENT_OPTION_LABELS[option] })))}{field("plan", "Plan", form, update)}{field("responsibleName", "Responsable", form, update)}{field("dueDate", "Vencimiento", form, update, undefined, "date")}{field("residualLikelihood", "Probabilidad residual", form, update, undefined, "number")}{field("residualImpact", "Impacto residual", form, update, undefined, "number")}{field("status", "Estado", form, update, treatmentStatuses.map((status) => ({ value: status, label: TREATMENT_STATUS_LABELS[status] })))}</>;
  }
  if (kind === "controls") {
    return <>{field("title", "Título", form, update)}{field("category", "Categoría", form, update)}{field("type", "Tipo", form, update)}{field("objective", "Objetivo", form, update)}{field("implementation", "Implementación", form, update)}{field("monitoringFrequency", "Frecuencia", form, update)}{field("ownerName", "Responsable", form, update)}</>;
  }
  return <>{field("name", "Nombre", form, update)}{field("description", "Descripción", form, update)}{field("metricType", "Tipo", form, update, ["NUMBER", "PERCENTAGE", "RATIO", "INDEX"].map((value) => ({ value, label: value })))}{field("unit", "Unidad", form, update)}{field("frequency", "Frecuencia", form, update, ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"].map((value) => ({ value, label: value })))}{field("targetValue", "Meta", form, update, undefined, "number")}{field("warningValue", "Umbral", form, update, undefined, "number")}{field("direction", "Dirección", form, update, [{ value: "HIGHER_IS_BETTER", label: "Mayor es mejor" }, { value: "LOWER_IS_BETTER", label: "Menor es mejor" }])}{field("assetId", "Activo vinculado", form, update, [{ value: "", label: "Sin activo" }, ...data.assets.map((item) => ({ value: item.id, label: item.name }))])}{field("riskId", "Riesgo vinculado", form, update, [{ value: "", label: "Sin riesgo" }, ...data.risks.map((item) => ({ value: item.id, label: item.title }))])}{field("controlId", "Control vinculado", form, update, [{ value: "", label: "Sin control" }, ...data.controls.map((item) => ({ value: item.id, label: item.title }))])}</>;
}

function field(name: string, label: string, form: Record<string, string>, update: (field: string, value: string) => void, options?: Array<{ value: string; label: string }>, type = "text") {
  return (
    <Box key={name}>
      <TextField fullWidth size="small" select={Boolean(options)} type={type} label={label} value={form[name] ?? ""} onChange={(event) => update(name, event.target.value)} InputLabelProps={type === "date" ? { shrink: true } : undefined}>
        {options?.map((option) => <MenuItem key={option.value || "empty"} value={option.value}>{option.label}</MenuItem>)}
      </TextField>
    </Box>
  );
}

function renderTable(kind: PageKind, data: RiskOperationsData, onEdit: (row: InformationAsset | Risk | RiskTreatment | OperationalControl | Kpi) => void) {
  const rows = data[kind];
  return (
    <TableContainer component={Paper} sx={surfaceSx}>
      <Table size="small">
        <TableHead><TableRow>{[...tableHeaders(kind), ""].map((header) => <TableCell key={header}>{header}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              {tableCells(kind, row).map((cell, index) => <TableCell key={`${row.id}-${index}`}>{cell}</TableCell>)}
              <TableCell align="right">
                <Button size="small" startIcon={<Edit />} onClick={() => onEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!rows.length ? <TableRow><TableCell colSpan={6}><Typography color="text.secondary">Sin datos todavía. Usá “Crear” para cargar el primer registro.</Typography></TableCell></TableRow> : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function tableHeaders(kind: PageKind) {
  if (kind === "assets") return ["Código", "Nombre", "Tipo", "Criticidad", "CIA"];
  if (kind === "risks") return ["Riesgo", "Activo", "Nivel", "Score", "Estado"];
  if (kind === "treatments") return ["Riesgo", "Opción", "Estado", "Residual", "Acciones"];
  if (kind === "controls") return ["Control", "Categoría", "Frecuencia", "Estado", "Vínculos"];
  return ["KPI", "Meta", "Última medición", "Frecuencia", "Evidencia"];
}

function tableCells(kind: PageKind, row: InformationAsset | Risk | RiskTreatment | OperationalControl | Kpi) {
  if (kind === "assets") {
    const asset = row as InformationAsset;
    return [asset.code, asset.name, asset.type, <Chip size="small" label={RISK_LEVEL_LABELS[asset.criticality]} />, `${asset.confidentiality}/${asset.integrity}/${asset.availability}`];
  }
  if (kind === "risks") {
    const risk = row as Risk;
    return [risk.title, risk.asset?.name ?? "-", <Chip size="small" label={RISK_LEVEL_LABELS[risk.inherentLevel]} />, risk.inherentScore, RISK_STATUS_LABELS[risk.status]];
  }
  if (kind === "treatments") {
    const treatment = row as RiskTreatment;
    return [treatment.risk?.title ?? "-", TREATMENT_OPTION_LABELS[treatment.strategy], TREATMENT_STATUS_LABELS[treatment.status], treatment.residualScore ?? "-", treatment.actions?.length ?? 0];
  }
  if (kind === "controls") {
    const control = row as OperationalControl;
    return [control.title, control.category, control.monitoringFrequency ?? "-", control.status, `${control.risks?.length ?? 0} riesgos`];
  }
  const kpi = row as Kpi;
  const latest = kpi.measurements?.[0];
  return [kpi.name, `${kpi.targetValue} ${kpi.unit}`, latest ? `${latest.value} · ${new Date(latest.measuredAt).toLocaleDateString()}` : "Sin mediciones", kpi.frequency, latest?.evidenceUrl ? <a href={latest.evidenceUrl} target="_blank" rel="noreferrer">Ver URL</a> : "-"];
}

function buildPayload(kind: PageKind, form: Record<string, string>): Record<string, unknown> {
  if (kind === "assets") return { code: form.code, name: form.name, type: form.type, criticality: form.criticality, confidentiality: Number(form.confidentiality), integrity: Number(form.integrity), availability: Number(form.availability), ownerName: form.ownerName, businessContext: form.businessContext, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
  if (kind === "risks") return { assetId: form.assetId, title: form.title, scenario: form.scenario, threat: form.threat, vulnerability: form.vulnerability, affectedCia: ["C", "I", "A"], likelihood: Number(form.likelihood), impact: Number(form.impact), status: form.status, ownerName: form.ownerName };
  if (kind === "treatments") return { riskId: form.riskId, strategy: form.strategy, plan: form.plan, responsibleName: form.responsibleName, dueDate: form.dueDate || undefined, residualLikelihood: nullableNumber(form.residualLikelihood), residualImpact: nullableNumber(form.residualImpact), status: form.status };
  if (kind === "controls") return { title: form.title, category: form.category, type: form.type, objective: form.objective, implementation: form.implementation, monitoringFrequency: form.monitoringFrequency, ownerName: form.ownerName };
  return { name: form.name, description: form.description, metricType: form.metricType, unit: form.unit, frequency: form.frequency, targetValue: Number(form.targetValue), warningValue: nullableNumber(form.warningValue), direction: form.direction, assetId: form.assetId || undefined, riskId: form.riskId || undefined, controlId: form.controlId || undefined };
}

function formFromRow(kind: PageKind, row: InformationAsset | Risk | RiskTreatment | OperationalControl | Kpi): Record<string, string> {
  if (kind === "assets") {
    const asset = row as InformationAsset;
    return { code: asset.code, name: asset.name, type: asset.type, criticality: asset.criticality, confidentiality: String(asset.confidentiality), integrity: String(asset.integrity), availability: String(asset.availability), ownerName: asset.ownerName ?? "", businessContext: asset.businessContext ?? "", tags: asset.tags.join(", ") };
  }
  if (kind === "risks") {
    const risk = row as Risk;
    return { assetId: risk.assetId, title: risk.title, scenario: risk.scenario, threat: risk.threat, vulnerability: risk.vulnerability, likelihood: String(risk.likelihood), impact: String(risk.impact), status: risk.status, ownerName: risk.ownerName ?? "" };
  }
  if (kind === "treatments") {
    const treatment = row as RiskTreatment;
    return { riskId: treatment.riskId, strategy: treatment.strategy, plan: treatment.plan, responsibleName: treatment.responsibleName ?? "", dueDate: toDateInput(treatment.dueDate), residualLikelihood: treatment.residualLikelihood ? String(treatment.residualLikelihood) : "", residualImpact: treatment.residualImpact ? String(treatment.residualImpact) : "", status: treatment.status };
  }
  if (kind === "controls") {
    const control = row as OperationalControl;
    return { title: control.title, category: control.category, type: control.type, objective: control.objective, implementation: control.implementation ?? "", monitoringFrequency: control.monitoringFrequency ?? "", ownerName: control.ownerName ?? "" };
  }
  const kpi = row as Kpi;
  return { name: kpi.name, description: kpi.description ?? "", metricType: kpi.metricType, unit: kpi.unit, frequency: kpi.frequency, targetValue: String(kpi.targetValue), warningValue: kpi.warningValue ? String(kpi.warningValue) : "", direction: kpi.direction, assetId: kpi.assetId ?? "", riskId: kpi.riskId ?? "", controlId: kpi.controlId ?? "" };
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function buildActionPayload(form: Record<string, string>) {
  return { title: form.title, ownerName: form.ownerName, dueDate: form.dueDate || undefined, evidenceUrl: form.evidenceUrl || undefined, evidenceNotes: form.evidenceNotes || undefined };
}

function buildMeasurementPayload(form: Record<string, string>) {
  return { measuredAt: form.measuredAt, value: Number(form.value), notes: form.notes || undefined, evidenceUrl: form.evidenceUrl || undefined };
}

function nullableNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

export default RiskOperationsPage;
