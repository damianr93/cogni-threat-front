import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { API_ENDPOINTS } from "../../../shared/constants";
import type { AuthState, User } from "../../../shared/types";
import { api } from "../../../shared/utils/api";
import { clearAuthSession, getStoredAuthSession, persistAuthSession, updateStoredAuthUser } from "../../../shared/utils/authSession";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface RegisterResponse {
  user: User;
}

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
};

const { token: storedToken, user: storedUser } = getStoredAuthSession();

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken && storedUser),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getAuthErrorMessage(error, "No se pudo iniciar sesión"));
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ user: User }>(API_ENDPOINTS.PROFILE);
      return response.data.user;
    } catch (error: unknown) {
      return rejectWithValue(getAuthErrorMessage(error, "Sesión inválida"));
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await api.post<RegisterResponse>(API_ENDPOINTS.REGISTER, payload);
      return response.data.user;
    } catch (error: unknown) {
      return rejectWithValue(getAuthErrorMessage(error, "No se pudo registrar el usuario"));
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      clearAuthSession();
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        persistAuthSession(action.payload.accessToken, action.payload.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? "No se pudo iniciar sesión");
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        if (state.token) {
          updateStoredAuthUser(action.payload);
        }
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        clearAuthSession();
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? "No se pudo registrar el usuario");
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
