import React, { useEffect } from "react";
import { Paper, Box, Typography, Stack, CircularProgress } from "@mui/material";
import { TrendingUp } from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { fetchRansomwareStats } from "../../../../store/slices/ransomware/ransomwareSlice";

const ACCENT = "#c94c4c";

const RansomwareTrendLineChart: React.FC = () => {
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
          <TrendingUp sx={{ color: ACCENT, fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
            Tendencia de ataques
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
            Evolución mensual
          </Typography>
        </Box>
      </Stack>

      {loading || !stats ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
          <CircularProgress size={28} sx={{ color: ACCENT }} />
        </Box>
      ) : (
        <LineChart
          dataset={stats.monthlyTrend}
          xAxis={[{
            scaleType: "band",
            dataKey: "month",
            tickLabelStyle: { fontSize: 11, fill: "#64748b", fontFamily: "Inter, sans-serif" },
          }]}
          yAxis={[{
            tickLabelStyle: { fontSize: 11, fill: "#64748b", fontFamily: "Inter, sans-serif" },
          }]}
          series={[{
            dataKey: "count",
            label: "Ataques mensuales",
            color: ACCENT,
            curve: "natural",
            area: true,
            showMark: true,
          }]}
          height={300}
          margin={{ left: 55, right: 20, top: 30, bottom: 55 }}
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
            "& .MuiLineElement-root": { strokeWidth: 2 },
            "& .MuiAreaElement-root": { fill: "url(#gradient-red-rw)" },
            "& .MuiMarkElement-root": { stroke: ACCENT, strokeWidth: 2, fill: "#141e30" },
          }}
        >
          <defs>
            <linearGradient id="gradient-red-rw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(201, 76, 76, 0.25)" />
              <stop offset="100%" stopColor="rgba(201, 76, 76, 0.02)" />
            </linearGradient>
          </defs>
        </LineChart>
      )}
    </Paper>
  );
};

export default RansomwareTrendLineChart;
