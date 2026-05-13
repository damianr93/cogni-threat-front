import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Tooltip,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Collapse,
  Select,
  MenuItem,
  TextField,
  Button,
  FormControl,
  InputLabel,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryIcon from "@mui/icons-material/History";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useCanWrite } from "../../hooks/useCanWrite";
import {
  fetchSyncStatus,
  triggerSync,
  triggerBackfill,
  type BackfillSource,
} from "../../../store/slices/vulnMonitor/vulnMonitorSlice";

const STATUS_COLOR: Record<string, string> = {
  ok: "#2d9e6b",
  warn: "#f59e0b",
  error: "#ef4444",
};

const SOURCE_LABELS: Record<string, string> = {
  nvd: "NVD",
  kev: "CISA KEV",
  github: "GitHub Advisory",
  osv: "OSV",
  epss: "EPSS",
};

const BACKFILL_SOURCES: BackfillSource[] = ["nvd", "github", "osv", "kev"];

function defaultSinceDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

const SyncStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const canWrite = useCanWrite();
  const { syncStatus, syncLoading, backfillLoading, backfillMessage } = useAppSelector(
    (s) => s.vulnMonitor
  );

  const [backfillOpen, setBackfillOpen] = useState(false);
  const [backfillSource, setBackfillSource] = useState<BackfillSource>("nvd");
  const [sinceDate, setSinceDate] = useState(defaultSinceDate);

  const sinceIso = useMemo(
    () => new Date(`${sinceDate}T00:00:00.000Z`).toISOString(),
    [sinceDate]
  );

  useEffect(() => {
    dispatch(fetchSyncStatus());
    const interval = setInterval(() => dispatch(fetchSyncStatus()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleSync = () => {
    dispatch(triggerSync()).then(() => {
      setTimeout(() => dispatch(fetchSyncStatus()), 3000);
    });
  };

  const handleBackfill = () => {
    dispatch(triggerBackfill({ source: backfillSource, since: sinceIso })).then(() => {
      setTimeout(() => dispatch(fetchSyncStatus()), 3000);
    });
  };

  return (
    <Card elevation={0}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: "0.65rem",
              letterSpacing: "0.08em",
            }}
          >
            Estado de sincronización
          </Typography>
          {canWrite && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Recuperación por fecha">
                <IconButton size="small" onClick={() => setBackfillOpen((v) => !v)}>
                  <HistoryIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sincronizar ahora">
                <span>
                  <IconButton size="small" onClick={handleSync} disabled={syncLoading}>
                    {syncLoading ? (
                      <CircularProgress size={14} />
                    ) : (
                      <RefreshIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )}
        </Stack>

        <Collapse in={canWrite && backfillOpen}>
          <Stack spacing={1.5} mb={2} sx={{ pt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Recuperación por fecha
            </Typography>
            <FormControl size="small" fullWidth>
              <InputLabel id="backfill-source-label">Fuente</InputLabel>
              <Select
                labelId="backfill-source-label"
                label="Fuente"
                value={backfillSource}
                onChange={(e) => setBackfillSource(e.target.value as BackfillSource)}
              >
                {BACKFILL_SOURCES.map((src) => (
                  <MenuItem key={src} value={src}>
                    {SOURCE_LABELS[src] ?? src}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Desde"
              type="date"
              value={sinceDate}
              onChange={(e) => setSinceDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleBackfill}
              disabled={backfillLoading || !sinceDate}
            >
              {backfillLoading ? "Iniciando..." : "Recuperar"}
            </Button>
            {backfillMessage && (
              <Typography variant="caption" color="text.secondary">
                {backfillMessage}
              </Typography>
            )}
          </Stack>
        </Collapse>

        <Stack spacing={1}>
          {syncStatus.length === 0 && (
            <Typography variant="caption" color="text.disabled">
              Sin datos de sincronización
            </Typography>
          )}
          {syncStatus.map((s) => (
            <Stack key={s.source} direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: STATUS_COLOR[s.status] ?? "#64748b",
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
                  {SOURCE_LABELS[s.source] ?? s.source}
                </Typography>
              </Stack>
              <Tooltip title={s.lastError ?? ""}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.72rem" }}>
                  {s.lastSyncAt ? formatRelative(s.lastSyncAt) : "Nunca"}
                  {s.lastCount != null ? ` · ${s.lastCount.toLocaleString()}` : ""}
                </Typography>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  return `hace ${Math.floor(diffH / 24)}d`;
}

export default SyncStatus;
