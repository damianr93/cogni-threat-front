import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { NAV_SECTIONS } from "../config/navigation";
import { logout } from "../../store/slices/auth/authSlice";

const drawerWidth = 260;

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const SidebarContent: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
    onNavigate?.();
  };

  return (
    <>
      <Toolbar
        sx={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          px: 2.5,
          minHeight: "64px !important",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1,
              backgroundColor: "rgba(74, 144, 217, 0.15)",
              border: "1px solid rgba(74, 144, 217, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <SecurityIcon sx={{ color: "#4a90d9", fontSize: 17 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "#e2e8f0",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              CogniThreat
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
                fontSize: "0.68rem",
                letterSpacing: "0.02em",
              }}
            >
              Intelligence Platform
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Box sx={{ overflow: "auto", mt: 1.5, px: 1.5, flex: 1 }}>
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.roles?.length) return true;
            return user ? item.roles.includes(user.role) : false;
          });

          if (!visibleItems.length) return null;

          return (
            <Box key={section.id} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  mb: 0.5,
                  display: "block",
                  color: "#475569",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                }}
              >
                {section.title}
              </Typography>
              <List dense disablePadding>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                      <ListItemButton
                        selected={isActive}
                        onClick={() => {
                          navigate(item.path);
                          onNavigate?.();
                        }}
                        sx={{
                          borderRadius: 1.5,
                          py: 0.85,
                          px: 1.5,
                          "&.Mui-selected": {
                            backgroundColor: "rgba(74, 144, 217, 0.1)",
                            "&:hover": {
                              backgroundColor: "rgba(74, 144, 217, 0.14)",
                            },
                            "& .MuiListItemIcon-root": {
                              color: "#4a90d9",
                            },
                            "& .MuiListItemText-primary": {
                              color: "#93bbf0",
                              fontWeight: 600,
                            },
                          },
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: isActive ? "#4a90d9" : "#475569",
                            minWidth: 36,
                            "& .MuiSvgIcon-root": { fontSize: 18 },
                          }}
                        >
                          <Icon />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: "0.85rem",
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? "#93bbf0" : "#94a3b8",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#2d9e6b",
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography variant="caption" display="block" sx={{ color: "#94a3b8", fontWeight: 500 }}>
              {user?.email ?? "Sesión activa"}
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: "#475569", fontSize: "0.65rem" }}>
              {user ? `${user.role} · ${user.permission}` : "v1.0.0"}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </Box>
    </>
  );
};

const drawerPaperSx = {
  width: drawerWidth,
  boxSizing: "border-box",
  backgroundColor: "#0c1220",
  borderRight: "1px solid rgba(255, 255, 255, 0.06)",
};

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
      >
        <SidebarContent onNavigate={onClose} />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": drawerPaperSx,
      }}
    >
      <SidebarContent />
    </Drawer>
  );
};

export default Sidebar;
