import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { toPlainText } from "../utils/plainText";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  selectNotificationItems,
  selectNotificationsActionError,
  selectNotificationsError,
  selectNotificationsLoading,
  selectUnreadTotal,
  type AlertSourceFilter,
} from "../../store/slices/notifications/notificationsSlice";

export const UNREAD_POLL_INTERVAL_MS = 30_000;

const TABS: { value: AlertSourceFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "ransomware-live", label: "Ransomware" },
  { value: "telegram-channel", label: "Telegram" },
  { value: "vuln-monitor", label: "Vulnerabilidades" },
];

interface NotificationsBellProps {
  /** Where the bell lives; the panel always opens toward the page content. */
  placement?: "sidebar" | "appbar";
}

const formatDate = (iso: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("es");
};

const NotificationsBell: React.FC<NotificationsBellProps> = ({ placement = "sidebar" }) => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectNotificationItems);
  const unreadTotal = useAppSelector(selectUnreadTotal);
  const loading = useAppSelector(selectNotificationsLoading);
  const error = useAppSelector(selectNotificationsError);
  const actionError = useAppSelector(selectNotificationsActionError);

  // UI state is local to the component; the slice only holds server data.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tab, setTab] = useState<AlertSourceFilter>("all");
  const open = Boolean(anchorEl);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const refreshCount = useCallback(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    void dispatch(fetchUnreadCount());
  }, [dispatch]);

  // Poll the unread count; skipped while the tab is hidden, refreshed on return.
  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, UNREAD_POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshCount);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshCount);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (open) void dispatch(fetchNotifications({ sourceKey: tab }));
  }, [open, tab, dispatch]);

  const handleMarkAll = () => {
    void dispatch(markAllNotificationsRead(tab));
  };

  const handleItemClick = (id: string, isRead: boolean) => {
    if (!isRead) void dispatch(markNotificationRead(id));
  };

  const isAppBar = placement === "appbar";

  return (
    <>
      <IconButton
        ref={buttonRef}
        aria-label="Notificaciones"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: "#94a3b8" }}
      >
        <Badge
          badgeContent={unreadTotal}
          max={99}
          color="error"
          invisible={unreadTotal <= 0}
          slotProps={{
            badge: {
              "aria-label":
                unreadTotal > 0 ? `${unreadTotal} notificaciones sin leer` : undefined,
            } as React.HTMLAttributes<HTMLSpanElement>,
          }}
        >
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>

      {/* Popover renders in a portal, so the sidebar cannot clip the panel. */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={
          isAppBar
            ? { vertical: "bottom", horizontal: "right" }
            : { vertical: "top", horizontal: "right" }
        }
        transformOrigin={
          isAppBar
            ? { vertical: "top", horizontal: "right" }
            : { vertical: "top", horizontal: "left" }
        }
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "Notificaciones",
            sx: {
              width: { xs: "calc(100vw - 16px)", sm: 380 },
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#0c1220",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#e2e8f0" }}>
            Notificaciones
          </Typography>
          <Button size="small" onClick={handleMarkAll} disabled={unreadTotal <= 0}>
            Marcar todas como leídas
          </Button>
        </Box>
        <Tabs
          value={tab}
          onChange={(_e, value: AlertSourceFilter) => setTab(value)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ minHeight: 36, px: 1 }}
        >
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} sx={{ minHeight: 36, py: 0 }} />
          ))}
        </Tabs>
        <Divider />

        {actionError && (
          <Alert severity="warning" sx={{ m: 1 }}>
            No se pudo completar la acción
          </Alert>
        )}

        <Box sx={{ overflowY: "auto", flex: 1, minHeight: 80 }}>
          {loading && items.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={22} />
            </Box>
          ) : error ? (
            <Typography sx={{ p: 3, textAlign: "center", color: "#f87171" }} variant="body2">
              No se pudieron cargar las notificaciones
            </Typography>
          ) : items.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: "center", color: "#64748b" }} variant="body2">
              No hay notificaciones
            </Typography>
          ) : (
            <List dense disablePadding>
              {items.map((n) => (
                <ListItemButton
                  key={n.id}
                  onClick={() => handleItemClick(n.id, n.isRead)}
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    borderLeft: n.isRead ? "3px solid transparent" : "3px solid #4a90d9",
                    opacity: n.isRead ? 0.65 : 1,
                  }}
                >
                  {/* Plain React text node: never interpreted as HTML. */}
                  <Typography
                    variant="body2"
                    sx={{ color: "#e2e8f0", whiteSpace: "pre-line", wordBreak: "break-word" }}
                  >
                    {toPlainText(n.payload?.telegramMessage)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {formatDate(n.sentAt ?? n.createdAt)}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationsBell;
