import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../../shared/utils/api";
import type {
  AlertSubscriptionEntity,
  VulnAlertPreviewResult,
  VulnWatchProfile,
} from "../../shared/types";
import ChipInput from "./ChipInput";

const SEVERITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export type VulnSubscriptionForm = {
  id: string | null;
  channelId: string | null;
  name: string;
  enabled: boolean;
  profileIds: string[];
  severities: string[];
  cvssMin: string;
  epssMin: string;
  isKevOnly: boolean;
  keywords: string[];
  chatIds: string[];
};

export const defaultVulnSubscriptionForm = (): VulnSubscriptionForm => ({
  id: null,
  channelId: null,
  name: "",
  enabled: true,
  profileIds: [],
  severities: ["CRITICAL", "HIGH"],
  cvssMin: "",
  epssMin: "",
  isKevOnly: false,
  keywords: [],
  chatIds: [],
});

interface VulnSubscriptionDialogProps {
  open: boolean;
  subscription: AlertSubscriptionEntity | null;
  profiles: VulnWatchProfile[];
  onClose: () => void;
  onSave: (form: VulnSubscriptionForm) => Promise<void>;
  saving: boolean;
  onError: (message: string) => void;
}

const VulnSubscriptionDialog: React.FC<VulnSubscriptionDialogProps> = ({
  open,
  subscription,
  profiles,
  onClose,
  onSave,
  saving,
  onError,
}) => {
  const [form, setForm] = useState<VulnSubscriptionForm>(defaultVulnSubscriptionForm());
  const [preview, setPreview] = useState<VulnAlertPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const initialRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = subscription
      ? (() => {
          const settings = (subscription.settings || {}) as Record<string, any>;
          const chatIds = subscription.deliveryChannel?.chatIds
            ? Array.isArray(subscription.deliveryChannel.chatIds)
              ? subscription.deliveryChannel.chatIds
              : [subscription.deliveryChannel.chatIds]
            : subscription.deliveryChannel?.chatId
            ? [subscription.deliveryChannel.chatId]
            : [];
          return {
            id: subscription.id,
            channelId: subscription.deliveryChannel?.id ?? null,
            name: subscription.name,
            enabled: subscription.enabled,
            profileIds: settings.profileIds || [],
            severities: settings.severities?.length
              ? settings.severities
              : ["CRITICAL", "HIGH"],
            cvssMin:
              settings.cvssMin != null ? String(settings.cvssMin) : "",
            epssMin:
              settings.epssMin != null ? String(settings.epssMin) : "",
            isKevOnly: Boolean(settings.isKevOnly),
            keywords: settings.keywords || [],
            chatIds,
          };
        })()
      : defaultVulnSubscriptionForm();
    setForm(next);
    setPreview(null);
    initialRef.current = JSON.stringify(next);
  }, [open, subscription]);

  const requestClose = () => {
    const dirty =
      initialRef.current !== null &&
      JSON.stringify(form) !== initialRef.current;
    if (dirty && !window.confirm("¿Descartar cambios sin guardar?")) return;
    initialRef.current = null;
    onClose();
  };

  const runPreview = async () => {
    if (form.profileIds.length === 0) {
      onError("Seleccioná al menos un perfil para la vista previa.");
      return;
    }
    setPreviewLoading(true);
    try {
      const response = await api.post("/alerts/vuln/preview", {
        profileIds: form.profileIds,
        severities: form.severities,
        cvssMin: form.cvssMin ? Number(form.cvssMin) : null,
        epssMin: form.epssMin ? Number(form.epssMin) : null,
        isKevOnly: form.isKevOnly,
        keywords: form.keywords,
        days: 7,
      });
      setPreview(response.data);
    } catch (err: any) {
      onError(err?.response?.data?.message || "No se pudo obtener la vista previa.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    if (form.profileIds.length === 0) {
      onError("Seleccioná al menos un perfil de inventario.");
      return;
    }
    if (form.chatIds.length === 0) {
      onError("Configurá al menos un Chat ID de Telegram.");
      return;
    }
    try {
      await onSave(form);
      initialRef.current = null;
    } catch {
      /* handled by parent */
    }
  };

  const selectedProfiles = profiles.filter((p) =>
    form.profileIds.includes(p.id)
  );

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {form.id ? "Editar alerta de vulnerabilidades" : "Nueva alerta de vulnerabilidades"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ py: 1 }}>
          <TextField
            label="Nombre de la alerta"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ej: CVEs stack web prod"
            fullWidth
            required
          />

          <Autocomplete
            multiple
            options={profiles}
            getOptionLabel={(option) => option.name}
            value={selectedProfiles}
            onChange={(_, newValue) =>
              setForm((p) => ({
                ...p,
                profileIds: newValue.map((v) => v.id),
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Perfiles de inventario"
                helperText="OR entre perfiles: alerta si el CVE toca cualquiera"
                required
              />
            )}
            isOptionEqualToValue={(a, b) => a.id === b.id}
          />

          <Autocomplete
            multiple
            options={SEVERITY_OPTIONS}
            value={form.severities}
            onChange={(_, newValue) =>
              setForm((p) => ({ ...p, severities: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Severidades"
                helperText="Por defecto: Critical + High"
              />
            )}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="CVSS mínimo (opcional)"
              type="number"
              inputProps={{ min: 0, max: 10, step: 0.1 }}
              value={form.cvssMin}
              onChange={(e) => setForm((p) => ({ ...p, cvssMin: e.target.value }))}
              fullWidth
            />
            <TextField
              label="EPSS mínimo (opcional)"
              type="number"
              inputProps={{ min: 0, max: 1, step: 0.01 }}
              value={form.epssMin}
              onChange={(e) => setForm((p) => ({ ...p, epssMin: e.target.value }))}
              fullWidth
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={form.isKevOnly}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isKevOnly: e.target.checked }))
                }
              />
            }
            label="Solo CVEs en catálogo KEV (CISA)"
          />

          <ChipInput
            label="Palabras clave adicionales (opcional)"
            values={form.keywords}
            onChange={(keywords) => setForm((p) => ({ ...p, keywords }))}
            placeholder="Agregar keyword"
            helperText="AND con match de perfil: el CVE debe contener la keyword"
          />

          <ChipInput
            label="Telegram Chat IDs"
            values={form.chatIds}
            onChange={(chatIds) => setForm((p) => ({ ...p, chatIds }))}
            placeholder="Agregar Chat ID"
            helperText="Chat o canal donde recibirás las alertas"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.enabled}
                onChange={(e) =>
                  setForm((p) => ({ ...p, enabled: e.target.checked }))
                }
              />
            }
            label="Activar alerta"
          />

          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">Vista previa (7 días)</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={runPreview}
                disabled={previewLoading || form.profileIds.length === 0}
              >
                {previewLoading ? "Calculando..." : "Calcular preview"}
              </Button>
            </Stack>
            {previewLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {preview && !previewLoading && (
              <Stack spacing={1}>
                <Typography variant="body2">
                  En los últimos {preview.days} días habrían disparado{" "}
                  <strong>{preview.totalMatches}</strong> alertas.
                </Typography>
                {preview.samples.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No hay CVEs recientes que coincidan con estos criterios.
                  </Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>CVE</TableCell>
                        <TableCell>Severidad</TableCell>
                        <TableCell>Perfiles</TableCell>
                        <TableCell>Match</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.samples.map((sample, idx) => (
                        <TableRow key={`${sample.cveId}-${idx}`}>
                          <TableCell>{sample.cveId || "—"}</TableCell>
                          <TableCell>{sample.severity || "—"}</TableCell>
                          <TableCell>{sample.matchedProfiles.join(", ")}</TableCell>
                          <TableCell>
                            {sample.matchedOn.slice(0, 2).join("; ")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={requestClose} size="large">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={
            saving ||
            !form.name ||
            form.profileIds.length === 0 ||
            form.chatIds.length === 0
          }
          size="large"
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VulnSubscriptionDialog;
