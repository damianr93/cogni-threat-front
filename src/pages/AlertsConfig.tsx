import PageHeader from "../shared/components/PageHeader";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Add, BugReport, Delete, Edit, Refresh, Settings, Telegram, Warning } from "@mui/icons-material";
import { api } from "../shared/utils/api";
import type { AlertSubscriptionEntity } from "../shared/types";
import { useCanWrite } from "../shared/hooks/useCanWrite";
import ChipInput from "../components/alerts/ChipInput";
import VulnAlertsSection from "../components/alerts/VulnAlertsSection";
import { softSurfaceSx, surfaceSx } from "../shared/ui/surface";

const AVAILABLE_COUNTRIES = [
  { code: "AF", name: "Afganistán" },
  { code: "AL", name: "Albania" },
  { code: "DE", name: "Alemania" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua y Barbuda" },
  { code: "SA", name: "Arabia Saudita" },
  { code: "DZ", name: "Argelia" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaiyán" },
  { code: "BS", name: "Bahamas" },
  { code: "BD", name: "Bangladés" },
  { code: "BB", name: "Barbados" },
  { code: "BH", name: "Baréin" },
  { code: "BE", name: "Bélgica" },
  { code: "BZ", name: "Belice" },
  { code: "BJ", name: "Benín" },
  { code: "BY", name: "Bielorrusia" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia y Herzegovina" },
  { code: "BW", name: "Botsuana" },
  { code: "BR", name: "Brasil" },
  { code: "BN", name: "Brunéi" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "BT", name: "Bután" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Camboya" },
  { code: "CM", name: "Camerún" },
  { code: "CA", name: "Canadá" },
  { code: "QA", name: "Catar" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CY", name: "Chipre" },
  { code: "VA", name: "Ciudad del Vaticano" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoras" },
  { code: "KP", name: "Corea del Norte" },
  { code: "KR", name: "Corea del Sur" },
  { code: "CI", name: "Costa de Marfil" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croacia" },
  { code: "CU", name: "Cuba" },
  { code: "DK", name: "Dinamarca" },
  { code: "DM", name: "Dominica" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egipto" },
  { code: "SV", name: "El Salvador" },
  { code: "AE", name: "Emiratos Árabes Unidos" },
  { code: "ER", name: "Eritrea" },
  { code: "SK", name: "Eslovaquia" },
  { code: "SI", name: "Eslovenia" },
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Etiopía" },
  { code: "PH", name: "Filipinas" },
  { code: "FI", name: "Finlandia" },
  { code: "FJ", name: "Fiyi" },
  { code: "FR", name: "Francia" },
  { code: "GA", name: "Gabón" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "GH", name: "Ghana" },
  { code: "GD", name: "Granada" },
  { code: "GR", name: "Grecia" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GQ", name: "Guinea Ecuatorial" },
  { code: "GW", name: "Guinea-Bisáu" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haití" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungría" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IQ", name: "Irak" },
  { code: "IR", name: "Irán" },
  { code: "IE", name: "Irlanda" },
  { code: "IS", name: "Islandia" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italia" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japón" },
  { code: "JO", name: "Jordania" },
  { code: "KZ", name: "Kazajistán" },
  { code: "KE", name: "Kenia" },
  { code: "KG", name: "Kirguistán" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "LA", name: "Laos" },
  { code: "LS", name: "Lesoto" },
  { code: "LV", name: "Letonia" },
  { code: "LB", name: "Líbano" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lituania" },
  { code: "LU", name: "Luxemburgo" },
  { code: "MK", name: "Macedonia del Norte" },
  { code: "MG", name: "Madagascar" },
  { code: "MY", name: "Malasia" },
  { code: "MW", name: "Malaui" },
  { code: "MV", name: "Maldivas" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MA", name: "Marruecos" },
  { code: "MU", name: "Mauricio" },
  { code: "MR", name: "Mauritania" },
  { code: "MX", name: "México" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldavia" },
  { code: "MC", name: "Mónaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar (Birmania)" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Níger" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Noruega" },
  { code: "NZ", name: "Nueva Zelanda" },
  { code: "OM", name: "Omán" },
  { code: "NL", name: "Países Bajos" },
  { code: "PK", name: "Pakistán" },
  { code: "PW", name: "Palaos" },
  { code: "PA", name: "Panamá" },
  { code: "PG", name: "Papúa Nueva Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Perú" },
  { code: "PL", name: "Polonia" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Reino Unido" },
  { code: "CF", name: "República Centroafricana" },
  { code: "CZ", name: "República Checa" },
  { code: "CG", name: "República del Congo" },
  { code: "CD", name: "República Democrática del Congo" },
  { code: "DO", name: "República Dominicana" },
  { code: "RW", name: "Ruanda" },
  { code: "RO", name: "Rumania" },
  { code: "RU", name: "Rusia" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "VC", name: "San Vicente y las Granadinas" },
  { code: "KN", name: "San Cristóbal y Nieves" },
  { code: "LC", name: "Santa Lucía" },
  { code: "ST", name: "Santo Tomé y Príncipe" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leona" },
  { code: "SG", name: "Singapur" },
  { code: "SY", name: "Siria" },
  { code: "SO", name: "Somalia" },
  { code: "LK", name: "Sri Lanka" },
  { code: "ZA", name: "Sudáfrica" },
  { code: "SD", name: "Sudán" },
  { code: "SS", name: "Sudán del Sur" },
  { code: "SE", name: "Suecia" },
  { code: "CH", name: "Suiza" },
  { code: "SR", name: "Surinam" },
  { code: "TH", name: "Tailandia" },
  { code: "TZ", name: "Tanzania" },
  { code: "TJ", name: "Tayikistán" },
  { code: "TL", name: "Timor Oriental" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad y Tobago" },
  { code: "TN", name: "Túnez" },
  { code: "TM", name: "Turkmenistán" },
  { code: "TR", name: "Turquía" },
  { code: "TV", name: "Tuvalu" },
  { code: "UA", name: "Ucrania" },
  { code: "UG", name: "Uganda" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistán" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "DJ", name: "Yibuti" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabue" },
];

type RansomwareForm = {
  id: string | null;
  channelId: string | null;
  name: string;
  enabled: boolean;
  countries: string[];
  chatIds: string[];
};

type TelegramForm = {
  id: string | null;
  channelId: string | null;
  name: string;
  enabled: boolean;
  channels: string[];
  keywords: string[];
  matchType: "any" | "all";
  chatIds: string[];
};

const defaultRansomwareForm: RansomwareForm = {
  id: null,
  channelId: null,
  name: "",
  enabled: true,
  countries: [],
  chatIds: [],
};

const defaultTelegramForm: TelegramForm = {
  id: null,
  channelId: null,
  name: "",
  enabled: true,
  channels: [],
  keywords: [],
  matchType: "any",
  chatIds: [],
};

interface TelegramChannel {
  id: string;
  username: string;
  description?: string;
  isActive: boolean;
}

const AlertsConfig: React.FC = () => {
  const canWrite = useCanWrite();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<AlertSubscriptionEntity[]>(
    []
  );
  const [telegramChannels, setTelegramChannels] = useState<string[]>([]);
  
  // Estados para gestión de canales de Telegram monitoreados
  const [channelsDialogOpen, setChannelsDialogOpen] = useState(false);
  const [monitoredChannels, setMonitoredChannels] = useState<TelegramChannel[]>([]);
  const [channelFormOpen, setChannelFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<TelegramChannel | null>(null);
  const [channelForm, setChannelForm] = useState({ username: "", description: "" });
  const [loadingChannels, setLoadingChannels] = useState(false);

  const [ransomDialogOpen, setRansomDialogOpen] = useState(false);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [ransomForm, setRansomForm] = useState<RansomwareForm>(
    defaultRansomwareForm
  );
  const [telegramForm, setTelegramForm] =
    useState<TelegramForm>(defaultTelegramForm);

  const ransomFormInitialRef = useRef<string | null>(null);
  const telegramFormInitialRef = useRef<string | null>(null);
  const channelFormInitialRef = useRef<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, telegramStatusRes] = await Promise.all([
        api.get("/alerts/subscriptions"),
        api.get("/alerts/telegram-status"),
      ]);

      setSubscriptions(subsRes.data || []);
      const channels = telegramStatusRes.data?.data?.channels || [];
      setTelegramChannels(Array.isArray(channels) ? channels : []);
    } catch (err: any) {
      console.error(err);
      setError("No se pudieron obtener las configuraciones de alertas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ransomwareSubscriptions = useMemo(
    () =>
      subscriptions.filter((item) => item.source?.key === "ransomware-live"),
    [subscriptions]
  );

  const telegramSubscriptions = useMemo(
    () =>
      subscriptions.filter((item) => item.source?.key === "telegram-channel"),
    [subscriptions]
  );

  const openRansomDialog =(subscription?: AlertSubscriptionEntity) => {
    if (!canWrite) return;

    const form = subscription
      ? (() => {
          const settings = (subscription.settings || {}) as Record<string, any>;
          const chatIds = subscription.deliveryChannel?.chatIds
            ? (Array.isArray(subscription.deliveryChannel.chatIds)
                ? subscription.deliveryChannel.chatIds
                : [subscription.deliveryChannel.chatIds])
            : subscription.deliveryChannel?.chatId
            ? [subscription.deliveryChannel.chatId]
            : [];
          return {
            id: subscription.id,
            channelId: subscription.deliveryChannel?.id ?? null,
            name: subscription.name,
            enabled: subscription.enabled,
            countries: settings.countries || [],
            chatIds,
          };
        })()
      : defaultRansomwareForm;
    setRansomForm(form);
    ransomFormInitialRef.current = JSON.stringify(form);
    setRansomDialogOpen(true);
  };

  const openTelegramDialog = (subscription?: AlertSubscriptionEntity) => {
    if (!canWrite) return;

    const form = subscription
      ? (() => {
          const settings = (subscription.settings || {}) as Record<string, any>;
          const chatIds = subscription.deliveryChannel?.chatIds
            ? (Array.isArray(subscription.deliveryChannel.chatIds)
                ? subscription.deliveryChannel.chatIds
                : [subscription.deliveryChannel.chatIds])
            : subscription.deliveryChannel?.chatId
            ? [subscription.deliveryChannel.chatId]
            : [];
          return {
            id: subscription.id,
            channelId: subscription.deliveryChannel?.id ?? null,
            name: subscription.name,
            enabled: subscription.enabled,
            channels: settings.channels || [],
            keywords: settings.keywords || [],
            matchType: (settings.matchType === "all" ? "all" : "any") as "all" | "any",
            chatIds,
          };
        })()
      : defaultTelegramForm;
    setTelegramForm(form);
    telegramFormInitialRef.current = JSON.stringify(form);
    setTelegramDialogOpen(true);
  };

  const ensureChannel =async (
    channelId: string | null,
    label: string,
    chatIds: string[]
  ): Promise<string> => {
    if (!canWrite) {
      throw new Error("No tienes permisos de escritura.");
    }

    if (chatIds.length === 0) {
      throw new Error(
        "Debes configurar al menos un Chat ID de Telegram."
      );
    }

    if (channelId) {
      await api.put(
        `/alerts/notification-channels/${channelId}`,
        {
          label,
          chatIds,
          type: "telegram",
        }
      );
      return channelId;
    }

    const response = await api.post(
      "/alerts/notification-channels",
      {
        label,
        chatIds,
        type: "telegram",
      }
    );
    return response.data?.id;
  };

  const saveSubscription = async (params: {
    sourceKey: "ransomware-live" | "telegram-channel" | "vuln-monitor";
    subscriptionId: string | null;
    channelId: string | null;
    formLabel: string;
    chatIds: string[];
    name: string;
    enabled: boolean;
    settings: Record<string, any>;
  }) => {
    const {
      sourceKey,
      subscriptionId,
      channelId,
      formLabel,
      chatIds,
      name,
      enabled,
      settings,
    } = params;

    setSaving(true);
    setError(null);
    try {
      const ensuredChannelId = await ensureChannel(
        channelId,
        formLabel,
        chatIds
      );

      if (subscriptionId) {
        await api.put(
          `/alerts/subscriptions/${subscriptionId}`,
          {
            name,
            enabled,
            deliveryChannelId: ensuredChannelId,
            settings,
          }
        );
      } else {
        await api.post("/alerts/subscriptions", {
          sourceKey,
          name,
          enabled,
          deliveryChannelId: ensuredChannelId,
          settings,
        });
      }

      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || "No se pudo guardar la configuración."
      );
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRansomware = async () => {
    try {
      await saveSubscription({
        sourceKey: "ransomware-live",
        subscriptionId: ransomForm.id,
        channelId: ransomForm.channelId,
        formLabel: `${ransomForm.name || "Ransomware"} - Telegram`,
        chatIds: ransomForm.chatIds,
        name: ransomForm.name || "Ransomware.live",
        enabled: ransomForm.enabled,
        settings: {
          countries: ransomForm.countries,
        },
      });
      ransomFormInitialRef.current = null;
      setRansomDialogOpen(false);
      setRansomForm(defaultRansomwareForm);
    } catch {
      /* handled arriba */
    }
  };

  const handleSaveTelegram = async () => {
    if (telegramForm.keywords.length === 0) {
      setError(
        "Debes configurar al menos una palabra clave para las alertas de Telegram."
      );
      return;
    }

    try {
      await saveSubscription({
        sourceKey: "telegram-channel",
        subscriptionId: telegramForm.id,
        channelId: telegramForm.channelId,
        formLabel: `${telegramForm.name || "Telegram"} - Alertas`,
        chatIds: telegramForm.chatIds,
        name: telegramForm.name || "Alertas de Telegram",
        enabled: telegramForm.enabled,
        settings: {
          channels: telegramForm.channels,
          keywords: telegramForm.keywords,
          matchType: telegramForm.matchType,
        },
      });
      telegramFormInitialRef.current = null;
      setTelegramDialogOpen(false);
      setTelegramForm(defaultTelegramForm);
    } catch {
      /* handled arriba */
    }
  };

  const handleToggleSubscription = async (
    subscription: AlertSubscriptionEntity
  ) => {
    if (!canWrite) return;

    try {
      await api.put(
        `/alerts/subscriptions/${subscription.id}`,
        {
          enabled: !subscription.enabled,
        }
      );
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError("No se pudo actualizar el estado de la alerta.");
    }
  };

  const handleExecuteManualCheck = async () => {
    if (!canWrite) return;

    setExecuting("all");
    try {
      await api.post("/alerts/trigger-manual-check");
      setError(null);
      // Mostrar mensaje de éxito temporalmente
      setTimeout(() => setExecuting(null), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al ejecutar verificación manual");
      setExecuting(null);
    }
  };

  // Funciones para gestión de canales de Telegram
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
    if (channel) setEditingChannel(channel);
    else setEditingChannel(null);
    setChannelForm(initial);
    channelFormInitialRef.current = JSON.stringify(initial);
    setChannelFormOpen(true);
  };

  const requestCloseRansom = () => {
    const dirty = ransomFormInitialRef.current !== null && JSON.stringify(ransomForm) !== ransomFormInitialRef.current;
    if (dirty && !window.confirm("¿Tienes cambios sin guardar. ¿Descartar y cerrar?")) return;
    ransomFormInitialRef.current = null;
    setRansomDialogOpen(false);
  };
  const requestCloseTelegram = () => {
    const dirty = telegramFormInitialRef.current !== null && JSON.stringify(telegramForm) !== telegramFormInitialRef.current;
    if (dirty && !window.confirm("¿Tienes cambios sin guardar. ¿Descartar y cerrar?")) return;
    telegramFormInitialRef.current = null;
    setTelegramDialogOpen(false);
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el canal");
    }
  };

  const handleToggleChannel = async (channel: TelegramChannel) => {
    if (!canWrite) return;

    try {
      await api.put(`/alerts/monitored-channels/${channel.id}`, {
        isActive: !channel.isActive,
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

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!canWrite) return;

    if (!window.confirm("¿Eliminar esta configuración de alertas?")) return;
    try {
      await api.delete(
        `/alerts/subscriptions/${subscriptionId}`
      );
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError("No se pudo eliminar la configuración.");
    }
  };

  const renderRansomwareCard = (subscription: AlertSubscriptionEntity) => {
    const settings = (subscription.settings || {}) as Record<string, any>;
    const countries: string[] = settings.countries || [];

    return (
      <Card key={subscription.id} sx={softSurfaceSx}>
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
                Ransomware.live
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={subscription.enabled}
                  onChange={() => handleToggleSubscription(subscription)}
                  disabled={!canWrite}
                />
              }
              label={subscription.enabled ? "Activo" : "Inactivo"}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Países monitoreados:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {countries.length === 0 && (
              <Typography variant="body2">Todos</Typography>
            )}
            {countries.map((country) => (
              <Chip
                key={country}
                label={
                  AVAILABLE_COUNTRIES.find((c) => c.code === country)?.name ||
                  country
                }
                size="small"
                color="primary"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Chat IDs:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {(() => {
              const chatIds = subscription.deliveryChannel?.chatIds
                ? (Array.isArray(subscription.deliveryChannel.chatIds)
                    ? subscription.deliveryChannel.chatIds
                    : [subscription.deliveryChannel.chatIds])
                : subscription.deliveryChannel?.chatId
                ? [subscription.deliveryChannel.chatId]
                : [];
              return chatIds.length === 0 ? (
                <Typography variant="body2">No configurado</Typography>
              ) : (
                chatIds.map((id) => (
                  <Chip key={id} label={id} size="small" sx={{ mb: 1 }} />
                ))
              );
            })()}
          </Stack>
        </CardContent>
        {canWrite && <CardActions>
          <Button
            size="small"
            startIcon={<Edit fontSize="small" />}
            onClick={() => openRansomDialog(subscription)}
          >
            Editar
          </Button>
          <Button
            size="small"
            color="success"
            variant="outlined"
            disabled={executing === "all"}
            onClick={handleExecuteManualCheck}
          >
            {executing === "all" ? "Ejecutando..." : "Ejecutar"}
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete fontSize="small" />}
            onClick={() => handleDeleteSubscription(subscription.id)}
          >
            Eliminar
          </Button>
        </CardActions>}
      </Card>
    );
  };

  const renderTelegramCard = (subscription: AlertSubscriptionEntity) => {
    const settings = (subscription.settings || {}) as Record<string, any>;
    const channels: string[] = settings.channels || [];
    const keywords: string[] = settings.keywords || [];

    return (
      <Card key={subscription.id} sx={softSurfaceSx}>
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
                Alertas desde canales de Telegram
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={subscription.enabled}
                  onChange={() => handleToggleSubscription(subscription)}
                  disabled={!canWrite}
                />
              }
              label={subscription.enabled ? "Activo" : "Inactivo"}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Canales monitoreados:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {channels.length === 0 && (
              <Typography variant="body2">
                Todos los canales configurados
              </Typography>
            )}
            {channels.map((channel) => (
              <Chip key={channel} label={channel} size="small" sx={{ mb: 1 }} />
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Palabras clave:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {keywords.map((keyword) => (
              <Chip
                key={keyword}
                label={keyword}
                size="small"
                color="primary"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Modo:{" "}
            {settings.matchType === "all"
              ? "Debe contener todas"
              : "Coincidencia parcial"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Chat IDs:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {(() => {
              const chatIds = subscription.deliveryChannel?.chatIds
                ? (Array.isArray(subscription.deliveryChannel.chatIds)
                    ? subscription.deliveryChannel.chatIds
                    : [subscription.deliveryChannel.chatIds])
                : subscription.deliveryChannel?.chatId
                ? [subscription.deliveryChannel.chatId]
                : [];
              return chatIds.length === 0 ? (
                <Typography variant="body2">No configurado</Typography>
              ) : (
                chatIds.map((id) => (
                  <Chip key={id} label={id} size="small" sx={{ mb: 1 }} />
                ))
              );
            })()}
          </Stack>
        </CardContent>
        {canWrite && <CardActions>
          <Button
            size="small"
            startIcon={<Edit fontSize="small" />}
            onClick={() => openTelegramDialog(subscription)}
          >
            Editar
          </Button>
          <Button
            size="small"
            color="success"
            variant="outlined"
            disabled={executing === "all"}
            onClick={handleExecuteManualCheck}
          >
            {executing === "all" ? "Ejecutando..." : "Ejecutar"}
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete fontSize="small" />}
            onClick={() => handleDeleteSubscription(subscription.id)}
          >
            Eliminar
          </Button>
        </CardActions>}
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<Settings />}
        title="Configuración de Alertas"
        subtitle="Suscripciones, canales de Telegram y fuentes"
        actions={
          <IconButton size="small" onClick={fetchData} title="Actualizar">
            <Refresh fontSize="small" />
          </IconButton>
        }
      />
      <Container maxWidth="lg" sx={{ py: 2 }}>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ ...surfaceSx, mb: 3, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Warning />} iconPosition="start" label="Ransomware" />
          <Tab icon={<Telegram />} iconPosition="start" label="Telegram" />
          <Tab icon={<BugReport />} iconPosition="start" label="Vulnerabilidades" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
      <Stack spacing={4}>
        <Paper sx={{ ...surfaceSx, p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">Alertas Ransomware.live</Typography>
            {canWrite && (
              <Button
                startIcon={<Add />}
                variant="contained"
                onClick={() => openRansomDialog()}
              >
                Nueva configuración
              </Button>
            )}
          </Stack>
          {ransomwareSubscriptions.length === 0 ? (
            <Alert severity="info">
              No hay configuraciones para ransomware.live.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {ransomwareSubscriptions.map(renderRansomwareCard)}
            </Stack>
          )}
        </Paper>

      </Stack>
      )}

      {activeTab === 1 && (
      <Stack spacing={4}>
        <Paper sx={{ ...surfaceSx, p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">
              Alertas desde canales de Telegram
            </Typography>
            <Stack direction="row" spacing={2}>
              {canWrite && (
                <>
                  <Button
                    startIcon={<Settings />}
                    variant="outlined"
                    onClick={handleOpenChannelsDialog}
                  >
                    Gestionar Canales
                  </Button>
                  <Button
                    startIcon={<Add />}
                    variant="contained"
                    onClick={() => openTelegramDialog()}
                  >
                    Nueva alerta
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
          {telegramSubscriptions.length === 0 ? (
            <Alert severity="info">
              Todavía no configuraste alertas basadas en mensajes de canales de
              Telegram.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {telegramSubscriptions.map(renderTelegramCard)}
            </Stack>
          )}
        </Paper>
      </Stack>
      )}

      {activeTab === 2 && (
        <VulnAlertsSection
          canWrite={canWrite}
          subscriptions={subscriptions}
          saving={saving}
          executing={executing}
          onRefresh={fetchData}
          onError={setError}
          onToggleSubscription={handleToggleSubscription}
          onDeleteSubscription={handleDeleteSubscription}
          onExecuteManualCheck={handleExecuteManualCheck}
          saveSubscription={saveSubscription}
        />
      )}

      <Dialog
        open={ransomDialogOpen}
        onClose={requestCloseRansom}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {ransomForm.id
            ? "Editar alerta Ransomware"
            : "Nueva alerta Ransomware"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 1 }}>
            <TextField
              label="Nombre de la alerta"
              value={ransomForm.name}
              onChange={(event) =>
                setRansomForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Ej: Alertas Ransomware LATAM"
              fullWidth
              required
            />
            <Autocomplete
              multiple
              options={AVAILABLE_COUNTRIES}
              getOptionLabel={(option) => option.name}
              value={AVAILABLE_COUNTRIES.filter((country) =>
                ransomForm.countries.includes(country.code)
              )}
              onChange={(_, newValue) =>
                setRansomForm((prev) => ({
                  ...prev,
                  countries: newValue.map((item) => item.code),
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Países a monitorear"
                  placeholder="Todos los países (dejar vacío) o seleccionar específicos"
                  helperText="Si no seleccionas ninguno, se monitoreará todos los países"
                />
              )}
            />
            <ChipInput
              label="Telegram Chat IDs"
              values={ransomForm.chatIds}
              onChange={(chatIds) =>
                setRansomForm((prev) => ({ ...prev, chatIds }))
              }
              placeholder="Agregar Chat ID"
              helperText="Chat o canal donde recibirás las alertas. Puedes agregar múltiples IDs."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={ransomForm.enabled}
                  onChange={(event) =>
                    setRansomForm((prev) => ({
                      ...prev,
                      enabled: event.target.checked,
                    }))
                  }
                />
              }
              label="Activar alerta"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={requestCloseRansom} size="large">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveRansomware}
            variant="contained"
            disabled={saving || !ransomForm.name || ransomForm.chatIds.length === 0}
            size="large"
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={telegramDialogOpen}
        onClose={requestCloseTelegram}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {telegramForm.id
            ? "Editar alerta de Telegram"
            : "Nueva alerta de Telegram"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 1 }}>
            <TextField
              label="Nombre de la alerta"
              value={telegramForm.name}
              onChange={(event) =>
                setTelegramForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Ej: Alertas palabras clave Telegram"
              fullWidth
              required
            />
            <Autocomplete
              multiple
              options={telegramChannels}
              freeSolo
              value={telegramForm.channels}
              onChange={(_, newValue) =>
                setTelegramForm((prev) => ({ ...prev, channels: newValue }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Canales específicos"
                  helperText="Dejar vacío para escuchar todos los canales configurados en el backend"
                />
              )}
            />
            <ChipInput
              label="Palabras clave (obligatorias)"
              values={telegramForm.keywords}
              onChange={(keywords) =>
                setTelegramForm((prev) => ({ ...prev, keywords }))
              }
              placeholder="Agregar palabra clave"
              helperText="Palabras o frases que deben aparecer en los mensajes para activar la alerta"
            />
            <TextField
              select
              label="Modo de coincidencia"
              value={telegramForm.matchType}
              onChange={(event) =>
                setTelegramForm((prev) => ({
                  ...prev,
                  matchType: event.target.value as "any" | "all",
                }))
              }
              helperText="Define si el mensaje debe contener al menos una palabra clave o todas"
              fullWidth
            >
              <MenuItem value="any">Coincide con alguna palabra clave</MenuItem>
              <MenuItem value="all">Debe contener todas las palabras clave</MenuItem>
            </TextField>
            <ChipInput
              label="Telegram Chat IDs"
              values={telegramForm.chatIds}
              onChange={(chatIds) =>
                setTelegramForm((prev) => ({ ...prev, chatIds }))
              }
              placeholder="Agregar Chat ID"
              helperText="Chat o canal donde recibirás las alertas. Puedes agregar múltiples IDs."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={telegramForm.enabled}
                  onChange={(event) =>
                    setTelegramForm((prev) => ({
                      ...prev,
                      enabled: event.target.checked,
                    }))
                  }
                />
              }
              label="Activar alerta"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={requestCloseTelegram} size="large">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTelegram}
            variant="contained"
            disabled={saving || !telegramForm.name || telegramForm.keywords.length === 0 || telegramForm.chatIds.length === 0}
            size="large"
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

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
                No hay canales configurados. Agrega uno para empezar.
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
    </Container>
    </Box>
  );
};

export default AlertsConfig;
