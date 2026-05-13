import React, { useEffect } from "react";
import { Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { Assessment, FactCheck, OpenInNew, Shield } from "@mui/icons-material";
import { fetchRiskOperations } from "../../../store/slices/riskOperations/riskOperationsSlice";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { softSurfaceSx, surfaceSx } from "../../ui/surface";

const ACCENT = "#d6a84f";

interface RiskOperationsCardProps {
  onExpand?: () => void;
}

const RiskOperationsCard: React.FC<RiskOperationsCardProps> = ({ onExpand }) => {
  const dispatch = useAppDispatch();
  const { risks, treatments, matrix, criteria, loading, error } = useAppSelector((state) => state.riskOperations);

  useEffect(() => {
    if (!loading && risks.length === 0 && !matrix) {
      dispatch(fetchRiskOperations());
    }
  }, [dispatch, loading, matrix, risks.length]);

  const highExposure = risks.filter((risk) => risk.inherentLevel === "HIGH" || risk.inherentLevel === "CRITICAL").length;
  const threshold = criteria?.acceptanceThreshold ?? matrix?.acceptanceThreshold ?? 12;
  const aboveThreshold = risks.filter((risk) => risk.inherentScore >= threshold).length;
  const activeTreatments = treatments.filter((treatment) => treatment.status === "PLANNED" || treatment.status === "IN_PROGRESS").length;
  const matrixSize = matrix?.matrixSize ?? criteria?.matrixSize ?? 5;

  if (loading && risks.length === 0) {
    return (
      <Card sx={{ ...surfaceSx, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} sx={{ color: ACCENT }} />
      </Card>
    );
  }

  return (
    <Card
      sx={{
        ...surfaceSx,
        height: "100%",
        cursor: onExpand ? "pointer" : "default",
        borderLeft: `3px solid ${ACCENT}`,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": onExpand
          ? { borderLeftColor: "#f0c86a", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)" }
          : undefined,
      }}
      onClick={onExpand}
    >
      <CardContent>
        <Stack spacing={2.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: "rgba(214, 168, 79, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Shield sx={{ color: ACCENT, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
                  Riesgos
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                  Gestión operacional
                </Typography>
              </Box>
            </Stack>
            <OpenInNew sx={{ color: "text.secondary", fontSize: 18 }} />
          </Stack>

          {error ? (
            <Box sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="body2" color="error.main">
                No se pudieron cargar los riesgos.
              </Typography>
            </Box>
          ) : (
            <>
              <Stack direction="row" spacing={1.5}>
                <MetricBox label="Riesgos" value={risks.length} helper="registrados" icon={<Assessment />} color={ACCENT} />
                <MetricBox label="Altos" value={highExposure} helper="alto/crítico" icon={<Shield />} color="#ef4444" />
              </Stack>

              <Box sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                    Matriz de riesgo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Umbral {threshold}
                  </Typography>
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${matrixSize}, 1fr)`, gap: 0.5 }}>
                  {Array.from({ length: matrixSize * matrixSize }, (_, index) => {
                    const probability = matrixSize - Math.floor(index / matrixSize);
                    const impact = (index % matrixSize) + 1;
                    const count = matrix?.cells.find((cell) => cell.probability === probability && cell.impact === impact)?.count ?? 0;
                    const score = probability * impact;
                    return (
                      <Box
                        key={`${probability}-${impact}`}
                        sx={{
                          minHeight: 24,
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: count ? "text.primary" : "text.disabled",
                          bgcolor: score >= threshold ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.12)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {count || ""}
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <FactCheck sx={{ color: "text.secondary", fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                    {activeTreatments} tratamientos activos
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: aboveThreshold > 0 ? "error.main" : "text.secondary", fontSize: "0.7rem" }}>
                  {aboveThreshold} sobre umbral
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

function MetricBox({ label, value, helper, icon, color }: { label: string; value: number; helper: string; icon: React.ReactNode; color: string }) {
  return (
    <Box flex={1} sx={{ ...softSurfaceSx, p: 1.5, borderRadius: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, fontSize: "0.67rem" }}>
          {label}
        </Typography>
        <Box sx={{ color, display: "flex", "& svg": { fontSize: 16 } }}>{icon}</Box>
      </Stack>
      <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
        {helper}
      </Typography>
    </Box>
  );
}

export default RiskOperationsCard;
