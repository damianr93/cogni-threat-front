import PageHeader from "../shared/components/PageHeader";
import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  ToggleButtonGroup,
  ToggleButton
} from "@mui/material";
import {
  Edit,
  Check,
  Addchart as AddChart,
  ArrowUpward,
  ArrowDownward,
  Close,
  Dashboard as DashboardIcon,
  ViewColumn,
  ViewStream,
  GridView
} from "@mui/icons-material";
import { useDashboardLayout, type WidgetId } from "../app/hooks/useDashboardLayout";
import { StateMessage, softSurfaceSx, surfaceSx } from "../shared/ui/surface";

// Chart widgets
import RansomwareGroupsBarChart from "../shared/components/widgets/charts/RansomwareGroupsBarChart";
import RansomwareWorldMapWidget from "../shared/components/widgets/charts/RansomwareWorldMapWidget";
import RansomwareTrendLineChart from "../shared/components/widgets/charts/RansomwareTrendLineChart";
import RansomwareSectorsChart from "../shared/components/widgets/charts/RansomwareSectorsChart";

// Card widgets
import RansomwareCard from "../shared/components/widgets/RansomwareCard";
import RiskOperationsCard from "../shared/components/widgets/RiskOperationsCard";
import TelegramCard from "../shared/components/widgets/TelegramCard";

// ─── Widget registry ────────────────────────────────────────────────────────

interface WidgetMeta {
  label: string;
  subtitle: string;
  category: "ransomware" | "risk" | "general";
  color: string;
  component: React.FC<any>;
}

const WIDGET_REGISTRY: Record<WidgetId, WidgetMeta> = {
  "ransomware-groups-bar": {
    label: "Top Threat Groups",
    subtitle: "Grupos de ransomware más activos",
    category: "ransomware",
    color: "#ef4444",
    component: RansomwareGroupsBarChart
  },
  "ransomware-worldmap": {
    label: "Geographic Distribution",
    subtitle: "Mapa global de ataques",
    category: "ransomware",
    color: "#4a90d9",
    component: RansomwareWorldMapWidget
  },
  "ransomware-trend-line": {
    label: "Attack Trend",
    subtitle: "Evolución mensual de ataques",
    category: "ransomware",
    color: "#8b5cf6",
    component: RansomwareTrendLineChart
  },
  "ransomware-sectors-pie": {
    label: "Target Sectors",
    subtitle: "Distribución por industria",
    category: "ransomware",
    color: "#22c55e",
    component: RansomwareSectorsChart
  },
  "card-ransomware": {
    label: "Resumen Ransomware",
    subtitle: "Métricas y actividad reciente",
    category: "ransomware",
    color: "#ef4444",
    component: (props) => <RansomwareCard onExpand={() => {}} {...props} />
  },
  "card-risks": {
    label: "Resumen de riesgos",
    subtitle: "Matriz y exposición operacional",
    category: "risk",
    color: "#d6a84f",
    component: (props) => <RiskOperationsCard onExpand={() => {}} {...props} />
  },
  "card-telegram": {
    label: "Telegram Channels",
    subtitle: "Mensajes recientes de canales",
    category: "general",
    color: "#3b82f6",
    component: (props) => <TelegramCard onExpand={() => {}} {...props} />
  }
};

const ALL_WIDGET_IDS = Object.keys(WIDGET_REGISTRY) as WidgetId[];

// ─── Edit overlay for a single widget ───────────────────────────────────────

const EditOverlay: React.FC<{
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}> = ({ index, total, onMoveUp, onMoveDown, onRemove }) => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      zIndex: 10,
      background: "rgba(15, 23, 42, 0.7)",
      
      borderRadius: 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
      border: "2px dashed rgba(148, 163, 184, 0.4)"
    }}
  >
    <Stack direction="row" spacing={1}>
      <Tooltip title="Mover arriba">
        <span>
          <IconButton
            size="small"
            disabled={index === 0}
            onClick={onMoveUp}
            sx={{ bgcolor: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.4)" }, "&.Mui-disabled": { color: "rgba(148,163,184,0.3)" } }}
          >
            <ArrowUpward fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Mover abajo">
        <span>
          <IconButton
            size="small"
            disabled={index === total - 1}
            onClick={onMoveDown}
            sx={{ bgcolor: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.4)" }, "&.Mui-disabled": { color: "rgba(148,163,184,0.3)" } }}
          >
            <ArrowDownward fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Eliminar widget">
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{ bgcolor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", "&:hover": { bgcolor: "rgba(239, 68, 68, 0.4)" } }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  </Box>
);

// ─── Add widget dialog ───────────────────────────────────────────────────────

const AddWidgetDialog: React.FC<{
  open: boolean;
  currentSlots: WidgetId[];
  onAdd: (id: WidgetId) => void;
  onRemove: (index: number) => void;
  onClose: () => void;
}> = ({ open, currentSlots, onAdd, onRemove, onClose }) => {
  const categories = [
    { key: "ransomware", label: "Ransomware", color: "#ef4444" },
    { key: "risk", label: "Riesgos", color: "#d6a84f" },
    { key: "general", label: "General", color: "#3b82f6" },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...surfaceSx,
          borderRadius: 3
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <AddChart sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ color: "text.primary" }}>
            Agregar widgets
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: "divider" }}>
        {categories.map((cat) => {
          const widgets = ALL_WIDGET_IDS.filter((id) => WIDGET_REGISTRY[id].category === cat.key);
          return (
            <Box key={cat.key} sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{ color: cat.color, letterSpacing: "0.08em", fontWeight: 700, display: "block", mb: 1.5 }}
              >
                {cat.label.toUpperCase()}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1.5 }}>
                {widgets.map((id) => {
                  const meta = WIDGET_REGISTRY[id];
                  const addedIndex = currentSlots.indexOf(id);
                  const isAdded = addedIndex !== -1;
                  return (
                    <Paper
                      key={id}
                      elevation={0}
                      sx={{
                        ...softSurfaceSx,
                        p: 2,
                        borderRadius: 2,
                        border: isAdded
                          ? `1px solid ${meta.color}`
                          : "1px solid rgba(148, 163, 184, 0.15)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: meta.color, transform: "translateY(-1px)" }
                      }}
                      onClick={() => isAdded ? onRemove(addedIndex) : onAdd(id)}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2" sx={{ color: isAdded ? meta.color : "text.primary", fontWeight: 600 }}>
                            {meta.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            {meta.subtitle}
                          </Typography>
                        </Box>
                        {isAdded ? (
                          <Check sx={{ color: meta.color, fontSize: 20 }} />
                        ) : (
                          <Box sx={{ width: 20, height: 20, borderRadius: "50%"  }} />
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
        >
          Listo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const CustomDashboard: React.FC = () => {
  const { layout, setColumns, addWidget, removeWidget, moveUp, moveDown } = useDashboardLayout();
  const [editMode, setEditMode] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const gridCols = layout.columns;

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<DashboardIcon />}
        title="Dashboard"
        subtitle={`${layout.slots.length} widgets · ${gridCols} ${gridCols === 1 ? "columna" : "columnas"}`}
        actions={
          <>
            {editMode && (
              <>
                <ToggleButtonGroup
                  value={String(gridCols)}
                  exclusive
                  onChange={(_, val) => val && setColumns(Number(val) as 1 | 2 | 3)}
                  size="small"
                >
                  <ToggleButton value="1"><ViewStream fontSize="small" /></ToggleButton>
                  <ToggleButton value="2"><ViewColumn fontSize="small" /></ToggleButton>
                  <ToggleButton value="3"><GridView fontSize="small" /></ToggleButton>
                </ToggleButtonGroup>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddChart />}
                  onClick={() => setShowAddDialog(true)}
                >
                  Agregar
                </Button>
              </>
            )}
            <Button
              size="small"
              variant={editMode ? "contained" : "outlined"}
              color={editMode ? "success" : "primary"}
              startIcon={editMode ? <Check /> : <Edit />}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? "Listo" : "Editar"}
            </Button>
          </>
        }
      />
      <Container maxWidth="xl">
        {/* ── Edit mode hint ── */}
        {editMode && (
          <Fade in timeout={300}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
              <Chip size="small" label="↑↓ para reordenar" variant="outlined" />
              <Chip size="small" label="✕ para eliminar" variant="outlined" color="error" />
              <Chip size="small" label="Columnas: 1 / 2 / 3" variant="outlined" />
            </Stack>
          </Fade>
        )}

        {/* ── Widget grid ── */}
        {layout.slots.length === 0 ? (
          <Fade in timeout={600}>
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                ...softSurfaceSx,
                borderStyle: "dashed",
                borderRadius: 3
              }}
            >
              <StateMessage title="Dashboard vacío" description="Hacé clic en Editar y luego en Agregar para seleccionar qué widgets querés ver." />
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
              >
                Editar dashboard
              </Button>
            </Paper>
          </Fade>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gap: 3
            }}
          >
            {layout.slots.map((widgetId, index) => {
              const meta = WIDGET_REGISTRY[widgetId];
              if (!meta) return null;
              const WidgetComponent = meta.component;
              return (
                <Fade key={`${widgetId}-${index}`} in timeout={400 + index * 80}>
                  <Box sx={{ position: "relative" }}>
                    {editMode && (
                      <EditOverlay
                        index={index}
                        total={layout.slots.length}
                        onMoveUp={() => moveUp(index)}
                        onMoveDown={() => moveDown(index)}
                        onRemove={() => removeWidget(index)}
                      />
                    )}
                    <WidgetComponent />
                  </Box>
                </Fade>
              );
            })}
          </Box>
        )}

        {/* ── Add widget dialog ── */}
        <AddWidgetDialog
          open={showAddDialog}
          currentSlots={layout.slots}
          onAdd={(id) => addWidget(id)}
          onRemove={(idx) => removeWidget(idx)}
          onClose={() => setShowAddDialog(false)}
        />
      </Container>
    </Box>
  );
};

export default CustomDashboard;
