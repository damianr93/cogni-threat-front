import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Telegram, OpenInNew, Refresh, AccessTime } from "@mui/icons-material";
import { api } from "../../utils/api";

// Accent color for Telegram module — muted steel blue
const ACCENT = "#4a80c4";
const ACCENT_BG = "rgba(74, 128, 196, 0.1)";
const ACCENT_BORDER = "rgba(74, 128, 196, 0.2)";

interface TelegramCardProps {
  onExpand: () => void;
}

interface TelegramMessage {
  id: string;
  channelName: string;
  content: string;
  date: string;
}

const TelegramCard: React.FC<TelegramCardProps> = ({ onExpand }) => {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get("/alerts/telegram-messages?limit=5");
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading telegram messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderLeft: `3px solid ${ACCENT_BORDER}`,
        }}
      >
        <CircularProgress size={28} sx={{ color: ACCENT }} />
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: "100%",
        cursor: "pointer",
        borderLeft: `3px solid ${ACCENT}`,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderLeftColor: "#6ba0e8",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
        },
      }}
      onClick={onExpand}
    >
      <CardContent>
        <Stack spacing={2.5}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: ACCENT_BG,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Telegram sx={{ color: ACCENT, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
                  Telegram
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                  Intel Feed
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); loadMessages(); }}
                sx={{ color: "text.secondary", "&:hover": { color: ACCENT, bgcolor: ACCENT_BG } }}
              >
                <Refresh sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: "text.secondary", "&:hover": { color: ACCENT, bgcolor: ACCENT_BG } }}
              >
                <OpenInNew sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          </Stack>

          {/* Primary metrics */}
          <Stack direction="row" spacing={1.5}>
            <Box
              flex={1}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, fontSize: "0.67rem" }}
              >
                Mensajes
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: ACCENT, lineHeight: 1.1, mt: 0.5 }}
              >
                {messages.length}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                recientes
              </Typography>
            </Box>
            <Box
              flex={1}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#2d9e6b", flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: "#2d9e6b", fontWeight: 600, fontSize: "0.72rem" }}>
                  Activo
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", mt: 0.25 }}>
                monitoreo en vivo
              </Typography>
            </Box>
          </Stack>

          {/* Recent messages */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                fontWeight: 600,
                fontSize: "0.67rem",
                mb: 1,
                display: "block",
              }}
            >
              Últimas entradas
            </Typography>
            <Box sx={{ maxHeight: 130, overflow: "auto" }}>
              {messages.length === 0 ? (
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                  Sin mensajes disponibles
                </Typography>
              ) : (
                messages.slice(0, 5).map((msg, idx) => (
                  <Stack
                    key={msg.id}
                    spacing={0.4}
                    sx={{
                      py: 0.6,
                      px: 1,
                      borderRadius: 1,
                      mb: 0.25,
                      bgcolor: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: "text.primary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {msg.content.substring(0, 60)}…
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={msg.channelName}
                        size="small"
                        sx={{
                          height: 17,
                          fontSize: "0.62rem",
                          bgcolor: ACCENT_BG,
                          color: "#93bbf0",
                          border: `1px solid ${ACCENT_BORDER}`,
                        }}
                      />
                      <Stack direction="row" alignItems="center" spacing={0.4}>
                        <AccessTime sx={{ fontSize: 10, color: "text.secondary" }} />
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                          {formatDate(msg.date)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                ))
              )}
            </Box>
          </Box>

          {/* Footer */}
          <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#2d9e6b", flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                monitoreo activo
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
              {messages.length} entradas
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TelegramCard;
