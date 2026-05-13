import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Block, Security } from '@mui/icons-material';
import { ERROR_MESSAGES } from '../constants';

const IpNotAllowedDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Verificar si hay un error de IP almacenado
    const checkIpError = () => {
      const ipNotAllowed = sessionStorage.getItem('ip_not_allowed');
      const ipErrorMessage = sessionStorage.getItem('ip_error_message');
      
      if (ipNotAllowed === 'true') {
        setErrorMessage(ipErrorMessage || ERROR_MESSAGES.IP_NOT_ALLOWED);
        setOpen(true);
      } else {
        // Si no hay flag, cerrar el diálogo
        setOpen(false);
      }
    };

    // Verificar al montar el componente
    checkIpError();

    // Escuchar eventos personalizados de error de IP
    const handleIpError = (event: CustomEvent) => {
      setErrorMessage(event.detail?.message || ERROR_MESSAGES.IP_NOT_ALLOWED);
      setOpen(true);
    };

    // Escuchar cuando la IP es autorizada
    const handleIpAllowed = () => {
      setOpen(false);
      setErrorMessage('');
    };

    window.addEventListener('ip-not-allowed', handleIpError as EventListener);
    window.addEventListener('ip-allowed', handleIpAllowed);

    return () => {
      window.removeEventListener('ip-not-allowed', handleIpError as EventListener);
      window.removeEventListener('ip-allowed', handleIpAllowed);
    };
  }, []);

  const handleClose = (_event?: unknown, reason?: string) => {
    // Permitir cerrar solo si el usuario hace clic fuera o presiona ESC
    // Pero no cerrar si hace clic en el botón (ese recarga la página)
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      // Si el usuario intenta cerrar, verificar si la IP sigue siendo no autorizada
      const ipNotAllowed = sessionStorage.getItem('ip_not_allowed');
      if (ipNotAllowed === 'true') {
        // Si sigue siendo no autorizada, mantener abierto
        setOpen(true);
      } else {
        // Si ya no está marcada como no autorizada, permitir cerrar
        setOpen(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Security sx={{ color: 'error.main', fontSize: 32 }} />
          <Typography variant="h5" component="div" fontWeight={700}>
            Acceso Restringido
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert 
          severity="error" 
          icon={<Block />}
          sx={{ 
            mb: 2,
            '& .MuiAlert-icon': {
              fontSize: 28,
            },
          }}
        >
          <Typography variant="body1" fontWeight={600} gutterBottom>
            IP no autorizada
          </Typography>
        </Alert>
        <Typography variant="body1" color="text.secondary" paragraph>
          {errorMessage || ERROR_MESSAGES.IP_NOT_ALLOWED}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          Por favor, contacta al administrador del sistema para solicitar acceso.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button 
          onClick={() => window.location.reload()} 
          variant="contained" 
          color="primary"
          fullWidth
        >
          Recargar Página
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IpNotAllowedDialog;
