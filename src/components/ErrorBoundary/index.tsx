import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Container, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Reload the page to recover
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              textAlign: 'center',
              py: 4
            }}
          >
            <ErrorOutlineIcon 
              sx={{ fontSize: 80, color: 'error.main', mb: 2 }} 
            />
            <Typography variant="h3" gutterBottom>
              ¡Ups! Algo salió mal
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Ha ocurrido un error inesperado. Por favor, toma captura de pantalla y envíala al soporte.
            </Typography>
            
            {this.state.error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left', width: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  🔴 ERROR DETECTADO - Por favor toma captura
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Mensaje:</strong> {this.state.error.toString()}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Fecha:</strong> {new Date().toLocaleString('es-MX')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Página:</strong> {window.location.href}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Navegador:</strong> {navigator.userAgent.substring(0, 80)}...
                </Typography>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="caption" display="block" gutterBottom>
                      <strong>Stack Trace (Solo desarrollo):</strong>
                    </Typography>
                    <pre style={{ fontSize: '0.75rem' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Box>
                )}
              </Alert>
            )}
            
            <Button 
              variant="contained" 
              size="large" 
              onClick={this.handleReset}
            >
              Recargar página
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
