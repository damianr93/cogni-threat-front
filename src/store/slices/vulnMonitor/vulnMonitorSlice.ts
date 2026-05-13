import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../../shared/utils/api";

export interface VulnCveListItem {
  id: string;
  cveId: string | null;
  sources: string[];
  title: string | null;
  description: string | null;
  cvssScore: number | null;
  severity: string | null;
  epssScore: number | null;
  epssPercentile: number | null;
  isKev: boolean;
  modifiedAt: string | null;
}

export interface VulnCve {
  id: string;
  cveId: string | null;
  sources: string[];
  title: string | null;
  description: string | null;
  cvssScore: number | null;
  cvssVector: string | null;
  cvssVersion: string | null;
  severity: string | null;
  epssScore: number | null;
  epssPercentile: number | null;
  isKev: boolean;
  kevDate: string | null;
  kevDueDate: string | null;
  kevRansomware: boolean;
  affectedPackages: unknown;
  references: unknown;
  publishedAt: string | null;
  modifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VulnStats {
  total: number;
  bySeverity: Record<string, number>;
  kevCount: number;
  newLast24h: number;
  lastSync: Record<string, string | null>;
}

export interface SyncSourceStatus {
  source: string;
  lastSyncAt: string | null;
  lastCount: number | null;
  errorCount: number;
  lastError: string | null;
  status: "ok" | "warn" | "error";
}

export interface CveListResponse {
  data: VulnCveListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CveFilters {
  page: number;
  limit: number;
  severity: string;
  source: string;
  is_kev: string;
  search: string;
  sort: string;
  order: string;
}

interface VulnMonitorState {
  cves: VulnCveListItem[];
  total: number;
  totalPages: number;
  page: number;
  stats: VulnStats | null;
  syncStatus: SyncSourceStatus[];
  selectedCve: VulnCve | null;
  filters: CveFilters;
  loading: boolean;
  statsLoading: boolean;
  syncLoading: boolean;
  backfillLoading: boolean;
  backfillMessage: string | null;
  error: string | null;
}

const initialFilters: CveFilters = {
  page: 1,
  limit: 50,
  severity: "",
  source: "",
  is_kev: "",
  search: "",
  sort: "modified_at",
  order: "desc",
};

const initialState: VulnMonitorState = {
  cves: [],
  total: 0,
  totalPages: 1,
  page: 1,
  stats: null,
  syncStatus: [],
  selectedCve: null,
  filters: initialFilters,
  loading: false,
  statsLoading: false,
  syncLoading: false,
  backfillLoading: false,
  backfillMessage: null,
  error: null,
};

export const fetchCves = createAsyncThunk(
  "vulnMonitor/fetchCves",
  async (filters: Partial<CveFilters>) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v !== undefined)
    );
    const response = await api.get<CveListResponse>("/cves", { params });
    return response.data;
  }
);

export const fetchVulnStats = createAsyncThunk(
  "vulnMonitor/fetchStats",
  async () => {
    const response = await api.get<VulnStats>("/cves/stats");
    return response.data;
  }
);

export const fetchSyncStatus = createAsyncThunk(
  "vulnMonitor/fetchSyncStatus",
  async () => {
    const response = await api.get<SyncSourceStatus[]>("/sync/status");
    return response.data;
  }
);

export const fetchCveById = createAsyncThunk(
  "vulnMonitor/fetchCveById",
  async (id: string) => {
    const response = await api.get<VulnCve>(`/cves/${id}`);
    return response.data;
  }
);

export const triggerSync = createAsyncThunk(
  "vulnMonitor/triggerSync",
  async () => {
    const response = await api.post("/sync/trigger");
    return response.data;
  }
);

export type BackfillSource = "nvd" | "github" | "osv" | "kev";

export interface BackfillPayload {
  source: BackfillSource;
  since: string;
  until?: string;
}

export const triggerBackfill = createAsyncThunk(
  "vulnMonitor/triggerBackfill",
  async (payload: BackfillPayload) => {
    const response = await api.post("/sync/backfill", payload);
    return response.data;
  }
);

const vulnMonitorSlice = createSlice({
  name: "vulnMonitor",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    setPage(state, action) {
      state.filters.page = action.payload;
    },
    clearSelectedCve(state) {
      state.selectedCve = null;
    },
    resetFilters(state) {
      state.filters = initialFilters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCves.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCves.fulfilled, (state, action) => {
        state.loading = false;
        state.cves = action.payload.data;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.page = action.payload.page;
      })
      .addCase(fetchCves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Error fetching CVEs";
      })

      .addCase(fetchVulnStats.pending, (state) => { state.statsLoading = true; })
      .addCase(fetchVulnStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchVulnStats.rejected, (state) => { state.statsLoading = false; })

      .addCase(fetchSyncStatus.pending, (state) => { state.syncLoading = true; })
      .addCase(fetchSyncStatus.fulfilled, (state, action) => {
        state.syncLoading = false;
        state.syncStatus = action.payload;
      })
      .addCase(fetchSyncStatus.rejected, (state) => { state.syncLoading = false; })

      .addCase(fetchCveById.fulfilled, (state, action) => {
        state.selectedCve = action.payload;
      })

      .addCase(triggerSync.pending, (state) => { state.syncLoading = true; })
      .addCase(triggerSync.fulfilled, (state) => { state.syncLoading = false; })
      .addCase(triggerSync.rejected, (state) => { state.syncLoading = false; })

      .addCase(triggerBackfill.pending, (state) => {
        state.backfillLoading = true;
        state.backfillMessage = null;
      })
      .addCase(triggerBackfill.fulfilled, (state, action) => {
        state.backfillLoading = false;
        state.backfillMessage = action.payload?.message ?? "Backfill iniciado";
      })
      .addCase(triggerBackfill.rejected, (state, action) => {
        state.backfillLoading = false;
        state.backfillMessage = action.error.message ?? "Error al iniciar backfill";
      });
  },
});

export const { setFilters, setPage, clearSelectedCve, resetFilters } = vulnMonitorSlice.actions;
export default vulnMonitorSlice.reducer;
