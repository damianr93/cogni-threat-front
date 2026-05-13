import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  DeleteOutline,
  Refresh,
  Science,
  Telegram as TelegramIcon,
  VpnKey,
} from "@mui/icons-material";
import PageHeader from "../shared/components/PageHeader";
import { api } from "../shared/utils/api";

type SecretSource = "db" | "env" | "none";

interface SecretDescriptor {
  key: string;
  label: string;
  isConfigured: boolean;
  source: SecretSource;
  maskedValue: string | null;
}

interface TestResult {
  ok: boolean | null;
  message: string;
}

interface TelegramStatus {
  isConnected: boolean;
  channels: string[];
  monitoringCount: number;
  pendingLogin: boolean;
}

const SESSION_KEY = "telegram_session_string";
const AI_KEYS = new Set([
  "ollama_url",
  "ollama_model",
  "ollama_embedding_model",
  "ollama_timeout_ms",
  "rag_retrieve_candidates",
  "rag_chat_temperature",
  "rag_chat_num_ctx",
  "rag_query_max_chars",
  "rag_query_instruct",
]);
const SENSITIVE_KEYS = new Set([
  "nvd_api_key",
  "github_token",
  "ransomware_api_key",
  "telegram_api_id",
  "telegram_api_hash",
  "telegram_session_string",
  "bot_token",
]);

const sourceChip = (source: SecretSource) => {
  if (source === "db") return <Chip size="small" label="Panel" color="success" variant="outlined" />;
  if (source === "env") return <Chip size="small" label=".env" color="warning" variant="outlined" />;
  return <Chip size="small" label="Sin configurar" color="default" variant="outlined" />;
};

const SecretsPanel: React.FC = () => {
  const [secrets, setSecrets] = useState<SecretDescriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  // Edit dialog
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Telegram
  const [telegram, setTelegram] = useState<TelegramStatus | null>(null);
  const [tgOpen, setTgOpen] = useState(false);

  const loadSecrets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<SecretDescriptor[]>("/admin/secrets");
      setSecrets(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "No se pudieron cargar los secretos");
    } finally {
      setLoading(false);
    }
  };

  const loadTelegramStatus = async () => {
    try {
      const response = await api.get<TelegramStatus>("/admin/secrets/telegram/status");
      setTelegram(response.data);
    } catch {
      setTelegram(null);
    }
  };

  useEffect(() => {
    loadSecrets();
    loadTelegramStatus();
  }, []);

  const openEdit = (secret: SecretDescriptor) => {
    setEditKey(secret.key);
    setEditLabel(secret.label);
    setEditValue("");
    setError(null);
  };

  const sortedSecrets = [...secrets].sort((a, b) => {
    const aGroup = AI_KEYS.has(a.key) ? 1 : 0;
    const bGroup = AI_KEYS.has(b.key) ? 1 : 0;
    return aGroup === bGroup ? a.label.localeCompare(b.label) : aGroup - bGroup;
  });

  const closeEdit = () => {
    setEditKey(null);
    setEditValue("");
  };

  const saveSecret = async () => {
    if (!editKey || editValue.trim().length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/secrets/${editKey}`, { value: editValue.trim() });
      closeEdit();
      await loadSecrets();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "No se pudo guardar el secreto");
    } finally {
      setSaving(false);
    }
  };

  const clearSecret = async (secret: SecretDescriptor) => {
    if (!window.confirm(`¿Borrar "${secret.label}" del panel? Volverá a usar el valor de .env si existe.`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/admin/secrets/${secret.key}`);
      await loadSecrets();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "No se pudo borrar el secreto");
    }
  };

  const testSecret = async (key: string, value?: string) => {
    setTestResults((prev) => ({ ...prev, [key]: { ok: null, message: "Probando..." } }));
    try {
      const response = await api.post<TestResult>(`/admin/secrets/${key}/test`, value ? { value } : {});
      setTestResults((prev) => ({ ...prev, [key]: response.data }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [key]: { ok: false, message: err.response?.data?.message ?? "Error al probar" },
      }));
    }
  };

  const renderTest = (key: string) => {
    const result = testResults[key];
    if (!result) return null;
    const color = result.ok === true ? "success.main" : result.ok === false ? "error.main" : "text.secondary";
    return (
      <Typography variant="caption" sx={{ color, display: "block", mt: 0.5 }}>
        {result.message}
      </Typography>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<VpnKey />}
        title="Fuentes, credenciales e IA"
        subtitle="Gestión de APIs externas, Telegram y configuración Ollama/RAG"
        accentColor="#4a90d9"
        actions={
          <IconButton size="small" onClick={() => { loadSecrets(); loadTelegramStatus(); }} disabled={loading}>
            <Refresh fontSize="small" />
          </IconButton>
        }
      />

      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Alert severity="info" sx={{ mb: 2 }}>
          CogniThreat uses Ollama as the built-in open-source AI provider. If you change the embedding model,
          keep the same vector dimension or update backend EMBEDDING_DIM and reindex embeddings.
        </Alert>

        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Credencial</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Box py={4}><CircularProgress /></Box>
                  </TableCell>
                </TableRow>
              ) : (
                sortedSecrets.map((secret, index) => {
                  const isSession = secret.key === SESSION_KEY;
                  const groupLabel = AI_KEYS.has(secret.key) ? "IA / Ollama" : "Fuentes externas";
                  const previous = sortedSecrets[index - 1];
                  const showGroup = !previous || AI_KEYS.has(previous.key) !== AI_KEYS.has(secret.key);
                  return (
                    <React.Fragment key={secret.key}>
                      {showGroup ? (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ bgcolor: "action.hover" }}>
                            <Typography variant="subtitle2" color="text.secondary">{groupLabel}</Typography>
                          </TableCell>
                        </TableRow>
                      ) : null}
                      <TableRow>
                        <TableCell>
                          <Typography fontWeight={600}>{secret.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{secret.key}</Typography>
                          {renderTest(secret.key)}
                        </TableCell>
                        <TableCell>{sourceChip(secret.source)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {secret.maskedValue ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {isSession ? (
                              <Chip size="small" label="Se gestiona en Conexión Telegram" variant="outlined" />
                            ) : (
                              <>
                                <Button size="small" variant="outlined" onClick={() => openEdit(secret)}>
                                  {secret.isConfigured ? "Cambiar" : "Configurar"}
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<Science />}
                                  disabled={!secret.isConfigured}
                                  onClick={() => testSecret(secret.key)}
                                >
                                  Probar
                                </Button>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={secret.source !== "db"}
                                  onClick={() => clearSecret(secret)}
                                >
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Telegram connection card */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <TelegramIcon color="primary" />
            <Typography variant="h6" sx={{ flex: 1 }}>Conexión Telegram (MTProto)</Typography>
            <Chip
              size="small"
              label={telegram?.isConnected ? "Conectado" : "Desconectado"}
              color={telegram?.isConnected ? "success" : "default"}
              variant="outlined"
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Monitoreando {telegram?.monitoringCount ?? 0} canal(es). El login genera la session cifrada sin tocar el
            servidor. Requiere configurar antes API ID y API Hash.
          </Typography>
          <Button variant="contained" startIcon={<TelegramIcon />} onClick={() => setTgOpen(true)}>
            {telegram?.isConnected ? "Reconectar cuenta" : "Conectar cuenta"}
          </Button>
        </Paper>
      </Container>

      {/* Edit secret dialog */}
      <Dialog open={editKey !== null} onClose={closeEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar: {editLabel}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ py: 1 }}>
            <TextField
              label="Nuevo valor"
              type={editKey && !SENSITIVE_KEYS.has(editKey) ? "text" : "password"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              fullWidth
              autoComplete="off"
              helperText={editKey && AI_KEYS.has(editKey)
                ? "La configuración se guarda cifrada y reemplaza el fallback de .env."
                : "El valor se cifra al guardar y nunca se vuelve a mostrar."}
            />
            {editKey && renderTest(editKey)}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => editKey && testSecret(editKey, editValue.trim())}
            disabled={editValue.trim().length === 0}
          >
            Probar
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeEdit}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={saveSecret}
            disabled={saving || editValue.trim().length === 0}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Telegram login stepper dialog */}
      <TelegramLoginDialog
        open={tgOpen}
        onClose={() => setTgOpen(false)}
        onSuccess={() => { setTgOpen(false); loadTelegramStatus(); loadSecrets(); }}
      />
    </Box>
  );
};

// --- Telegram login flow (phone → code → optional 2FA) ---

interface TelegramLoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ["Teléfono", "Código", "2FA"];

const TelegramLoginDialog: React.FC<TelegramLoginDialogProps> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(0); setPhone(""); setCode(""); setPassword(""); setBusy(false); setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const start = async () => {
    setBusy(true); setError(null);
    try {
      await api.post("/admin/secrets/telegram/login/start", { phone: phone.trim() });
      setStep(1);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "No se pudo iniciar el login");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true); setError(null);
    try {
      const res = await api.post<{ passwordRequired?: boolean; success?: boolean }>(
        "/admin/secrets/telegram/login/verify",
        { code: code.trim() },
      );
      if (res.data?.passwordRequired) {
        setStep(2);
      } else {
        reset();
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Código inválido");
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async () => {
    setBusy(true); setError(null);
    try {
      await api.post("/admin/secrets/telegram/login/password", { password });
      reset();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Contraseña 2FA inválida");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Conectar cuenta de Telegram</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 0 && (
          <TextField
            label="Número de teléfono"
            placeholder="+5491123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            helperText="Con código de país. Telegram enviará un código de verificación."
          />
        )}
        {step === 1 && (
          <TextField
            label="Código de verificación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            fullWidth
            autoComplete="off"
            helperText="Revisá el código que te llegó por Telegram."
          />
        )}
        {step === 2 && (
          <TextField
            label="Contraseña 2FA"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            autoComplete="off"
            helperText="Tu cuenta tiene verificación en dos pasos."
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={busy}>Cancelar</Button>
        {step === 0 && (
          <Button variant="contained" onClick={start} disabled={busy || phone.trim().length === 0}>
            {busy ? "Enviando..." : "Enviar código"}
          </Button>
        )}
        {step === 1 && (
          <Button variant="contained" onClick={verify} disabled={busy || code.trim().length === 0}>
            {busy ? "Verificando..." : "Verificar"}
          </Button>
        )}
        {step === 2 && (
          <Button variant="contained" onClick={submitPassword} disabled={busy || password.length === 0}>
            {busy ? "Validando..." : "Confirmar"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SecretsPanel;
