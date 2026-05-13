import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, Stack, IconButton, Tooltip, Chip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { fetchCveById, type VulnCveListItem } from "../../../store/slices/vulnMonitor/vulnMonitorSlice";
import SeverityBadge from "./SeverityBadge";
import SourceBadge from "./SourceBadge";

interface Props {
  cves: VulnCveListItem[];
  loading: boolean;
}

const CveTable: React.FC<Props> = ({ cves, loading }) => {
  const dispatch = useAppDispatch();

  if (!loading && cves.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="body2" color="text.disabled">
          No se encontraron CVEs con los filtros actuales.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={HEAD_SX}>CVE-ID</TableCell>
            <TableCell sx={HEAD_SX}>Descripción</TableCell>
            <TableCell sx={HEAD_SX}>Severidad</TableCell>
            <TableCell sx={HEAD_SX} align="right">CVSS</TableCell>
            <TableCell sx={HEAD_SX} align="right">EPSS</TableCell>
            <TableCell sx={HEAD_SX}>Fuentes</TableCell>
            <TableCell sx={HEAD_SX}>Modificado</TableCell>
            <TableCell sx={HEAD_SX} />
          </TableRow>
        </TableHead>
        <TableBody>
          {cves.map((cve) => (
            <TableRow
              key={cve.id}
              hover
              onClick={() => dispatch(fetchCveById(cve.id))}
              sx={{
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(74,144,217,0.04)" },
                "&:last-child td": { borderBottom: 0 },
              }}
            >
              <TableCell sx={{ ...CELL_SX, whiteSpace: "nowrap" }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#60a5fa", fontFamily: "monospace", fontWeight: 600, fontSize: "0.78rem" }}
                  >
                    {cve.cveId ?? cve.id}
                  </Typography>
                  {cve.isKev && (
                    <Chip
                      label="KEV"
                      size="small"
                      sx={{
                        backgroundColor: "#4a1942",
                        color: "#e879f9",
                        fontWeight: 700,
                        fontSize: "0.58rem",
                        height: 16,
                        borderRadius: 0.5,
                      }}
                    />
                  )}
                </Stack>
              </TableCell>

              <TableCell sx={{ ...CELL_SX, maxWidth: 320 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.5,
                  }}
                >
                  {cve.description ?? cve.title ?? (
                    <Box component="span" sx={{ color: "text.disabled", fontStyle: "italic" }}>
                      Sin descripción disponible
                    </Box>
                  )}
                </Typography>
              </TableCell>

              <TableCell sx={CELL_SX}>
                <SeverityBadge severity={cve.severity} />
              </TableCell>

              <TableCell sx={{ ...CELL_SX, fontFamily: "monospace" }} align="right">
                {cve.cvssScore != null ? (
                  <Typography variant="caption" sx={{ color: cvssColor(cve.cvssScore), fontFamily: "monospace", fontWeight: 600 }}>
                    {cve.cvssScore.toFixed(1)}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.disabled">—</Typography>
                )}
              </TableCell>

              <TableCell sx={{ ...CELL_SX, fontFamily: "monospace", whiteSpace: "nowrap" }} align="right">
                {cve.epssScore != null ? (
                  <Tooltip title={`Percentil ${cve.epssPercentile != null ? (cve.epssPercentile * 100).toFixed(1) : "?"}%`}>
                    <Typography
                      variant="caption"
                      component="span"
                      sx={{ color: epssColor(cve.epssScore), fontFamily: "monospace", fontWeight: 600 }}
                    >
                      {cve.epssScore.toFixed(3)}
                    </Typography>
                  </Tooltip>
                ) : (
                  <Typography variant="caption" color="text.disabled">—</Typography>
                )}
              </TableCell>

              <TableCell sx={CELL_SX}>
                <SourceBadge sources={cve.sources} />
              </TableCell>

              <TableCell sx={{ ...CELL_SX, whiteSpace: "nowrap" }}>
                <Typography variant="caption" color="text.disabled">
                  {cve.modifiedAt ? formatRelative(cve.modifiedAt) : "—"}
                </Typography>
              </TableCell>

              <TableCell sx={CELL_SX} onClick={(e) => e.stopPropagation()}>
                {cve.cveId && (
                  <Tooltip title="Ver en NVD">
                    <IconButton
                      size="small"
                      href={`https://nvd.nist.gov/vuln/detail/${cve.cveId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNewIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const HEAD_SX = {
  color: "text.disabled",
  fontSize: "0.68rem",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  borderColor: "rgba(255,255,255,0.06)",
  py: 1,
  bgcolor: "rgba(255,255,255,0.02)",
};

const CELL_SX = {
  color: "text.secondary",
  fontSize: "0.8rem",
  py: 1,
  borderColor: "rgba(255,255,255,0.04)",
};

function cvssColor(score: number): string {
  if (score >= 9) return "#ef4444";
  if (score >= 7) return "#f97316";
  if (score >= 4) return "#f59e0b";
  return "#4ade80";
}

function epssColor(score: number): string {
  if (score >= 0.7) return "#ef4444";
  if (score >= 0.3) return "#f59e0b";
  return "#94a3b8";
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `hace ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  return `hace ${Math.floor(diffH / 24)}d`;
}

export default CveTable;
