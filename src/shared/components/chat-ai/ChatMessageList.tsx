import React, { useEffect, useRef } from "react";
import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../../../store/slices/chatAi/chatAiSlice";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
}

const markdownSx = {
  "& p": { margin: 0, lineHeight: 1.65, fontSize: "0.9rem" },
  "& p + p": { marginTop: "0.5em" },
  "& ul, & ol": { pl: 2.5, my: 0.5 },
  "& li": { fontSize: "0.9rem", lineHeight: 1.65 },
  "& code": {
    fontFamily: "monospace",
    fontSize: "0.82rem",
    bgcolor: "rgba(255,255,255,0.07)",
    px: 0.5,
    borderRadius: 0.5,
  },
  "& pre": {
    bgcolor: "rgba(0,0,0,0.35)",
    p: 1.5,
    borderRadius: 1,
    overflowX: "auto",
    my: 1,
    "& code": { bgcolor: "transparent", px: 0 },
  },
  "& strong": { fontWeight: 700 },
  "& em": { fontStyle: "italic" },
  "& a": { color: "primary.light", wordBreak: "break-all" },
  "& table": {
    borderCollapse: "collapse",
    width: "100%",
    fontSize: "0.82rem",
    my: 1,
    display: "block",
    overflowX: "auto",
  },
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    px: 1.25,
    py: 0.6,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  "& th": {
    bgcolor: "rgba(74,144,217,0.1)",
    fontWeight: 700,
  },
  "& tr:nth-of-type(even) td": {
    bgcolor: "rgba(255,255,255,0.02)",
  },
  "& blockquote": {
    borderLeft: "3px solid",
    borderColor: "primary.dark",
    pl: 1.5,
    ml: 0,
    my: 0.5,
    color: "text.secondary",
  },
  "& h1, & h2, & h3, & h4": {
    fontWeight: 700,
    lineHeight: 1.3,
    my: 0.75,
  },
  "& h1": { fontSize: "1.1rem" },
  "& h2": { fontSize: "1rem" },
  "& h3, & h4": { fontSize: "0.9rem" },
  "& hr": { borderColor: "divider", my: 1 },
};

const ChatMessageList: React.FC<Props> = ({ messages, loading, sending }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <CircularProgress size={28} color="primary" />
      </Box>
    );
  }

  if (messages.length === 0 && !sending) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "text.disabled",
          gap: 1,
          minHeight: 0,
          px: 2,
        }}
      >
        <SmartToyIcon sx={{ fontSize: 40, opacity: 0.25, color: "primary.main" }} />
        <Typography variant="body2" color="text.secondary">
          Preguntá sobre CVEs, ransomware, actores o alertas
        </Typography>
        <Typography variant="caption">
          Acotá el contexto con el panel derecho o dejá todas las fuentes
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
        <Stack spacing={2.5}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Box
                sx={{
                  maxWidth: "92%",
                  px: 1.75,
                  py: 1.25,
                  borderRadius: 2,
                  bgcolor: msg.role === "user" ? "rgba(74,144,217,0.12)" : "transparent",
                  border: msg.role === "assistant" ? "1px solid" : "none",
                  borderColor: "divider",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                {msg.role === "assistant" ? (
                  <Box sx={{ color: "text.primary", ...markdownSx }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ color: "text.primary", whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: "0.9rem" }}
                  >
                    {msg.content}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ fontSize: "0.65rem", mt: 0.75, display: "block" }}
                >
                  {msg.role === "user" ? "Vos" : "Asistente"} ·{" "}
                  {new Date(msg.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>
            </Box>
          ))}

          {sending && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 0.5 }}>
              <CircularProgress size={14} color="primary" />
              <Typography variant="caption" color="text.disabled">
                Pensando…
              </Typography>
            </Stack>
          )}
          <div ref={bottomRef} />
        </Stack>
      </Box>
    </Box>
  );
};

export default ChatMessageList;
