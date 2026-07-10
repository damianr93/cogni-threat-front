import React from "react";
import {
  Box, TextField, IconButton, Stack, Chip, Typography, Tooltip, Autocomplete,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import type { ContextCategory, ContextSourceItem } from "../../../store/slices/chatAi/chatAiSlice";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  disabled: boolean;
  selectedSources: string[];
  selectedCategories: string[];
  contextCategories: ContextCategory[];
  contextSources: ContextSourceItem[];
  sourceLabels: Record<string, string>;
  onToggleSource: (id: string) => void;
  onToggleCategory: (id: string) => void;
  onClearCategories: () => void;
}

const ChatInputArea: React.FC<Props> = ({
  value,
  onChange,
  onSend,
  sending,
  disabled,
  selectedSources,
  selectedCategories,
  contextCategories,
  contextSources,
  sourceLabels,
  onToggleSource,
  onToggleCategory,
  onClearCategories,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !sending && value.trim()) onSend();
    }
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        py: 1.5,
      }}
    >
      <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, sm: 3 } }}>
        {selectedSources.length > 0 ? (
          <Box sx={{ mb: 1.25 }}>
            <Autocomplete
              multiple
              size="small"
              options={contextSources}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={contextSources.filter((s) => selectedSources.includes(s.id))}
              onChange={(_, __, reason, details) => {
                if (reason === "removeOption" && details?.option) {
                  onToggleSource(details.option.id);
                } else if (reason === "clear") {
                  selectedSources.forEach((id) => onToggleSource(id));
                }
              }}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={sourceLabels[option.id] ?? option.label}
                    size="small"
                    sx={{ fontSize: "0.72rem", maxWidth: 220 }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Contexto" placeholder="Fuentes seleccionadas" />
              )}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.02)",
                  fontSize: "0.82rem",
                },
              }}
            />
          </Box>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center" sx={{ mb: 1.25 }}>
            <Typography variant="caption" color="text.disabled">
              Base:
            </Typography>
            <Chip
              label="Todas"
              size="small"
              variant={selectedCategories.length === 0 ? "filled" : "outlined"}
              onClick={onClearCategories}
              sx={{
                fontSize: "0.72rem",
                height: 26,
                ...(selectedCategories.length === 0 && {
                  bgcolor: "rgba(74,144,217,0.15)",
                  color: "primary.main",
                }),
              }}
            />
            {contextCategories.map((cat) => {
              const active = selectedCategories.includes(cat.name);
              return (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  size="small"
                  variant={active ? "filled" : "outlined"}
                  onClick={() => onToggleCategory(cat.name)}
                  sx={{
                    fontSize: "0.72rem",
                    height: 26,
                    ...(active && { bgcolor: `${cat.color}33`, color: cat.color, borderColor: cat.color }),
                  }}
                />
              );
            })}
          </Stack>
        )}

        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={5}
            placeholder={disabled ? "Seleccioná o creá una conversación…" : "Escribí tu pregunta…"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || sending}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.02)",
                fontSize: "0.9rem",
                borderRadius: 2,
              },
            }}
          />
          <Tooltip title="Enviar (Enter)">
            <span>
              <IconButton
                onClick={onSend}
                disabled={disabled || sending || !value.trim()}
                color="primary"
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  width: 40,
                  height: 40,
                  "&:hover": { bgcolor: "primary.dark" },
                  "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "text.disabled" },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
};

export default ChatInputArea;
