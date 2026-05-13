import React, { useEffect } from "react";
import { Paper, Box, Typography, Stack, CircularProgress } from "@mui/material";
import { Groups } from "@mui/icons-material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { fetchRansomwareStats } from "../../../../store/slices/ransomware/ransomwareSlice";

const ACCENT = "#c94c4c";

const RansomwareGroupsBarChart: React.FC = () => {
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
            bgcolor: "rgba(201, 76, 76, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Groups sx={{ color: ACCENT, fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
            Grupos más activos
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
            Víctimas por grupo
          </Typography>
        </Box>
      </Stack>

      {loading || !stats ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 350 }}>
          <CircularProgress size={28} sx={{ color: ACCENT }} />
        </Box>
      ) : (
        <BarChart
          dataset={stats.topGroups}
          xAxis={[{
            scaleType: "band",
            dataKey: "group",
            tickLabelStyle: {
              angle: 45,
              textAnchor: "start",
              fontSize: 11,
              fill: "#64748b",
              fontFamily: "Inter, sans-serif",
            },
          }]}
          yAxis={[{
            tickLabelStyle: { fontSize: 11, fill: "#64748b", fontFamily: "Inter, sans-serif" },
          }]}
          series={[{ dataKey: "victims", label: "Víctimas", color: ACCENT }]}
          height={380}
          margin={{ left: 55, right: 10, top: 30, bottom: 100 }}
          sx={{
            "& .MuiChartsAxis-line": { stroke: "rgba(255,255,255,0.06)" },
            "& .MuiChartsAxis-tick": { stroke: "rgba(255,255,255,0.06)" },
            "& .MuiChartsGrid-line": { stroke: "rgba(255,255,255,0.04)" },
            "& .MuiChartsLegend-series text": {
              fill: "#64748b !important",
              fontFamily: "Inter, sans-serif !important",
              fontWeight: "500 !important",
              fontSize: "11px !important",
            },
          }}
        />
      )}
    </Paper>
  );
};

export default RansomwareGroupsBarChart;
