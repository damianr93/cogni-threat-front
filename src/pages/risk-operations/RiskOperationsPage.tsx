import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { Add, Assessment, Close, Edit, FactCheck, Inventory, Security, Speed, Timeline } from "@mui/icons-material";
import PageHeader from "../../shared/components/PageHeader";
import { api } from "../../shared/utils/api";
import { useAppDispatch } from "../../shared/hooks/useAppDispatch";
import { useAppSelector } from "../../shared/hooks/useAppSelector";
import {
  createRiskOperation,
  createTreatmentAction,
  fetchRiskOperations,
  updateRiskOperation,
} from "../../store/slices/riskOperations/riskOperationsSlice";
import type { AppDispatch } from "../../store/store";
import {
  RISK_LEVEL_LABELS,
  RISK_STATUS_LABELS,
  TREATMENT_OPTION_LABELS,
  TREATMENT_STATUS_LABELS,
  type InformationAsset,
  type Kpi,
  type KpiDirection,
  type KpiFrequency,
  type OperationalControl,
  type Risk,
  type RiskAlertMatch,
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
  riskAlerts: RiskAlertMatch[];
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
const scoreOptions = [1, 2, 3, 4, 5];

const wrapTextSx = { minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" } as const;

const wrapChipSx = {
  maxWidth: "100%",
  height: "auto",
  alignItems: "flex-start",
  "& .MuiChip-label": {
    display: "block",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    lineHeight: 1.35,
    py: 0.35,
  },
} as const;

interface AdminUserOption {
  id: string;
  email: string;
}

/** Generates a short, readable, client-side-unique asset code, e.g. "AST-l8x3f9a1-k3j2". */
function generateAssetCode() {
  const timestampPart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 6);
  return `AST-${timestampPart}-${randomPart}`;
}

const initialForm: Record<string, string> = {
  code: "",
  name: "",
  type: "INFORMATION",
  criticality: "MEDIUM",
  confidentiality: "3",
  integrity: "3",
  availability: "3",
  ownerName: "",
  ownerUserId: "",
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
  responsibleUserId: "",
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
  const navigate = useNavigate();
  const { assets, risks, riskAlerts, treatments, controls, kpis, criteria, matrix, loading, saving, error } = useAppSelector((state) => state.riskOperations);
  const [form, setForm] = useState(initialForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [riskView, setRiskView] = useState<"list" | "matrix" | "alerts">("list");
  const [treatmentView, setTreatmentView] = useState<"list" | "alerts">("list");
  const [adminUsers, setAdminUsers] = useState<AdminUserOption[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchRiskOperations());
  }, [dispatch]);

  useEffect(() => {
    if (kind !== "assets" && kind !== "risks" && kind !== "treatments") return;
    let cancelled = false;
    setAdminUsersLoading(true);
    setAdminUsersError(null);
    api
      .get<AdminUserOption[]>("/risk-operations/users")
      .then((response) => {
        if (!cancelled) setAdminUsers(response.data);
      })
      .catch(() => {
        if (!cancelled) setAdminUsersError("No se pudieron cargar los usuarios");
      })
      .finally(() => {
        if (!cancelled) setAdminUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

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
    setForm(kind === "assets" ? { ...initialForm, code: generateAssetCode() } : initialForm);
    setCreateOpen(true);
  };

  const openEdit = (row: InformationAsset | Risk | RiskTreatment | OperationalControl | Kpi) => {
    setEditingId(row.id);
    setForm((current) => ({ ...current, ...formFromRow(kind, row) }));
    setCreateOpen(true);
  };

  const meta = pageMeta[kind];
  const data = { assets, risks, riskAlerts, treatments, controls, kpis };

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={meta.icon}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <Stack direction="row" spacing={1}>
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
      {kind === "treatments" ? (
        <TreatmentViewSwitcher value={treatmentView} onChange={setTreatmentView} />
      ) : null}
      {kind === "risks" && riskView === "matrix" && matrix ? (
        <RiskMatrixWidget matrix={matrix} threshold={criteria?.acceptanceThreshold ?? matrix.acceptanceThreshold} />
      ) : kind === "risks" && riskView === "alerts" ? (
        <RiskAlertsPanel alerts={riskAlerts} />
      ) : kind === "treatments" && treatmentView === "alerts" ? (
        <TreatmentAlertsPanel treatments={treatments} alerts={riskAlerts} />
      ) : (
        renderTable(kind, data, openEdit, kind === "kpis" ? (kpiId: string) => navigate(`/kpis/${kpiId}`) : undefined)
      )}

      <FormDrawer title={`${editingId ? "Editar" : "Crear"} ${meta.title.toLowerCase()}`} open={createOpen} onClose={() => setCreateOpen(false)} saving={saving} onSave={save}>
        <Box sx={formGridSx}>
          {renderForm(kind, form, update, { assets, risks, treatments, controls }, { adminUsers, adminUsersLoading, adminUsersError })}
        </Box>
        {kind === "controls" && editingId ? (
          <ControlKpiPanel kpis={kpis} controlId={editingId} dispatch={dispatch} onViewMeasurements={(kpiId: string) => navigate(`/kpis/${kpiId}`)} />
        ) : null}
        {kind === "treatments" && editingId ? (() => {
          const treatment = treatments.find((item) => item.id === editingId);
          return treatment ? <TreatmentActionsPanel treatment={treatment} controls={controls} kpis={kpis} dispatch={dispatch} /> : null;
        })() : null}
        {kind === "risks" && editingId ? (() => {
          const treatment = treatments.find((item) => item.riskId === editingId);
          if (!treatment) {
            return (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">Este riesgo todavía no tiene un tratamiento definido — las acciones se habilitan una vez creado.</Typography>
              </Box>
            );
          }
          return <TreatmentActionsPanel treatment={treatment} controls={controls} kpis={kpis} dispatch={dispatch} />;
        })() : null}
      </FormDrawer>
    </Box>
  );
};

const formGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" },
  gap: 2,
  minWidth: 0,
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
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    PaperProps={{ sx: { width: { xs: "100vw", sm: 560 }, maxWidth: "100vw", bgcolor: "#0c1220", overflowX: "hidden" } }}
  >
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5} sx={{ p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ ...wrapTextSx, fontWeight: 700 }}>{title}</Typography>
          <Typography variant="caption" color="text.secondary" sx={wrapTextSx}>Completá solo lo necesario y guardá sin salir de la lista.</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ flexShrink: 0 }}><Close /></IconButton>
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>{children}</Box>
      <Divider />
      <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="flex-end" spacing={1.5} sx={{ p: 2 }}>
        <Button onClick={onClose} fullWidth={false}>Cancelar</Button>
        <Button variant="contained" disabled={saving} onClick={onSave}>{saving ? "Guardando..." : saveLabel}</Button>
      </Stack>
    </Box>
  </Drawer>
);

const SummaryCards = ({ kind, data }: { kind: PageKind; data: RiskOperationsData }) => {
  const cards = getSummaryCards(kind, data);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: `repeat(${Math.min(cards.length, 4)}, minmax(0, 1fr))`,
        },
        gap: 2,
        mb: 3,
      }}
    >
      {cards.map((card) => (
        <MetricCard key={card.label} label={card.label} value={card.value} helper={card.helper} accent={card.accent} />
      ))}
    </Box>
  );
};

const RiskViewSwitcher = ({ value, onChange }: { value: "list" | "matrix" | "alerts"; onChange: (value: "list" | "matrix" | "alerts") => void }) => (
  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ mb: 2, minWidth: 0 }}>
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
      <ToggleButton value="alerts">Alertas</ToggleButton>
    </ToggleButtonGroup>
  </Stack>
);


const TreatmentViewSwitcher = ({ value, onChange }: { value: "list" | "alerts"; onChange: (value: "list" | "alerts") => void }) => (
  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ mb: 2, minWidth: 0 }}>
    <Box>
      <Typography variant="body2" color="text.secondary">
        Revisá planes y alertas vinculadas al activo del riesgo tratado.
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
      <ToggleButton value="list">Planes</ToggleButton>
      <ToggleButton value="alerts">Alertas</ToggleButton>
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

const RiskAlertsPanel = ({ alerts }: { alerts: RiskAlertMatch[] }) => (
  <Stack spacing={2} sx={{ mb: 3 }}>
    <Alert severity="info">
      Estas alertas salen de las fuentes monitoreadas y se vinculan a activos cuando el contenido de la fuente coincide con algún tag del activo.
    </Alert>
    {alerts.map((alert) => (
      <AppCard key={alert.id}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="overline" color="text.secondary">{alert.sourceKey ?? alert.serviceSource}</Typography>
                <Typography variant="h6" fontWeight={800} sx={wrapTextSx}>{alert.victim || alert.incidentId}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {new Date(alert.sentAt ?? alert.createdAt).toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {alert.matchedAssets.map((asset) => (
                <Chip
                  key={`${alert.id}-${asset.id}`}
                  size="small"
                  color="primary"
                  label={`${asset.code} · ${asset.name} (${asset.matchedTags.join(", ")})`}
                  sx={wrapChipSx}
                />
              ))}
            </Stack>
            <Typography component="pre" variant="body2" sx={{ ...wrapTextSx, whiteSpace: "pre-wrap", m: 0, p: 1.5, borderRadius: 2, ...softSurfaceSx }}>
              {truncate(alert.sourceMessage, 900)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={wrapTextSx}>
              Fuente cruda: {truncate(JSON.stringify(alert.payload), 260)}
            </Typography>
          </Stack>
        </CardContent>
      </AppCard>
    ))}
    {!alerts.length ? (
      <AppCard>
        <CardContent>
          <Typography color="text.secondary">No hay alertas vinculadas por tags de activos todavía.</Typography>
        </CardContent>
      </AppCard>
    ) : null}
  </Stack>
);


const TreatmentAlertsPanel = ({ treatments, alerts }: { treatments: RiskTreatment[]; alerts: RiskAlertMatch[] }) => {
  const alertsByTreatment = treatments.map((treatment) => ({
    treatment,
    alerts: alerts.filter((alert) =>
      alert.matchedAssets.some((asset) => asset.id === treatment.risk?.assetId),
    ),
  }));
  const totalAlerts = alertsByTreatment.reduce((total, item) => total + item.alerts.length, 0);

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Alert severity="info">
        Estas alertas se cruzan contra el activo del riesgo tratado. Si el tag del activo aparece en la fuente, el plan queda con contexto operativo para priorizar.
      </Alert>
      {alertsByTreatment.map(({ treatment, alerts: linkedAlerts }) => (
        <AppCard key={treatment.id}>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="overline" color="text.secondary">{TREATMENT_OPTION_LABELS[treatment.strategy]}</Typography>
                  <Typography variant="h6" fontWeight={800} sx={wrapTextSx}>{treatment.risk?.title ?? treatment.id}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={wrapTextSx}>{treatment.risk?.asset?.name ?? "Sin activo vinculado"}</Typography>
                </Box>
                <Chip size="small" label={`${linkedAlerts.length} alertas`} color={linkedAlerts.length ? "warning" : "default"} sx={wrapChipSx} />
              </Stack>
              <Typography variant="body2" sx={wrapTextSx}>{truncate(treatment.plan, 220)}</Typography>
              {linkedAlerts.slice(0, 3).map((alert) => (
                <Box key={`${treatment.id}-${alert.id}`} sx={{ p: 1.5, borderRadius: 2, ...softSurfaceSx }}>
                  <Typography variant="caption" color="text.secondary">{alert.sourceKey ?? alert.serviceSource}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={wrapTextSx}>{alert.victim || alert.incidentId}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={wrapTextSx}>{truncate(alert.sourceMessage, 220)}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </AppCard>
      ))}
      {!totalAlerts ? (
        <AppCard>
          <CardContent>
            <Typography color="text.secondary">No hay tratamientos con alertas vinculadas por tags todavía.</Typography>
          </CardContent>
        </AppCard>
      ) : null}
    </Stack>
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
    const treatmentsWithAlerts = data.treatments.filter((treatment) =>
      data.riskAlerts.some((alert) =>
        alert.matchedAssets.some((asset) => asset.id === treatment.risk?.assetId),
      ),
    ).length;
    return [
      { label: "Planes", value: data.treatments.length, helper: "Tratamientos definidos", accent: uiTokens.accent },
      { label: "Con alertas", value: treatmentsWithAlerts, helper: "Contexto fuente por tag", accent: "#f59e0b" },
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

function renderForm(
  kind: PageKind,
  form: Record<string, string>,
  update: (field: string, value: string) => void,
  data: Pick<RiskOperationsData, "assets" | "risks" | "treatments" | "controls">,
  ownerOptions: { adminUsers: AdminUserOption[]; adminUsersLoading: boolean; adminUsersError: string | null },
) {
  if (kind === "assets") {
    return (
      <>
        {field("name", "Nombre", form, update)}
        {field("type", "Tipo", form, update)}
        {field("criticality", "Criticidad", form, update, riskLevels.map((level) => ({ value: level, label: RISK_LEVEL_LABELS[level] })))}
        {ciaField("confidentiality", "Confidencialidad", form, update)}
        {ciaField("integrity", "Integridad", form, update)}
        {ciaField("availability", "Disponibilidad", form, update)}
        {ownerField("ownerName", "Responsable", form, update, ownerOptions)}
        {descriptionField("description", "Descripción", form, update)}
        {field("tags", "Tags separados por coma", form, update)}
      </>
    );
  }
  if (kind === "risks") {
    return <>{field("assetId", "Activo", form, update, data.assets.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })))}{field("title", "Título", form, update)}{field("scenario", "Escenario", form, update)}{field("threat", "Amenaza", form, update)}{field("vulnerability", "Vulnerabilidad", form, update)}{scoreField("likelihood", "Probabilidad", form, update)}{scoreField("impact", "Impacto", form, update)}{field("status", "Estado", form, update, riskStatuses.map((status) => ({ value: status, label: RISK_STATUS_LABELS[status] })))}{ownerField("ownerName", "Responsable", form, update, ownerOptions)}</>;
  }
  if (kind === "treatments") {
    return <>{field("riskId", "Riesgo", form, update, data.risks.map((item) => ({ value: item.id, label: item.title })))}{field("strategy", "Opción", form, update, treatmentOptions.map((option) => ({ value: option, label: TREATMENT_OPTION_LABELS[option] })))}{descriptionField("plan", "Plan", form, update)}{ownerField("responsibleName", "Responsable", form, update, ownerOptions, "responsibleUserId")}{field("dueDate", "Vencimiento", form, update, undefined, "date")}{optionalScoreField("residualLikelihood", "Probabilidad residual", form, update)}{optionalScoreField("residualImpact", "Impacto residual", form, update)}{field("status", "Estado", form, update, treatmentStatuses.map((status) => ({ value: status, label: TREATMENT_STATUS_LABELS[status] })))}</>;
  }
  if (kind === "controls") {
    return <>{field("title", "Título", form, update)}{field("category", "Categoría", form, update)}{field("type", "Tipo", form, update)}{field("objective", "Objetivo", form, update)}{field("implementation", "Implementación", form, update)}{field("monitoringFrequency", "Frecuencia", form, update)}{field("ownerName", "Responsable", form, update)}</>;
  }
  return <>{field("name", "Nombre", form, update)}{field("description", "Descripción", form, update)}{field("metricType", "Tipo", form, update, ["NUMBER", "PERCENTAGE", "RATIO", "INDEX"].map((value) => ({ value, label: value })))}{field("unit", "Unidad", form, update)}{field("frequency", "Frecuencia", form, update, ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"].map((value) => ({ value, label: value })))}{field("targetValue", "Meta", form, update, undefined, "number")}{field("warningValue", "Umbral", form, update, undefined, "number")}{field("direction", "Dirección", form, update, [{ value: "HIGHER_IS_BETTER", label: "Mayor es mejor" }, { value: "LOWER_IS_BETTER", label: "Menor es mejor" }])}{field("assetId", "Activo vinculado", form, update, [{ value: "", label: "Sin activo" }, ...data.assets.map((item) => ({ value: item.id, label: item.name }))])}{field("riskId", "Riesgo vinculado", form, update, [{ value: "", label: "Sin riesgo" }, ...data.risks.map((item) => ({ value: item.id, label: item.title }))])}{field("controlId", "Control vinculado", form, update, [{ value: "", label: "Sin control" }, ...data.controls.map((item) => ({ value: item.id, label: item.title }))])}</>;
}

function field(name: string, label: string, form: Record<string, string>, update: (field: string, value: string) => void, options?: Array<{ value: string; label: string }>, type = "text", disabled = false) {
  return (
    <Box key={name} sx={{ minWidth: 0 }}>
      <TextField fullWidth size="small" select={Boolean(options)} type={type} label={label} value={form[name] ?? ""} disabled={disabled} onChange={(event) => update(name, event.target.value)} InputLabelProps={type === "date" ? { shrink: true } : undefined}>
        {options?.map((option) => <MenuItem key={option.value || "empty"} value={option.value}>{option.label}</MenuItem>)}
      </TextField>
    </Box>
  );
}

/** Multiline text field, styled the same way the previous "Contexto" (businessContext) field used to be. */
function descriptionField(name: string, label: string, form: Record<string, string>, update: (field: string, value: string) => void) {
  return (
    <Box key={name} sx={{ gridColumn: { xs: "1", sm: "1 / -1" }, minWidth: 0 }}>
      <TextField fullWidth multiline rows={3} size="small" label={label} value={form[name] ?? ""} onChange={(event) => update(name, event.target.value)} />
    </Box>
  );
}

/** CIA rating select — 1 to 5, plain MenuItem options (no existing severity-label convention fit this numeric 1-5 case). */
function ciaField(name: string, label: string, form: Record<string, string>, update: (field: string, value: string) => void) {
  return (
    <Box key={name} sx={{ minWidth: 0 }}>
      <FormControl fullWidth size="small">
        <InputLabel id={`${name}-label`}>{label}</InputLabel>
        <Select labelId={`${name}-label`} label={label} value={form[name] ?? "3"} onChange={(event) => update(name, String(event.target.value))}>
          {scoreOptions.map((value) => <MenuItem key={value} value={String(value)}>{value}</MenuItem>)}
        </Select>
      </FormControl>
    </Box>
  );
}

/** Risk score select — keeps probability/impact constrained to the 1..5 matrix scale. */
function scoreField(name: string, label: string, form: Record<string, string>, update: (field: string, value: string) => void) {
  return (
    <Box key={name} sx={{ minWidth: 0 }}>
      <FormControl fullWidth size="small">
        <InputLabel id={`${name}-label`}>{label}</InputLabel>
        <Select labelId={`${name}-label`} label={label} value={form[name] ?? "3"} onChange={(event) => update(name, String(event.target.value))}>
          {scoreOptions.map((value) => <MenuItem key={value} value={String(value)}>{value}</MenuItem>)}
        </Select>
      </FormControl>
    </Box>
  );
}

/** Responsable select — populated from GET /risk-operations/users, displayed by email (backend exposes no display-name field). */
function ownerField(
  name: string,
  label: string,
  form: Record<string, string>,
  update: (field: string, value: string) => void,
  { adminUsers, adminUsersLoading, adminUsersError }: { adminUsers: AdminUserOption[]; adminUsersLoading: boolean; adminUsersError: string | null },
  idField = "ownerUserId",
) {
  const currentValue = form[name] ?? "";
  const currentUserId = form[idField] ?? "";
  const selectedById = currentUserId ? adminUsers.find((user) => user.id === currentUserId) : undefined;
  const selectValue = selectedById?.email ?? currentValue;
  const hasCurrentValueInOptions = !selectValue || adminUsers.some((user) => user.email === selectValue);

  return (
    <Box key={name} sx={{ minWidth: 0 }}>
      <FormControl fullWidth size="small" disabled={adminUsersLoading}>
        <InputLabel id={`${name}-label`}>{label}</InputLabel>
        <Select
          labelId={`${name}-label`}
          label={label}
          value={hasCurrentValueInOptions ? selectValue : ""}
          onChange={(event) => {
            const selectedUser = adminUsers.find((user) => user.email === event.target.value);
            update(name, event.target.value as string);
            update(idField, selectedUser?.id ?? "");
          }}
        >
          <MenuItem value="">{adminUsersLoading ? "Cargando..." : "Sin asignar"}</MenuItem>
          {!hasCurrentValueInOptions ? <MenuItem value={selectValue}>{selectValue}</MenuItem> : null}
          {adminUsers.map((user) => <MenuItem key={user.id} value={user.email}>{user.email}</MenuItem>)}
        </Select>
        {adminUsersError ? <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{adminUsersError}</Typography> : null}
      </FormControl>
    </Box>
  );
}


function optionalScoreField(name: string, label: string, form: Record<string, string>, update: (field: string, value: string) => void) {
  return field(name, label, form, update, [
    { value: "", label: "Sin calcular" },
    ...scoreOptions.map((value) => ({ value: String(value), label: String(value) })),
  ]);
}

function renderTable(
  kind: PageKind,
  data: RiskOperationsData,
  onEdit: (row: InformationAsset | Risk | RiskTreatment | OperationalControl | Kpi) => void,
  onViewMeasurements?: (kpiId: string) => void,
) {
  const rows = data[kind];
  return (
    <TableContainer component={Paper} sx={{ ...surfaceSx, maxWidth: "100%", overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: { xs: 680, md: "100%" } }}>
        <TableHead><TableRow>{[...tableHeaders(kind), ""].map((header) => <TableCell key={header}>{header}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              {tableCells(kind, row, data.kpis).map((cell, index) => <TableCell key={`${row.id}-${index}`} sx={{ maxWidth: { xs: 220, md: 320 }, verticalAlign: "top", ...wrapTextSx }}>{cell}</TableCell>)}
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Button size="small" startIcon={<Edit />} onClick={() => onEdit(row)}>
                    Editar
                  </Button>
                  {kind === "kpis" && onViewMeasurements ? (
                    <Button size="small" startIcon={<Timeline />} onClick={() => onViewMeasurements(row.id)}>
                      Mediciones
                    </Button>
                  ) : null}
                </Stack>
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
  if (kind === "assets") return ["Código", "Nombre", "Tipo", "Criticidad", "CIA", "Descripción"];
  if (kind === "risks") return ["Riesgo", "Activo", "Nivel", "Score", "Estado"];
  if (kind === "treatments") return ["Riesgo", "Opción", "Estado", "Residual", "Acciones"];
  if (kind === "controls") return ["Control", "Categoría", "Frecuencia", "Estado", "Vínculos"];
  return ["KPI", "Meta", "Última medición", "Frecuencia", "Evidencia"];
}

function tableCells(kind: PageKind, row: InformationAsset | Risk | RiskTreatment | OperationalControl | Kpi, kpis: Kpi[]) {
  if (kind === "assets") {
    const asset = row as InformationAsset;
    return [asset.code, asset.name, asset.type, <Chip size="small" label={RISK_LEVEL_LABELS[asset.criticality]} />, `${asset.confidentiality}/${asset.integrity}/${asset.availability}`, truncate(asset.description)];
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
    const linkedKpis = kpis.filter((item) => item.controlId === control.id).length;
    return [control.title, control.category, control.monitoringFrequency ?? "-", control.status, `${control.risks?.length ?? 0} riesgos · ${linkedKpis} KPIs`];
  }
  const kpi = row as Kpi;
  const latest = sortMeasurementsDesc(kpi.measurements)[0];
  return [kpi.name, `${kpi.targetValue} ${kpi.unit}`, latest ? `${latest.value} · ${new Date(latest.measuredAt).toLocaleDateString()}` : "Sin mediciones", kpi.frequency, latest?.evidenceUrl ? <a href={latest.evidenceUrl} target="_blank" rel="noreferrer">Ver URL</a> : "-"];
}

function buildPayload(kind: PageKind, form: Record<string, string>): Record<string, unknown> {
  if (kind === "assets") return { code: form.code, name: form.name, type: form.type, criticality: form.criticality, confidentiality: Number(form.confidentiality), integrity: Number(form.integrity), availability: Number(form.availability), ownerName: form.ownerName, description: form.description || undefined, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
  if (kind === "risks") return { assetId: form.assetId, title: form.title, scenario: form.scenario, threat: form.threat, vulnerability: form.vulnerability, affectedCia: ["C", "I", "A"], likelihood: Number(form.likelihood), impact: Number(form.impact), status: form.status, ownerName: form.ownerName, ownerUserId: form.ownerUserId || undefined };
  if (kind === "treatments") return { riskId: form.riskId, strategy: form.strategy, plan: form.plan, responsibleName: form.responsibleName, responsibleUserId: form.responsibleUserId || undefined, dueDate: form.dueDate || undefined, residualLikelihood: nullableNumber(form.residualLikelihood), residualImpact: nullableNumber(form.residualImpact), status: form.status };
  if (kind === "controls") return { title: form.title, category: form.category, type: form.type, objective: form.objective, implementation: form.implementation, monitoringFrequency: form.monitoringFrequency, ownerName: form.ownerName };
  return { name: form.name, description: form.description, metricType: form.metricType, unit: form.unit, frequency: form.frequency, targetValue: Number(form.targetValue), warningValue: nullableNumber(form.warningValue), direction: form.direction, assetId: form.assetId || undefined, riskId: form.riskId || undefined, controlId: form.controlId || undefined };
}

function formFromRow(kind: PageKind, row: InformationAsset | Risk | RiskTreatment | OperationalControl | Kpi): Record<string, string> {
  if (kind === "assets") {
    const asset = row as InformationAsset;
    return { code: asset.code, name: asset.name, type: asset.type, criticality: asset.criticality, confidentiality: String(asset.confidentiality), integrity: String(asset.integrity), availability: String(asset.availability), ownerName: asset.ownerName ?? "", ownerUserId: asset.ownerUserId ?? "", description: asset.description ?? "", tags: asset.tags.join(", ") };
  }
  if (kind === "risks") {
    const risk = row as Risk;
    return { assetId: risk.assetId, title: risk.title, scenario: risk.scenario, threat: risk.threat, vulnerability: risk.vulnerability, likelihood: String(risk.likelihood), impact: String(risk.impact), status: risk.status, ownerName: risk.ownerName ?? "", ownerUserId: risk.ownerUserId ?? "" };
  }
  if (kind === "treatments") {
    const treatment = row as RiskTreatment;
    return { riskId: treatment.riskId, strategy: treatment.strategy, plan: treatment.plan, responsibleName: treatment.responsibleName ?? "", responsibleUserId: treatment.responsibleUserId ?? "", dueDate: toDateInput(treatment.dueDate), residualLikelihood: treatment.residualLikelihood ? String(treatment.residualLikelihood) : "", residualImpact: treatment.residualImpact ? String(treatment.residualImpact) : "", status: treatment.status };
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

function nullableNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

function truncate(value?: string | null, maxLength = 60) {
  if (!value) return "-";
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function sortMeasurementsDesc(measurements: Kpi["measurements"] | undefined) {
  return [...(measurements ?? [])].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
}

type KpiStatusColor = "success" | "warning" | "error" | "default";

function kpiStatus(kpi: Kpi): { color: KpiStatusColor; label: string } {
  const latest = sortMeasurementsDesc(kpi.measurements)[0];
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

const kpiFrequencies: KpiFrequency[] = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"];
const kpiDirections: Array<{ value: KpiDirection; label: string }> = [
  { value: "HIGHER_IS_BETTER", label: "Mayor es mejor" },
  { value: "LOWER_IS_BETTER", label: "Menor es mejor" },
];

const initialKpiMiniForm = { name: "", unit: "", targetValue: "", frequency: "MONTHLY" as KpiFrequency, direction: "HIGHER_IS_BETTER" as KpiDirection };

function ControlKpiPanel({
  kpis,
  controlId,
  dispatch,
  onViewMeasurements,
}: {
  kpis: Kpi[];
  controlId: string;
  dispatch: AppDispatch;
  onViewMeasurements: (kpiId: string) => void;
}) {
  const [selectedKpiId, setSelectedKpiId] = useState("");
  const [linking, setLinking] = useState(false);
  const [miniForm, setMiniForm] = useState(initialKpiMiniForm);
  const [creating, setCreating] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const linkedKpis = kpis.filter((kpi) => kpi.controlId === controlId);
  const unlinkedKpis = kpis.filter((kpi) => !kpi.controlId);

  const unlink = async (kpiId: string) => {
    setUnlinkingId(kpiId);
    try {
      await dispatch(updateRiskOperation({ resource: "kpis", id: kpiId, payload: { controlId: null } })).unwrap();
      await dispatch(fetchRiskOperations());
    } finally {
      setUnlinkingId(null);
    }
  };

  const linkExisting = async () => {
    if (!selectedKpiId) return;
    setLinking(true);
    try {
      await dispatch(updateRiskOperation({ resource: "kpis", id: selectedKpiId, payload: { controlId } })).unwrap();
      await dispatch(fetchRiskOperations());
      setSelectedKpiId("");
    } finally {
      setLinking(false);
    }
  };

  const createKpi = async () => {
    if (!miniForm.name || !miniForm.unit || !miniForm.targetValue) return;
    setCreating(true);
    try {
      await dispatch(
        createRiskOperation({
          resource: "kpis",
          payload: {
            name: miniForm.name,
            unit: miniForm.unit,
            targetValue: Number(miniForm.targetValue),
            frequency: miniForm.frequency,
            direction: miniForm.direction,
            metricType: "NUMBER",
            controlId,
          },
        }),
      ).unwrap();
      await dispatch(fetchRiskOperations());
      setMiniForm(initialKpiMiniForm);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>KPIs vinculados</Typography>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        {linkedKpis.map((kpi) => {
          const latest = sortMeasurementsDesc(kpi.measurements)[0];
          const status = kpiStatus(kpi);
          return (
            <Box key={kpi.id} sx={{ p: 1.5, borderRadius: 2, ...softSurfaceSx }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} sx={wrapTextSx}>{kpi.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {`${latest?.value ?? "—"} / ${kpi.targetValue} ${kpi.unit}`}
                  </Typography>
                </Box>
                <Chip size="small" color={status.color === "default" ? undefined : status.color} label={status.label} />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => onViewMeasurements(kpi.id)}>Ver mediciones</Button>
                <Button size="small" color="error" disabled={unlinkingId === kpi.id} onClick={() => unlink(kpi.id)}>
                  {unlinkingId === kpi.id ? "Desvinculando..." : "Desvincular"}
                </Button>
              </Stack>
            </Box>
          );
        })}
        {!linkedKpis.length ? <Typography variant="body2" color="text.secondary">Sin KPIs vinculados todavía.</Typography> : null}
      </Stack>

      <Box sx={{ p: 1.5, borderRadius: 2, ...softSurfaceSx, mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Vincular KPI existente</Typography>
        <Stack direction="row" spacing={1}>
          <FormControl fullWidth size="small">
            <InputLabel id="link-kpi-label">KPI</InputLabel>
            <Select labelId="link-kpi-label" label="KPI" value={selectedKpiId} onChange={(event) => setSelectedKpiId(event.target.value)}>
              {unlinkedKpis.map((kpi) => <MenuItem key={kpi.id} value={kpi.id}>{kpi.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" disabled={!selectedKpiId || linking} onClick={linkExisting} sx={{ flexShrink: 0 }}>
            {linking ? "Vinculando..." : "Vincular"}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, borderRadius: 2, ...softSurfaceSx }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Crear KPI para este control</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
          <TextField size="small" label="Nombre" value={miniForm.name} onChange={(event) => setMiniForm((current) => ({ ...current, name: event.target.value }))} />
          <TextField size="small" label="Unidad" value={miniForm.unit} onChange={(event) => setMiniForm((current) => ({ ...current, unit: event.target.value }))} />
          <TextField size="small" type="number" label="Meta" value={miniForm.targetValue} onChange={(event) => setMiniForm((current) => ({ ...current, targetValue: event.target.value }))} />
          <FormControl fullWidth size="small">
            <InputLabel id="mini-kpi-frequency-label">Frecuencia</InputLabel>
            <Select labelId="mini-kpi-frequency-label" label="Frecuencia" value={miniForm.frequency} onChange={(event) => setMiniForm((current) => ({ ...current, frequency: event.target.value as KpiFrequency }))}>
              {kpiFrequencies.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
            <InputLabel id="mini-kpi-direction-label">Dirección</InputLabel>
            <Select labelId="mini-kpi-direction-label" label="Dirección" value={miniForm.direction} onChange={(event) => setMiniForm((current) => ({ ...current, direction: event.target.value as KpiDirection }))}>
              {kpiDirections.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" sx={{ mt: 1.5 }} disabled={!miniForm.name || !miniForm.unit || !miniForm.targetValue || creating} onClick={createKpi}>
          {creating ? "Creando..." : "Crear KPI"}
        </Button>
      </Box>
    </Box>
  );
}

function TreatmentActionsPanel({
  treatment,
  controls,
  kpis,
  dispatch,
}: {
  treatment: RiskTreatment;
  controls: OperationalControl[];
  kpis: Kpi[];
  dispatch: AppDispatch;
}) {
  const [miniForm, setMiniForm] = useState({ title: "", ownerName: "", dueDate: "", evidenceUrl: "", controlId: "", kpiId: "" });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof typeof miniForm, value: string) => setMiniForm((current) => ({ ...current, [field]: value }));

  const selectControl = (controlId: string) => {
    const controlKpi = kpis.find((kpi) => kpi.controlId === controlId);
    setMiniForm((current) => ({ ...current, controlId, kpiId: controlKpi?.id ?? "" }));
  };

  const availableKpis = miniForm.controlId ? kpis.filter((kpi) => kpi.controlId === miniForm.controlId) : kpis;

  const submit = async () => {
    if (!miniForm.title) return;
    setSubmitting(true);
    try {
      await dispatch(
        createTreatmentAction({
          treatmentId: treatment.id,
          payload: {
            title: miniForm.title,
            ownerName: miniForm.ownerName || undefined,
            dueDate: miniForm.dueDate || undefined,
            evidenceUrl: miniForm.evidenceUrl || undefined,
            controlId: miniForm.controlId || undefined,
            kpiId: miniForm.kpiId || undefined,
          },
        }),
      ).unwrap();
      await dispatch(fetchRiskOperations());
      setMiniForm({ title: "", ownerName: "", dueDate: "", evidenceUrl: "", controlId: "", kpiId: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Acciones</Typography>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        {(treatment.actions ?? []).map((action) => (
          <Box key={action.id} sx={{ p: 1.5, borderRadius: 2, ...softSurfaceSx }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} sx={wrapTextSx}>{action.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={wrapTextSx}>
                  {action.ownerName || "Sin responsable"} {action.dueDate ? `· vence ${new Date(action.dueDate).toLocaleDateString()}` : ""}
                </Typography>
              </Box>
              <Chip size="small" label={action.status} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              {action.control ? <Chip size="small" variant="outlined" label={`Control: ${action.control.title}`} /> : null}
              {action.kpi ? <Chip size="small" variant="outlined" label={`KPI: ${action.kpi.name}`} /> : null}
            </Stack>
          </Box>
        ))}
        {!(treatment.actions ?? []).length ? <Typography variant="body2" color="text.secondary">Sin acciones todavía.</Typography> : null}
      </Stack>

      <Box sx={{ p: 1.5, borderRadius: 2, ...softSurfaceSx }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Agregar acción</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
          <TextField size="small" label="Título" value={miniForm.title} onChange={(event) => updateField("title", event.target.value)} />
          <TextField size="small" label="Responsable" value={miniForm.ownerName} onChange={(event) => updateField("ownerName", event.target.value)} />
          <TextField size="small" type="date" label="Vencimiento" value={miniForm.dueDate} onChange={(event) => updateField("dueDate", event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="URL de evidencia" value={miniForm.evidenceUrl} onChange={(event) => updateField("evidenceUrl", event.target.value)} />
          <FormControl fullWidth size="small">
            <InputLabel id="action-control-label">Control operacional</InputLabel>
            <Select labelId="action-control-label" label="Control operacional" value={miniForm.controlId} onChange={(event) => selectControl(event.target.value)}>
              <MenuItem value="">Sin control</MenuItem>
              {controls.map((control) => <MenuItem key={control.id} value={control.id}>{control.title}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" disabled={Boolean(miniForm.controlId)}>
            <InputLabel id="action-kpi-label">KPI</InputLabel>
            <Select labelId="action-kpi-label" label="KPI" value={miniForm.kpiId} onChange={(event) => updateField("kpiId", event.target.value)}>
              <MenuItem value="">{miniForm.controlId ? "Ese control no tiene KPI" : "Sin KPI"}</MenuItem>
              {availableKpis.map((kpi) => <MenuItem key={kpi.id} value={kpi.id}>{kpi.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" sx={{ mt: 1.5 }} disabled={!miniForm.title || submitting} onClick={submit}>
          {submitting ? "Agregando..." : "Agregar acción"}
        </Button>
      </Box>
    </Box>
  );
}

export default RiskOperationsPage;
