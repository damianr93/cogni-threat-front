import React, { useEffect } from "react";
import { Paper, Box, Typography, Stack, CircularProgress } from "@mui/material";
import { Public } from "@mui/icons-material";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { fetchRansomwareStats } from "../../../../store/slices/ransomware/ransomwareSlice";
import WorldMap from "../../WorldMap";

const ACCENT = "#4a80c4";

const RansomwareWorldMapWidget: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector((s) => s.ransomware);

  useEffect(() => {
    if (!stats && !loading) dispatch(fetchRansomwareStats());
  }, [dispatch, stats, loading]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        borderLeft: `3px solid ${ACCENT}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            bgcolor: "rgba(74, 128, 196, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Public sx={{ color: ACCENT, fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
            Distribución geográfica
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
            Mapa global de amenazas
          </Typography>
        </Box>
      </Stack>

      {loading || !stats ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 380 }}>
          <CircularProgress size={28} sx={{ color: ACCENT }} />
        </Box>
      ) : (
        <Box sx={{ height: 380, width: "100%" }}>
          <WorldMap data={stats.attacksByCountry} />
        </Box>
      )}
    </Paper>
  );
};

export default RansomwareWorldMapWidget;
