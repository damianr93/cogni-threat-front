import PageHeader from "../shared/components/PageHeader";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Fade,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid
} from "@mui/material";
import {
  Article,
  AccessTime,
  Refresh,
  Search,
  Close,
  Edit,
  Add,
  Delete,
  Public,
  ArrowUpward,
  ArrowDownward,
  SortByAlpha,
  Link as LinkIcon,
  Event
} from "@mui/icons-material";
import { api } from "../shared/utils/api";
import { useCanWrite } from "../shared/hooks/useCanWrite";

interface FakeNews {
  id: string;
  title: string;
  origin: string;
  target?: string;
  identificatedDate?: string;
  methods?: string;
  consequences: string[];
  links: string[];
  createdAt: string;
  updatedAt: string;
}

interface FakeNewsFormData {
  title: string;
  origin: string;
  target?: string;
  identificatedDate?: string;
  methods?: string;
  consequences: string[];
  links: string[];
}

const FakeNewsDashboard: React.FC = () => {
  const canWrite = useCanWrite();
  const [fakeNews, setFakeNews] = useState<FakeNews[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFakeNews, setSelectedFakeNews] = useState<FakeNews | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"origin" | "target" | "consequences" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const formInitialSnapshotRef = useRef<string | null>(null);
  const [editingFakeNews, setEditingFakeNews] = useState<FakeNews | null>(null);
  const [formData, setFormData] = useState<FakeNewsFormData>({
    title: "",
    origin: "",
    target: "",
    identificatedDate: "",
    methods: "",
    consequences: [],
    links: []
  });
  const [tempConsequence, setTempConsequence] = useState("");
  const [tempLink, setTempLink] = useState("");

  // Función helper para normalizar URLs
  const normalizeUrl = (url: string): string => {
    if (!url) return url;
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const formatDateDisplay = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Función helper para convertir fecha a formato YYYY-MM-DD para el input
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return "";
    // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Si está en formato ISO o timestamp, extraer solo la fecha
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Obtener la fecha en zona horaria local
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // Si falla, devolver string vacío
    }
    return "";
  };

  useEffect(() => {
    loadFakeNews();
  }, []);

  const loadFakeNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/fake-news");
      if (response.data.success && response.data.data) {
        setFakeNews(response.data.data);
      } else {
        setError("Error al cargar fake news");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar fake news");
    } finally {
      setLoading(false);
    }
  };

  const handleFakeNewsClick = (fakeNewsItem: FakeNews) => {
    setSelectedFakeNews(fakeNewsItem);
    setDetailsOpen(true);
  };

  const handleCreate = () => {
    if (!canWrite) return;

    setEditingFakeNews(null);
    const initial = {
      title: "",
      origin: "",
      target: "",
      identificatedDate: "",
      methods: "",
      consequences: [],
      links: []
    };
    setFormData(initial);
    formInitialSnapshotRef.current = JSON.stringify(initial);
    setTempConsequence("");
    setTempLink("");
    setFormOpen(true);
  };

  const handleEdit = (fakeNewsItem: FakeNews) => {
    if (!canWrite) return;

    setEditingFakeNews(fakeNewsItem);
    const mapped = {
      title: fakeNewsItem.title,
      origin: fakeNewsItem.origin,
      target: fakeNewsItem.target || "",
      identificatedDate: formatDateForInput(fakeNewsItem.identificatedDate),
      methods: fakeNewsItem.methods || "",
      consequences: fakeNewsItem.consequences || [],
      links: fakeNewsItem.links || []
    };
    setFormData(mapped);
    formInitialSnapshotRef.current = JSON.stringify(mapped);
    setTempConsequence("");
    setTempLink("");
    setFormOpen(true);
  };

  const requestCloseForm = () => {
    const dirty = formInitialSnapshotRef.current !== null && JSON.stringify(formData) !== formInitialSnapshotRef.current;
    if (dirty && !window.confirm("¿Tienes cambios sin guardar. ¿Descartar y cerrar?")) return;
    formInitialSnapshotRef.current = null;
    setFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!canWrite) return;

    if (!window.confirm("¿Estás seguro de eliminar esta fake news?")) return;

    try {
      const response = await api.delete(`/fake-news/${id}`);
      if (response.data.success) {
        await loadFakeNews();
      } else {
        setError("Error al eliminar fake news");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar fake news");
    }
  };

  const handleSave = async () => {
    try {
      // Preparar los datos, convirtiendo strings vacíos a undefined para campos opcionales
      // Mantener la fecha en formato YYYY-MM-DD sin conversión de timezone
      let identificatedDateValue: string | undefined = undefined;
      if (formData.identificatedDate && formData.identificatedDate.trim() !== "") {
        // Mantener el formato YYYY-MM-DD tal como está, sin conversión a ISO string
        // Esto evita problemas de timezone donde la fecha se desplaza un día
        identificatedDateValue = formData.identificatedDate.trim();
      }

      const dataToSend = {
        title: formData.title,
        origin: formData.origin,
        target: formData.target && formData.target.trim() !== "" ? formData.target : undefined,
        identificatedDate: identificatedDateValue,
        methods: formData.methods && formData.methods.trim() !== "" ? formData.methods : undefined,
        consequences: formData.consequences,
        links: formData.links
      };

      if (editingFakeNews) {
        const response = await api.put(`/fake-news/${editingFakeNews.id}`, dataToSend);
        if (response.data.success) {
          await loadFakeNews();
          formInitialSnapshotRef.current = JSON.stringify(formData);
        } else {
          setError("Error al actualizar fake news");
        }
      } else {
        const response = await api.post("/fake-news", dataToSend);
        if (response.data.success && response.data.data) {
          await loadFakeNews();
          setEditingFakeNews(response.data.data as FakeNews);
          formInitialSnapshotRef.current = JSON.stringify(formData);
        } else {
          setError("Error al crear fake news");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar fake news");
    }
  };

  const filteredAndSortedFakeNews = React.useMemo(() => {
    if (fakeNews.length === 0) return [];

    let filtered = [...fakeNews];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.origin.toLowerCase().includes(query) ||
          (f.target && f.target.toLowerCase().includes(query)) ||
          (f.methods && f.methods.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "origin":
          comparison = a.origin.localeCompare(b.origin);
          break;
        case "target": {
          const aTarget = a.target || "";
          const bTarget = b.target || "";
          comparison = aTarget.localeCompare(bTarget);
          break;
        }
        case "consequences":
          comparison = (a.consequences?.length || 0) - (b.consequences?.length || 0);
          break;
        case "date": {
          const aTime = a.identificatedDate ? new Date(a.identificatedDate).getTime() : 0;
          const bTime = b.identificatedDate ? new Date(b.identificatedDate).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [fakeNews, searchQuery, sortBy, sortOrder]);

  if (loading && fakeNews.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<Article />}
        title="Fake News"
        subtitle={`${fakeNews.length} registros de desinformación`}
        actions={
          <>
            {canWrite && (
              <Button variant="contained" size="small" startIcon={<Add />} onClick={handleCreate}>
                Nueva entrada
              </Button>
            )}
            <IconButton size="small" onClick={loadFakeNews}>
              <Refresh fontSize="small" />
            </IconButton>
          </>
        }
      />

      {error && (
        <Container maxWidth="xl" sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Container>
      )}

      <Container maxWidth="xl">
        {/* Search and Filters */}
        <Fade in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2
            }}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Buscar fake news por origen, objetivo o métodos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#4a90d9" }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery("")}>
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "rgba(74, 144, 217, 0.3)"
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(74, 144, 217, 0.5)"
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#4a90d9"
                    }
                  }
                }}
              />
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant={sortBy === "origin" ? "contained" : "outlined"}
                  onClick={() => {
                    if (sortBy === "origin") {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    } else {
                      setSortBy("origin");
                      setSortOrder("asc");
                    }
                  }}
                  startIcon={<SortByAlpha />}
                  endIcon={
                    sortBy === "origin" ? (
                      sortOrder === "desc" ? (
                        <ArrowDownward sx={{ fontSize: 16 }} />
                      ) : (
                        <ArrowUpward sx={{ fontSize: 16 }} />
                      )
                    ) : null
                  }
                  sx={{
                    fontFamily: '"Rajdhani", sans-serif',
                    fontWeight: 600,
                    borderColor: "rgba(74, 144, 217, 0.3)",
                    color: sortBy === "origin" ? "white" : "rgba(255, 255, 255, 0.7)",
                    ...(sortBy === "origin" && {
                      bgcolor: "#4a90d9",
                      "&:hover": { bgcolor: "#0891b2" }
                    }),
                    "&:hover": {
                      borderColor: "rgba(74, 144, 217, 0.5)",
                      bgcolor: sortBy === "origin" ? "#0891b2" : "rgba(74, 144, 217, 0.1)"
                    }
                  }}
                >
                  Origen
                </Button>
                <Button
                  variant={sortBy === "target" ? "contained" : "outlined"}
                  onClick={() => {
                    if (sortBy === "target") {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    } else {
                      setSortBy("target");
                      setSortOrder("asc");
                    }
                  }}
                  startIcon={<Public />}
                  endIcon={
                    sortBy === "target" ? (
                      sortOrder === "desc" ? (
                        <ArrowDownward sx={{ fontSize: 16 }} />
                      ) : (
                        <ArrowUpward sx={{ fontSize: 16 }} />
                      )
                    ) : null
                  }
                  sx={{
                    fontFamily: '"Rajdhani", sans-serif',
                    fontWeight: 600,
                    borderColor: "rgba(74, 144, 217, 0.3)",
                    color: sortBy === "target" ? "white" : "rgba(255, 255, 255, 0.7)",
                    ...(sortBy === "target" && {
                      bgcolor: "#4a90d9",
                      "&:hover": { bgcolor: "#0891b2" }
                    }),
                    "&:hover": {
                      borderColor: "rgba(74, 144, 217, 0.5)",
                      bgcolor: sortBy === "target" ? "#0891b2" : "rgba(74, 144, 217, 0.1)"
                    }
                  }}
                >
                  Objetivo
                </Button>
                <Button
                  variant={sortBy === "consequences" ? "contained" : "outlined"}
                  onClick={() => {
                    if (sortBy === "consequences") {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    } else {
                      setSortBy("consequences");
                      setSortOrder("desc");
                    }
                  }}
                  startIcon={<AccessTime />}
                  endIcon={
                    sortBy === "consequences" ? (
                      sortOrder === "desc" ? (
                        <ArrowDownward sx={{ fontSize: 16 }} />
                      ) : (
                        <ArrowUpward sx={{ fontSize: 16 }} />
                      )
                    ) : null
                  }
                  sx={{
                    fontFamily: '"Rajdhani", sans-serif',
                    fontWeight: 600,
                    borderColor: "rgba(74, 144, 217, 0.3)",
                    color: sortBy === "consequences" ? "white" : "rgba(255, 255, 255, 0.7)",
                    ...(sortBy === "consequences" && {
                      bgcolor: "#4a90d9",
                      "&:hover": { bgcolor: "#0891b2" }
                    }),
                    "&:hover": {
                      borderColor: "rgba(74, 144, 217, 0.5)",
                      bgcolor: sortBy === "consequences" ? "#0891b2" : "rgba(74, 144, 217, 0.1)"
                    }
                  }}
                >
                  Consecuencias
                </Button>
                <Button
                  variant={sortBy === "date" ? "contained" : "outlined"}
                  onClick={() => {
                    if (sortBy === "date") {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    } else {
                      setSortBy("date");
                      setSortOrder("desc");
                    }
                  }}
                  startIcon={<Event />}
                  endIcon={
                    sortBy === "date" ? (
                      sortOrder === "desc" ? (
                        <ArrowDownward sx={{ fontSize: 16 }} />
                      ) : (
                        <ArrowUpward sx={{ fontSize: 16 }} />
                      )
                    ) : null
                  }
                  sx={{
                    fontFamily: '"Rajdhani", sans-serif',
                    fontWeight: 600,
                    borderColor: "rgba(74, 144, 217, 0.3)",
                    color: sortBy === "date" ? "white" : "rgba(255, 255, 255, 0.7)",
                    ...(sortBy === "date" && {
                      bgcolor: "#4a90d9",
                      "&:hover": { bgcolor: "#0891b2" }
                    }),
                    "&:hover": {
                      borderColor: "rgba(74, 144, 217, 0.5)",
                      bgcolor: sortBy === "date" ? "#0891b2" : "rgba(74, 144, 217, 0.1)"
                    }
                  }}
                >
                  Fecha
                </Button>
                {(searchQuery || sortBy !== "date") && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearchQuery("");
                      setSortBy("date");
                      setSortOrder("desc");
                    }}
                    startIcon={<Close />}
                    sx={{
                      fontFamily: '"Rajdhani", sans-serif',
                      fontWeight: 600,
                      borderColor: "rgba(74, 144, 217, 0.3)",
                      color: "rgba(255, 255, 255, 0.7)",
                      "&:hover": {
                        borderColor: "rgba(74, 144, 217, 0.5)",
                        bgcolor: "rgba(74, 144, 217, 0.1)"
                      }
                    }}
                  >
                    Limpiar
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Fade>

        {/* Fake News Table */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "background.paper"
            }}
          >
            <TableContainer sx={{ overflow: "auto" }}>
              <Table sx={{ tableLayout: "fixed", width: "100%", minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "35%" }}>TÍTULO</TableCell>
                    <TableCell sx={{ width: "20%" }}>OBJETIVO</TableCell>
                    <TableCell sx={{ width: "15%" }}>FECHA</TableCell>
                    <TableCell align="right" sx={{ width: "10%" }}>CONSECUENCIAS</TableCell>
                    {canWrite && <TableCell align="center" sx={{ width: "20%" }}>ACCIONES</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedFakeNews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canWrite ? 5 : 4} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          {searchQuery ? "No se encontraron resultados" : "No hay registros disponibles"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedFakeNews.map((fakeNewsItem) => (
                      <TableRow
                        key={fakeNewsItem.id}
                        hover
                        onClick={() => handleFakeNewsClick(fakeNewsItem)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell
                          sx={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            minWidth: 0
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                                color: "primary.main",
                                display: "flex",
                                flexShrink: 0
                              }}
                            >
                              <Article fontSize="small" />
                            </Box>
                            <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ wordBreak: "break-word", minWidth: 0 }}>
                              {fakeNewsItem.title}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ wordBreak: "break-word", overflowWrap: "break-word", minWidth: 0 }}>
                          <Chip
                            icon={<Public sx={{ fontSize: 14 }} />}
                            label={fakeNewsItem.target || "N/A"}
                            size="small"
                            variant="outlined"
                            sx={{
                              maxWidth: "100%",
                              "& .MuiChip-label": {
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateDisplay(fakeNewsItem.identificatedDate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={fakeNewsItem.consequences?.length || 0}
                            size="small"
                            sx={{
                              borderRadius: 1,
                              height: 24,
                              minWidth: 32,
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        {canWrite && (
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center" onClick={(e) => e.stopPropagation()}>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(fakeNewsItem)}
                                sx={{
                                  color: "primary.main",
                                  border: "1px solid",
                                  borderColor: "divider"
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(fakeNewsItem.id)}
                                sx={{
                                  color: "error.main",
                                  border: "1px solid",
                                  borderColor: "divider",
                                  "&:hover": {
                                    backgroundColor: "error.light",
                                    color: "white",
                                    borderColor: "error.main"
                                  }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Fade>
      </Container>

      {/* Fake News Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedFakeNews(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", py: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Detalles de Fake News
            </Typography>
            <IconButton
              onClick={() => {
                setDetailsOpen(false);
                setSelectedFakeNews(null);
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedFakeNews && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight={700}>
                    {selectedFakeNews.title}
                  </Typography>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      label={selectedFakeNews.target || "Sin objetivo"}
                      icon={<Public fontSize="small" />}
                      color="primary"
                      variant="outlined"
                    />
                    {selectedFakeNews.identificatedDate && (
                      <Chip
                        label={new Date(selectedFakeNews.identificatedDate).toLocaleDateString()}
                        icon={<AccessTime fontSize="small" />}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      ORIGEN
                    </Typography>
                    <Typography variant="body1">
                      {selectedFakeNews.origin}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      DESCRIPCION
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {selectedFakeNews.methods || "No especificados"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {selectedFakeNews.consequences && selectedFakeNews.consequences.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        CONSECUENCIAS
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {selectedFakeNews.consequences.map((c, i) => (
                          <Chip key={i} label={c} size="small" />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {selectedFakeNews.links && selectedFakeNews.links.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        ENLACES
                      </Typography>
                      <Stack spacing={0.5}>
                        {selectedFakeNews.links.map((link, i) => (
                          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LinkIcon sx={{ fontSize: 20 }} />
                            <Typography
                              component="a"
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="body2"
                              sx={{
                                color: "primary.main",
                                textDecoration: "none",
                                "&:hover": {
                                  textDecoration: "underline"
                                },
                                wordBreak: "break-all"
                              }}
                            >
                              {link}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button
            onClick={() => {
              setDetailsOpen(false);
              setSelectedFakeNews(null);
            }}
            color="inherit"
          >
            Cerrar
          </Button>
          {selectedFakeNews && canWrite && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                setDetailsOpen(false);
                handleEdit(selectedFakeNews);
              }}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={requestCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              {editingFakeNews ? "Editar Fake News" : "Nueva Fake News"}
            </Typography>
            <IconButton onClick={requestCloseForm}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Origen"
              fullWidth
              required
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Objetivo"
                fullWidth
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              />
              <TextField
                  label="Fecha de Identificación"
                  type="date"
                  fullWidth
                  value={formData.identificatedDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, identificatedDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& input": {
                      color: "white",
                    },
                    "& input::-webkit-calendar-picker-indicator": {
                      filter: "invert(1)",
                      cursor: "pointer",
                    },
                    "& .MuiInputLabel-root": {
                      color: "rgba(255,255,255,0.7)",
                    },
                  }}
                />
            </Stack>

            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={formData.methods}
              onChange={(e) => setFormData({ ...formData, methods: e.target.value })}
              placeholder="Descripción de los métodos utilizados..."
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>Consecuencias</Typography>
              <TextField
                fullWidth
                placeholder="Escribe y presiona Enter para agregar"
                value={tempConsequence}
                onChange={(e) => setTempConsequence(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tempConsequence.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      consequences: [...(formData.consequences || []), tempConsequence.trim()]
                    });
                    setTempConsequence("");
                  }
                }}
                size="small"
                helperText="Presiona Enter para agregar"
              />
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {formData.consequences?.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    onDelete={() => {
                      setFormData({
                        ...formData,
                        consequences: formData.consequences.filter((_, i) => i !== idx)
                      });
                    }}
                    size="small"
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Enlaces</Typography>
              <TextField
                fullWidth
                placeholder="Pegar URL y presionar Enter"
                value={tempLink}
                onChange={(e) => setTempLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tempLink.trim()) {
                    e.preventDefault();
                    const normalized = normalizeUrl(tempLink.trim());
                    setFormData({
                      ...formData,
                      links: [...(formData.links || []), normalized]
                    });
                    setTempLink("");
                  }
                }}
                size="small"
                helperText="Presiona Enter para agregar"
              />
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {formData.links?.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    onDelete={() => {
                      setFormData({
                        ...formData,
                        links: formData.links.filter((_, i) => i !== idx)
                      });
                    }}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={requestCloseForm}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.title || !formData.origin}
          >
            {editingFakeNews ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog >
    </Box >
  );
};

export default FakeNewsDashboard;
