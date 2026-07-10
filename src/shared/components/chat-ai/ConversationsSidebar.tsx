import React, { useState } from "react";
import {
  Box, Typography, List, ListItemButton, ListItemText, IconButton,
  TextField, CircularProgress, Stack, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { ConversationSummary } from "../../../store/slices/chatAi/chatAiSlice";

interface Props {
  conversations: ConversationSummary[];
  selectedId: number | null;
  loading: boolean;
  collapsed: boolean;
  canWrite: boolean;
  onSelect: (id: number) => void;
  onNew: () => void;
  onUpdateTitle: (id: number, title: string) => void;
  onDelete: (id: number) => void;
}

const ConversationsSidebar: React.FC<Props> = ({
  conversations,
  selectedId,
  loading,
  collapsed,
  canWrite,
  onSelect,
  onNew,
  onUpdateTitle,
  onDelete,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  if (collapsed) return null;

  const startEdit = (id: number, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdateTitle(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        minHeight: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "text.disabled",
            fontSize: "0.65rem",
          }}
        >
          Historial
        </Typography>
        {canWrite && (
          <Tooltip title="Nueva conversación">
            <IconButton size="small" onClick={onNew} sx={{ color: "primary.main" }}>
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} sx={{ color: "#4a90d9" }} />
          </Box>
        ) : conversations.length === 0 ? (
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", p: 2, textAlign: "center" }}>
            Sin conversaciones. Creá una nueva.
          </Typography>
        ) : (
          <List dense disablePadding>
            {conversations.map((conv) => (
              <ListItemButton
                key={conv.id}
                selected={selectedId === conv.id}
                onClick={() => onSelect(conv.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": { bgcolor: "rgba(74,144,217,0.12)" },
                }}
              >
                {editingId === conv.id ? (
                  <TextField
                    size="small"
                    fullWidth
                    value={editTitle}
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ "& input": { fontSize: "0.8rem", py: 0.5 } }}
                  />
                ) : (
                  <>
                    <ListItemText
                      primary={conv.title}
                      secondary={new Date(conv.createdAt).toLocaleDateString("es-AR")}
                      primaryTypographyProps={{ fontSize: "0.82rem", noWrap: true }}
                      secondaryTypographyProps={{ fontSize: "0.68rem" }}
                    />
                    {canWrite && (
                      <Stack direction="row" spacing={0.25}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(conv.id, conv.title);
                          }}
                          sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("¿Eliminar esta conversación?")) {
                              onDelete(conv.id);
                            }
                          }}
                          sx={{ opacity: 0.5, "&:hover": { opacity: 1, color: "error.main" } }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    )}
                  </>
                )}
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ConversationsSidebar;
