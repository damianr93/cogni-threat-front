import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Box, Typography } from "@mui/material";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const numericToAlpha2Map = countries.getNumericCodes();
const alpha2ToNumeric = new Map<string, string>(
  Object.entries(numericToAlpha2Map).map(([numeric, alpha2]) => [alpha2.toUpperCase(), numeric])
);
alpha2ToNumeric.set("XK", "383");

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface AttackData {
  country: string;
  count: number;
}

interface WorldMapProps {
  data: AttackData[];
}

const WorldMap: React.FC<WorldMapProps> = ({ data }) => {
  const [tooltipContent, setTooltipContent] = useState<{ country: string; count: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const maxCount = Math.max(...data.map(d => d.count), 1);

  const countryMap = React.useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(item => {
      if (item.country) {
        const code = item.country.trim().toUpperCase();
        const numeric = alpha2ToNumeric.get(code);
        if (numeric) {
          const normalized = String(numeric).padStart(3, "0");
          map.set(normalized, item.count);
          const numericValue = Number(normalized);
          if (!Number.isNaN(numericValue)) {
            map.set(String(numericValue), item.count);
          }
        } else {
          map.set(code, item.count);
        }
      }
    });
    return map;
  }, [data]);

  const getCountryData = (countryCode: string | number) => {
    const normalizedKey = String(countryCode).padStart(3, "0");
    const numericValue = Number(normalizedKey);
    const unpaddedKey = Number.isNaN(numericValue) ? undefined : String(numericValue);
    const count = countryMap.get(normalizedKey) ?? (unpaddedKey ? countryMap.get(unpaddedKey) : undefined);
    return count || 0;
  };

  const getColor = (count: number) => {
    if (count === 0) return "rgba(30, 41, 59, 0.3)";
    const intensity = count / maxCount;
    
    if (intensity > 0.7) return "rgba(220, 38, 38, 0.75)";
    if (intensity > 0.5) return "rgba(239, 68, 68, 0.7)";
    if (intensity > 0.3) return "rgba(249, 115, 22, 0.65)";
    if (intensity > 0.15) return "rgba(251, 146, 60, 0.6)";
    if (intensity > 0.05) return "rgba(251, 191, 36, 0.55)";
    return "rgba(34, 197, 94, 0.5)";
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.5)", borderRadius: 2 }}>
      <ComposableMap
        projectionConfig={{
          scale: 147,
          center: [0, 20],
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = geo.id;
                const count = getCountryData(countryCode);
                const alpha2 = countries.numericToAlpha2(String(countryCode).padStart(3, "0")) || countries.numericToAlpha2(String(countryCode));

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(event) => {
                      handleMouseMove(event);
                      setTooltipContent({
                        country: geo.properties?.name || alpha2 || "Sin información",
                        count: count,
                      });
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => {
                      setTooltipContent(null);
                    }}
                    style={{
                      default: {
                        fill: getColor(count),
                        stroke: "#22c55e",
                        strokeWidth: 0.5,
                        opacity: count > 0 ? 1 : 0.4,
                      },
                      hover: {
                        fill: count > 0 ? "rgba(124, 58, 237, 0.8)" : "rgba(51, 65, 85, 0.6)",
                        stroke: "#3b82f6",
                        strokeWidth: 2,
                        cursor: "pointer",
                        opacity: 1,
                      },
                      pressed: {
                        fill: "rgba(99, 102, 241, 0.85)",
                        stroke: "#3b82f6",
                        strokeWidth: 1.5,
                        opacity: 1,
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltipContent && (
        <Box
          sx={{
            position: "fixed",
            left: position.x + 15,
            top: position.y + 15,
            pointerEvents: "none",
            zIndex: 9999,
            bgcolor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(59, 130, 246, 0.5)",
            borderRadius: 2,
            px: 2,
            py: 1.5,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Typography variant="body2" fontWeight={700} color="white" sx={{ mb: 0.5 }}>
            {tooltipContent.country}
          </Typography>
          <Typography variant="body2" color="primary.light">
            {tooltipContent.count} {tooltipContent.count === 1 ? "ataque" : "ataques"}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
          bgcolor: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: 2,
          p: 2,
          minWidth: 200,
        }}
      >
        <Typography variant="caption" fontWeight={700} color="white" sx={{ mb: 1, display: "block" }}>
          Intensidad de Ataques
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {[
            { color: "rgba(220, 38, 38, 0.75)", label: "Muy Alto (>70%)" },
            { color: "rgba(239, 68, 68, 0.7)", label: "Alto (50-70%)" },
            { color: "rgba(249, 115, 22, 0.65)", label: "Medio (30-50%)" },
            { color: "rgba(251, 146, 60, 0.6)", label: "Bajo (15-30%)" },
            { color: "rgba(251, 191, 36, 0.55)", label: "Muy Bajo (5-15%)" },
            { color: "rgba(34, 197, 94, 0.5)", label: "Mínimo (<5%)" },
            { color: "rgba(30, 41, 59, 0.3)", label: "Sin datos" },
          ].map((item, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: item.color,
                  borderRadius: 0.5,
                  border: "1px solid rgba(34, 197, 94, 0.5)",
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default WorldMap;

