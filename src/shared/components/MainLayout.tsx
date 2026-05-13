import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { Menu as MenuIcon, Security as SecurityIcon } from "@mui/icons-material";
import Sidebar from "./Sidebar";
import IpNotAllowedDialog from "./IpNotAllowedDialog";
import { theme } from "../../theme/theme";

interface MainLayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 260;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isChatRoute = location.pathname === "/chat-ai";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <IpNotAllowedDialog />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* Mobile-only top AppBar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            display: { sm: "none" },
            backgroundColor: "#0c1220",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            zIndex: (t) => t.zIndex.drawer + 1,
          }}
        >
          <Toolbar sx={{ minHeight: "56px !important", px: 1.5 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ color: "#94a3b8", mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: 1,
                  backgroundColor: "rgba(74, 144, 217, 0.15)",
                  border: "1px solid rgba(74, 144, 217, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SecurityIcon sx={{ color: "#4a90d9", fontSize: 15 }} />
              </Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}
              >
                CogniThreat
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Sidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: isChatRoute ? 0 : { xs: 2, sm: 3 },
            pt: isChatRoute
              ? { xs: "56px", sm: 0 }
              : { xs: "calc(56px + 16px)", sm: 3 },
            backgroundColor: "background.default",
            minHeight: "100vh",
            height: isChatRoute ? "100vh" : undefined,
            overflow: isChatRoute ? "hidden" : undefined,
            display: isChatRoute ? "flex" : "block",
            flexDirection: isChatRoute ? "column" : undefined,
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default MainLayout;
