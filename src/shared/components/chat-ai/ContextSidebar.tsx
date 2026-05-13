import React, { useEffect, useState } from "react";
import {
  Box, Typography, TextField, Stack, Chip, CircularProgress,
  List, ListItemButton, ListItemText, Pagination, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import {
  fetchContextSources,
  toggleSelectedSource,
  clearSelectedSources,
  type ContextCategory,
  type ContextSourceItem,
} from "../../../store/slices/chatAi/chatAiSlice";

interface Props {
  categories: ContextCategory[];
  sources: ContextSourceItem[];
  selectedSources: string[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
}

const ContextSidebar: React.FC<Props> = ({
  categories,
  sources,
  selectedSources,
  total,
  page,
  totalPages,
  loading,
}) => {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [browseCategory, setBrowseCategory] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    dispatch(
      fetchContextSources({
        page: browseCategory || debouncedSearch ? 1 : page,
        search: debouncedSearch || undefined,
        category: browseCategory || undefined,
      })
    );
  }, [dispatch, page, debouncedSearch, browseCategory]);

  const handlePageChange = (_: unknown, newPage: number) => {
    dispatch(
      fetchContextSources({
        page: newPage,
        search: debouncedSearch || undefined,
        category: browseCategory || undefined,
      })
    );
  };

  const categoryColor = (name: string) =>
    categories.find((c) => c.name === name)?.color ?? "#64748b";

  return (
    <Box
      sx={{
        width: { xs: 260, md: 280 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid",
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
          Contexto
        </Typography>
        {selectedSources.length > 0 && (
          <Chip
            label={`${selectedSources.length} sel.`}
            size="small"
            onDelete={() => dispatch(clearSelectedSources())}
            sx={{ fontSize: "0.65rem", height: 22 }}
          />
        )}
      </Stack>

      <Box sx={{ px: 1.5, py: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar fuente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
          sx={{ "& input": { fontSize: "0.8rem" } }}
        />
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ px: 1.5, pb: 1 }}>
        <Chip
          label="Todas"
          size="small"
          variant={!browseCategory ? "filled" : "outlined"}
          onClick={() => setBrowseCategory("")}
          sx={{
            fontSize: "0.68rem",
            height: 24,
            ...(!browseCategory && { bgcolor: "rgba(74,144,217,0.15)", color: "primary.main" }),
          }}
        />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            size="small"
            variant={browseCategory === cat.name ? "filled" : "outlined"}
            onClick={() => setBrowseCategory(browseCategory === cat.name ? "" : cat.name)}
            sx={{
              fontSize: "0.68rem",
              height: 24,
              ...(browseCategory === cat.name && {
                bgcolor: `${cat.color}33`,
                color: cat.color,
                borderColor: cat.color,
              }),
            }}
          />
        ))}
      </Stack>

      <Typography variant="caption" color="text.disabled" sx={{ px: 1.5, pb: 0.5 }}>
        {total.toLocaleString()} fuentes
      </Typography>

      <Box sx={{ flex: 1, overflow: "auto", px: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} color="primary" />
          </Box>
        ) : sources.length === 0 ? (
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", p: 2, textAlign: "center" }}>
            Sin resultados
          </Typography>
        ) : (
          <List dense disablePadding>
            {sources.map((item) => {
              const selected = selectedSources.includes(item.id);
              return (
                <ListItemButton
                  key={item.id}
                  onClick={() => dispatch(toggleSelectedSource(item.id))}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    ...(selected && { bgcolor: "rgba(74,144,217,0.08)" }),
                  }}
                >
                  {selected ? (
                    <CheckCircleIcon sx={{ fontSize: 16, color: "primary.main", mr: 1, flexShrink: 0 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: "text.disabled", mr: 1, flexShrink: 0 }} />
                  )}
                  <ListItemText
                    primary={item.label}
                    secondary={item.summary}
                    primaryTypographyProps={{
                      fontSize: "0.78rem",
                      sx: { color: categoryColor(item.category) },
                    }}
                    secondaryTypographyProps={{ fontSize: "0.65rem", noWrap: true }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            size="small"
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default ContextSidebar;
