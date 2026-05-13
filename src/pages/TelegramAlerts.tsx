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
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Autocomplete,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from "@mui/material";
import {
  Telegram,
  AccessTime,
  Refresh,
  Search,
  FilterList,
  Settings,
  Add,
  Edit,
  Delete
} from "@mui/icons-material";
import { api } from "../shared/utils/api";
import PageHeader from "../shared/components/PageHeader";
import { useCanWrite } from "../shared/hooks/useCanWrite";

interface TelegramMessage {
  id: string;
  channelName: string;
  content: string;
  date: string;
  messageId?: string;
}

interface TelegramChannel {
  id: string;
  username: string;
  description?: string;
  isActive: boolean;
}

const TelegramAlerts: React.FC = () => {
  const canWrite = useCanWrite();
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para gestión de canales
  const [channelsDialogOpen, setChannelsDialogOpen] = useState(false);
  const [monitoredChannels, setMonitoredChannels] = useState<TelegramChannel[]>([]);
  const [channelFormOpen, setChannelFormOpen] = useState(false);
  const channelFormInitialRef = useRef<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<TelegramChannel | null>(null);
  const [channelForm, setChannelForm] = useState({ username: "", description: "" });
  const [loadingChannels, setLoadingChannels] = useState(false);

  const channels = React.useMemo(() => {
    const unique = Array.from(new Set(messages.map((m) => m.channelName)));
    return unique;
  }, [messages]);

  useEffect(() => {
    loadMessages();
    // Auto-refresh cada 2 minutos
    const interval = setInterval(() => {
      loadMessages(false);
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const response = await api.get("/alerts/telegram-messages?limit=100");
      
      if (response.data.success) {
        setMessages(response.data.data || []);
        setError(null);
      } else {
        setError(response.data.error || "Error al cargar mensajes");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredMessages = React.useMemo(() => {
    let filtered = messages;

    if (selectedChannel) {
      filtered = filtered.filter((m) => m.channelName === selectedChannel);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.content.toLowerCase().includes(query) ||
          m.channelName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [messages, selectedChannel, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Funciones para gestión de canales
  const fetchMonitoredChannels = async () => {
    try {
      setLoadingChannels(true);
      const response = await api.get("/alerts/monitored-channels");
      setMonitoredChannels(response.data);
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar canales de Telegram");
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleOpenChannelsDialog = async () => {
    setChannelsDialogOpen(true);
    await fetchMonitoredChannels();
  };

  const handleOpenChannelForm = (channel?: TelegramChannel) => {
    if (!canWrite) return;

    const initial = channel
      ? { username: channel.username, description: channel.description || "" }
      : { username: "", description: "" };
    if (channel) {
      setEditingChannel(channel);
    } else {
      setEditingChannel(null);
    }
    setChannelForm(initial);
    channelFormInitialRef.current = JSON.stringify(initial);
    setChannelFormOpen(true);
  };

  const requestCloseChannelForm = () => {
    const dirty = channelFormInitialRef.current !== null && JSON.stringify(channelForm) !== channelFormInitialRef.current;
    if (dirty && !window.confirm("¿Tienes cambios sin guardar. ¿Descartar y cerrar?")) return;
    channelFormInitialRef.current = null;
    setChannelFormOpen(false);
  };

  const handleSaveChannel = async () => {
    if (!canWrite) return;

    if (!channelForm.username.trim()) {
      setError("El nombre de usuario es obligatorio");
      return;
    }

    try {
      if (editingChannel) {
        await api.put(`/alerts/monitored-channels/${editingChannel.id}`, channelForm);
      } else {
        await api.post("/alerts/monitored-channels", channelForm);
      }
      channelFormInitialRef.current = null;
      setChannelFormOpen(false);
      setChannelForm({ username: "", description: "" });
      await fetchMonitoredChannels();
      await loadMessages(false); // Refrescar mensajes
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el canal");
    }
  };

  const handleToggleChannel = async (channel: TelegramChannel) => {
    if (!canWrite) return;

    try {
      await api.put(`/alerts/monitored-channels/${channel.id}`, {
        isActive: !channel.isActive
      });
      await fetchMonitoredChannels();
    } catch {
      setError("Error al cambiar el estado del canal");
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!canWrite) return;

    if (!window.confirm("¿Eliminar este canal?")) return;

    try {
      await api.delete(`/alerts/monitored-channels/${id}`);
      await fetchMonitoredChannels();
      await loadMessages(false); // Refrescar mensajes
    } catch {
      setError("Error al eliminar el canal");
    }
  };

  const handleReloadChannels = async () => {
    if (!canWrite) return;

    try {
      await api.post("/alerts/monitored-channels/reload");
    } catch {
      setError("Error al recargar los canales");
    }
  };

  if (loading) {
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
          Cargando alertas de Telegram...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<Telegram />}
        title="Alertas Telegram"
        subtitle={`${messages.length} mensajes · monitoreo de canales`}
        accentColor="#4a80c4"
        actions={
          <>
            {canWrite && (
              <Button
                startIcon={<Settings />}
                variant="outlined"
                size="small"
                onClick={handleOpenChannelsDialog}
              >
                Canales
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => loadMessages(false)}
              disabled={refreshing}
            >
              <Refresh
                fontSize="small"
                sx={{
                  animation: refreshing ? "spin 1s linear infinite" : undefined,
                  "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } }
                }}
              />
            </IconButton>
          </>
        }
      />

      <Container maxWidth="xl">
        {/* Filtros */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            bgcolor: "background.paper",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                placeholder="Buscar en mensajes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255, 255, 255, 0.05)"
                  }
                }}
              />
              {channels.length > 1 && (
                <Autocomplete
                  sx={{ minWidth: 250 }}
                  options={channels}
                  value={selectedChannel}
                  onChange={(_, newValue) => setSelectedChannel(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Filtrar por canal"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <FilterList sx={{ color: "text.secondary", mr: 1, ml: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "rgba(255, 255, 255, 0.05)"
                        }
                      }}
                    />
                  )}
                />
              )}
              {selectedChannel && (
                <Chip
                  label={`${filteredMessages.length} resultados`}
                  onDelete={() => setSelectedChannel(null)}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Feed de mensajes */}
        <Stack spacing={2}>
          {filteredMessages.length === 0 ? (
            <Card elevation={0} sx={{ bgcolor: "background.paper", p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No se encontraron mensajes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || selectedChannel
                  ? "Intenta con otros filtros"
                  : "Aún no hay mensajes del canal"}
              </Typography>
            </Card>
          ) : (
            filteredMessages.map((message, index) => (
              <Fade in timeout={300 + index * 50} key={message.id}>
                <Card
                  elevation={0}
                  sx={{
                    bgcolor: "background.paper",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
                      transform: "translateY(-2px)"
                    }
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2}>
                      {/* Avatar del canal */}
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "primary.main"
                        }}
                      >
                        <Telegram />
                      </Avatar>

                      {/* Contenido */}
                      <Box sx={{ flex: 1 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {message.channelName}
                          </Typography>
                          <Chip
                            label={formatDate(message.date)}
                            size="small"
                            icon={<AccessTime sx={{ fontSize: 14 }} />}
                            sx={{
                              bgcolor: "rgba(148, 163, 184, 0.1)",
                              color: "text.secondary",
                              height: 24
                            }}
                          />
                        </Stack>

                        <Typography
                          variant="body1"
                          sx={{
                            color: "text.primary",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            lineHeight: 1.6,
                            mb: 1
                          }}
                        >
                          {message.content}
                        </Typography>

                        <Divider sx={{ my: 1.5, borderColor: "rgba(255, 255, 255, 0.1)" }} />

                        <Stack direction="row" spacing={1}>
                          <Chip
                            icon={<Telegram sx={{ fontSize: 14 }} />}
                            label="Telegram"
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: "rgba(59, 130, 246, 0.3)",
                              color: "#60a5fa"
                            }}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>
            ))
          )}
        </Stack>
      </Container>

      {/* Diálogo de gestión de canales de Telegram */}
      <Dialog 
        open={channelsDialogOpen} 
        onClose={() => setChannelsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Canales de Telegram Monitoreados
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {loadingChannels ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : monitoredChannels.length === 0 ? (
              <Alert severity="info">
                No hay canales configurados. Agrega uno para empezar a recibir mensajes.
              </Alert>
            ) : (
              monitoredChannels.map((channel) => (
                <Paper key={channel.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body1" fontWeight="medium">
                          {channel.username}
                        </Typography>
                        <Chip
                          label={channel.isActive ? "Activo" : "Inactivo"}
                          color={channel.isActive ? "success" : "default"}
                          size="small"
                        />
                      </Stack>
                      {channel.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {channel.description}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Switch
                        checked={channel.isActive}
                        onChange={() => handleToggleChannel(channel)}
                        size="small"
                        disabled={!canWrite}
                      />
                      {canWrite && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenChannelForm(channel)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteChannel(channel.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {canWrite && (
            <Button startIcon={<Refresh />} onClick={handleReloadChannels} size="large">
              Recargar Servicio
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setChannelsDialogOpen(false)} size="large">
            Cerrar
          </Button>
          {canWrite && (
            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={() => handleOpenChannelForm()}
              size="large"
            >
              Agregar Canal
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo de formulario de canal */}
      <Dialog open={channelFormOpen} onClose={requestCloseChannelForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingChannel ? "Editar Canal" : "Nuevo Canal"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 1 }}>
            <TextField
              label="Nombre de usuario"
              value={channelForm.username}
              onChange={(e) =>
                setChannelForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="@nombre_canal"
              helperText="Incluir @ al inicio (ej: @pepito)"
              fullWidth
              required
            />
            <TextField
              label="Descripción"
              value={channelForm.description}
              onChange={(e) =>
                setChannelForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descripción opcional del canal"
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={requestCloseChannelForm} size="large">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveChannel}
            variant="contained"
            disabled={!channelForm.username.trim()}
            size="large"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TelegramAlerts;
