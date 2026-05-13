import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Stack, Chip, Link,
} from "@mui/material";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { clearSelectedCve } from "../../../store/slices/vulnMonitor/vulnMonitorSlice";
import SeverityBadge from "./SeverityBadge";
import SourceBadge from "./SourceBadge";

const CveDetail: React.FC = () => {
  const dispatch = useAppDispatch();
  const cve = useAppSelector((s) => s.vulnMonitor.selectedCve);

  if (!cve) return null;

  const nvdUrl = cve.cveId ? `https://nvd.nist.gov/vuln/detail/${cve.cveId}` : null;
  const affectedPackages = Array.isArray(cve.affectedPackages) ? (cve.affectedPackages as any[]) : [];
  const refs = Array.isArray(cve.references) ? (cve.references as any[]) : [];

  return (
    <Dialog open onClose={() => dispatch(clearSelectedCve())} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
            {cve.cveId ?? cve.id}
          </Typography>
          <SeverityBadge severity={cve.severity} />
          {cve.isKev && (
            <Chip
              label="KEV"
              size="small"
              sx={{ backgroundColor: "#4a1942", color: "#e879f9", fontWeight: 700, fontSize: "0.68rem", height: 20 }}
            />
          )}
        </Stack>
        <Box mt={0.75}>
          <SourceBadge sources={cve.sources} />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {cve.title && (
            <Box>
              <SectionLabel>Producto / Summary</SectionLabel>
              <Typography variant="body2" color="text.primary">{cve.title}</Typography>
            </Box>
          )}

          {cve.description && (
            <Box>
              <SectionLabel>Descripción</SectionLabel>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {cve.description}
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={4} flexWrap="wrap" rowGap={2}>
            {cve.cvssScore != null && (
              <StatBox label="CVSS Score" value={`${cve.cvssScore.toFixed(1)}${cve.cvssVersion ? ` (${cve.cvssVersion})` : ""}`} />
            )}
            {cve.epssScore != null && (
              <StatBox
                label="EPSS Score"
                value={`${cve.epssScore.toFixed(3)} · ${cve.epssPercentile != null ? (cve.epssPercentile * 100).toFixed(1) : "?"}% percentil`}
              />
            )}
            {cve.publishedAt && (
              <StatBox label="Publicado" value={new Date(cve.publishedAt).toLocaleDateString("es-AR")} />
            )}
            {cve.modifiedAt && (
              <StatBox label="Modificado" value={new Date(cve.modifiedAt).toLocaleDateString("es-AR")} />
            )}
          </Stack>

          {cve.isKev && (
            <Box
              sx={{
                bgcolor: "rgba(126,34,206,0.08)",
                border: "1px solid rgba(126,34,206,0.2)",
                borderRadius: 1.5,
                p: 1.5,
              }}
            >
              <SectionLabel>CISA KEV — Vulnerabilidad explotada activamente</SectionLabel>
              <Stack direction="row" spacing={3} mt={0.5} flexWrap="wrap" rowGap={1}>
                {cve.kevDate && <StatBox label="Fecha de adición" value={cve.kevDate} />}
                {cve.kevDueDate && <StatBox label="Fecha límite de remediación" value={cve.kevDueDate} />}
                <StatBox label="Asociada a ransomware" value={cve.kevRansomware ? "Sí" : "No"} />
              </Stack>
            </Box>
          )}

          {affectedPackages.length > 0 && (
            <Box>
              <SectionLabel>Paquetes afectados</SectionLabel>
              <Stack spacing={0.75} mt={0.5}>
                {affectedPackages.slice(0, 10).map((pkg: any, i: number) => (
                  <Typography key={i} variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                    {pkg.ecosystem && <Box component="span" sx={{ color: "primary.light" }}>[{pkg.ecosystem}]</Box>}{" "}
                    {pkg.name}
                    {pkg.vulnerableVersionRange && ` ${pkg.vulnerableVersionRange}`}
                    {pkg.firstPatchedVersion && (
                      <Box component="span" sx={{ color: "success.light" }}> → fix: {pkg.firstPatchedVersion}</Box>
                    )}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {refs.length > 0 && (
            <Box>
              <SectionLabel>Referencias</SectionLabel>
              <Stack spacing={0.5} mt={0.5}>
                {refs.slice(0, 8).map((ref: any, i: number) => (
                  <Link
                    key={i}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "primary.light", fontSize: "0.78rem", wordBreak: "break-all" }}
                  >
                    {ref.url}
                  </Link>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        {nvdUrl && (
          <Button href={nvdUrl} target="_blank" rel="noopener noreferrer" size="small" variant="outlined">
            Ver en NVD
          </Button>
        )}
        <Button onClick={() => dispatch(clearSelectedCve())} size="small" color="secondary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      color: "text.disabled",
      fontWeight: 700,
      textTransform: "uppercase",
      fontSize: "0.65rem",
      letterSpacing: "0.08em",
      display: "block",
      mb: 0.5,
    }}
  >
    {children}
  </Typography>
);

const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <SectionLabel>{label}</SectionLabel>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
  </Box>
);

export default CveDetail;
