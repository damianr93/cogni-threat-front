import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../../shared/utils/api";

export const ALERT_SOURCE_KEYS = [
  "ransomware-live",
  "telegram-channel",
  "vuln-monitor",
] as const;

export type AlertSourceKey = (typeof ALERT_SOURCE_KEYS)[number];

/** "all" is a UI-only value meaning "no source filter". */
export type AlertSourceFilter = AlertSourceKey | "all";

export const NOTIFICATIONS_PAGE_SIZE = 50;

export interface AlertNotification {
  id: string;
  sourceKey: string | null;
  isRead: boolean;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
  payload?: { telegramMessage?: string | null } | null;
}

export type UnreadCounts = Record<AlertSourceKey, number> & { total: number };

export interface FetchNotificationsArgs {
  sourceKey?: AlertSourceFilter | null;
  unread?: boolean;
  limit?: number;
  offset?: number;
}

/** What an optimistic mark-read actually changed, so a rollback is exact. */
interface AppliedRead {
  sourceKey: AlertSourceKey | null;
  decrementedSource: boolean;
  decrementedTotal: boolean;
}

export interface NotificationsState {
  items: AlertNotification[];
  unreadCount: UnreadCounts;
  loading: boolean;
  error: string | null;
  actionError: string | null;
  hasMore: boolean;
  pendingReads: Record<string, AppliedRead>;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

type UnreadCountPayload =
  | { sourceKey: AlertSourceKey; count: number }
  | { sourceKey: null; counts: UnreadCounts };

const emptyCounts = (): UnreadCounts => ({
  total: 0,
  "ransomware-live": 0,
  "telegram-channel": 0,
  "vuln-monitor": 0,
});

const initialState: NotificationsState = {
  items: [],
  unreadCount: emptyCounts(),
  loading: false,
  error: null,
  actionError: null,
  hasMore: false,
  pendingReads: {},
};

const isSourceKey = (value: unknown): value is AlertSourceKey =>
  ALERT_SOURCE_KEYS.includes(value as AlertSourceKey);

/** Narrows a UI filter to a real source key; "all", null and unknown give null. */
const toSourceKey = (value: unknown): AlertSourceKey | null =>
  isSourceKey(value) ? value : null;

const sumSources = (counts: UnreadCounts): number =>
  ALERT_SOURCE_KEYS.reduce((sum, key) => sum + counts[key], 0);

const errorMessage = (err: unknown, fallback: string): string => {
  const e = err as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

export const fetchNotifications = createAsyncThunk<
  AlertNotification[],
  FetchNotificationsArgs | void,
  { rejectValue: string }
>("notifications/fetchNotifications", async (args, { rejectWithValue }) => {
  const { sourceKey, unread, limit, offset } = args ?? {};
  const params: Record<string, string | number | boolean> = {
    limit: limit ?? NOTIFICATIONS_PAGE_SIZE,
    offset: offset ?? 0,
  };
  const key = toSourceKey(sourceKey);
  if (key) params.sourceKey = key;
  if (unread) params.unread = true;
  try {
    const res = await api.get<ApiEnvelope<AlertNotification[]>>(
      "/alerts/notifications",
      { params },
    );
    return res.data.data ?? [];
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Error al cargar las notificaciones"));
  }
});

export const fetchUnreadCount = createAsyncThunk<
  UnreadCountPayload,
  AlertSourceFilter | void,
  { rejectValue: string }
>("notifications/fetchUnreadCount", async (sourceKey, { rejectWithValue }) => {
  const key = toSourceKey(sourceKey);
  try {
    if (key) {
      const res = await api.get<ApiEnvelope<{ count: number }>>(
        "/alerts/notifications/unread-count",
        { params: { sourceKey: key } },
      );
      return { sourceKey: key, count: res.data.data?.count ?? 0 };
    }
    const res = await api.get<ApiEnvelope<Partial<UnreadCounts>>>(
      "/alerts/notifications/unread-count",
      { params: {} },
    );
    return { sourceKey: null, counts: { ...emptyCounts(), ...res.data.data } };
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Error al cargar el contador"));
  }
});

export const markNotificationRead = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notifications/markRead", async (id, { rejectWithValue }) => {
  try {
    await api.put(`/alerts/notifications/${id}/read`);
    return id;
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Error al marcar como leída"));
  }
});

export const markAllNotificationsRead = createAsyncThunk<
  AlertSourceKey | null,
  AlertSourceFilter | void,
  { rejectValue: string }
>("notifications/markAllRead", async (sourceKey, { rejectWithValue }) => {
  const key = toSourceKey(sourceKey);
  try {
    await api.put("/alerts/notifications/read-all", null, {
      params: key ? { sourceKey: key } : {},
    });
    return key;
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Error al marcar todas como leídas"));
  }
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { limit, offset } = action.meta.arg ?? {};
        const pageSize = limit ?? NOTIFICATIONS_PAGE_SIZE;
        state.loading = false;
        state.items = offset
          ? [...state.items, ...action.payload]
          : action.payload;
        state.hasMore = action.payload.length >= pageSize;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? action.error.message ?? "Error al cargar las notificaciones";
        if (!action.meta.arg?.offset) {
          state.items = [];
          state.hasMore = false;
        }
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        const payload = action.payload;
        if (payload.sourceKey) {
          state.unreadCount[payload.sourceKey] = payload.count;
          state.unreadCount.total = sumSources(state.unreadCount);
        } else {
          state.unreadCount = payload.counts;
        }
      })
      .addCase(markNotificationRead.pending, (state, action) => {
        const id = action.meta.arg;
        state.actionError = null;
        const item = state.items.find((n) => n.id === id);
        if (!item || item.isRead || state.pendingReads[id]) return;
        const sourceKey = toSourceKey(item.sourceKey);
        const applied: AppliedRead = {
          sourceKey,
          decrementedSource: false,
          decrementedTotal: false,
        };
        item.isRead = true;
        item.readAt = new Date().toISOString();
        if (sourceKey && state.unreadCount[sourceKey] > 0) {
          state.unreadCount[sourceKey] -= 1;
          applied.decrementedSource = true;
        }
        if (state.unreadCount.total > 0) {
          state.unreadCount.total -= 1;
          applied.decrementedTotal = true;
        }
        state.pendingReads[id] = applied;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        delete state.pendingReads[action.payload];
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        const id = action.meta.arg;
        state.actionError =
          action.payload ?? action.error.message ?? "Error al marcar como leída";
        const applied = state.pendingReads[id];
        if (!applied) return;
        delete state.pendingReads[id];
        const item = state.items.find((n) => n.id === id);
        if (item) {
          item.isRead = false;
          item.readAt = null;
        }
        if (applied.sourceKey && applied.decrementedSource) {
          state.unreadCount[applied.sourceKey] += 1;
        }
        if (applied.decrementedTotal) state.unreadCount.total += 1;
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.actionError = null;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        const sourceKey = action.payload;
        const now = new Date().toISOString();
        for (const item of state.items) {
          if (!item.isRead && (!sourceKey || item.sourceKey === sourceKey)) {
            item.isRead = true;
            item.readAt = now;
          }
        }
        if (sourceKey) {
          state.unreadCount[sourceKey] = 0;
          state.unreadCount.total = sumSources(state.unreadCount);
        } else {
          state.unreadCount = emptyCounts();
        }
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.actionError =
          action.payload ?? action.error.message ?? "Error al marcar todas como leídas";
      });
  },
});

type SliceRoot = { notifications: NotificationsState };

export const selectNotificationItems = (state: SliceRoot) => state.notifications.items;
export const selectUnreadCounts = (state: SliceRoot) => state.notifications.unreadCount;
export const selectUnreadTotal = (state: SliceRoot) => state.notifications.unreadCount.total;
export const selectNotificationsLoading = (state: SliceRoot) => state.notifications.loading;
export const selectNotificationsError = (state: SliceRoot) => state.notifications.error;
export const selectNotificationsActionError = (state: SliceRoot) =>
  state.notifications.actionError;
export const selectNotificationsHasMore = (state: SliceRoot) => state.notifications.hasMore;

export default notificationsSlice.reducer;
