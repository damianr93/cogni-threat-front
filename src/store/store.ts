import { configureStore, type Action, type ThunkAction } from "@reduxjs/toolkit";
import ransomwareReducer from "./slices/ransomware/ransomwareSlice";
import cartReducer from "./slices/cart/cartSlice";
import vulnMonitorReducer from "./slices/vulnMonitor/vulnMonitorSlice";
import chatAiReducer from "./slices/chatAi/chatAiSlice";
import authReducer from "./slices/auth/authSlice";
import riskOperationsReducer from "./slices/riskOperations/riskOperationsSlice";

export const store = configureStore({
  reducer: {
    ransomware: ransomwareReducer,
    cart: cartReducer,
    vulnMonitor: vulnMonitorReducer,
    chatAi: chatAiReducer,
    auth: authReducer,
    riskOperations: riskOperationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
