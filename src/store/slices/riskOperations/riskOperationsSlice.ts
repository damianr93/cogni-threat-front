import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../../shared/utils/api";
import type { InformationAsset, Kpi, KpiMeasurement, OperationalControl, Risk, RiskAlertMatch, RiskCriteriaConfig, RiskMatrixData, RiskTreatment, TreatmentAction } from "../../../shared/types/risk-operations";

type Resource = "assets" | "risks" | "treatments" | "controls" | "kpis";

interface RiskOperationsState {
  assets: InformationAsset[];
  risks: Risk[];
  treatments: RiskTreatment[];
  controls: OperationalControl[];
  kpis: Kpi[];
  criteria: RiskCriteriaConfig | null;
  matrix: RiskMatrixData | null;
  riskAlerts: RiskAlertMatch[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: RiskOperationsState = {
  assets: [],
  risks: [],
  treatments: [],
  controls: [],
  kpis: [],
  criteria: null,
  matrix: null,
  riskAlerts: [],
  loading: false,
  saving: false,
  error: null,
};

export const fetchRiskOperations = createAsyncThunk("riskOperations/fetchAll", async () => {
  const [assets, risks, treatments, controls, kpis, criteria, matrix, riskAlerts] = await Promise.all([
    api.get<InformationAsset[]>("/risk-operations/assets"),
    api.get<Risk[]>("/risk-operations/risks"),
    api.get<RiskTreatment[]>("/risk-operations/treatments"),
    api.get<OperationalControl[]>("/risk-operations/controls"),
    api.get<Kpi[]>("/risk-operations/kpis"),
    api.get<RiskCriteriaConfig>("/risk-operations/criteria"),
    api.get<RiskMatrixData>("/risk-operations/risks/matrix"),
    api.get<RiskAlertMatch[]>("/risk-operations/risks/alerts"),
  ]);

  return {
    assets: assets.data,
    risks: risks.data,
    treatments: treatments.data,
    controls: controls.data,
    kpis: kpis.data,
    criteria: criteria.data,
    matrix: matrix.data,
    riskAlerts: riskAlerts.data,
  };
});

export const updateRiskCriteria = createAsyncThunk(
  "riskOperations/updateCriteria",
  async ({ acceptanceThreshold }: { acceptanceThreshold: number }) => {
    const response = await api.put<RiskCriteriaConfig>("/risk-operations/criteria", { acceptanceThreshold });
    return response.data;
  },
);

export const createRiskOperation = createAsyncThunk(
  "riskOperations/create",
  async ({ resource, payload }: { resource: Resource; payload: Record<string, unknown> }) => {
    await api.post(`/risk-operations/${resource}`, payload);
    return resource;
  },
);

export const updateRiskOperation = createAsyncThunk(
  "riskOperations/update",
  async ({ resource, id, payload }: { resource: Resource; id: string; payload: Record<string, unknown> }) => {
    await api.put(`/risk-operations/${resource}/${id}`, payload);
    return resource;
  },
);

export const createTreatmentAction = createAsyncThunk(
  "riskOperations/createAction",
  async ({ treatmentId, payload }: { treatmentId: string; payload: Record<string, unknown> }) => {
    const response = await api.post<TreatmentAction>(`/risk-operations/treatments/${treatmentId}/actions`, payload);
    return response.data;
  },
);

export const updateTreatmentAction = createAsyncThunk(
  "riskOperations/updateAction",
  async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
    const response = await api.put<TreatmentAction>(`/risk-operations/actions/${id}`, payload);
    return response.data;
  },
);

export const createKpiMeasurement = createAsyncThunk(
  "riskOperations/createMeasurement",
  async ({ kpiId, payload }: { kpiId: string; payload: Record<string, unknown> }) => {
    const response = await api.post<KpiMeasurement>(`/risk-operations/kpis/${kpiId}/measurements`, payload);
    return response.data;
  },
);

const riskOperationsSlice = createSlice({
  name: "riskOperations",
  initialState,
  reducers: {
    clearRiskOperationsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRiskOperations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRiskOperations.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload.assets;
        state.risks = action.payload.risks;
        state.treatments = action.payload.treatments;
        state.controls = action.payload.controls;
        state.kpis = action.payload.kpis;
        state.criteria = action.payload.criteria;
        state.matrix = action.payload.matrix;
        state.riskAlerts = action.payload.riskAlerts;
      })
      .addCase(fetchRiskOperations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "No se pudieron cargar los datos";
      })
      .addCase(createRiskOperation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createRiskOperation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createRiskOperation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "No se pudo guardar";
      })
      .addCase(updateRiskOperation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateRiskOperation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateRiskOperation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "No se pudo actualizar";
      })
      .addCase(createTreatmentAction.pending, (state) => {
        state.saving = true;
      })
      .addCase(createTreatmentAction.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createTreatmentAction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "No se pudo guardar la acción";
      })
      .addCase(updateTreatmentAction.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateTreatmentAction.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateTreatmentAction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "No se pudo actualizar la acción";
      })
      .addCase(createKpiMeasurement.pending, (state) => {
        state.saving = true;
      })
      .addCase(createKpiMeasurement.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createKpiMeasurement.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "No se pudo guardar la medición";
      })
      .addCase(updateRiskCriteria.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateRiskCriteria.fulfilled, (state, action) => {
        state.saving = false;
        state.criteria = action.payload;
      })
      .addCase(updateRiskCriteria.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "No se pudo actualizar el umbral";
      });
  },
});

export const { clearRiskOperationsError } = riskOperationsSlice.actions;
export default riskOperationsSlice.reducer;
