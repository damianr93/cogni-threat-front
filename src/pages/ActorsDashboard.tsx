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
  Avatar,
  Fade,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Link,
  Tooltip
} from "@mui/material";

import {
  Person,
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
  Flag,
  Description,
  CalendarToday,
  Security,
  Group,
  OpenInNew,
  Bookmark,
  PictureAsPdf,
} from "@mui/icons-material";

import DescriptionIcon from "@mui/icons-material/Description";

import { api } from "../shared/utils/api";
import { useCanWrite } from "../shared/hooks/useCanWrite";
import { softSurfaceSx, surfaceSx } from "../shared/ui/surface";

interface Hito {
  id: string;
  date: string;
  description: string;
  target: string;
  link: string;
  links?: string[];
  actorsDataId: string;
  createdAt: string;
  updatedAt: string;
  carriedOutBy?: {
    id: string;
    name: string;
  };
}

interface Actor {
  id: string;
  name: string;
  identificatedDate?: string;
  subGroup?: boolean;
  description?: string;
  country?: string;
  descriptionMethods?: string;
  methods: string[];
  aliases: string[];
  hitos: string[];
  hitosDatas: Hito[];
  createdAt: string;
  updatedAt: string;
}

interface ActorFormData {
  name: string;
  identificatedDate?: string;
  subGroup: boolean;
  description?: string;
  country?: string;
  descriptionMethods?: string;
  methods: string[];
  aliases: string[];
  hitos: string[];
  hitosDatas: {
    id?: string;
    date: string;
    description: string;
    target: string;
    link: string;
  }[];
}

const exportActorToPdf = async (actor: Actor) => {
  try {
    const response = await api.get(`/actors/${actor.id}/export/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${actor.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
};
const exportActorToWord = async (actor: Actor) => {
  try {
    const response = await api.get(`/actors/${actor.id}/export/docx`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${actor.name}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting Word:', error);
  }
};

// Hitos Input Table
const HitosInputTable: React.FC<{
  value: ActorFormData["hitosDatas"];
  onChange: (value: ActorFormData["hitosDatas"]) => void;
}> = React.memo(({ value, onChange }) => {
  const handleAdd = React.useCallback(() => {
    onChange([
      { date: new Date().toISOString().split("T")[0], description: "", target: "", link: "" },
      ...value,
    ]);
  }, [value, onChange]);

  const handleChange = React.useCallback((idx: number, field: keyof ActorFormData["hitosDatas"][0], val: string) => {
    const newHitos = [...value];
    newHitos[idx] = { ...newHitos[idx], [field]: val };
    onChange(newHitos);
  }, [value, onChange]);

  const handleDelete = React.useCallback((idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  }, [value, onChange]);

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" color="text.secondary">Hitos</Typography>
        <Button
          size="small"
          onClick={handleAdd}
          startIcon={<Add />}
          variant="outlined"
        >
          Agregar Hito
        </Button>
      </Stack>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          minHeight: 220,
          maxHeight: 520,
          overflowX: "auto",
          overflowY: "auto"
        }}
      >
        <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 180 }}>Fecha</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Objetivo</TableCell>
              <TableCell>Link(s)</TableCell>
              <TableCell sx={{ width: 52 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.map((hito, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ wordBreak: "break-word", whiteSpace: "normal", verticalAlign: "top" }}>
                  <TextField
                    type="date"
                    value={hito.date}
                    onChange={(e) => handleChange(idx, "date", e.target.value)}
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    fullWidth
                    size="small"
                    sx={{
                      "& input": {
                        color: "white",
                        paddingRight: "-24px",
                      },
                      "& input::-webkit-calendar-picker-indicator": {
                        filter: "invert(1)",
                        cursor: "pointer",
                        marginLeft: "8px",
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ wordBreak: "break-word", whiteSpace: "normal", verticalAlign: "top" }}>
                  <Box sx={{ maxHeight: "10.5em", overflowY: "auto", lineHeight: 1.5 }}>
                    <TextField
                      value={hito.description}
                      onChange={(e) => handleChange(idx, "description", e.target.value)}
                      variant="standard"
                      placeholder="Descripción"
                      InputProps={{ disableUnderline: true }}
                      fullWidth
                      size="small"
                      multiline
                      minRows={1}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ wordBreak: "break-word", whiteSpace: "normal", verticalAlign: "top" }}>
                  <Box sx={{ maxHeight: "10.5em", overflowY: "auto", lineHeight: 1.5 }}>
                    <TextField
                      value={hito.target}
                      onChange={(e) => handleChange(idx, "target", e.target.value)}
                      variant="standard"
                      placeholder="Objetivo"
                      InputProps={{ disableUnderline: true }}
                      fullWidth
                      size="small"
                      multiline
                      minRows={1}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ wordBreak: "break-word", whiteSpace: "normal", verticalAlign: "top" }}>
                  <TextField
                    value={hito.link}
                    onChange={(e) => handleChange(idx, "link", e.target.value)}
                    variant="standard"
                    placeholder="URL(s), separar por coma"
                    InputProps={{ disableUnderline: true }}
                    fullWidth
                    size="small"
                    multiline
                    minRows={1}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleDelete(idx)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {value.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 2 }}>
                  No hay hitos agregados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

// Methods Input Table
const MethodsInputTable: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
}> = React.memo(({ value, onChange }) => {
  const handleAdd = React.useCallback(() => {
    onChange([...value, ""]);
  }, [value, onChange]);

  const handleChange = React.useCallback((idx: number, val: string) => {
    const newMethods = [...value];
    newMethods[idx] = val;
    onChange(newMethods);
  }, [value, onChange]);

  const handleDelete = React.useCallback((idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  }, [value, onChange]);

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" color="text.secondary">Métodos</Typography>
        <Button
          size="small"
          onClick={handleAdd}
          startIcon={<Add />}
          variant="outlined"
        >
          Agregar Método
        </Button>
      </Stack>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          minHeight: 220,
          maxHeight: 380,
          overflowX: "auto",
          overflowY: "auto"
        }}
      >
        <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell>Método</TableCell>
              <TableCell sx={{ width: 52 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.map((method, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                  <TextField
                    value={method}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    variant="standard"
                    placeholder="Descripción del método..."
                    InputProps={{ disableUnderline: true }}
                    fullWidth
                    multiline
                    minRows={1}
                  />
                </TableCell>
                <TableCell sx={{ width: 60 }}>
                  <IconButton size="small" onClick={() => handleDelete(idx)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {value.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ color: "text.secondary", py: 2 }}>
                  No hay métodos agregados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

// Aliases Input Table (una columna, mismo patrón que métodos/hitos)
const AliasesInputTable: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
}> = React.memo(({ value, onChange }) => {
  const handleAdd = React.useCallback(() => {
    onChange([...value, ""]);
  }, [value, onChange]);

  const handleChange = React.useCallback((idx: number, val: string) => {
    const next = [...value];
    next[idx] = val;
    onChange(next);
  }, [value, onChange]);

  const handleDelete = React.useCallback((idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  }, [value, onChange]);

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" color="text.secondary">Alias</Typography>
        <Button
          size="small"
          onClick={handleAdd}
          startIcon={<Add />}
          variant="outlined"
        >
          Agregar alias
        </Button>
      </Stack>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          minHeight: 220,
          maxHeight: 380,
          overflowX: "auto",
          overflowY: "auto"
        }}
      >
        <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell>Alias</TableCell>
              <TableCell sx={{ width: 60 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.map((alias, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                  <TextField
                    value={alias}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    variant="standard"
                    placeholder="Nombre del alias..."
                    InputProps={{ disableUnderline: true }}
                    fullWidth
                    size="small"
                    multiline
                    minRows={1}
                  />
                </TableCell>
                <TableCell sx={{ width: 60 }}>
                  <IconButton size="small" onClick={() => handleDelete(idx)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {value.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ color: "text.secondary", py: 2 }}>
                  No hay alias agregados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

const ActorsDashboard: React.FC = () => {
  const canWrite = useCanWrite();
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"actors" | "hitos">("actors");
  const [sortBy, setSortBy] = useState<"name" | "country" | "hitos" | "date" | "target">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterSubGroups, setFilterSubGroups] = useState<boolean | null>(null);
  const [hitos, setHitos] = useState<Hito[]>([]);
  const [hitosTotal, setHitosTotal] = useState(0);
  const [hitosPage, setHitosPage] = useState(0);
  const [hitosRowsPerPage, setHitosRowsPerPage] = useState(25);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const formInitialSnapshotRef = useRef<string | null>(null);
  const [editingActor, setEditingActor] = useState<Actor | null>(null);
  const [formData, setFormData] = useState<ActorFormData>({
    name: "",
    identificatedDate: "",
    subGroup: false,
    description: "",
    country: "",
    descriptionMethods: "",
    methods: [],
    aliases: [],
    hitos: [],
    hitosDatas: []
  });


const [pendingLinksOpen, setPendingLinksOpen] = useState(false);
const [pendingLinksInput, setPendingLinksInput] = useState("");

const [pendingLinks, setPendingLinks] = useState<string[]>(() => {
  try {
    return JSON.parse(
      localStorage.getItem("pendingNewsLinks") || "[]"
    );
  } catch {
    return [];
  }
});

useEffect(() => {
  localStorage.setItem(
    "pendingNewsLinks",
    JSON.stringify(pendingLinks)
  );
}, [pendingLinks]);

const handleAddPendingLinks = () => {
  const urls = pendingLinksInput
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  if (urls.length === 0) return;

  setPendingLinks((prev) => {
    const merged = [...prev];

    urls.forEach((url) => {
      if (!merged.includes(url)) {
        merged.push(url);
      }
    });

    return merged;
  });

  setPendingLinksInput("");
};

const handleDeletePendingLink = (url: string) => {
  setPendingLinks((prev) =>
    prev.filter((x) => x !== url)
  );
};


  const loadHitos = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: String(hitosPage + 1),
        limit: String(hitosRowsPerPage),
        sortBy: sortBy === "name" || sortBy === "date" || sortBy === "target" ? sortBy : "date",
        sortOrder
      });
      const response = await api.get("/actors/hitos/search?" + params.toString());

      if (response.data.success && response.data.data) {
        setHitos(response.data.data);
        setHitosTotal(response.data.total ?? 0);
      } else {
        setHitos([]);
        setHitosTotal(0);
      }
    } catch (err: any) {
      console.error("Error loading hitos", err);
      setHitos([]);
      setHitosTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, hitosPage, hitosRowsPerPage, sortBy, sortOrder]);

  useEffect(() => {
    if (viewMode === "actors") {
      loadActors();
    } else {
      loadHitos();
    }
  }, [viewMode, loadHitos]);

  const loadActors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/actors");
      if (response.data.success && response.data.data) {
        setActors(response.data.data);
      } else {
        setError("Error al cargar actores");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cargar actores");
    } finally {
      setLoading(false);
    }
  };

  const handleActorClick = (actor: Actor) => {
    setSelectedActor(actor);
    setDetailsOpen(true);
  };

  const handleCreate = () => {
    if (!canWrite) return;

    setEditingActor(null);
    const initial = {
      name: "",
      identificatedDate: "",
      subGroup: false,
      description: "",
      country: "",
      descriptionMethods: "",
      methods: [],
      aliases: [],
      hitos: [],
      hitosDatas: []
    };
    setFormData(initial);
    formInitialSnapshotRef.current = JSON.stringify(initial);
    setFormOpen(true);
  };

  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    } catch {
      // ignore
    }
    return "";
  };

  const handleEdit = (actor: Actor) => {
    if (!canWrite) return;

    setEditingActor(actor);
    const mapped = {
      name: actor.name,
      identificatedDate: formatDateForInput(actor.identificatedDate),
      subGroup: actor.subGroup || false,
      description: actor.description || "",
      country: actor.country || "",
      descriptionMethods: actor.descriptionMethods || "",
      methods: actor.methods || [],
      aliases: actor.aliases || [],
      hitos: actor.hitos || [],
      hitosDatas: actor.hitosDatas ? actor.hitosDatas.map(h => ({
        id: h.id,
        date: new Date(h.date).toISOString().split('T')[0],
        description: h.description,
        target: h.target,
        link: (h.links && h.links.length) ? h.links.join(", ") : (h.link || '')
      })) : []
    };
    setFormData(mapped);
    formInitialSnapshotRef.current = JSON.stringify(mapped);
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

    if (!window.confirm("¿Estás seguro de eliminar este actor?")) return;

    try {
      const response = await api.delete(`/actors/${id}`);
      if (response.data.success) {
        await loadActors();
      } else {
        setError("Error al eliminar actor");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar actor");
    }
  };

  // Convierte YYYY-MM-DD a Date en mediodía UTC para evitar que la fecha retroceda un día por timezone
  const dateStringToNoonUTC = (dateStr: string): Date =>
    new Date(dateStr.trim() + "T12:00:00.000Z");

  const handleSave = async () => {
    try {
      const identificatedDateValue =
        formData.identificatedDate?.trim() !== ""
          ? dateStringToNoonUTC(formData.identificatedDate!)
          : undefined;
      const aliasesClean = (formData.aliases || []).map((a) => a.trim()).filter(Boolean);

      if (editingActor) {
        const payload = {
          ...formData,
          identificatedDate: identificatedDateValue,
          aliases: aliasesClean,
          hitosDatas: formData.hitosDatas.map(h => {
            const linksArr = (h.link || "").split(",").map(s => s.trim()).filter(Boolean);
            return {
              ...h,
              date: dateStringToNoonUTC(h.date),
              link: linksArr[0] || null,
              links: linksArr
            };
          })
        };
        const response = await api.put(`/actors/${editingActor.id}`, payload);
        if (response.data.success) {
          await loadActors();
          formInitialSnapshotRef.current = JSON.stringify(formData);
        } else {
          setError("Error al actualizar actor");
        }
      } else {
        const payload = {
          ...formData,
          identificatedDate: identificatedDateValue,
          aliases: aliasesClean,
          hitosDatas: formData.hitosDatas.map(h => {
            const linksArr = (h.link || "").split(",").map(s => s.trim()).filter(Boolean);
            return {
              ...h,
              date: dateStringToNoonUTC(h.date),
              link: linksArr[0] || null,
              links: linksArr
            };
          })
        };
        const response = await api.post("/actors", payload);
        if (response.data.success && response.data.data) {
          await loadActors();
          const createdActor = response.data.data as Actor;
          setEditingActor(createdActor);
          // Sync formData hitosDatas with real IDs from server to prevent duplicates on re-save
          const syncedHitosDatas = (createdActor.hitosDatas || []).map(h => ({
            id: h.id,
            date: new Date(h.date).toISOString().split('T')[0],
            description: h.description,
            target: h.target,
            link: (h.links && h.links.length) ? h.links.join(", ") : (h.link || '')
          }));
          const syncedFormData = { ...formData, hitosDatas: syncedHitosDatas };
          setFormData(syncedFormData);
          formInitialSnapshotRef.current = JSON.stringify(syncedFormData);
        } else {
          setError("Error al crear actor");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar actor");
    }
  };


const getSearchScore = (actor: Actor, query: string) => {
  const name = actor.name.toLowerCase();
  const aliases = actor.aliases.map((a) => a.toLowerCase());

  if (name.startsWith(query)) return 100;

  if (name.split(/\s+/).some((word) => word.startsWith(query))) return 90;

  if (aliases.some((alias) => alias.startsWith(query))) return 80;

  if (name.includes(query)) return 70;

  if (aliases.some((alias) => alias.includes(query))) return 60;

  if (actor.country?.toLowerCase().includes(query)) return 50;

  if (actor.description?.toLowerCase().includes(query)) return 40;

  return 0;
};


  const filteredAndSortedActors = React.useMemo(() => {
    if (actors.length === 0) return [];

    let filtered = [...actors];

    // SubGroups filter
    if (filterSubGroups !== null) {
      filtered = filtered.filter((a) => {
        if (filterSubGroups === true) {
          return a.subGroup === true;
        } else {
          return a.subGroup !== true;
        }
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          (a.country && a.country.toLowerCase().includes(query)) ||
          (a.description && a.description.toLowerCase().includes(query)) ||
          a.aliases.some((alias) => alias.toLowerCase().includes(query))
      );
    }

    // Sort
// Sort
filtered.sort((a, b) => {
  if (searchQuery) {
    const query = searchQuery.toLowerCase();

    const scoreA = getSearchScore(a, query);
    const scoreB = getSearchScore(b, query);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
  }

  let comparison = 0;

  switch (sortBy) {
    case "name":
      comparison = a.name.localeCompare(b.name);
      break;
    case "country": {
      const aCountry = a.country || "";
      const bCountry = b.country || "";
      comparison = aCountry.localeCompare(bCountry);
      break;
    }
    case "hitos":
      comparison =
        (a.hitosDatas?.length ?? a.hitos?.length ?? 0) -
        (b.hitosDatas?.length ?? b.hitos?.length ?? 0);
      break;
  }

  return sortOrder === "asc" ? comparison : -comparison;
});

    return filtered;
  }, [actors, searchQuery, sortBy, sortOrder, filterSubGroups]);

  if (loading && actors.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 500, color: "text.secondary" }}>
          Cargando actores...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<Person />}
        title="Threat Actors"
        subtitle={`${actors.length} actores registrados`}
        accentColor="#c9872a"
        actions={
          <>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: 1, p: 0.5 }}>
              <Stack direction="row" spacing={0.5}>
                <Button
                  variant={viewMode === "actors" ? "contained" : "text"}
                  size="small"
                  onClick={() => setViewMode("actors")}
                  color={viewMode === "actors" ? "primary" : "inherit"}
                >
                  Actores
                </Button>
                <Button
                  variant={viewMode === "hitos" ? "contained" : "text"}
                  size="small"
                  onClick={() => setViewMode("hitos")}
                  color={viewMode === "hitos" ? "primary" : "inherit"}
                >
                  Hitos
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Bookmark />}
                  onClick={() => setPendingLinksOpen(true)}
                >
                  Pendientes ({pendingLinks.length})
                </Button>
              </Stack>
            </Box>
            {canWrite && (
              <Button variant="contained" size="small" startIcon={<Add />} onClick={handleCreate}>
                Nuevo Actor
              </Button>
            )}
            <IconButton size="small" onClick={loadActors}>
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
            variant="outlined"
            sx={{
              ...surfaceSx,
              p: 3,
              mb: 4,
            }}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder={viewMode === "actors" ? "Buscar actores por nombre, país, descripción o alias..." : "Buscar hitos por descripción, objetivo o actor..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (viewMode === "hitos") setHitosPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearchQuery(""); if (viewMode === "hitos") setHitosPage(0); }}>
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant={sortBy === "name" ? "contained" : "outlined"}
                  onClick={() => {
                    if (sortBy === "name") {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    } else {
                      setSortBy("name");
                      setSortOrder("asc");
                    }
                  }}
                  startIcon={<SortByAlpha />}
                  endIcon={
                    sortBy === "name" ? (
                      sortOrder === "desc" ? (
                        <ArrowDownward sx={{ fontSize: 16 }} />
                      ) : (
                        <ArrowUpward sx={{ fontSize: 16 }} />
                      )
                    ) : null
                  }
                >
                  Nombre
                </Button>
                <Button
                  variant={sortBy === "country" ? "contained" : "outlined"}
                  onClick={() => {
                    if (sortBy === "country") {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    } else {
                      setSortBy("country");
                      setSortOrder("asc");
                    }
                  }}
                  startIcon={<Public />}
                  endIcon={
                    sortBy === "country" ? (
                      sortOrder === "desc" ? (
                        <ArrowDownward sx={{ fontSize: 16 }} />
                      ) : (
                        <ArrowUpward sx={{ fontSize: 16 }} />
                      )
                    ) : null
                  }
                >
                  País
                </Button>
                <Button
                  variant={sortBy === "hitos" ? "contained" : "outlined"}
                  onClick={() => {
                    if (sortBy === "hitos") {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    } else {
                      setSortBy("hitos");
                      setSortOrder("desc");
                    }
                  }}
                  startIcon={<AccessTime />}
                  endIcon={
                    sortBy === "hitos" ? (
                      sortOrder === "desc" ? (
                        <ArrowDownward sx={{ fontSize: 16 }} />
                      ) : (
                        <ArrowUpward sx={{ fontSize: 16 }} />
                      )
                    ) : null
                  }
                >
                  Hitos
                </Button>
                <Button
                  variant={filterSubGroups !== null ? "contained" : "outlined"}
                  color="secondary"
                  onClick={() => {
                    // Toggle: null -> true (solo subgrupos) -> false (solo no subgrupos) -> null (todos)
                    if (filterSubGroups === null) {
                      setFilterSubGroups(true);
                    } else if (filterSubGroups === true) {
                      setFilterSubGroups(false);
                    } else {
                      setFilterSubGroups(null);
                    }
                  }}
                  startIcon={<Group />}
                >
                  {filterSubGroups === null
                    ? "Todos"
                    : filterSubGroups === true
                      ? "Solo Subgrupos"
                      : "Sin Subgrupos"}
                </Button>
                {(searchQuery || sortBy !== "name" || filterSubGroups !== null) && (
                  <Button
                    variant="text"
                    onClick={() => {
                      setSearchQuery("");
                      setSortBy("name");
                      setSortOrder("asc");
                      setFilterSubGroups(null);
                      if (viewMode === "hitos") setHitosPage(0);
                    }}
                    startIcon={<Close />}
                    color="inherit"
                  >
                    Limpiar
                  </Button>
                )}
              </Stack>
              {viewMode === "hitos" && (
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Button
                    variant={sortBy === "date" ? "contained" : "outlined"}
                    onClick={() => {
                      setHitosPage(0);
                      if (sortBy === "date") {
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy("date");
                        setSortOrder("desc");
                      }
                    }}
                    startIcon={<CalendarToday />}
                  >
                    Fecha
                  </Button>
                  <Button
                    variant={sortBy === "target" ? "contained" : "outlined"}
                    onClick={() => {
                      setHitosPage(0);
                      if (sortBy === "target") {
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy("target");
                        setSortOrder("asc");
                      }
                    }}
                    startIcon={<Description />}
                  >
                    Target
                  </Button>
                  <Button
                    variant={sortBy === "name" ? "contained" : "outlined"}
                    onClick={() => {
                      setHitosPage(0);
                      if (sortBy === "name") {
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy("name");
                        setSortOrder("asc");
                      }
                    }}
                    startIcon={<SortByAlpha />}
                  >
                    Actor
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Fade>

        {/* Content Table */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              ...surfaceSx,
              overflow: "hidden"
            }}
          >
            {viewMode === "actors" ? (
              <TableContainer sx={{ overflow: "auto" }}>
                <Table sx={{ tableLayout: "fixed", width: "100%", minWidth: 500 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: "35%" }}>Actor Name</TableCell>
                      <TableCell sx={{ width: "20%" }}>Country</TableCell>
                      <TableCell sx={{ width: "15%" }} align="right">Hitos</TableCell>
                      {canWrite && <TableCell sx={{ width: "30%" }} align="center">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAndSortedActors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canWrite ? 4 : 3} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          {searchQuery ? "No se encontraron actores" : "No hay actores registrados"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedActors.map((actor) => (
                        <TableRow
                          key={actor.id}
                          hover
                          sx={{ cursor: "pointer" }}
                          onClick={() => handleActorClick(actor)}
                        >
                          <TableCell
                            sx={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              minWidth: 0
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: "action.selected", flexShrink: 0 }}>
                                <Person sx={{ fontSize: 20, color: "text.secondary" }} />
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight={600} component="span" sx={{ wordBreak: "break-word" }}>
                                  {actor.name}
                                </Typography>
                                {actor.subGroup && (
                                  <Chip
                                    label="Subgrupo"
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: "0.7rem", mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ wordBreak: "break-word", overflowWrap: "break-word", minWidth: 0 }}>
                            <Chip
                              icon={<Flag sx={{ fontSize: 14 }} />}
                              label={actor.country || "N/A"}
                              size="small"
                              variant="outlined"
                              sx={{ maxWidth: "100%", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={(actor.hitosDatas?.length ?? actor.hitos?.length ?? 0).toLocaleString()}
                              size="small"
                              color="default"
                            />
                          </TableCell>
                          {canWrite && (
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(actor);
                                  }}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(actor.id);
                                  }}
                                  color="error"
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
            ) : (
              <TableContainer sx={{ overflow: "auto" }}>
                <Table sx={{ tableLayout: "fixed", width: "100%", minWidth: 500 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: "10%" }}>Fecha</TableCell>
                      <TableCell sx={{ width: "42%" }}>Descripción</TableCell>
                      <TableCell sx={{ width: "23%" }}>Target</TableCell>
                      <TableCell sx={{ width: "25%" }}>Actor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hitos.length === 0 && !loading ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          {searchQuery ? "No se encontraron hitos" : "No hay hitos registrados"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      hitos.map((hito) => (
                        <TableRow
                          key={hito.id}
                          hover
                        >
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {new Date(hito.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top" }}>
                            <Box
                              sx={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                minWidth: 0,
                                maxHeight: "10.5em",
                                overflowY: "auto",
                                lineHeight: 1.5
                              }}
                            >
                              {hito.description}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top" }}>
                            <Box
                              sx={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                minWidth: 0,
                                maxHeight: "10.5em",
                                overflowY: "auto",
                                lineHeight: 1.5
                              }}
                            >
                              {hito.target}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              minWidth: 0
                            }}
                          >
                            {hito.carriedOutBy ? (
                              <Chip
                                icon={<Person sx={{ fontSize: 14 }} />}
                                label={hito.carriedOutBy.name}
                                size="small"
                                onClick={async () => {
                                  if (!hito.carriedOutBy?.id) return;
                                  try {
                                    const response = await api.get(`/actors/${hito.carriedOutBy.id}`);
                                    if (response.data.success) {
                                      setSelectedActor(response.data.data);
                                      setDetailsOpen(true);
                                    }
                                  } catch (error) {
                                    console.error("Error loading actor details:", error);
                                  }
                                }}
                                sx={{ cursor: "pointer", maxWidth: "100%", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">Unknown</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {viewMode === "hitos" && (
                  <TablePagination
                    component="div"
                    count={hitosTotal}
                    page={hitosPage}
                    onPageChange={(_, newPage) => setHitosPage(newPage)}
                    rowsPerPage={hitosRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setHitosRowsPerPage(parseInt(e.target.value, 10));
                      setHitosPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="Filas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
                  />
                )}
              </TableContainer>
            )}
          </Paper>
        </Fade>
      </Container>

      {/* Actor Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedActor(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 0,
          variant: "outlined",
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2} flex={1}>
              <Avatar
                variant="rounded"
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "action.hover"
                }}
              >
                <Person color="primary" sx={{ fontSize: 32 }} />
              </Avatar>
              <Box flex={1}>
                <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    {selectedActor?.name}
                  </Typography>
                  <Chip
                    icon={<AccessTime sx={{ fontSize: 16 }} />}
                    label={`${selectedActor?.hitosDatas?.length ?? selectedActor?.hitos?.length ?? 0} Hitos`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                {selectedActor?.country && (
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5, display: "flex", alignItems: "center" }}>
                    <Flag sx={{ fontSize: 16, mr: 0.5 }} />
                    {selectedActor.country}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton
              onClick={() => {
                setDetailsOpen(false);
                setSelectedActor(null);
              }}
              color="inherit"
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedActor && (
            <Grid container spacing={3}>
              {selectedActor.description && (
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={softSurfaceSx}>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Description color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Descripción
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {selectedActor.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Card variant="outlined" sx={softSurfaceSx}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                      <CalendarToday color="action" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={700}>
                        Información
                      </Typography>
                    </Stack>
                    <Stack spacing={1.5}>
                      {selectedActor.identificatedDate && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            FECHA DE IDENTIFICACIÓN
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {new Date(selectedActor.identificatedDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      {selectedActor.descriptionMethods && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            DESCRIPCIÓN GENERAL DE MÉTODOS
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: "pre-wrap" }}
                          >
                            {selectedActor.descriptionMethods}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {selectedActor.aliases && selectedActor.aliases.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={softSurfaceSx}>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <Security color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Alias
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {selectedActor.aliases.map((alias, idx) => (
                          <Chip
                            key={idx}
                            label={alias}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {selectedActor.methods && selectedActor.methods.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={softSurfaceSx}>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <Security color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Métodos
                        </Typography>
                      </Stack>
                      <Stack spacing={1}>
                        {selectedActor.methods.map((method, idx) => (
                          <Box key={idx} sx={{ display: "flex", gap: 1 }}>
                            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "text.disabled", mt: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {method}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {(selectedActor.hitosDatas && selectedActor.hitosDatas.length > 0) ? (
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={softSurfaceSx}>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <AccessTime color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Hitos ({selectedActor.hitosDatas.length})
                        </Typography>
                      </Stack>
                      <TableContainer
                        sx={{
                          minHeight: 220,
                          maxHeight: 380,
                          overflowX: "auto",
                          overflowY: "auto"
                        }}
                      >
                        <Table
                          size="small"
                          stickyHeader
                          sx={{
                            minWidth: 400,
                            tableLayout: "fixed",
                            width: "100%"
                          }}
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ whiteSpace: "nowrap", width: "8%" }}>FECHA</TableCell>
                              <TableCell sx={{ width: "52%" }}>DESCRIPCIÓN</TableCell>
                              <TableCell sx={{ width: "22%" }}>TARGET</TableCell>
                              <TableCell sx={{ width: "8%", textAlign: "center" }}>LINK</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedActor.hitosDatas.map((hito, idx) => {
                              const linkUrls: string[] = (hito.links && hito.links.length)
                                ? hito.links
                                : (hito.link ? [hito.link] : []);
                              const normalizedUrls = linkUrls
                                .map(u => (u.startsWith("http") ? u : `https://${u}`))
                                .filter(Boolean);
                              return (
                                <TableRow key={hito.id || idx} hover>
                                  <TableCell sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                                    {new Date(hito.date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell sx={{ verticalAlign: "top" }}>
                                    <Box
                                      sx={{
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                        minWidth: 0,
                                        maxHeight: "10.5em",
                                        overflowY: "auto",
                                        lineHeight: 1.5
                                      }}
                                    >
                                      {hito.description}
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ verticalAlign: "top" }}>
                                    <Box
                                      sx={{
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                        minWidth: 0,
                                        maxHeight: "10.5em",
                                        overflowY: "auto",
                                        lineHeight: 1.5
                                      }}
                                    >
                                      {hito.target}
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ verticalAlign: "top", textAlign: "center" }}>
                                    {normalizedUrls.length > 0 ? (
                                      <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                                        {normalizedUrls.map((url, i) => (
                                          <Tooltip key={i} title={linkUrls[i] || url} placement="left">
                                            <IconButton
                                              component="a"
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              size="small"
                                              color="primary"
                                              sx={{ p: 0.5 }}
                                            >
                                              <OpenInNew fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        ))}
                                      </Stack>
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              ) : (selectedActor.hitos && selectedActor.hitos.length > 0) && (
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={softSurfaceSx}>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <AccessTime color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Hitos (Legacy)
                        </Typography>
                      </Stack>
                      <Stack spacing={1}>
                        {selectedActor.hitos.map((hito, idx) => (
                          <Box key={idx} sx={{ display: "flex", gap: 1 }}>
                            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "text.disabled", mt: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {hito}
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
              setSelectedActor(null);
            }}
            color="inherit"
          >
            Cerrar
          </Button>
          {selectedActor && (
            <>
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={() => exportActorToWord(selectedActor)}
              >
                Word
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<PictureAsPdf />}
                onClick={() => exportActorToPdf(selectedActor)}
              >
                PDF
              </Button>

              {canWrite && (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => {
                    setDetailsOpen(false);
                    handleEdit(selectedActor);
                  }}
                >
                  Editar
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Create/Edit Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={requestCloseForm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.default",
            borderRadius: 3
            
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="h5"
              sx={{

                fontWeight: 700,
                color: "#4a90d9"
              }}
            >
              {editingActor ? "Editar Actor" : "Nuevo Actor"}
            </Typography>
            <IconButton onClick={requestCloseForm} sx={{ color: "#4a90d9" }}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)"
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#4a90d9"
                }
              }}
            />

            <TextField
              label="Fecha de identificación"
              type="date"
              fullWidth
              value={formData.identificatedDate || ""}
              onChange={(e) => setFormData({ ...formData, identificatedDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
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
  },

  "& input": {
    color: "white",
  },

  "& input::-webkit-calendar-picker-indicator": {
    filter: "invert(1)",
    cursor: "pointer",
  },

  "& .MuiInputLabel-root": {
    color: "rgba(255, 255, 255, 0.7)"
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#4a90d9"
  }
}}
            />

            <TextField
              label="País"
              fullWidth
              value={formData.country || ""}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="País de origen"
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
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)"
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#4a90d9"
                }
              }}
            />

            {/* Checkbox Subgrupo */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.subGroup}
                  onChange={(e) => setFormData({ ...formData, subGroup: e.target.checked })}
                  sx={{
                    color: "rgba(74, 144, 217, 0.5)",
                    "&.Mui-checked": {
                      color: "#4a90d9"
                    }
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontFamily: '"Rajdhani", sans-serif',
                    fontWeight: 600
                  }}
                >
                  Es un subgrupo
                </Typography>
              }
            />

            {/* Aliases - Input con chips */}
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
                        {/* Aliases Input Table */}
            <AliasesInputTable
              value={formData.aliases || []}
              onChange={(aliases) => setFormData({ ...formData, aliases })}
            />

            <TextField
              label="Descripción General de Métodos"
              fullWidth
              multiline
              rows={3}
              value={formData.descriptionMethods}
              onChange={(e) => setFormData({ ...formData, descriptionMethods: e.target.value })}
            />
            {/* Methods Input Table */}
            <MethodsInputTable
              value={formData.methods}
              onChange={(newMethods) => setFormData({ ...formData, methods: newMethods })}
            />

            {/* Hitos Input Table */}
            <HitosInputTable
              value={formData.hitosDatas}
              onChange={(newHitos) => setFormData({ ...formData, hitosDatas: newHitos })}
            />

          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={requestCloseForm} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>


          <Dialog
  open={pendingLinksOpen}
  onClose={() => setPendingLinksOpen(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>
    Links pendientes ({pendingLinks.length})
  </DialogTitle>

  <DialogContent>
    <TextField
      fullWidth
      multiline
      minRows={5}
      value={pendingLinksInput}
      onChange={(e) =>
        setPendingLinksInput(e.target.value)
      }
      placeholder={`https://sitio1.com
https://sitio2.com
https://sitio3.com`}
      sx={{ mt: 1 }}
    />

    <Button
      sx={{ mt: 2 }}
      variant="contained"
      startIcon={<Add />}
      onClick={handleAddPendingLinks}
    >
      Agregar links
    </Button>

    <List sx={{ mt: 3 }}>
      {pendingLinks.map((url) => (
        <ListItem
          key={url}
          secondaryAction={
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={() =>
                  window.open(url, "_blank")
                }
              >
                <OpenInNew />
              </IconButton>

              <IconButton
                color="error"
                onClick={() =>
                  handleDeletePendingLink(url)
                }
              >
                <Delete />
              </IconButton>
            </Stack>
          }
        >
          <ListItemText
            primary={
              <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                {url}
              </Link>
            }
          />
        </ListItem>
      ))}
    </List>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => setPendingLinksOpen(false)}
    >
      Cerrar
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  );
};

export default ActorsDashboard;
