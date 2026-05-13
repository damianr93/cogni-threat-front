import { useEffect, useState } from "react";
import { AdminPanelSettings } from "@mui/icons-material";
import { Alert, Box, Button, CardContent, Slider, Stack, Typography } from "@mui/material";
import PageHeader from "../shared/components/PageHeader";
import { useAppDispatch } from "../shared/hooks/useAppDispatch";
import { useAppSelector } from "../shared/hooks/useAppSelector";
import { fetchRiskOperations, updateRiskCriteria } from "../store/slices/riskOperations/riskOperationsSlice";
import { AppCard, softSurfaceSx } from "../shared/ui/surface";

const AdminRiskSettingsPage = () => {
  const dispatch = useAppDispatch();
  const { criteria, saving, error } = useAppSelector((state) => state.riskOperations);
  const [threshold, setThreshold] = useState(10);
  const matrixSize = criteria?.matrixSize ?? 5;
  const maxScore = matrixSize * matrixSize;

  useEffect(() => {
    dispatch(fetchRiskOperations());
  }, [dispatch]);

  useEffect(() => {
    if (criteria) setThreshold(criteria.acceptanceThreshold);
  }, [criteria]);

  const save = async () => {
    await dispatch(updateRiskCriteria({ acceptanceThreshold: threshold })).unwrap();
    await dispatch(fetchRiskOperations());
  };

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader icon={<AdminPanelSettings />} title="Configuración de riesgo" subtitle="Criterios globales para criticidad y matriz de riesgos." />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <AppCard sx={{ maxWidth: 760 }}>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
              <Metric label="Tamaño de matriz" value={`${matrixSize} × ${matrixSize}`} />
              <Metric label="Score máximo" value={maxScore} />
            </Box>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography fontWeight={700}>Umbral de aceptación</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Riesgos con score mayor a este valor se consideran no aceptables y requieren tratamiento.
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800}>{threshold}</Typography>
              </Stack>
              <Slider value={threshold} min={1} max={maxScore} step={1} marks onChange={(_, value) => setThreshold(value as number)} />
            </Box>
            <Button variant="contained" disabled={saving} onClick={save} sx={{ alignSelf: "flex-end" }}>
              {saving ? "Guardando..." : "Guardar configuración"}
            </Button>
          </Stack>
        </CardContent>
      </AppCard>
    </Box>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <Box sx={{ p: 2, borderRadius: 2, ...softSurfaceSx }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" fontWeight={800}>{value}</Typography>
  </Box>
);

export default AdminRiskSettingsPage;
