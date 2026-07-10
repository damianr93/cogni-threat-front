import React from "react";
import {
  Box, TextField, IconButton, Stack, Chip, Tooltip, Autocomplete,
  FormControl, InputLabel, Select, OutlinedInput, MenuItem, Checkbox, ListItemText,
  type SelectChangeEvent,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import type { ContextCategory, ContextSourceItem } from "../../../store/slices/chatAi/chatAiSlice";

const ALL_CATEGORIES = "__ALL__";

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

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const raw = event.target.value;
    const newValue = typeof raw === "string" ? raw.split(",") : raw;

    if (newValue.includes(ALL_CATEGORIES)) {
      onClearCategories();
      return;
    }

    const added = newValue.filter((v) => !selectedCategories.includes(v));
    const removed = selectedCategories.filter((v) => !newValue.includes(v));
    [...added, ...removed].forEach(onToggleCategory);
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
          <FormControl size="small" sx={{ minWidth: 200, mb: 1 }}>
            <InputLabel id="chat-base-category-label" sx={{ fontSize: "0.78rem" }}>
              Base
            </InputLabel>
            <Select
              labelId="chat-base-category-label"
              multiple
              value={selectedCategories}
              onChange={handleCategoryChange}
              input={<OutlinedInput label="Base" />}
              renderValue={(selected) =>
                selected.length === 0
                  ? "Todas"
                  : selected
                      .map((name) => contextCategories.find((c) => c.name === name)?.label ?? name)
                      .join(", ")
              }
              sx={{
                fontSize: "0.78rem",
                bgcolor: "rgba(255,255,255,0.02)",
                "& .MuiSelect-select": { py: 0.5 },
              }}
              MenuProps={{ MenuListProps: { dense: true } }}
            >
              <MenuItem value={ALL_CATEGORIES} dense sx={{ fontSize: "0.78rem" }}>
                <Checkbox checked={selectedCategories.length === 0} size="small" />
                <ListItemText primary="Todas" primaryTypographyProps={{ fontSize: "0.78rem" }} />
              </MenuItem>
              {contextCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.name} dense sx={{ fontSize: "0.78rem" }}>
                  <Checkbox checked={selectedCategories.includes(cat.name)} size="small" />
                  <ListItemText primary={cat.label} primaryTypographyProps={{ fontSize: "0.78rem" }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
