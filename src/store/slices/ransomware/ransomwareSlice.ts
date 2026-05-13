import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../../shared/utils/api";

export interface RansomwareStats {
  overview: {
    totalGroups: number;
    totalVictims: number;
    argentinaAttacks: number;
  };
  topGroups: Array<{ group: string; altname?: string; victims: number; name?: string }>;
  allGroups: string[];
  attacksByCountry: Array<{ country: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number }>;
  sectorAnalysis: Array<{ activity: string; count: number }>;
  recentActivity: Array<{
    id: string;
    victim: string;
    group: string;
    country: string | null;
    activity: string | null;
    discovered: string;
    website: string | null;
    description: string | null;
    postUrl: string | null;
    screenshot: string | null;
    permalink: string | null;
    attackDate: string | null;
    duplicates: string[];
    extrainfos: string[];
    infostealer: string | null;
    press: string | null;
    ransomwareLiveId: string;
  }>;
}

export interface RansomwareGroupListItem {
  group: string;
  altname: string | null;
  victims: number;
  firstseen: string | null;
  lastseen: string | null;
  has_negotiations: boolean;
  negotiation_count: number;
  has_ransomnote: boolean;
  ransomnotes_count: number;
}

export interface GroupsSyncTriggerResponse {
  started: boolean;
  message: string;
}

export interface GroupsSyncProgress {
  status: "idle" | "running" | "completed" | "failed";
  total: number;
  processed: number;
  successCount: number;
  errorCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  message: string | null;
}

interface DashboardSource {
  id: string;
  name: string;
  type: string;
  lastSync: string | null;
}

interface RansomwareState {
  stats: RansomwareStats | null;
  loading: boolean;
  error: string | null;
  allGroups: RansomwareGroupListItem[];
  allGroupsLoading: boolean;
  groupsSyncStatus: "idle" | "syncing" | "error";
  groupsLastSyncAt: string | null;
  groupsSyncMessage: string | null;
  groupsSyncProgress: GroupsSyncProgress | null;
}

const initialState: RansomwareState = {
  stats: null,
  loading: false,
  error: null,
  allGroups: [],
  allGroupsLoading: false,
  groupsSyncStatus: "idle",
  groupsLastSyncAt: null,
  groupsSyncMessage: null,
  groupsSyncProgress: null,
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 20 * 60 * 1000;

async function waitForGroupsSyncCompletion(
  dispatch: (action: ReturnType<typeof fetchGroupsSyncProgress>) => { unwrap: () => Promise<GroupsSyncProgress> }
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const progress = await dispatch(fetchGroupsSyncProgress()).unwrap();
    if (progress.status === "completed" || progress.status === "failed") {
      return progress;
    }
  }
  return null;
}

export const fetchRansomwareStats = createAsyncThunk(
  "ransomware/fetchStats",
  async () => {
    const response = await api.get("/dashboard/ransomware-stats");
    return response.data.data;
  }
);

export const fetchAllGroups = createAsyncThunk(
  "ransomware/fetchAllGroups",
  async () => {
    const response = await api.get("/dashboard/all-groups");
    if (response.data.success && response.data.data) {
      return response.data.data as RansomwareGroupListItem[];
    }
    return [];
  }
);

export const fetchGroupsSyncStatus = createAsyncThunk(
  "ransomware/fetchGroupsSyncStatus",
  async () => {
    const response = await api.get<DashboardSource[]>("/dashboard/sources");
    const source = response.data.find((s) => s.name === "ransomware-live");
    return source?.lastSync ?? null;
  }
);

export const fetchGroupsSyncProgress = createAsyncThunk(
  "ransomware/fetchGroupsSyncProgress",
  async () => {
    const response = await api.get<GroupsSyncProgress>("/data-sources/sync-groups/status");
    return response.data;
  }
);

export const triggerGroupsSync = createAsyncThunk(
  "ransomware/triggerGroupsSync",
  async (_, { dispatch }) => {
    const response = await api.post<GroupsSyncTriggerResponse>("/data-sources/sync-groups");
    const result = response.data;

    if (!result.started) {
      return { trigger: result, progress: null as GroupsSyncProgress | null };
    }

    const progress = await waitForGroupsSyncCompletion(dispatch);
    await dispatch(fetchAllGroups());
    await dispatch(fetchRansomwareStats());
    await dispatch(fetchGroupsSyncStatus());
    return { trigger: result, progress };
  }
);

const ransomwareSlice = createSlice({
  name: "ransomware",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearGroupsSyncMessage: (state) => {
      state.groupsSyncMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRansomwareStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRansomwareStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchRansomwareStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error fetching stats";
      })
      .addCase(fetchAllGroups.pending, (state) => {
        state.allGroupsLoading = true;
      })
      .addCase(fetchAllGroups.fulfilled, (state, action) => {
        state.allGroupsLoading = false;
        state.allGroups = action.payload;
      })
      .addCase(fetchAllGroups.rejected, (state) => {
        state.allGroupsLoading = false;
      })
      .addCase(fetchGroupsSyncStatus.fulfilled, (state, action) => {
        state.groupsLastSyncAt = action.payload;
      })
      .addCase(fetchGroupsSyncProgress.fulfilled, (state, action) => {
        state.groupsSyncProgress = action.payload;
        if (action.payload.status === "running") {
          state.groupsSyncStatus = "syncing";
        } else if (action.payload.status === "failed") {
          state.groupsSyncStatus = "error";
        } else if (action.payload.status === "completed" || action.payload.status === "idle") {
          state.groupsSyncStatus = "idle";
        }
      })
      .addCase(triggerGroupsSync.pending, (state) => {
        state.groupsSyncStatus = "syncing";
        state.groupsSyncMessage = null;
      })
      .addCase(triggerGroupsSync.fulfilled, (state, action) => {
        state.groupsSyncStatus = action.payload.progress?.status === "failed" ? "error" : "idle";
        state.groupsSyncMessage =
          action.payload.progress?.message ?? action.payload.trigger.message;
        if (action.payload.progress) {
          state.groupsSyncProgress = action.payload.progress;
        }
      })
      .addCase(triggerGroupsSync.rejected, (state, action) => {
        state.groupsSyncStatus = "error";
        state.groupsSyncMessage = action.error.message || "Error al sincronizar grupos";
      });
  },
});

export const { clearError, clearGroupsSyncMessage } = ransomwareSlice.actions;
export default ransomwareSlice.reducer;
