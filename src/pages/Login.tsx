import React, { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Security as SecurityIcon } from "@mui/icons-material";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../shared/hooks/useAppDispatch";
import { useAppSelector } from "../shared/hooks/useAppSelector";
import { clearAuthError, login, register } from "../store/slices/auth/authSlice";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (mode === "register") {
      const result = await dispatch(register({ email, password }));

      if (register.fulfilled.match(result)) {
        setMode("login");
        setPassword("");
        setSuccessMessage("Usuario registrado. Ya podés iniciar sesión.");
      }

      return;
    }

    const result = await dispatch(login({ email, password }));

    if (login.fulfilled.match(result)) {
      navigate(from, { replace: true });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        backgroundColor: "background.default",
      }}
    >
      <Container maxWidth="xs">
        <Paper sx={{ p: 4, backgroundColor: "background.paper" }}>
          <Stack spacing={3}>
            <Stack spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: "rgba(74, 144, 217, 0.15)",
                  border: "1px solid rgba(74, 144, 217, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SecurityIcon sx={{ color: "primary.main" }} />
              </Box>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={700}>
                  CogniThreat
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode === "login" ? "Ingresá para acceder al panel" : "Registrá un usuario de solo lectura"}
                </Typography>
              </Box>
            </Stack>

            {successMessage && <Alert severity="success">{successMessage}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  fullWidth
                />
                <TextField
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} /> : undefined}
                >
                  {mode === "login" ? "Iniciar sesión" : "Registrar"}
                </Button>
                <Button
                  type="button"
                  variant="text"
                  disabled={loading}
                  onClick={() => {
                    dispatch(clearAuthError());
                    setSuccessMessage(null);
                    setMode((current) => current === "login" ? "register" : "login");
                  }}
                >
                  {mode === "login" ? "Crear una cuenta" : "Ya tengo cuenta"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
