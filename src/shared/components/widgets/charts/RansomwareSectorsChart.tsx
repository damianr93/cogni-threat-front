import React, { useEffect } from "react";
import { Paper, Box, Typography, Stack, CircularProgress } from "@mui/material";
import { Security } from "@mui/icons-material";
import { PieChart } from "@mui/x-charts/PieChart";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { fetchRansomwareStats } from "../../../../store/slices/ransomware/ransomwareSlice";

// Professional muted color palette for sector slices
const SECTOR_COLORS = ["#4a90d9", "#3a9db8", "#2d9e6b", "#c9872a", "#c94c4c"];

const RansomwareSectorsChart: React.FC = () => {
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
        borderLeft: "3px solid #2d9e6b",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            bgcolor: "rgba(45, 158, 107, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Security sx={{ color: "#2d9e6b", fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
            Sectores objetivo
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
            Distribución por industria
          </Typography>
        </Box>
      </Stack>

      {loading || !stats ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
          <CircularProgress size={28} sx={{ color: "#2d9e6b" }} />
        </Box>
      ) : (
        <PieChart
          series={[{
            data: stats.sectorAnalysis.slice(0, 5).map((item, index) => ({
              id: index,
              value: item.count,
              label: item.activity,
              color: SECTOR_COLORS[index % SECTOR_COLORS.length],
            })),
            innerRadius: 60,
            outerRadius: 120,
            paddingAngle: 2,
            cornerRadius: 4,
            highlightScope: { faded: "global", highlighted: "item" },
            faded: { innerRadius: 55, additionalRadius: -8, color: "#2a3548" },
          }]}
          height={300}
          slotProps={{
            legend: {
              direction: "row",
              position: { vertical: "bottom", horizontal: "middle" },
              padding: 0,
              itemMarkWidth: 10,
              itemMarkHeight: 10,
              markGap: 6,
              itemGap: 14,
              labelStyle: {
                fontSize: 11,
                fill: "#64748b",
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
              },
            },
          }}
          sx={{
            "& .MuiPieArc-root": { strokeWidth: 1, stroke: "rgba(0,0,0,0.3)" },
            "& .MuiChartsLegend-mark": { rx: 2 },
          }}
        />
      )}
    </Paper>
  );
};

export default RansomwareSectorsChart;
