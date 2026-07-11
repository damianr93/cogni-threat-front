import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search,
  ArrowUpward,
  ArrowDownward,
  ChevronLeft,
  ChevronRight,
  NotificationsActive,
  Clear,
} from "@mui/icons-material";
import { api } from "../shared/utils/api";
import PageHeader from "../shared/components/PageHeader";
import TelegramMessageHtml from "../shared/components/TelegramMessageHtml";

export type AlertHistoryItem = {
  id: string;
  incidentId: string;
  serviceSource: string;
  country: string;
  victim: string;
  group: string;
  severity: string | null;
  telegramSent: boolean;
  sentAt: string | null;
  createdAt: string;
  deliveryStatus: string | null;
  errorMessage: string | null;
  eventId: string | null;
  sourceKey: string | null;
  payload?: { telegramMessage?: string } | null;
};

const PAGE_SIZE = 20;

const Home: React.FC = () => {
  const [items, setItems] = useState<AlertHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const fetchAlerts = (pageNum: number = 1, q?: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("limit", String(PAGE_SIZE));
    params.set("order", order);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    const qValue = q !== undefined ? q : searchQuery;
    if (qValue.trim()) params.set("q", qValue.trim());

    api
      .get<{ success: boolean; data: AlertHistoryItem[]; total: number; page: number; totalPages: number }>(
        `/alerts/history?${params.toString()}`
      )
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setItems(res.data.data);
          setTotal(res.data.total ?? 0);
          setPage(res.data.page ?? 1);
          setTotalPages(res.data.totalPages ?? 1);
        } else {
          setItems([]);
          setTotal(0);
          setTotalPages(0);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message || "Error al cargar alertas");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  // Auto-search with debounce when searchQuery changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAlerts(1, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    fetchAlerts(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, order]);

  const handleSearch = () => {
    setPage(1);
    fetchAlerts(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setPage(1);
    setTimeout(() => fetchAlerts(1, ""), 0);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getSeverityColor = (s: string | null) => {
    if (!s) return "#64748b";
    switch (s.toUpperCase()) {
      case "CRITICAL":
        return "#e05252";
      case "HIGH":
        return "#c9872a";
      case "MEDIUM":
        return "#4a90d9";
      case "LOW":
        return "#2d9e6b";
      default:
        return "#64748b";
    }
  };

  const hasFilters = dateFrom || dateTo || searchQuery.trim();

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader icon={<NotificationsActive />} title="Muro de alertas" subtitle="Todas las alertas emitidas por el sistema" />

      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "background.paper",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: 2,
          }}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <TextField
                placeholder="Buscar en todo el contenido (víctima, grupo, país, descripción, mensaje...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                size="small"
                sx={{ flex: 1, minWidth: 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {loading && searchQuery ? (
                        <CircularProgress size={16} sx={{ color: "text.secondary" }} />
                      ) : (
                        <Search sx={{ color: "text.secondary" }} />
                      )}
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery("")}>
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
              <TextField
                label="Desde"
                type="date"
                size="small"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 140,

                  "& .MuiOutlinedInput-root": {
                    color: "white",
                  },

                  "& input": {
                    color: "white",
                  },

                  "& input::-webkit-calendar-picker-indicator": {
                    filter: "invert(1)",
                    cursor: "pointer",
                  },
                }}
              />

              <TextField
                label="Hasta"
                type="date"
                size="small"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 140,

                  "& .MuiOutlinedInput-root": {
                    color: "white",
                  },

                  "& input": {
                    color: "white",
                  },

                  "& input::-webkit-calendar-picker-indicator": {
                    filter: "invert(1)",
                    cursor: "pointer",
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Orden</InputLabel>
                <Select
                  value={order}
                  label="Orden"
                  onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
                >
                  <MenuItem value="desc">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ArrowDownward fontSize="small" /> Más recientes
                    </Stack>
                  </MenuItem>
                  <MenuItem value="asc">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ArrowUpward fontSize="small" /> Más antiguas
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={handleSearch}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <Search />}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  color: "text.secondary",
                  "&:hover": { borderColor: "rgba(255, 255, 255, 0.25)", bgcolor: "rgba(255,255,255,0.04)" },
                }}
              >
                Buscar
              </Button>
              {hasFilters && (
                <Button variant="outlined" size="small" onClick={clearFilters} startIcon={<Clear />}>
                  Limpiar
                </Button>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              La búsqueda es automática (500ms de debounce). Busca en todos los campos: víctima, grupo, país, descripción, contenido del mensaje Telegram, CVE, y más.
            </Typography>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && items.length === 0 ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 2,
            }}
          >
            <NotificationsActive sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay alertas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasFilters ? "Prueba a cambiar filtros o búsqueda." : "Aún no se ha emitido ninguna alerta."}
            </Typography>
          </Paper>
        ) : (
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {total} alerta{total !== 1 ? "s" : ""} · Página {page} de {totalPages}
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {items.map((alert) => (
                <Paper
                  key={alert.id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: 2,
                    transition: "border-color 0.2s ease",
                    "&:hover": { borderColor: "rgba(255, 255, 255, 0.14)" },
                  }}
                >
                  <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Chip
                      label={alert.serviceSource}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.06)",
                        color: "text.secondary",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                    {alert.severity && (
                      <Chip
                        label={alert.severity}
                        size="small"
                        sx={{
                          bgcolor: `${getSeverityColor(alert.severity)}22`,
                          color: getSeverityColor(alert.severity),
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {alert.telegramSent && (
                      <Chip label="Enviado a Telegram" size="small" color="success" variant="outlined" />
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                      Enviado: {formatDate(alert.sentAt ?? alert.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                    {alert.victim}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Grupo: <strong>{alert.group}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      · País: <strong>{alert.country}</strong>
                    </Typography>
                    {alert.incidentId && (
                      <Typography variant="body2" color="text.secondary">
                        · ID: {alert.incidentId}
                      </Typography>
                    )}
                  </Stack>
                  {alert.deliveryStatus && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      Estado: {alert.deliveryStatus}
                    </Typography>
                  )}
                  {(alert.payload as { telegramMessage?: string } | undefined)?.telegramMessage && (
                    <Paper
                      variant="outlined"
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: "rgba(0, 0, 0, 0.2)",
                        borderColor: "rgba(255, 255, 255, 0.06)",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 0.5 }}>
                        Mensaje enviado a Telegram
                      </Typography>
                      <TelegramMessageHtml
                        html={(alert.payload as { telegramMessage?: string }).telegramMessage || ""}
                      />
                    </Paper>
                  )}
                </Paper>
              ))}
            </Stack>

            {totalPages > 1 && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={2}
                sx={{ mt: 4, pt: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ChevronLeft />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  Anterior
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Página {page} de {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ChevronRight />}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Siguiente
                </Button>
              </Stack>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Home;
