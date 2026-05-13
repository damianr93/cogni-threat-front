import React, { useEffect, useCallback, useState } from "react";
import {
  Box, Container, Grid, Typography, Stack, TextField, Select, MenuItem,
  FormControl, InputLabel, Pagination, CircularProgress, Chip,
  Card, CardContent, Fade, Grow, InputAdornment, Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useAppDispatch } from "../shared/hooks/useAppDispatch";
import { useAppSelector } from "../shared/hooks/useAppSelector";
import {
  fetchCves, fetchVulnStats, setFilters, setPage, resetFilters,
} from "../store/slices/vulnMonitor/vulnMonitorSlice";
import CveTable from "../shared/components/vuln-monitor/CveTable";
import CveDetail from "../shared/components/vuln-monitor/CveDetail";
import SyncStatus from "../shared/components/vuln-monitor/SyncStatus";
import PageHeader from "../shared/components/PageHeader";

const STAT_CARDS = [
  {
    key: "total",
    label: "Total CVEs",
    subtitle: "INDEXED",
    color: "#4a90d9",
    getValue: (s: any) => s?.total,
  },
  {
    key: "kev",
    label: "CISA KEV",
    subtitle: "EXPLOITED IN THE WILD",
    color: "#e879f9",
    getValue: (s: any) => s?.kevCount,
  },
  {
    key: "critical",
    label: "Críticas",
    subtitle: "CVSS ≥ 9.0",
    color: "#ef4444",
    getValue: (s: any) => s?.bySeverity?.["CRITICAL"],
  },
  {
    key: "new24h",
    label: "Últimas 24 h",
    subtitle: "NUEVAS O ACTUALIZADAS",
    color: "#4ade80",
    getValue: (s: any) => s?.newLast24h,
  },
];

const VulnMonitorDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cves, total, totalPages, stats, filters, loading, statsLoading, selectedCve } =
    useAppSelector((s) => s.vulnMonitor);
  const [searchInput, setSearchInput] = useState(filters.search);

  const load = useCallback(() => {
    dispatch(fetchCves(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchVulnStats());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        dispatch(setFilters({ search: searchInput }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, dispatch]);

  const handleFilter = (key: string, value: string) =>
    dispatch(setFilters({ [key]: value }));
  const handlePage = (_: unknown, page: number) => dispatch(setPage(page));
  const hasActiveFilters = !!(filters.severity || filters.source || filters.is_kev || filters.search);

  const noNvdData = stats && stats.total > 0 && (stats.bySeverity?.["CRITICAL"] ?? 0) === 0
    && (stats.bySeverity?.["HIGH"] ?? 0) === 0;

  return (
    <Box>
      <PageHeader
        title="Vuln Monitor"
        subtitle="Vulnerabilidades multi-fuente: NVD · CISA KEV · GitHub Advisory · OSV · EPSS"
        icon={<VerifiedUserIcon />}
        accentColor="#4a90d9"
      />

      <Container maxWidth="xl">
        {/* Stats cards */}
        <Fade in timeout={800}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 4 }}>
            {STAT_CARDS.map((card, i) => (
              <Grow in timeout={400 + i * 150} key={card.key}>
                <Card
                  elevation={0}
                  sx={{
                    flex: 1,
                    transition: "all 0.3s ease",
                    "&:hover": { borderColor: card.color },
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="body2"
                      sx={{
                        color: card.color,
                        mb: 1,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontSize: "0.72rem",
                      }}
                    >
                      {card.label}
                    </Typography>
                    <Typography variant="h2" sx={{ fontWeight: 900, color: "white" }}>
                      {statsLoading ? (
                        <CircularProgress size={24} sx={{ color: card.color }} />
                      ) : (
                        (card.getValue(stats) ?? 0).toLocaleString()
                      )}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: `${card.color}b3`, mt: 1, fontWeight: 600, letterSpacing: "0.05em" }}
                    >
                      {card.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            ))}
          </Stack>
        </Fade>

        {noNvdData && (
          <Alert
            severity="info"
            sx={{ mb: 3, bgcolor: "rgba(74,144,217,0.08)", border: "1px solid rgba(74,144,217,0.2)", color: "#93c5fd" }}
          >
            La mayoría de los CVEs provienen de CISA KEV y aún no tienen datos CVSS. Para enriquecer con NVD ejecutá:{" "}
            <code style={{ fontFamily: "monospace" }}>npm run seed:vuln</code> en el backend.
          </Alert>
        )}

        <Grid container spacing={2.5}>
          {/* Main panel */}
          <Grid size={{ xs: 12, md: 9 }} sx={{ order: { xs: 2, md: 1 } }}>
            {/* Filters */}
            <Card elevation={0} sx={{ mb: 2 }}>
              <CardContent sx={{ pb: "12px !important" }}>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
                  <TextField
                    placeholder="Buscar CVE, descripción, vendor..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    size="small"
                    sx={{ flex: 1, minWidth: 200 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <FilterSelect
                    label="Severidad"
                    value={filters.severity}
                    onChange={(v) => handleFilter("severity", v)}
                    options={[
                      { label: "Todas", value: "" },
                      { label: "Critical", value: "CRITICAL" },
                      { label: "High", value: "HIGH" },
                      { label: "Medium", value: "MEDIUM" },
                      { label: "Low", value: "LOW" },
                    ]}
                  />

                  <FilterSelect
                    label="Fuente"
                    value={filters.source}
                    onChange={(v) => handleFilter("source", v)}
                    options={[
                      { label: "Todas", value: "" },
                      { label: "NVD", value: "nvd" },
                      { label: "CISA KEV", value: "kev" },
                      { label: "GitHub", value: "github" },
                      { label: "OSV", value: "osv" },
                    ]}
                  />

                  <FilterSelect
                    label="KEV"
                    value={filters.is_kev}
                    onChange={(v) => handleFilter("is_kev", v)}
                    options={[
                      { label: "Todos", value: "" },
                      { label: "Solo KEV", value: "true" },
                      { label: "Sin KEV", value: "false" },
                    ]}
                  />

                  <FilterSelect
                    label="Ordenar"
                    value={filters.sort}
                    onChange={(v) => handleFilter("sort", v)}
                    options={[
                      { label: "Modificado", value: "modified_at" },
                      { label: "CVSS", value: "cvss_score" },
                      { label: "EPSS", value: "epss_score" },
                    ]}
                  />
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
                  <Typography variant="caption" color="text.disabled">
                    {loading ? "Cargando..." : `${total.toLocaleString()} resultados`}
                  </Typography>
                  {hasActiveFilters && (
                    <Chip
                      label="Limpiar filtros"
                      size="small"
                      onClick={() => {
                        setSearchInput("");
                        dispatch(resetFilters());
                      }}
                      variant="outlined"
                      sx={{ fontSize: "0.7rem", color: "text.secondary" }}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Table */}
            <Card elevation={0} sx={{ overflow: "hidden" }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress size={36} />
                </Box>
              ) : (
                <CveTable cves={cves} loading={loading} />
              )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={filters.page}
                  onChange={handlePage}
                  size="small"
                  sx={{
                    "& .MuiPaginationItem-root": { color: "text.secondary" },
                    "& .Mui-selected": { bgcolor: "rgba(74,144,217,0.15)", color: "#4a90d9" },
                  }}
                />
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 3 }} sx={{ order: { xs: 1, md: 2 } }}>
            <Stack spacing={2}>
              <SyncStatus />

              {stats && (
                <Card elevation={0}>
                  <CardContent>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        letterSpacing: "0.08em",
                        display: "block",
                        mb: 2,
                      }}
                    >
                      Distribución por severidad
                    </Typography>
                    <Stack spacing={1.25}>
                      {(
                        [
                          { key: "CRITICAL", color: "#ef4444" },
                          { key: "HIGH", color: "#f97316" },
                          { key: "MEDIUM", color: "#f59e0b" },
                          { key: "LOW", color: "#4ade80" },
                          { key: "UNKNOWN", color: "#64748b" },
                        ] as const
                      ).map(({ key, color }) => {
                        const count = stats.bySeverity[key] ?? 0;
                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                          <Box key={key}>
                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                                {key}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.primary", fontWeight: 600, fontFamily: "monospace", fontSize: "0.75rem" }}
                              >
                                {count.toLocaleString()}
                              </Typography>
                            </Stack>
                            <Box sx={{ height: 4, borderRadius: 2, bgcolor: "rgba(255,255,255,0.06)" }}>
                              <Box
                                sx={{
                                  height: "100%",
                                  borderRadius: 2,
                                  bgcolor: color,
                                  width: `${pct.toFixed(1)}%`,
                                  transition: "width 0.6s ease",
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {selectedCve && <CveDetail />}
    </Box>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}> = ({ label, value, onChange, options }) => (
  <FormControl size="small" sx={{ minWidth: 120 }}>
    <InputLabel sx={{ fontSize: "0.8rem" }}>{label}</InputLabel>
    <Select value={value} onChange={(e) => onChange(e.target.value)} label={label} sx={{ fontSize: "0.8rem" }}>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value} sx={{ fontSize: "0.8rem" }}>
          {o.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default VulnMonitorDashboard;
