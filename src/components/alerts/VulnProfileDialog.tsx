import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { api } from "../../shared/utils/api";
import type { VulnEnvironment, VulnWatchProfile } from "../../shared/types";

export type VulnProfileItemForm = {
  label: string;
  query: string;
  vendor: string;
  product: string;
  ecosystem: string;
};

export type VulnProfileForm = {
  name: string;
  description: string;
  environment: VulnEnvironment;
  items: VulnProfileItemForm[];
};

const emptyItem = (): VulnProfileItemForm => ({
  label: "",
  query: "",
  vendor: "",
  product: "",
  ecosystem: "",
});

const defaultForm = (): VulnProfileForm => ({
  name: "",
  description: "",
  environment: "OTHER",
  items: [emptyItem()],
});

interface VulnProfileDialogProps {
  open: boolean;
  profile: VulnWatchProfile | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

const VulnProfileDialog: React.FC<VulnProfileDialogProps> = ({
  open,
  profile,
  onClose,
  onSaved,
  onError,
}) => {
  const [form, setForm] = useState<VulnProfileForm>(defaultForm());
  const [saving, setSaving] = useState(false);
  const initialRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = profile
      ? {
          name: profile.name,
          description: profile.description || "",
          environment: profile.environment,
          items: profile.items.map((item) => ({
            label: item.label,
            query: item.query,
            vendor: item.vendor || "",
            product: item.product || "",
            ecosystem: item.ecosystem || "",
          })),
        }
      : defaultForm();
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [open, profile]);

  const requestClose = () => {
    const dirty =
      initialRef.current !== null &&
      JSON.stringify(form) !== initialRef.current;
    if (dirty && !window.confirm("¿Descartar cambios sin guardar?")) return;
    initialRef.current = null;
    onClose();
  };

  const updateItem = (index: number, patch: Partial<VulnProfileItemForm>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      onError("El nombre del perfil es obligatorio.");
      return;
    }
    const validItems = form.items.filter(
      (item) => item.label.trim() && item.query.trim()
    );
    if (validItems.length === 0) {
      onError("Agregá al menos un item con etiqueta y término de búsqueda.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        environment: form.environment,
        items: validItems.map((item) => ({
          label: item.label.trim(),
          query: item.query.trim(),
          vendor: item.vendor.trim() || undefined,
          product: item.product.trim() || undefined,
          ecosystem: item.ecosystem.trim() || undefined,
        })),
      };

      if (profile) {
        await api.put(`/alerts/vuln-profiles/${profile.id}`, payload);
      } else {
        await api.post("/alerts/vuln-profiles", payload);
      }
      initialRef.current = null;
      onSaved();
      onClose();
    } catch (err: any) {
      onError(err?.response?.data?.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {profile ? "Editar perfil de inventario" : "Nuevo perfil de inventario"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ py: 1 }}>
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ej: Stack web prod"
            fullWidth
            required
          />
          <TextField
            label="Descripción"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            multiline
            rows={2}
            fullWidth
          />
          <TextField
            select
            label="Entorno"
            value={form.environment}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                environment: e.target.value as VulnEnvironment,
              }))
            }
            fullWidth
          >
            <MenuItem value="APP">Aplicaciones</MenuItem>
            <MenuItem value="IT">IT</MenuItem>
            <MenuItem value="OT">OT</MenuItem>
            <MenuItem value="OTHER">Otro</MenuItem>
          </TextField>

          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">Items del inventario</Typography>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() =>
                  setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }))
                }
              >
                Agregar item
              </Button>
            </Stack>
            <Stack spacing={2}>
              {form.items.map((item, index) => (
                <Box
                  key={`item-${index}`}
                  sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
                >
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Item {index + 1}
                    </Typography>
                    {form.items.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            items: p.items.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                  <Stack spacing={2}>
                    <TextField
                      label="Etiqueta"
                      value={item.label}
                      onChange={(e) => updateItem(index, { label: e.target.value })}
                      placeholder="nginx prod"
                      size="small"
                      fullWidth
                      required
                    />
                    <TextField
                      label="Término de búsqueda"
                      value={item.query}
                      onChange={(e) => updateItem(index, { query: e.target.value })}
                      placeholder="nginx, lodash, siemens"
                      size="small"
                      fullWidth
                      required
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Vendor (opcional)"
                        value={item.vendor}
                        onChange={(e) => updateItem(index, { vendor: e.target.value })}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label="Product (opcional)"
                        value={item.product}
                        onChange={(e) => updateItem(index, { product: e.target.value })}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label="Ecosystem (opcional)"
                        value={item.ecosystem}
                        onChange={(e) =>
                          updateItem(index, { ecosystem: e.target.value })
                        }
                        placeholder="npm, pip, cpe"
                        size="small"
                        fullWidth
                      />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
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
          disabled={saving || !form.name.trim()}
          size="large"
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VulnProfileDialog;
