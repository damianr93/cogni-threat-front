import React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";

interface PageHeaderProps {
  /** MUI icon element */
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  /** Hex / rgba accent color for the icon box. Defaults to primary (#4a90d9). */
  accentColor?: string;
  /** Content rendered on the right side (buttons, chips, etc.) */
  actions?: React.ReactNode;
  /** Container maxWidth. Defaults to "xl". */
  maxWidth?: "sm" | "md" | "lg" | "xl" | false;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  accentColor = "#4a90d9",
  actions,
  maxWidth = "xl",
}) => {
  // Derive a very low opacity background from the accent colour
  const iconBg = accentColor.startsWith("rgba")
    ? accentColor
    : `${accentColor}1a`; // 0.1 opacity hex trick: append 1a

  return (
    <Box
      sx={{
        py: 2.5,
        mb: 3,
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <Container maxWidth={maxWidth}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          {/* Left: icon + title */}
          <Stack direction="row" alignItems="center" spacing={1.5} minWidth={0}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& .MuiSvgIcon-root": {
                  fontSize: 20,
                  color: accentColor,
                },
              }}
            >
              {icon}
            </Box>
            <Box minWidth={0}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mt: 0.25 }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Right: optional actions */}
          {actions && (
            <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
              {actions}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default PageHeader;
