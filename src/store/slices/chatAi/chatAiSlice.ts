import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../../shared/utils/api";
import { AI_ENDPOINTS } from "../../../shared/constants";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  pending?: boolean;
  failed?: boolean;
}

export interface ConversationSummary {
  id: number;
  title: string;
  createdAt: string;
}

export interface ContextCategory {
  id: string;
  name: string;
  label: string;
  color: string;
}

export interface ContextSourceItem {
  id: string;
  label: string;
  category: string;
  summary?: string;
}

interface ChatAiState {
  conversations: ConversationSummary[];
  selectedId: number | null;
  messagesByConv: Record<number, ChatMessage[]>;
  loadingConversations: boolean;
  loadingHistory: boolean;
  sending: boolean;
  selectedCategories: string[];
  selectedSources: string[];
  contextCategories: ContextCategory[];
  contextSources: ContextSourceItem[];
  contextSourcesTotal: number;
  contextSourcesPage: number;
  contextSourcesTotalPages: number;
  loadingContextSources: boolean;
  error: string | null;
}

const initialState: ChatAiState = {
  conversations: [],
  selectedId: null,
  messagesByConv: {},
  loadingConversations: false,
  loadingHistory: false,
  sending: false,
  selectedCategories: [],
  selectedSources: [],
  contextCategories: [],
  contextSources: [],
  contextSourcesTotal: 0,
  contextSourcesPage: 1,
  contextSourcesTotalPages: 1,
  loadingContextSources: false,
  error: null,
};

function unwrapData<T>(payload: unknown): T {
  const p = payload as { success?: boolean; data?: T };
  if (p && typeof p === "object" && "data" in p) return p.data as T;
  return payload as T;
}

export const fetchConversations = createAsyncThunk(
  "chatAi/fetchConversations",
  async () => {
    const response = await api.get(AI_ENDPOINTS.CONVERSATIONS);
    return unwrapData<ConversationSummary[]>(response.data);
  }
);

export const fetchHistory = createAsyncThunk(
  "chatAi/fetchHistory",
  async (conversationId: number) => {
    const response = await api.get(AI_ENDPOINTS.CONVERSATION_HISTORY(conversationId));
    return { conversationId, messages: unwrapData<ChatMessage[]>(response.data) };
  }
);

export const createConversation = createAsyncThunk(
  "chatAi/createConversation",
  async (title?: string) => {
    const response = await api.post(AI_ENDPOINTS.CONVERSATION, title ? { title } : {});
    return unwrapData<ConversationSummary>(response.data);
  }
);

export const updateConversationTitle = createAsyncThunk(
  "chatAi/updateConversationTitle",
  async ({ id, title }: { id: number; title: string }) => {
    const response = await api.put(AI_ENDPOINTS.CONVERSATION_UPDATE_TITLE(id), { title });
    return unwrapData<{ id: number; title: string }>(response.data);
  }
);

export const deleteConversation = createAsyncThunk(
  "chatAi/deleteConversation",
  async (conversationId: number, { rejectWithValue }) => {
    try {
      await api.post(AI_ENDPOINTS.CONVERSATION_DELETE, { conversationId });
      return { conversationId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar conversación";
      return rejectWithValue(message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chatAi/sendMessage",
  async (
    {
      conversationId,
      question,
      categories,
      sources,
      tempId,
    }: {
      conversationId: number;
      question: string;
      categories?: string[];
      sources?: string[];
      tempId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const body: Record<string, unknown> = { conversationId, question };
      if (sources?.length) body.sources = sources;
      else if (categories?.length) body.categories = categories;

      const response = await api.post(AI_ENDPOINTS.ASK, body);
      const data = unwrapData<{ response: string; conversationId: number; timestamp: string }>(
        response.data
      );
      return { question, tempId, ...data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al enviar mensaje";
      return rejectWithValue({ message, tempId, conversationId });
    }
  }
);

export const fetchContextCategories = createAsyncThunk(
  "chatAi/fetchContextCategories",
  async () => {
    const response = await api.get<ContextCategory[]>(AI_ENDPOINTS.CONTEXT_CATEGORIES);
    return response.data;
  }
);

export const fetchContextSources = createAsyncThunk(
  "chatAi/fetchContextSources",
  async (params: { page?: number; search?: string; category?: string }) => {
    const response = await api.get<{
      items: ContextSourceItem[];
      total: number;
      page: number;
      totalPages: number;
    }>(AI_ENDPOINTS.CONTEXT_SOURCES, { params: { limit: 20, ...params } });
    return response.data;
  }
);

const chatAiSlice = createSlice({
  name: "chatAi",
  initialState,
  reducers: {
    selectConversation(state, action: PayloadAction<number | null>) {
      state.selectedId = action.payload;
    },
    toggleSelectedSource(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.selectedSources.indexOf(id);
      if (idx >= 0) state.selectedSources.splice(idx, 1);
      else state.selectedSources.push(id);
    },
    clearSelectedSources(state) {
      state.selectedSources = [];
    },
    toggleSelectedCategory(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.selectedCategories.indexOf(id);
      if (idx >= 0) state.selectedCategories.splice(idx, 1);
      else state.selectedCategories.push(id);
    },
    clearSelectedCategories(state) {
      state.selectedCategories = [];
    },
    setSelectedCategories(state, action: PayloadAction<string[]>) {
      state.selectedCategories = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.error.message ?? "Error cargando conversaciones";
      })

      .addCase(fetchHistory.pending, (state) => {
        state.loadingHistory = true;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        state.messagesByConv[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loadingHistory = false;
        state.error = action.error.message ?? "Error cargando historial";
      })

      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.selectedId = action.payload.id;
        state.messagesByConv[action.payload.id] = [];
      })

      .addCase(updateConversationTitle.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.payload.id);
        if (conv) conv.title = action.payload.title;
      })

      .addCase(deleteConversation.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        state.conversations = state.conversations.filter((c) => c.id !== conversationId);
        delete state.messagesByConv[conversationId];
        if (state.selectedId === conversationId) {
          state.selectedId = null;
        }
      })
      .addCase(deleteConversation.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Error al eliminar conversación";
      })

      .addCase(sendMessage.pending, (state, action) => {
        state.sending = true;
        state.error = null;
        const { conversationId, question, tempId } = action.meta.arg;
        const messages = state.messagesByConv[conversationId] ?? [];
        const optimisticMsg: ChatMessage = {
          id: tempId,
          role: "user",
          content: question,
          timestamp: new Date().toISOString(),
          pending: true,
        };
        state.messagesByConv[conversationId] = [...messages, optimisticMsg];
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const { conversationId, question, response, timestamp, tempId } = action.payload;
        const messages = state.messagesByConv[conversationId] ?? [];
        const userMsg: ChatMessage = {
          id: `local-u-${Date.now()}`,
          role: "user",
          content: question,
          timestamp: new Date().toISOString(),
        };
        const assistantMsg: ChatMessage = {
          id: `local-a-${Date.now()}`,
          role: "assistant",
          content: response,
          timestamp,
        };
        const withoutTemp = messages.filter((m) => m.id !== tempId);
        state.messagesByConv[conversationId] = [...withoutTemp, userMsg, assistantMsg];
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        const payload = action.payload as { message?: string; tempId?: string; conversationId?: number } | undefined;
        state.error = payload?.message ?? "Error al enviar";
        if (payload?.conversationId != null && payload.tempId) {
          const messages = state.messagesByConv[payload.conversationId];
          if (messages) {
            const msg = messages.find((m) => m.id === payload.tempId);
            if (msg) {
              msg.pending = false;
              msg.failed = true;
            }
          }
        }
      })

      .addCase(fetchContextCategories.fulfilled, (state, action) => {
        state.contextCategories = action.payload;
      })

      .addCase(fetchContextSources.pending, (state) => {
        state.loadingContextSources = true;
      })
      .addCase(fetchContextSources.fulfilled, (state, action) => {
        state.loadingContextSources = false;
        state.contextSources = action.payload.items;
        state.contextSourcesTotal = action.payload.total;
        state.contextSourcesPage = action.payload.page;
        state.contextSourcesTotalPages = action.payload.totalPages;
      })
      .addCase(fetchContextSources.rejected, (state) => {
        state.loadingContextSources = false;
      });
  },
});

export const {
  selectConversation,
  toggleSelectedSource,
  clearSelectedSources,
  toggleSelectedCategory,
  clearSelectedCategories,
  setSelectedCategories,
  clearError,
} = chatAiSlice.actions;

export default chatAiSlice.reducer;
