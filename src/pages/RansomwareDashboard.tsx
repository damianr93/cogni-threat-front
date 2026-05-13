import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Avatar,
  Fade,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Link,
  Autocomplete,
  TextField,
} from "@mui/material";
import { useAppDispatch } from "../shared/hooks/useAppDispatch";
import { useAppSelector } from "../shared/hooks/useAppSelector";
import { fetchRansomwareStats, type RansomwareStats } from "../store/slices/ransomware/ransomwareSlice";
import { Groups, Warning, Public, AccessTime, Close, Launch, Image, Article, CalendarToday, Language, Security, Edit, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import PageHeader from "../shared/components/PageHeader";
import { api } from "../shared/utils/api";
import { useCanWrite } from "../shared/hooks/useCanWrite";
import { MetricCard, softSurfaceSx, surfaceSx } from "../shared/ui/surface";
import countries from "i18n-iso-countries";
import esLocale from "i18n-iso-countries/langs/es.json";

countries.registerLocale(esLocale);

interface GroupDetails {
  id: string;
  group: string;
  altname: string | null;
  description: string | null;
  victims: number;
  firstseen: string | null;
  lastseen: string | null;
  added_date: string | null;
  has_negotiations: boolean;
  negotiation_count: number;
  has_ransomnote: boolean;
  ransomnotes_count: number;
  url: string | null;
  ttps: string[];
  vulnerabilities: string[];
  tools: any;
  locations: any[] | null;
  createdAt: string;
  updatedAt: string;
}

const RansomwareDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const canWrite = useCanWrite();
  const { stats, loading, error } = useAppSelector((state) => state.ransomware);
  const [selectedIncident, setSelectedIncident] = useState<RansomwareStats['recentActivity'][0] | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{ code2: string; name: string } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [filteredActivities, setFilteredActivities] = useState<RansomwareStats['recentActivity']>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [groupDetailsLoading, setGroupDetailsLoading] = useState(false);
  const [editingIncident, setEditingIncident] = useState<RansomwareStats['recentActivity'][0] | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({ victim: '', country: '', activity: '', website: '', description: '' });
  const [sortBy, setSortBy] = useState<'victim' | 'group' | 'country' | 'activity' | 'discovered'>('discovered');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    dispatch(fetchRansomwareStats());
    const interval = setInterval(() => {
      dispatch(fetchRansomwareStats());
    }, 300000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const hasFilters = selectedCountry || selectedGroup || selectedIndustry;

    if (!hasFilters) {
      if (stats?.recentActivity) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const windowed = stats.recentActivity.filter((activity) => {
          const discoveredDate = new Date(activity.discovered);
          return discoveredDate >= cutoff;
        });
        setFilteredActivities(windowed.length > 0 ? windowed : stats.recentActivity);
      }
      return;
    }

    setFilterLoading(true);
    const params = new URLSearchParams();
    if (selectedCountry) params.append('countryCode', selectedCountry.code2);
    if (selectedGroup) params.append('group', selectedGroup);
    if (selectedIndustry) params.append('industry', selectedIndustry);

    api.get(`/dashboard/victims-by-filters?${params.toString()}`)
      .then(response => {
        if (response.data.success && response.data.data) {
          setFilteredActivities(response.data.data);
        } else {
          setFilteredActivities([]);
        }
      })
      .catch(error => {
        console.error("Error fetching filtered victims:", error);
        setFilteredActivities([]);
      })
      .finally(() => {
        setFilterLoading(false);
      });
  }, [selectedCountry, selectedGroup, selectedIndustry, stats?.recentActivity]);

  const availableCountries = React.useMemo(() => {
    if (!stats?.attacksByCountry) return [];
    return stats.attacksByCountry.map(item => ({
      code2: item.country,
      name: countries.getName(item.country, "es") || item.country
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [stats?.attacksByCountry]);

  const availableGroups = React.useMemo(() => {
    if (!stats?.allGroups) return [];
    return stats.allGroups;
  }, [stats?.allGroups]);

  const availableIndustries = React.useMemo(() => {
    if (!stats?.sectorAnalysis) return [];
    return stats.sectorAnalysis
      .map(s => s.activity)
      .filter((a): a is string => !!a)
      .sort((a, b) => a.localeCompare(b));
  }, [stats?.sectorAnalysis]);

  const handleGroupClick = async (groupName: string) => {
    setGroupDetailsLoading(true);
    try {
      const response = await api.get(`/dashboard/group-details?groupName=${encodeURIComponent(groupName)}`);
      if (response.data.success && response.data.data) {
        setGroupDetails(response.data.data);
      } else {
        console.error('Error fetching group details:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setGroupDetailsLoading(false);
    }
  };

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const sortedActivities = React.useMemo(() => {
    return [...filteredActivities].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'victim':
          cmp = (a.victim ?? '').localeCompare(b.victim ?? '');
          break;
        case 'group':
          cmp = (a.group ?? '').localeCompare(b.group ?? '');
          break;
        case 'country':
          cmp = (a.country ?? '').localeCompare(b.country ?? '');
          break;
        case 'activity':
          cmp = (a.activity ?? '').localeCompare(b.activity ?? '');
          break;
        case 'discovered':
          cmp = new Date(a.discovered).getTime() - new Date(b.discovered).getTime();
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredActivities, sortBy, sortOrder]);

  const renderSortableHeader = (label: string, col: typeof sortBy) => {
    const active = sortBy === col;
    return (
      <TableCell
        sx={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'rgba(59,130,246,0.08)' } }}
        onClick={() => handleSort(col)}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <span>{label}</span>
          {active
            ? sortOrder === 'asc'
              ? <ArrowUpward sx={{ fontSize: 15, color: 'primary.main' }} />
              : <ArrowDownward sx={{ fontSize: 15, color: 'primary.main' }} />
            : <ArrowDownward sx={{ fontSize: 15, color: 'transparent' }} />}
        </Stack>
      </TableCell>
    );
  };

  const handleOpenEdit = (incident: RansomwareStats['recentActivity'][0]) => {
    if (!canWrite) return;

    setEditForm({
      victim: incident.victim ?? '',
      country: incident.country ?? '',
      activity: incident.activity ?? '',
      website: incident.website ?? '',
      description: incident.description ?? '',
    });
    setEditingIncident(incident);
  };

  const handleSaveEdit = async () => {
    if (!canWrite || !editingIncident) return;
    setEditSaving(true);
    try {
      const response = await api.patch(`/dashboard/victims/${editingIncident.id}`, editForm);
      if (response.data.success && response.data.data) {
        const updated = response.data.data;
        setFilteredActivities(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
        setSelectedIncident(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
        setEditingIncident(null);
      }
    } catch (err) {
      console.error('Error updating victim:', err);
    } finally {
      setEditSaving(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: "primary.main" }}>
          Cargando Inteligencia de Amenazas...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ fontSize: "1.1rem" }}>{error}</Alert>
      </Container>
    );
  }

  if (!stats) return null;

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<Warning />}
        title="Ransomware Live"
        subtitle={`${stats.overview.totalGroups} grupos · ${stats.overview.totalVictims.toLocaleString()} víctimas`}
        accentColor="#c94c4c"
      />

      <Container maxWidth="xl">
        <Fade in timeout={800}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mb: 4 }}>
            <Grow in timeout={600}>
              <Box sx={{ flex: 1 }}><MetricCard label="Grupos activos" value={stats.overview.totalGroups} helper="Actores monitoreados" accent="#4a90d9" /></Box>
            </Grow>

            <Grow in timeout={800}>
              <Box sx={{ flex: 1 }}><MetricCard label="Víctimas" value={stats.overview.totalVictims.toLocaleString()} helper="Organizaciones comprometidas" accent="#ef4444" /></Box>
            </Grow>

            <Grow in timeout={1000}>
              <Box sx={{ flex: 1 }}><MetricCard label="Argentina" value={stats.overview.argentinaAttacks.toLocaleString()} helper="Organizaciones afectadas" accent="#f59e0b" /></Box>
            </Grow>
          </Stack>
        </Fade>


        <Fade in timeout={1400}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              ...surfaceSx,
              borderRadius: 3,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Avatar sx={{ bgcolor: "error.main" }}>
                <AccessTime />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" fontWeight={700}>
                  Últimos Incidentes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCountry || selectedGroup || selectedIndustry
                    ? "Todos los ataques filtrados de la base de datos"
                    : "Últimos registros en base (prioridad: últimos 30 días)"}
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
              <Autocomplete
                options={availableCountries}
                getOptionLabel={(option) => `${option.name} (${option.code2})`}
                value={selectedCountry}
                onChange={(_, newValue) => setSelectedCountry(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por País"
                    placeholder="Todos los países"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "rgba(59, 130, 246, 0.05)",
                        "&:hover": {
                          bgcolor: "rgba(59, 130, 246, 0.1)"
                        },
                        "&.Mui-focused": {
                          bgcolor: "rgba(59, 130, 246, 0.15)"
                        }
                      }
                    }}
                  />
                )}
                sx={{ flex: 1 }}
              />
              <Autocomplete
                options={availableGroups}
                value={selectedGroup}
                onChange={(_, newValue) => setSelectedGroup(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por Grupo"
                    placeholder="Todos los grupos"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "rgba(239, 68, 68, 0.05)",
                        "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
                        "&.Mui-focused": { bgcolor: "rgba(239, 68, 68, 0.15)" }
                      }
                    }}
                  />
                )}
                sx={{ flex: 1 }}
              />
              <Autocomplete
                options={availableIndustries}
                value={selectedIndustry}
                onChange={(_, newValue) => setSelectedIndustry(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por Industria"
                    placeholder="Todas las industrias"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "rgba(245, 158, 11, 0.05)",
                        "&:hover": { bgcolor: "rgba(245, 158, 11, 0.1)" },
                        "&.Mui-focused": { bgcolor: "rgba(245, 158, 11, 0.15)" }
                      }
                    }}
                  />
                )}
                sx={{ flex: 1 }}
              />
              {(selectedCountry || selectedGroup || selectedIndustry) && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedCountry(null);
                    setSelectedGroup(null);
                    setSelectedIndustry(null);
                  }}
                  sx={{ minWidth: 100 }}
                >
                  Limpiar
                </Button>
              )}
            </Stack>

            {filterLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!filterLoading && filteredActivities.length === 0 && stats && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {selectedCountry || selectedGroup || selectedIndustry
                  ? "No se encontraron incidentes con los filtros seleccionados."
                  : "No hay víctimas en la base todavía o no hay registros en la ventana mostrada. Sincronizá desde Fuentes de datos o ejecutá el seed del backend."}
              </Alert>
            )}

            {!filterLoading && filteredActivities.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Mostrando {filteredActivities.length} {filteredActivities.length === 1 ? "incidente" : "incidentes"}
                {selectedCountry && ` de ${selectedCountry.name}`}
                {selectedGroup && ` del grupo ${selectedGroup}`}
                {selectedIndustry && ` en industria ${selectedIndustry}`}
              </Typography>
            )}

            {!filterLoading && (
              <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    {renderSortableHeader("Organización Víctima", "victim")}
                    {renderSortableHeader("Grupo de Amenaza", "group")}
                    {renderSortableHeader("País", "country")}
                    {renderSortableHeader("Industria", "activity")}
                    {renderSortableHeader("Fecha de Descubrimiento", "discovered")}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedActivities.map((activity, index) => (
                    <TableRow
                      key={activity.id || index}
                      hover
                      onClick={() => setSelectedIncident(activity)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "rgba(59, 130, 246, 0.05)"
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {activity.victim}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.group}
                          size="small"
                          sx={{
                            bgcolor: "error.main",
                            color: "white",
                            fontWeight: 600,
                            fontSize: "0.75rem"
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Public sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2">
                            {activity.country || "Desconocido"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {activity.activity || "No especificado"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(activity.discovered).toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )}
          </Paper>
        </Fade>
      </Container>

      <Dialog
        open={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            borderRadius: 3,
            border: "1px solid rgba(59, 130, 246, 0.3)"
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                {selectedIncident?.victim}
              </Typography>
              <Chip
                icon={<Security />}
                label={selectedIncident?.group}
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedIncident?.group) {
                    handleGroupClick(selectedIncident.group);
                  }
                }}
                sx={{ 
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              />
            </Box>
            <Button
              onClick={() => setSelectedIncident(null)}
              sx={{ minWidth: "auto", p: 1 }}
            >
              <Close />
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Public sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                    País
                  </Typography>
                </Stack>
                <Typography variant="body1">
                  {selectedIncident?.country || "No especificado"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Article sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                    Industria
                  </Typography>
                </Stack>
                <Typography variant="body1">
                  {selectedIncident?.activity || "No especificado"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <CalendarToday sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                    Fecha de Descubrimiento
                  </Typography>
                </Stack>
                <Typography variant="body1">
                  {selectedIncident?.discovered
                    ? new Date(selectedIncident.discovered).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "No disponible"}
                </Typography>
              </Box>

              {selectedIncident?.attackDate && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AccessTime sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      Fecha del Ataque
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {new Date(selectedIncident.attackDate).toLocaleString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              {selectedIncident?.website && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Language sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      Sitio Web
                    </Typography>
                  </Stack>
                  <Link
                    href={`https://${selectedIncident.website.replace(/^(https?:\/\/)?(www\.)?/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    {selectedIncident.website}
                    <Launch sx={{ fontSize: 16 }} />
                  </Link>
                </Box>
              )}

              {selectedIncident?.permalink && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Launch sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      Enlace Ransomware.live
                    </Typography>
                  </Stack>
                  <Link
                    href={selectedIncident.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    Ver en ransomware.live
                    <Launch sx={{ fontSize: 16 }} />
                  </Link>
                </Box>
              )}

              {selectedIncident?.postUrl && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Launch sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      URL del Post
                    </Typography>
                  </Stack>
                  <Link
                    href={selectedIncident.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, wordBreak: "break-all" }}
                  >
                    {selectedIncident.postUrl}
                    <Launch sx={{ fontSize: 16 }} />
                  </Link>
                </Box>
              )}

              {selectedIncident?.screenshot && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Image sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                      Captura de Pantalla
                    </Typography>
                  </Stack>
                  <Link
                    href={selectedIncident.screenshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    Ver imagen
                    <Launch sx={{ fontSize: 16 }} />
                  </Link>
                </Box>
              )}
            </Box>
          </Box>

          {selectedIncident?.description && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Descripción
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {selectedIncident.description}
              </Typography>
            </>
          )}

          {((selectedIncident?.duplicates && selectedIncident.duplicates.length > 0) || (selectedIncident?.extrainfos && selectedIncident.extrainfos.length > 0)) && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
                {selectedIncident.duplicates && selectedIncident.duplicates.length > 0 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                      Duplicados
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selectedIncident.duplicates.map((dup, idx) => (
                        <Chip key={idx} label={dup} size="small" sx={{ fontSize: "0.7rem" }} />
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedIncident.extrainfos && selectedIncident.extrainfos.length > 0 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                      Información Adicional
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selectedIncident.extrainfos.map((info, idx) => (
                        <Chip key={idx} label={info} size="small" color="info" sx={{ fontSize: "0.7rem" }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}

          {selectedIncident?.infostealer && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Info Stealer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                {selectedIncident.infostealer}
              </Typography>
            </>
          )}

          {selectedIncident?.press && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Información de Prensa
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedIncident.press}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "rgba(59, 130, 246, 0.05)" }}>
          {canWrite && (
            <Button
              startIcon={<Edit />}
              variant="outlined"
              onClick={() => selectedIncident && handleOpenEdit(selectedIncident)}
            >
              Editar
            </Button>
          )}
          <Button onClick={() => setSelectedIncident(null)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editingIncident}
        onClose={() => !editSaving && setEditingIncident(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            borderRadius: 3,
            border: "1px solid rgba(245, 158, 11, 0.3)"
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Editar incidente
            </Typography>
            <Button onClick={() => setEditingIncident(null)} sx={{ minWidth: "auto", p: 1 }} disabled={editSaving}>
              <Close />
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Organización víctima"
              value={editForm.victim}
              onChange={e => setEditForm(f => ({ ...f, victim: e.target.value }))}
              fullWidth
              size="small"
              disabled={editSaving}
            />
            <TextField
              label="País (código ISO 2, ej: AR)"
              value={editForm.country}
              onChange={e => setEditForm(f => ({ ...f, country: e.target.value.toUpperCase().slice(0, 2) }))}
              fullWidth
              size="small"
              inputProps={{ maxLength: 2 }}
              disabled={editSaving}
            />
            <Autocomplete
              options={availableIndustries}
              value={editForm.activity || null}
              onChange={(_, newValue) => setEditForm(f => ({ ...f, activity: newValue ?? '' }))}
              freeSolo
              disabled={editSaving}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Industria / Sector"
                  placeholder="Ej: Manufacturing, Healthcare..."
                  size="small"
                  onChange={e => setEditForm(f => ({ ...f, activity: e.target.value }))}
                />
              )}
            />
            <TextField
              label="Sitio web"
              value={editForm.website}
              onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
              fullWidth
              size="small"
              disabled={editSaving}
            />
            <TextField
              label="Descripción"
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={4}
              disabled={editSaving}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "rgba(245, 158, 11, 0.05)" }}>
          <Button onClick={() => setEditingIncident(null)} disabled={editSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={editSaving}
            startIcon={editSaving ? <CircularProgress size={16} /> : <Edit />}
          >
            {editSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!groupDetails}
        onClose={() => setGroupDetails(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            borderRadius: 3,
            border: "1px solid rgba(239, 68, 68, 0.3)"
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "error.main"
                  }}
                >
                  <Groups />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {groupDetails?.group}
                  </Typography>
                  {groupDetails?.altname && (
                    <Typography variant="body2" color="text.secondary">
                      También conocido como: {groupDetails.altname}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
            <Button
              onClick={() => setGroupDetails(null)}
              sx={{ minWidth: "auto", p: 1 }}
            >
              <Close />
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {groupDetailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mb: 3 }}>
                <Card
                  sx={{
                    ...softSurfaceSx,
                    flex: 1,
                    borderColor: "rgba(239, 68, 68, 0.35)"
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total de Víctimas
                    </Typography>
                    <Typography variant="h3" fontWeight={900} color="error.main">
                      {groupDetails?.victims.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    ...softSurfaceSx,
                    flex: 1,
                    borderColor: "rgba(124, 58, 237, 0.35)"
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Negociaciones
                    </Typography>
                    <Typography variant="h3" fontWeight={900} sx={{ color: "#a78bfa" }}>
                      {groupDetails?.negotiation_count || 0}
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    ...softSurfaceSx,
                    flex: 1,
                    borderColor: "rgba(245, 158, 11, 0.35)"
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Notas de Rescate
                    </Typography>
                    <Typography variant="h3" fontWeight={900} sx={{ color: "#fbbf24" }}>
                      {groupDetails?.ransomnotes_count || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>

              {groupDetails?.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    📄 Descripción
                  </Typography>
                  <Paper sx={{ ...softSurfaceSx, p: 2 }}>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {groupDetails.description}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    📅 Actividad Temporal
                  </Typography>
                  <Stack spacing={2}>
                    {groupDetails?.firstseen && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Primera aparición
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(groupDetails.firstseen).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </Typography>
                      </Box>
                    )}
                    {groupDetails?.lastseen && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Última aparición
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(groupDetails.lastseen).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </Typography>
                      </Box>
                    )}
                    {groupDetails?.added_date && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Fecha de registro
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(groupDetails.added_date).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    🔗 Enlaces
                  </Typography>
                  <Stack spacing={2}>
                    {groupDetails?.url && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Información en Ransomware.live
                        </Typography>
                        <Link
                          href={groupDetails.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                        >
                          Ver información completa
                          <Launch sx={{ fontSize: 16 }} />
                        </Link>
                      </Box>
                    )}
                    <Stack direction="row" spacing={1}>
                      <Chip
                        icon={groupDetails?.has_negotiations ? <Security /> : <Close />}
                        label={groupDetails?.has_negotiations ? "Con negociaciones" : "Sin negociaciones"}
                        color={groupDetails?.has_negotiations ? "success" : "default"}
                        size="small"
                      />
                      <Chip
                        icon={groupDetails?.has_ransomnote ? <Article /> : <Close />}
                        label={groupDetails?.has_ransomnote ? "Con notas de rescate" : "Sin notas"}
                        color={groupDetails?.has_ransomnote ? "warning" : "default"}
                        size="small"
                      />
                    </Stack>
                  </Stack>
                </Box>
              </Stack>

              {groupDetails?.ttps && groupDetails.ttps.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    ⚔️ TTPs (Tácticas, Técnicas y Procedimientos)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {groupDetails.ttps.map((ttp, idx) => (
                      <Chip key={idx} label={ttp} color="primary" size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {groupDetails?.vulnerabilities && groupDetails.vulnerabilities.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    🛡️ Vulnerabilidades Explotadas
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {groupDetails.vulnerabilities.map((vuln, idx) => (
                      <Chip key={idx} label={vuln} color="error" size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {groupDetails?.tools && Object.keys(groupDetails.tools).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    🔧 Herramientas Utilizadas
                  </Typography>
                  <Paper sx={{ ...softSurfaceSx, p: 2 }}>
                    <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace", overflow: "auto" }}>
                      {JSON.stringify(groupDetails.tools, null, 2)}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {groupDetails?.locations && Array.isArray(groupDetails.locations) && groupDetails.locations.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    🌐 Ubicaciones ({groupDetails.locations.length})
                  </Typography>
                  <TableContainer component={Paper} sx={softSurfaceSx}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>FQDN</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Última actualización</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupDetails.locations.map((location: any, idx: number) => (
                          <TableRow key={idx} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                {location.fqdn || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {location.title || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={location.type || "N/A"} size="small" color="info" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={location.available ? "Disponible" : "No disponible"}
                                size="small"
                                color={location.available ? "success" : "default"}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {location.updated
                                  ? new Date(location.updated).toLocaleDateString("es-ES")
                                  : "N/A"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "rgba(239, 68, 68, 0.05)" }}>
          <Button onClick={() => setGroupDetails(null)} variant="contained" color="error">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RansomwareDashboard;
