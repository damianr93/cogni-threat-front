import { createTheme } from '@mui/material/styles';

// Design system: professional dark threat intelligence dashboard
// Palette based on deep navy slate — sober, readable, data-forward
// Colors are used functionally (status), not decoratively

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4a90d9',       // Muted steel blue
      light: '#6aa8e8',
      dark: '#2e6fb8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',       // Slate 500
      light: '#94a3b8',
      dark: '#475569',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0c1220',    // Deep navy
      paper: '#141e30',      // Slightly lighter navy
    },
    text: {
      primary: '#e2e8f0',    // Slate 200 — easier on the eyes than pure white
      secondary: '#64748b',  // Slate 500
    },
    divider: 'rgba(255, 255, 255, 0.06)',
    error: {
      main: '#e05252',       // Muted red
      light: '#f87171',
      dark: '#c53030',
    },
    warning: {
      main: '#c9872a',       // Muted amber
      light: '#f59e0b',
      dark: '#a16207',
    },
    success: {
      main: '#2d9e6b',       // Muted green
      light: '#34d399',
      dark: '#16a34a',
    },
    info: {
      main: '#4a90d9',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#2d3748 transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 3,
            backgroundColor: '#2d3748',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#4a5568',
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#141e30',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: 'none',
          padding: '7px 16px',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
          '&:hover': { borderColor: 'rgba(255, 255, 255, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
            '&.Mui-focused fieldset': { borderWidth: 1, borderColor: '#4a90d9' },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '14px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          color: '#64748b',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          maxWidth: '100%',
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#141e30',
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.06)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});
