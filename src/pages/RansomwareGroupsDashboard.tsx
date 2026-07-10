import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Avatar,
  Fade,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Link,
  Grid,
  Snackbar,
  LinearProgress
} from "@mui/material";
import {
  Groups,
  Warning,
  AccessTime,
  Refresh,
  Search,
  Close,
  Launch,
  Security,
  Article,
  TrendingUp,
  Public,
  ArrowUpward,
  ArrowDownward,
  SortByAlpha,
  Sync,
  ExpandMore
} from "@mui/icons-material";
import { useAppDispatch } from "../shared/hooks/useAppDispatch";
import { useAppSelector } from "../shared/hooks/useAppSelector";
import {
  fetchRansomwareStats,
  fetchAllGroups,
  fetchGroupsSyncStatus,
  fetchGroupsSyncProgress,
  triggerGroupsSync,
  clearGroupsSyncMessage,
} from "../store/slices/ransomware/ransomwareSlice";
import { api } from "../shared/utils/api";
import { format } from "../shared/utils";
import PageHeader from "../shared/components/PageHeader";
import { useCanWrite } from "../shared/hooks/useCanWrite";

interface GroupDetails {
  id: string;
  group: string;
  altname: string | null;
  description: string | null;
  victims: number;
  firstseen: string | null;
  lastseen: string | null;
  added_date: string | null;
  has_negotiations: boolean;
  negotiation_count: number;
  has_ransomnote: boolean;
  ransomnotes_count: number;
  url: string | null;
  ttps: string[];
  vulnerabilities: string[];
  tools: any;
  locations: any[] | null;
  createdAt: string;
  updatedAt: string;
}


const wrapTextSx = { minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" } as const;

const wrapChipSx = {
  maxWidth: "100%",
  height: "auto",
  alignItems: "flex-start",
  "& .MuiChip-label": {
    display: "block",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    lineHeight: 1.35,
    py: 0.35,
  },
} as const;

const detailAccordionSx = {
  bgcolor: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(239, 68, 68, 0.18)",
  borderRadius: "12px !important",
  overflow: "hidden",
  "&:before": { display: "none" },
} as const;

interface GroupAttack {
  id: string;
  victim: string;
  group: string;
  country: string | null;
  activity: string | null;
  discovered: string;
  website: string | null;
  description: string | null;
  postUrl: string | null;
  screenshot: string | null;
  permalink: string | null;
  attackDate: string | null;
  duplicates: string[];
  extrainfos: string[];
  infostealer: string | null;
  press: string | null;
  ransomwareLiveId: string;
}

const RansomwareGroupsDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const canWrite = useCanWrite();
  const {
    stats,
    loading,
    error,
    allGroups,
    allGroupsLoading,
    groupsSyncStatus,
    groupsLastSyncAt,
    groupsSyncMessage,
    groupsSyncProgress,
  } = useAppSelector((state) => state.ransomware);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetails | null>(null);
  const [groupAttacks, setGroupAttacks] = useState<GroupAttack[]>([]);
  const [groupAttacksLoading, setGroupAttacksLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"group" | "victims" | "lastseen">("victims");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    dispatch(fetchRansomwareStats());
    dispatch(fetchAllGroups());
    dispatch(fetchGroupsSyncStatus());
    dispatch(fetchGroupsSyncProgress());
    const interval = setInterval(() => {
      dispatch(fetchRansomwareStats());
    }, 300000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (groupsSyncProgress?.status !== "running") return;
    const interval = setInterval(() => {
      dispatch(fetchGroupsSyncProgress());
    }, 3000);
    return () => clearInterval(interval);
  }, [dispatch, groupsSyncProgress?.status]);

  const handleRefresh = () => {
    dispatch(fetchAllGroups());
    dispatch(fetchRansomwareStats());
    dispatch(fetchGroupsSyncStatus());
  };

  const handleSync = () => {
    dispatch(triggerGroupsSync());
  };

  const handleGroupClick = async (groupName: string) => {
    setGroupAttacksLoading(true);
    try {
      // Fetch group details
      const detailsResponse = await api.get(`/dashboard/group-details?groupName=${encodeURIComponent(groupName)}`);
      if (detailsResponse.data.success && detailsResponse.data.data) {
        setSelectedGroup(detailsResponse.data.data);
      }

      // Fetch group attacks
      const attacksResponse = await api.get(`/dashboard/victims-by-filters?group=${encodeURIComponent(groupName)}`);
      if (attacksResponse.data.success && attacksResponse.data.data) {
        setGroupAttacks(attacksResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    } finally {
      setGroupAttacksLoading(false);
    }
  };

  const filteredAndSortedGroups = React.useMemo(() => {
    if (allGroups.length === 0) return [];

    let filtered = [...allGroups];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.group.toLowerCase().includes(query) ||
          (g.altname && g.altname.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "group":
          comparison = a.group.localeCompare(b.group);
          break;
        case "victims":
          comparison = a.victims - b.victims;
          break;
        case "lastseen":
          if (a.lastseen && b.lastseen) {
            comparison = new Date(a.lastseen).getTime() - new Date(b.lastseen).getTime();
          } else {
            comparison = a.victims - b.victims;
          }
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [allGroups, searchQuery, sortBy, sortOrder]);

  if ((loading && !stats) || allGroupsLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress size={80} thickness={4} sx={{ color: "#ef4444" }} />
        <Typography variant="h6" sx={{ mt: 3, color: "#ef4444"  }}>
          LOADING THREAT GROUPS...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ fontSize: "1.1rem" }}>{error}</Alert>
      </Container>
    );
  }

  if (!stats) return null;

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <PageHeader
        icon={<Groups />}
        title="Ransomware Groups"
        subtitle={`${stats.overview.totalGroups} grupos activos · inteligencia de actores`}
        accentColor="#c94c4c"
        actions={
          <Stack direction="row" alignItems="center" spacing={1}>
            {groupsLastSyncAt && (
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", mr: 1 }}>
                Última sync: {format.timeAgo(groupsLastSyncAt)}
              </Typography>
            )}
            {canWrite && (
              <Button
                size="small"
                variant="outlined"
                startIcon={
                  groupsSyncStatus === "syncing" ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <Sync fontSize="small" />
                  )
                }
                disabled={groupsSyncStatus === "syncing"}
                onClick={handleSync}
                sx={{
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontFamily: '"Rajdhani", sans-serif',
                  fontWeight: 600,
                  "&:hover": { borderColor: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.1)" },
                }}
              >
                Sincronizar grupos
              </Button>
            )}
            <IconButton size="small" onClick={handleRefresh} title="Actualizar">
              <Refresh fontSize="small" />
            </IconButton>
          </Stack>
        }
      />

      {groupsSyncProgress?.status === "running" && groupsSyncProgress.total > 0 && (
        <Container maxWidth="xl" sx={{ mb: 2 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(239, 68, 68, 0.08)" }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                  Sincronizando grupos…
                </Typography>
                <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: 700 }}>
                  {groupsSyncProgress.processed} / {groupsSyncProgress.total}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (groupsSyncProgress.processed / groupsSyncProgress.total) * 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "rgba(239, 68, 68, 0.15)",
                  "& .MuiLinearProgress-bar": { bgcolor: "#ef4444" },
                }}
              />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                {groupsSyncProgress.successCount} ok · {groupsSyncProgress.errorCount} errores
              </Typography>
            </Stack>
          </Paper>
        </Container>
      )}

      <Container maxWidth="xl">
        {/* Search and Filters */}
        <Fade in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              background: "transparent",
              
              borderRadius: 3
            }}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Buscar grupos por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#ef4444" }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "rgba(239, 68, 68, 0.3)"
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(239, 68, 68, 0.5)"
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#ef4444"
                    }
                  }
                }}
              />
              
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontWeight: 600,
                    fontFamily: '"Rajdhani", sans-serif',
                    letterSpacing: "0.05em",
                    textTransform: "uppercase"
                  }}
                >
                  Ordenar por:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant={sortBy === "victims" ? "contained" : "outlined"}
                    onClick={() => {
                      if (sortBy === "victims") {
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy("victims");
                        setSortOrder("desc");
                      }
                    }}
                    startIcon={<TrendingUp />}
                    endIcon={
                      sortBy === "victims" ? (
                        sortOrder === "desc" ? (
                          <ArrowDownward sx={{ fontSize: 16 }} />
                        ) : (
                          <ArrowUpward sx={{ fontSize: 16 }} />
                        )
                      ) : null
                    }
                    sx={{
                      fontFamily: '"Rajdhani", sans-serif',
                      fontWeight: 600,
                      borderColor: "rgba(239, 68, 68, 0.3)",
                      color: sortBy === "victims" ? "white" : "rgba(255, 255, 255, 0.7)",
                      ...(sortBy === "victims" && {
                        bgcolor: "#ef4444",
                        "&:hover": { bgcolor: "#dc2626" }
                      }),
                      "&:hover": {
                        borderColor: "rgba(239, 68, 68, 0.5)",
                        bgcolor: sortBy === "victims" ? "#dc2626" : "rgba(239, 68, 68, 0.1)"
                      }
                    }}
                  >
                    Víctimas
                  </Button>
                  <Button
                    variant={sortBy === "group" ? "contained" : "outlined"}
                    onClick={() => {
                      if (sortBy === "group") {
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy("group");
                        setSortOrder("asc");
                      }
                    }}
                    startIcon={<SortByAlpha />}
                    endIcon={
                      sortBy === "group" ? (
                        sortOrder === "desc" ? (
                          <ArrowDownward sx={{ fontSize: 16 }} />
                        ) : (
                          <ArrowUpward sx={{ fontSize: 16 }} />
                        )
                      ) : null
                    }
                    sx={{
                      fontFamily: '"Rajdhani", sans-serif',
                      fontWeight: 600,
                      borderColor: "rgba(239, 68, 68, 0.3)",
                      color: sortBy === "group" ? "white" : "rgba(255, 255, 255, 0.7)",
                      ...(sortBy === "group" && {
                        bgcolor: "#ef4444",
                        "&:hover": { bgcolor: "#dc2626" }
                      }),
                      "&:hover": {
                        borderColor: "rgba(239, 68, 68, 0.5)",
                        bgcolor: sortBy === "group" ? "#dc2626" : "rgba(239, 68, 68, 0.1)"
                      }
                    }}
                  >
                    Nombre
                  </Button>
                  
                  {(searchQuery || sortBy !== "victims") && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSearchQuery("");
                        setSortBy("victims");
                        setSortOrder("desc");
                      }}
                      startIcon={<Close />}
                      sx={{
                        fontFamily: '"Rajdhani", sans-serif',
                        fontWeight: 600,
                        borderColor: "rgba(239, 68, 68, 0.3)",
                        color: "rgba(255, 255, 255, 0.7)",
                        "&:hover": {
                          borderColor: "rgba(239, 68, 68, 0.5)",
                          bgcolor: "rgba(239, 68, 68, 0.1)"
                        }
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </Fade>

        {/* Groups Table */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{

              borderRadius: 3,
              overflow: "hidden"
            }}
          >
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(239, 68, 68, 0.1)" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#ef4444"  }}>
                      GROUP NAME
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#ef4444"  }}>
                      ALT NAME
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#ef4444"  }}>
                      VICTIMS
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#ef4444"  }}>
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedGroups.map((group) => (
                    <TableRow
                      key={group.group}
                      hover
                      sx={{
                        "&:hover": {
                          bgcolor: "rgba(239, 68, 68, 0.05)"
                        },
                        cursor: "pointer"
                      }}
                      onClick={() => handleGroupClick(group.group)}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Groups sx={{ color: "#ef4444", fontSize: 20 }} />
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: "white",
                              fontFamily: '"Rajdhani", sans-serif'
                            }}
                          >
                            {group.group}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255, 255, 255, 0.6)",
                            fontStyle: group.altname ? "normal" : "italic"
                          }}
                        >
                          {group.altname || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={group.victims.toLocaleString()}
                          sx={{
                            bgcolor: "rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            fontWeight: 700,
                            
                            border: "1px solid rgba(239, 68, 68, 0.3)"
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGroupClick(group.group);
                          }}
                          sx={{
                            borderColor: "rgba(239, 68, 68, 0.3)",
                            color: "#ef4444",
                            fontFamily: '"Rajdhani", sans-serif',
                            fontWeight: 600,
                            "&:hover": {
                              borderColor: "#ef4444",
                              bgcolor: "rgba(239, 68, 68, 0.1)"
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Fade>
      </Container>

      {/* Group Details Dialog */}
      <Dialog
        open={!!selectedGroup}
        onClose={() => {
          setSelectedGroup(null);
          setGroupAttacks([]);
        }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: "calc(100vw - 16px)", sm: "min(1180px, calc(100vw - 48px))" },
            maxWidth: "100vw",
            maxHeight: "calc(100vh - 24px)",
            overflow: "hidden",
            bgcolor: "background.default",
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "rgba(239, 68, 68, 0.2)"
                }}
              >
                <Groups sx={{ color: "#ef4444" }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    ...wrapTextSx,
                    fontWeight: 700,
                    color: "#ef4444"
                  }}
                >
                  {selectedGroup?.group}
                </Typography>
                {selectedGroup?.altname && (
                  <Typography variant="body2" sx={{ ...wrapTextSx, color: "rgba(255, 255, 255, 0.6)" }}>
                    AKA: {selectedGroup.altname}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton
              onClick={() => {
                setSelectedGroup(null);
                setGroupAttacks([]);
              }}
              sx={{ color: "#ef4444" }}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ minWidth: 0, overflowX: "hidden", p: { xs: 2, sm: 3 } }}>
          {groupAttacksLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "#ef4444" }} />
            </Box>
          ) : (
            <>
              {/* Stats Cards */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mb: 4 }}>
                <Card
                  
                  sx={{
                    flex: 1

                  }}
                >
                  <CardContent>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#ef4444",
                        mb: 1,
                        fontWeight: 700,
                        
                        letterSpacing: "0.1em",
                        textTransform: "uppercase"
                      }}
                    >
                      Total Victims
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{

                        fontWeight: 900,
                        color: "white"
                        
                      }}
                    >
                      {selectedGroup?.victims.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    flex: 1

                  }}
                >
                  <CardContent>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#8b5cf6",
                        mb: 1,
                        fontWeight: 700,
                        
                        letterSpacing: "0.1em",
                        textTransform: "uppercase"
                      }}
                    >
                      Negotiations
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{

                        fontWeight: 900,
                        color: "white"
                        
                      }}
                    >
                      {selectedGroup?.negotiation_count || 0}
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    flex: 1

                  }}
                >
                  <CardContent>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#f59e0b",
                        mb: 1,
                        fontWeight: 700,
                        
                        letterSpacing: "0.1em",
                        textTransform: "uppercase"
                      }}
                    >
                      Ransom Notes
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{

                        fontWeight: 900,
                        color: "white"
                        
                      }}
                    >
                      {selectedGroup?.ransomnotes_count || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>

              {/* Description */}
              {selectedGroup?.description && (
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Article sx={{ color: "#ef4444", fontSize: 20 }} />
                    <Typography
                      variant="h6"
                      sx={{

                        fontWeight: 700,
                        color: "#ef4444"
                      }}
                    >
                      DESCRIPTION
                    </Typography>
                  </Stack>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "rgba(239, 68, 68, 0.05)",
                      border: "1px solid rgba(239, 68, 68, 0.2)"
                    }}
                  >
                    <Typography variant="body1" sx={{ ...wrapTextSx, whiteSpace: "pre-wrap", color: "white" }}>
                      {selectedGroup.description}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Temporal Activity & Links */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Temporal Activity */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <AccessTime sx={{ color: "#ef4444", fontSize: 20 }} />
                    <Typography
                      variant="h6"
                      sx={{

                        fontWeight: 700,
                        color: "#ef4444"
                      }}
                    >
                      ACTIVIDAD TEMPORAL
                    </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    {selectedGroup?.firstseen && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)", mb: 0.5 }}>
                          Primera aparición
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "white" }}>
                          {new Date(selectedGroup.firstseen).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </Typography>
                      </Box>
                    )}
                    {selectedGroup?.lastseen && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)", mb: 0.5 }}>
                          Última aparición
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "white" }}>
                          {new Date(selectedGroup.lastseen).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </Typography>
                      </Box>
                    )}
                    {selectedGroup?.added_date && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)", mb: 0.5 }}>
                          Fecha de registro
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "white" }}>
                          {new Date(selectedGroup.added_date).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>

                {/* Links */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Launch sx={{ color: "#ef4444", fontSize: 20 }} />
                    <Typography
                      variant="h6"
                      sx={{

                        fontWeight: 700,
                        color: "#ef4444"
                      }}
                    >
                      ENLACES
                    </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    {selectedGroup?.url && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)", mb: 0.5 }}>
                          Información en Ransomware.live
                        </Typography>
                        <Link
                          href={selectedGroup.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "#3b82f6",
                            fontWeight: 600,
                            "&:hover": {
                              color: "#60a5fa"
                            }
                          }}
                        >
                          Ver información completa
                          <Launch sx={{ fontSize: 16 }} />
                        </Link>
                      </Box>
                    )}
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Chip
                        icon={selectedGroup?.has_negotiations ? <Security /> : <Close />}
                        label={selectedGroup?.has_negotiations ? "Con negociaciones" : "Sin negociaciones"}
                        size="small"
                        sx={{
                          bgcolor: selectedGroup?.has_negotiations
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(100, 116, 139, 0.2)",
                          color: selectedGroup?.has_negotiations ? "#22c55e" : "#94a3b8",
                          border: `1px solid ${
                            selectedGroup?.has_negotiations ? "rgba(34, 197, 94, 0.3)" : "rgba(100, 116, 139, 0.3)"
                          }`
                        }}
                      />
                      <Chip
                        icon={selectedGroup?.has_ransomnote ? <Article /> : <Close />}
                        label={selectedGroup?.has_ransomnote ? "Con notas de rescate" : "Sin notas"}
                        size="small"
                        sx={{
                          bgcolor: selectedGroup?.has_ransomnote
                            ? "rgba(245, 158, 11, 0.2)"
                            : "rgba(100, 116, 139, 0.2)",
                          color: selectedGroup?.has_ransomnote ? "#f59e0b" : "#94a3b8",
                          border: `1px solid ${
                            selectedGroup?.has_ransomnote ? "rgba(245, 158, 11, 0.3)" : "rgba(100, 116, 139, 0.3)"
                          }`
                        }}
                      />
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>

              {/* TTPs and Vulnerabilities */}
              <Stack spacing={2} sx={{ mb: 3, minWidth: 0 }}>
                {selectedGroup?.ttps && selectedGroup.ttps.length > 0 && (
                  <Accordion defaultExpanded disableGutters sx={detailAccordionSx}>
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: "#ef4444" }} />}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                        <Warning sx={{ color: "#ef4444", fontSize: 20 }} />
                        <Typography variant="h6" sx={{ ...wrapTextSx, fontWeight: 700, color: "#ef4444" }}>
                          TTPs ({selectedGroup.ttps.length})
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, minWidth: 0 }}>
                        {selectedGroup.ttps.map((ttp, idx) => (
                          <Chip
                            key={idx}
                            label={ttp}
                            size="small"
                            sx={{
                              ...wrapChipSx,
                              bgcolor: "rgba(59, 130, 246, 0.2)",
                              color: "#3b82f6",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                            }}
                          />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {selectedGroup?.vulnerabilities && selectedGroup.vulnerabilities.length > 0 && (
                  <Accordion defaultExpanded disableGutters sx={detailAccordionSx}>
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: "#ef4444" }} />}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                        <Security sx={{ color: "#ef4444", fontSize: 20 }} />
                        <Typography variant="h6" sx={{ ...wrapTextSx, fontWeight: 700, color: "#ef4444" }}>
                          VULNERABILITIES ({selectedGroup.vulnerabilities.length})
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, minWidth: 0 }}>
                        {selectedGroup.vulnerabilities.map((vuln, idx) => (
                          <Chip
                            key={idx}
                            label={vuln}
                            size="small"
                            sx={{
                              ...wrapChipSx,
                              bgcolor: "rgba(239, 68, 68, 0.2)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Stack>

              {/* Tools */}
              {selectedGroup?.tools && Object.keys(selectedGroup.tools).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Security sx={{ color: "#ef4444", fontSize: 20 }} />
                    <Typography
                      variant="h6"
                      sx={{

                        fontWeight: 700,
                        color: "#ef4444"
                      }}
                    >
                      HERRAMIENTAS UTILIZADAS
                    </Typography>
                  </Stack>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "rgba(59, 130, 246, 0.05)",
                      border: "1px solid rgba(59, 130, 246, 0.2)"
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        
                        maxWidth: "100%",
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        color: "white",
                        fontSize: "0.85rem"
                      }}
                    >
                      {JSON.stringify(selectedGroup.tools, null, 2)}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Locations */}
              {selectedGroup?.locations &&
                Array.isArray(selectedGroup.locations) &&
                selectedGroup.locations.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <Public sx={{ color: "#ef4444", fontSize: 20 }} />
                      <Typography
                        variant="h6"
                        sx={{

                          fontWeight: 700,
                          color: "#ef4444"
                        }}
                      >
                        UBICACIONES ({selectedGroup.locations.length})
                      </Typography>
                    </Stack>
                    <TableContainer
                      component={Paper}
                      sx={{
                        bgcolor: "rgba(59, 130, 246, 0.05)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        maxHeight: 300,
                        maxWidth: "100%",
                        overflowX: "auto"
                      }}
                    >
                      <Table size="small" stickyHeader sx={{ minWidth: { xs: 720, md: "100%" } }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: "rgba(59, 130, 246, 0.1)" }}>
                            <TableCell sx={{ fontWeight: 700, color: "#3b82f6" }}>FQDN</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#3b82f6" }}>TÍTULO</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#3b82f6" }}>TIPO</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#3b82f6" }}>ESTADO</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#3b82f6" }}>ÚLTIMA ACTUALIZACIÓN</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedGroup.locations.map((location: any, idx: number) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    
                                    fontSize: "0.75rem",
                                    color: "white"
                                  }}
                                >
                                  {location.fqdn || "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ ...wrapTextSx, color: "white" }}>
                                  {location.title || "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={location.type || "N/A"}
                                  size="small"
                                  sx={{
                                    bgcolor: "rgba(59, 130, 246, 0.2)",
                                    color: "#3b82f6",
                                    border: "1px solid rgba(59, 130, 246, 0.3)"
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={location.available ? "Disponible" : "No disponible"}
                                  size="small"
                                  sx={{
                                    bgcolor: location.available
                                      ? "rgba(34, 197, 94, 0.2)"
                                      : "rgba(100, 116, 139, 0.2)",
                                    color: location.available ? "#22c55e" : "#94a3b8",
                                    border: `1px solid ${
                                      location.available ? "rgba(34, 197, 94, 0.3)" : "rgba(100, 116, 139, 0.3)"
                                    }`
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                                  {location.updated
                                    ? new Date(location.updated).toLocaleDateString("es-ES")
                                    : "N/A"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

              {/* Group Attacks Table */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Warning sx={{ color: "#ef4444", fontSize: 20 }} />
                  <Typography
                    variant="h6"
                    sx={{

                      fontWeight: 700,
                      color: "#ef4444"
                    }}
                  >
                    ATTACKS ({groupAttacks.length})
                  </Typography>
                </Stack>
                <TableContainer
                  component={Paper}
                  sx={{
                    bgcolor: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    maxHeight: 400,
                    maxWidth: "100%",
                    overflowX: "auto"
                  }}
                >
                  <Table size="small" stickyHeader sx={{ minWidth: { xs: 760, md: "100%" } }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(239, 68, 68, 0.1)" }}>
                        <TableCell sx={{ fontWeight: 700, color: "#ef4444" }}>VICTIM</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ef4444" }}>COUNTRY</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ef4444" }}>ACTIVITY</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ef4444" }}>DISCOVERED</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ef4444" }}>ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupAttacks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                              No attacks found for this group
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        groupAttacks.map((attack) => (
                          <TableRow key={attack.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ ...wrapTextSx, fontWeight: 600, color: "white" }}>
                                {attack.victim}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={attack.country || "N/A"}
                                size="small"
                                sx={{
                                  bgcolor: "rgba(59, 130, 246, 0.2)",
                                  color: "#3b82f6"
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ ...wrapTextSx, color: "rgba(255, 255, 255, 0.7)" }}>
                                {attack.activity || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                                {new Date(attack.discovered).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {attack.postUrl && (
                                <IconButton
                                  size="small"
                                  href={attack.postUrl}
                                  target="_blank"
                                  sx={{ color: "#ef4444" }}
                                >
                                  <Launch fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(239, 68, 68, 0.2)", flexWrap: "wrap", gap: 1 }}>
          {selectedGroup?.url && (
            <Button
              href={selectedGroup.url}
              target="_blank"
              startIcon={<Launch />}
              sx={{
                color: "#ef4444",
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 600
              }}
            >
              View on Ransomware.live
            </Button>
          )}
          <Button
            onClick={() => {
              setSelectedGroup(null);
              setGroupAttacks([]);
            }}
            sx={{
              color: "#ef4444",
              fontFamily: '"Rajdhani", sans-serif',
              fontWeight: 600
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!groupsSyncMessage}
        autoHideDuration={4000}
        onClose={() => dispatch(clearGroupsSyncMessage())}
        message={groupsSyncMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default RansomwareGroupsDashboard;

