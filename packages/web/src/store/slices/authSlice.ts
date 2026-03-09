import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "../../lib/api";
import { disconnectSocket } from "../../lib/socket";

interface User {
  id: string;
  email: string;
  handle: string;
  displayName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("sentry_token"),
  refreshToken: localStorage.getItem("sentry_refresh_token"),
  isAuthenticated: !!localStorage.getItem("sentry_token"),
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { identifier: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/auth/login", credentials);
      localStorage.setItem("sentry_token", response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem(
          "sentry_refresh_token",
          response.data.refreshToken,
        );
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    data: {
      email: string;
      password: string;
      handle: string;
      displayName: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/auth/register", data);
      localStorage.setItem("sentry_token", response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem(
          "sentry_refresh_token",
          response.data.refreshToken,
        );
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Registration failed",
      );
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/users/me");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch user",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem("sentry_token");
      localStorage.removeItem("sentry_refresh_token");
      disconnectSocket();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        // Token is invalid/expired — log user out
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem("sentry_token");
        localStorage.removeItem("sentry_refresh_token");
        disconnectSocket();
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
