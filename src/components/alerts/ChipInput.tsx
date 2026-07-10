import React, { useState } from "react";
import { Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";

interface ChipInputProps {
  label: string;
  values: string[];
  helperText?: string;
  placeholder?: string;
  onChange: (values: string[]) => void;
}

const chipSx = {
  maxWidth: "100%",
  height: "auto",
  alignItems: "flex-start",
  mb: 1,
  "& .MuiChip-label": {
    display: "block",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    lineHeight: 1.35,
    py: 0.35,
  },
} as const;

const ChipInput: React.FC<ChipInputProps> = ({
  label,
  values,
  helperText,
  placeholder = "Agregar valor",
  onChange,
}) => {
  const [input, setInput] = useState("");

  const addValue = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setInput("");
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1, minWidth: 0 }}>
        {values.map((value) => (
          <Chip
            key={`${label}-${value}`}
            label={value}
            onDelete={() => onChange(values.filter((item) => item !== value))}
            sx={chipSx}
          />
        ))}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ minWidth: 0 }}>
        <TextField
          size="small"
          fullWidth
          value={input}
          placeholder={placeholder}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
          helperText={helperText}
        />
        <Button variant="outlined" onClick={addValue} size="small">
          Agregar
        </Button>
      </Stack>
    </Box>
  );
};

export default ChipInput;
