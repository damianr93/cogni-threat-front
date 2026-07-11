import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useEffect } from "react";
import MainLayout from "../../shared/components/MainLayout";
import Home from "../../pages/Home";
import RansomwareDashboard from "../../pages/RansomwareDashboard";
import RansomwareGroupsDashboard from "../../pages/RansomwareGroupsDashboard";
import AlertsConfig from "../../pages/AlertsConfig";
import TelegramAlerts from "../../pages/TelegramAlerts";
import ActorsDashboard from "../../pages/ActorsDashboard";
import CustomDashboard from "../../pages/CustomDashboard";
import VulnMonitorDashboard from "../../pages/VulnMonitorDashboard";
import ChatAiDashboard from "../../pages/ChatAiDashboard";
import Login from "../../pages/Login";
import AdminUsersPanel from "../../pages/AdminUsersPanel";
import SecretsPanel from "../../pages/SecretsPanel";
import AssetsPage from "../../pages/AssetsPage";
import RisksPage from "../../pages/RisksPage";
import RiskTreatmentPage from "../../pages/RiskTreatmentPage";
import OperationalControlPage from "../../pages/OperationalControlPage";
import KpisPage from "../../pages/KpisPage";
import KpiDetailPage from "../../pages/risk-operations/KpiDetailPage";
import AdminRiskSettingsPage from "../../pages/AdminRiskSettingsPage";
import { useAppDispatch } from "../../shared/hooks/useAppDispatch";
import { useAppSelector } from "../../shared/hooks/useAppSelector";
import { fetchCurrentUser } from "../../store/slices/auth/authSlice";

const ProtectedLayout = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, token, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (loading || (token && !user)) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<CustomDashboard />} />
        <Route path="/ransomware" element={<RansomwareDashboard />} />
        <Route path="/ransomware-groups" element={<RansomwareGroupsDashboard />} />
        <Route path="/vuln-monitor" element={<VulnMonitorDashboard />} />
        <Route path="/chat-ai" element={<ChatAiDashboard />} />
        <Route path="/alerts-config" element={<AlertsConfig />} />
        <Route path="/telegram-alerts" element={<TelegramAlerts />} />
        <Route path="/actors" element={<ActorsDashboard />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/risks" element={<RisksPage />} />
        <Route path="/risk-treatment" element={<RiskTreatmentPage />} />
        <Route path="/kpis" element={<KpisPage />} />
        <Route path="/kpis/:id" element={<KpiDetailPage />} />
        <Route path="/operational-controls" element={<OperationalControlPage />} />
        <Route path="/admin" element={user?.role === "ADMIN" ? <AdminUsersPanel /> : <Navigate to="/" replace />} />
        <Route path="/admin/risk-settings" element={user?.role === "ADMIN" ? <AdminRiskSettingsPage /> : <Navigate to="/" replace />} />
        <Route path="/admin/secrets" element={user?.role === "ADMIN" ? <SecretsPanel /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
};
