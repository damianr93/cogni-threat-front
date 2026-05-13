import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Delete, Refresh, Shield } from "@mui/icons-material";
import PageHeader from "../shared/components/PageHeader";
import { api } from "../shared/utils/api";
import { useAppSelector } from "../shared/hooks/useAppSelector";
import { surfaceSx } from "../shared/ui/surface";

type UserRole = "ADMIN" | "USER";
type UserPermission = "READ" | "WRITE";

interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  permission: UserPermission;
  isActive: boolean;
  createdAt: string;
}

const AdminUsersPanel: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<AdminUser[]>("/admin/users");
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (
    id: string,
    data: Partial<Pick<AdminUser, "role" | "permission" | "isActive">>,
  ) => {
    setSavingId(id);
    setError(null);

    try {
      const response = await api.put<AdminUser>(`/admin/users/${id}`, data);
      setUsers((current) => current.map((user) => user.id === id ? response.data : user));
    } catch (err: any) {
      setError(err.response?.data?.message ?? "No se pudo actualizar el usuario");
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;

    setSavingId(id);
    setError(null);

    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message ?? "No se pudo eliminar el usuario");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<Shield />}
        title="Administración"
        subtitle="Usuarios, roles y permisos"
        accentColor="#4a90d9"
        actions={
          <IconButton size="small" onClick={loadUsers} disabled={loading}>
            <Refresh fontSize="small" />
          </IconButton>
        }
      />

      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer component={Paper} sx={surfaceSx}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Permiso</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4}>
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  const isSaving = savingId === user.id;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={600}>{user.email}</Typography>
                          {isCurrentUser && <Chip size="small" label="Tu usuario" color="primary" variant="outlined" />}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={user.role}
                            disabled={isSaving}
                            onChange={(event) => updateUser(user.id, { role: event.target.value as UserRole })}
                          >
                            <MenuItem value="ADMIN">ADMIN</MenuItem>
                            <MenuItem value="USER">USER</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={user.permission}
                            disabled={isSaving}
                            onChange={(event) => updateUser(user.id, { permission: event.target.value as UserPermission })}
                          >
                            <MenuItem value="READ">READ</MenuItem>
                            <MenuItem value="WRITE">WRITE</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Switch
                            checked={user.isActive}
                            disabled={isSaving}
                            onChange={(event) => updateUser(user.id, { isActive: event.target.checked })}
                          />
                          <Chip
                            size="small"
                            label={user.isActive ? "Activo" : "Inactivo"}
                            color={user.isActive ? "success" : "default"}
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell align="center">
                        <Button
                          color="error"
                          variant="outlined"
                          size="small"
                          startIcon={<Delete />}
                          disabled={isSaving || isCurrentUser}
                          onClick={() => deleteUser(user.id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default AdminUsersPanel;
