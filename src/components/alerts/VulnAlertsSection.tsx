import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { api } from "../../shared/utils/api";
import type {
  AlertSubscriptionEntity,
  VulnEnvironment,
  VulnWatchProfile,
} from "../../shared/types";
import VulnProfileDialog from "./VulnProfileDialog";
import VulnSubscriptionDialog, {
  type VulnSubscriptionForm,
} from "./VulnSubscriptionDialog";

const ENV_LABELS: Record<VulnEnvironment, string> = {
  APP: "App",
  IT: "IT",
  OT: "OT",
  OTHER: "Otro",
};

interface VulnAlertsSectionProps {
  canWrite: boolean;
  subscriptions: AlertSubscriptionEntity[];
  saving: boolean;
  executing: string | null;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onToggleSubscription: (subscription: AlertSubscriptionEntity) => void;
  onDeleteSubscription: (subscriptionId: string) => void;
  onExecuteManualCheck: () => void;
  saveSubscription: (params: {
    sourceKey: "vuln-monitor";
    subscriptionId: string | null;
    channelId: string | null;
    formLabel: string;
    chatIds: string[];
    name: string;
    enabled: boolean;
    settings: Record<string, unknown>;
  }) => Promise<void>;
}

const VulnAlertsSection: React.FC<VulnAlertsSectionProps> = ({
  canWrite,
  subscriptions,
  saving,
  executing,
  onRefresh,
  onError,
  onToggleSubscription,
  onDeleteSubscription,
  onExecuteManualCheck,
  saveSubscription,
}) => {
  const [profiles, setProfiles] = useState<VulnWatchProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VulnWatchProfile | null>(null);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<AlertSubscriptionEntity | null>(null);

  const vulnSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.source?.key === "vuln-monitor"),
    [subscriptions]
  );

  const fetchProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const response = await api.get("/alerts/vuln-profiles");
      setProfiles(response.data || []);
    } catch (err: any) {
      onError(err?.response?.data?.message || "No se pudieron cargar los perfiles.");
    } finally {
      setLoadingProfiles(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const openProfileDialog = (profile?: VulnWatchProfile) => {
    if (!canWrite) return;
    setEditingProfile(profile || null);
    setProfileDialogOpen(true);
  };

  const handleDeleteProfile = async (id: string) => {
    if (!canWrite) return;
    if (!window.confirm("¿Eliminar este perfil de inventario?")) return;
    try {
      await api.delete(`/alerts/vuln-profiles/${id}`);
      await fetchProfiles();
      await onRefresh();
    } catch (err: any) {
      onError(err?.response?.data?.message || "No se pudo eliminar el perfil.");
    }
  };

  const openSubscriptionDialog = (subscription?: AlertSubscriptionEntity) => {
    if (!canWrite) return;
    if (!subscription && profiles.length === 0) {
      onError("Creá un perfil con tus paquetes antes de suscribirte.");
      return;
    }
    setEditingSubscription(subscription || null);
    setSubscriptionDialogOpen(true);
  };

  const handleSaveSubscription = async (form: VulnSubscriptionForm) => {
    await saveSubscription({
      sourceKey: "vuln-monitor",
      subscriptionId: form.id,
      channelId: form.channelId,
      formLabel: `${form.name || "Vuln"} - Telegram`,
      chatIds: form.chatIds,
      name: form.name || "Alertas de vulnerabilidades",
      enabled: form.enabled,
      settings: {
        profileIds: form.profileIds,
        severities: form.severities,
        cvssMin: form.cvssMin ? Number(form.cvssMin) : null,
        epssMin: form.epssMin ? Number(form.epssMin) : null,
        isKevOnly: form.isKevOnly,
        sources: [],
        keywords: form.keywords,
      },
    });
    setSubscriptionDialogOpen(false);
    setEditingSubscription(null);
  };

  const profileNameById = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [profiles]);

  const renderSubscriptionCard = (subscription: AlertSubscriptionEntity) => {
    const settings = (subscription.settings || {}) as Record<string, any>;
    const profileIds: string[] = settings.profileIds || [];
    const severities: string[] = settings.severities || ["CRITICAL", "HIGH"];
    const chatIds = subscription.deliveryChannel?.chatIds
      ? Array.isArray(subscription.deliveryChannel.chatIds)
        ? subscription.deliveryChannel.chatIds
        : [subscription.deliveryChannel.chatIds]
      : subscription.deliveryChannel?.chatId
      ? [subscription.deliveryChannel.chatId]
      : [];

    return (
      <Card key={subscription.id}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography variant="h6">{subscription.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Vuln Monitor
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={subscription.enabled}
                  onChange={() => onToggleSubscription(subscription)}
                  disabled={!canWrite}
                />
              }
              label={subscription.enabled ? "Activo" : "Inactivo"}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Perfiles:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {profileIds.length === 0 ? (
              <Typography variant="body2">Sin perfiles</Typography>
            ) : (
              profileIds.map((id) => (
                <Chip
                  key={id}
                  label={profileNameById.get(id) || id}
                  size="small"
                  color="primary"
                  sx={{ mb: 1 }}
                />
              ))
            )}
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {severities.map((sev) => (
              <Chip key={sev} label={sev} size="small" variant="outlined" sx={{ mb: 1 }} />
            ))}
            {settings.isKevOnly && (
              <Chip label="Solo KEV" size="small" color="warning" sx={{ mb: 1 }} />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Chat IDs:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {chatIds.length === 0 ? (
              <Typography variant="body2">No configurado</Typography>
            ) : (
              chatIds.map((id) => (
                <Chip key={id} label={id} size="small" sx={{ mb: 1 }} />
              ))
            )}
          </Stack>
        </CardContent>
        {canWrite && (
          <CardActions>
            <Button
              size="small"
              startIcon={<Edit fontSize="small" />}
              onClick={() => openSubscriptionDialog(subscription)}
            >
              Editar
            </Button>
            <Button
              size="small"
              color="success"
              variant="outlined"
              disabled={executing === "all"}
              onClick={onExecuteManualCheck}
            >
              {executing === "all" ? "Ejecutando..." : "Ejecutar"}
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<Delete fontSize="small" />}
              onClick={() => onDeleteSubscription(subscription.id)}
            >
              Eliminar
            </Button>
          </CardActions>
        )}
      </Card>
    );
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6">Inventario (perfiles)</Typography>
            <Typography variant="body2" color="text.secondary">
              Paquetes, productos y sistemas que querés vigilar
            </Typography>
          </Box>
          {canWrite && (
            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={() => openProfileDialog()}
            >
              Nuevo perfil
            </Button>
          )}
        </Stack>
        {loadingProfiles ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : profiles.length === 0 ? (
          <Alert severity="info">
            Creá un perfil con tus paquetes (nginx, postgresql, Siemens S7…) antes
            de configurar alertas.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {profiles.map((profile) => (
              <Card key={profile.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1">{profile.name}</Typography>
                        <Chip
                          label={ENV_LABELS[profile.environment]}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      {profile.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {profile.description}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {profile.items.length} item(s):{" "}
                        {profile.items
                          .slice(0, 4)
                          .map((i) => i.label)
                          .join(", ")}
                        {profile.items.length > 4 ? "…" : ""}
                      </Typography>
                    </Box>
                    {canWrite && (
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => openProfileDialog(profile)}>
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteProfile(profile.id)}
                        >
                          Eliminar
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">Suscripciones de vulnerabilidades</Typography>
          {canWrite && (
            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={() => openSubscriptionDialog()}
              disabled={profiles.length === 0}
            >
              Nueva alerta vuln
            </Button>
          )}
        </Stack>
        {vulnSubscriptions.length === 0 ? (
          <Alert severity="info">
            {profiles.length === 0
              ? "Primero creá un perfil de inventario."
              : "Todavía no configuraste alertas de CVEs por perfil."}
          </Alert>
        ) : (
          <Stack spacing={2}>
            {vulnSubscriptions.map(renderSubscriptionCard)}
          </Stack>
        )}
      </Paper>

      <VulnProfileDialog
        open={profileDialogOpen}
        profile={editingProfile}
        onClose={() => {
          setProfileDialogOpen(false);
          setEditingProfile(null);
        }}
        onSaved={async () => {
          await fetchProfiles();
        }}
        onError={onError}
      />

      <VulnSubscriptionDialog
        open={subscriptionDialogOpen}
        subscription={editingSubscription}
        profiles={profiles}
        onClose={() => {
          setSubscriptionDialogOpen(false);
          setEditingSubscription(null);
        }}
        onSave={handleSaveSubscription}
        saving={saving}
        onError={onError}
      />
    </Stack>
  );
};

export default VulnAlertsSection;
